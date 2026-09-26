import { lazy, Suspense, useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { findProject, projectModules } from "./catalog/discover-projects";
import LandingPage from "./shell/LandingPage";
import AboutPage, { type LinkProps as AboutLinkProps } from "./shell/AboutPage";
import { aboutCopy } from "./shell/about-copy";
import ProjectFrame from "./shell/ProjectFrame";
import RealmMode from "./shell/RealmMode";
import {
  clearRealmReturnIntent,
  readRealmReturnIntent,
  readRealmReturnScrollY,
  rememberRealmReturnIntent,
} from "./shell/realm-return-intent";
import {
  clearProjectReturnIntent,
  readProjectReturnLandingScrollY,
  readProjectReturnPath,
  readProjectReturnScrollY,
  rememberProjectReturnIntent,
} from "./shell/project-return-intent";
import type { PrototypeVariant } from "./prototype/PortfolioPrototype";

const DesignDirections = lazy(() => import("./design-directions/DesignDirections"));
const HeroMotionDrafts = lazy(() => import("./design-directions/HeroMotionDrafts"));
const MobileHeroDrafts = lazy(() => import("./design-directions/MobileHeroDrafts"));
const ArtDirections = lazy(() => import("./design-directions/art-directions/ArtDirections"));
const PortfolioPrototype = lazy(() => import("./prototype/PortfolioPrototype"));

interface RealmReturnState {
  readonly projectId: string;
  readonly entry: {
    readonly x: number;
    readonly y: number;
  };
  readonly settled: boolean;
  // The landing's original pre-realm scroll offset, captured in the r11
  // intent at the first dive. The deep-return exit must restore it — the
  // returned realm's own body-lock captures the PROJECT page's scroll (≈0),
  // which used to flash the hero before the focus rescue yanked to the
  // threshold section.
  readonly landingScrollY?: number;
}

function projectIdFromPath(pathname: string): string | undefined {
  const match = pathname.match(/^\/projects\/([^/]+)\/?$/);
  return match?.[1];
}

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  // The deep, entered from /about: the realm renders OVER the live about page
  // (no route change) — the exit lands back on it with the scroll intact.
  const [aboutDeepOpen, setAboutDeepOpen] = useState(false);
  // The about page's true offset captured BEFORE the deep's body lock zeroes
  // window.scrollY (the r16 lesson): a project opened from inside the
  // about-deep must still return to the row the visitor left on about.
  const aboutDeepScrollYRef = useRef<number | null>(null);
  const [realmReturn, setRealmReturn] = useState<RealmReturnState | null>(null);
  const realmReturnRef = useRef<RealmReturnState | null>(null);
  const landingRealmExitHandlerRef = useRef<(() => void) | null>(null);

  const projectId = projectIdFromPath(pathname);
  const project = projectId ? findProject(projectId) : undefined;
  const prototypeQuery = pathname === "/" ? new URLSearchParams(window.location.search).get("prototype") : null;
  const requestedPrototypeVariant: PrototypeVariant | undefined =
    prototypeQuery === "field" || prototypeQuery === "ledger"
      ? "field"
      : prototypeQuery === "room" || prototypeQuery === "specimen"
        ? "room"
        : undefined;
  const prototypeVariant: PrototypeVariant | undefined = requestedPrototypeVariant;
  const comparisonMode = requestedPrototypeVariant !== undefined;

  const openProject = useCallback((id: string) => {
    // Capture the landing's offset while it is still on screen (a realm
    // chain captures its own intent instead — the viewport then belongs to
    // the project page beneath the realm, not the catalogue). The realm
    // intent must guard this too, not just the restored-return ref: a
    // landing-owned realm's first dive passes through here while the body
    // is position:fixed, so window.scrollY reads ≈0 — a project intent
    // written then is garbage, and on a later deep-return surface exit the
    // fresh landing consumes it and scrolls to 0, clobbering the realm's
    // own restore to the original landing offset (r16).
    if (realmReturnRef.current === null && !readRealmReturnIntent()) {
      // The deep's body lock fakes window.scrollY ≈0 (r16): an origin inside
      // the about-deep uses the offset captured before the lock.
      const originScrollY = aboutDeepScrollYRef.current ?? window.scrollY;
      // Leaving /about for a project: ferry the landing's offset in the same
      // intent (the slot it currently sits in, or the one already ferried by
      // a previous about hop) so the later exit-about can still rescue it.
      const carried =
        pathname === "/about" && readProjectReturnPath() === "/"
          ? readProjectReturnScrollY()
          : pathname === "/about"
            ? readProjectReturnLandingScrollY() ?? undefined
            : undefined;
      rememberProjectReturnIntent(originScrollY, pathname, carried);
    }
    // Exit-project must land on plain about, never re-assert the deep.
    aboutDeepScrollYRef.current = null;
    setAboutDeepOpen(false);
    window.history.pushState({}, "", `/projects/${id}/`);
    // behavior is NOT inherited from html{scroll-behavior:smooth}: "auto"
    // resolves to smooth and the reset becomes a ~0.3s animated scroll-up
    // (owner-reported jerk on every card click). Every other reset in the
    // shell scrolls instant; these two were the outliers.
    window.scrollTo({ top: 0, behavior: "instant" });
    setPathname(`/projects/${id}/`);
  }, [pathname]);

  const openAbout = useCallback(() => {
    // Same return-intent mechanism the project cards use: the landing's
    // mount effect restores the offset when the about page goes back.
    rememberProjectReturnIntent(window.scrollY, pathname);
    window.history.pushState({ v: 1 }, "", "/about");
    window.scrollTo({ top: 0, behavior: "instant" });
    setPathname("/about");
  }, [pathname]);

  // Back from /about: pop to the tagged landing entry (native scroll
  // restore + the landing's return-intent mount) — unless this was a deep
  // link with no SPA entry behind it, then load the index plainly.
  const goHomeFromAbout = useCallback(() => {
    const state = window.history.state as { v?: number } | null;
    if (state && state.v) {
      window.history.back();
      return;
    }
    window.location.assign("/");
  }, []);

  const handleAboutBackClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    goHomeFromAbout();
  }, [goHomeFromAbout]);

  const renderAboutLink = useCallback(
    ({ to, className, children }: AboutLinkProps): ReactNode => {
      if (to === "/") {
        return (
          <a className={className} href={to} onClick={handleAboutBackClick}>
            {children}
          </a>
        );
      }
      if (to === "/deep") {
        // "the deep" — the immersive realm opens OVER the live about page:
        // no route change, so the exit lands back here with the scroll intact.
        // The pre-lock offset is captured now: RealmMode's body lock zeroes
        // window.scrollY, and a project opened from this deep needs the row.
        return (
          <a
            className={className}
            href="/"
            onClick={(e) => {
              if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                aboutDeepScrollYRef.current = window.scrollY;
                setAboutDeepOpen(true);
              }
            }}
          >
            {children}
          </a>
        );
      }
      const projectMatch = /^\/projects\/([^/]+)\/?$/.exec(to);
      if (projectMatch) {
        return (
          <a
            className={className}
            href={to}
            onClick={(e) => {
              if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                openProject(projectMatch[1]);
              }
            }}
          >
            {children}
          </a>
        );
      }
      return <a className={className} href={to}>{children}</a>;
    },
    [handleAboutBackClick, openProject],
  );

  useEffect(() => {
    if (!pathname.startsWith("/about")) {
      return;
    }
    const prev = document.title;
    document.title = "about · vasyapym";
    return () => {
      document.title = prev;
    };
  }, [pathname]);

  const beginRealmReturn = useCallback((): boolean => {
    if (!project || !readRealmReturnIntent() || realmReturnRef.current !== null) {
      return false;
    }

    const nextReturn: RealmReturnState = {
      projectId: project.id,
      entry: {
        x: 60,
        y: Math.max(60, window.innerHeight - 60),
      },
      settled: false,
      // The intent is still live here (set during the previous dive), so the
      // original landing offset S is available for the exit restore.
      landingScrollY: readRealmReturnScrollY(),
    };

    realmReturnRef.current = nextReturn;
    setRealmReturn(nextReturn);
    return true;
  }, [project]);

  useEffect(() => {
    const handlePopState = () => {
      // The about-deep is route-less: any traversal leaves /about, so the
      // deep must not survive it (no-op bailout when already false).
      aboutDeepScrollYRef.current = null;
      setAboutDeepOpen(false);
      if (realmReturnRef.current !== null) {
        window.history.replaceState({}, "", "/");
        setPathname("/");
        return;
      }

      if (beginRealmReturn()) {
        return;
      }

      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [beginRealmReturn]);

  const goHome = useCallback(() => {
    if (beginRealmReturn()) {
      return;
    }

    // The origin route rides the project-return intent: a project entered
    // from /about returns there; the catalogue flow stays as before.
    if (readProjectReturnPath().startsWith("/about")) {
      // The entry that opened this project IS the SPA /about entry (every
      // project push happens while /about is current) — pop back to it
      // instead of pushing a duplicate: nothing stale can sit behind /about
      // afterwards, so exit-about lands on the landing. The popstate handler
      // routes to /about and the page restores its offset pre-paint.
      window.history.back();
      return;
    }

    // With a return intent, the landing's mount effect owns the viewport
    // (it restores the catalogue offset before first paint); the top-reset
    // here only pins the fresh history entry so browser-native back/forward
    // never inherit the project page's scroll. A plain back without an
    // intent — a direct project boot, a realm-exit landing — starts at the
    // top as before.
    window.scrollTo({ top: 0, behavior: "instant" });
    window.history.pushState({}, "", "/");
    setPathname("/");
  }, [beginRealmReturn]);

  const handleRealmReturnEntered = useCallback(() => {
    const currentReturn = realmReturnRef.current;
    if (!currentReturn || currentReturn.settled) {
      return;
    }

    const settledReturn: RealmReturnState = {
      ...currentReturn,
      settled: true,
    };

    window.history.replaceState({}, "", "/");
    realmReturnRef.current = settledReturn;
    setPathname("/");
    setRealmReturn(settledReturn);
  }, []);

  const handleRealmReturnOpenProject = useCallback(
    (id: string) => {
      // Chained dive: forward the SAME original landing offset into the new
      // intent (read from the ref — stable identity, no dep churn).
      rememberRealmReturnIntent(realmReturnRef.current?.landingScrollY);
      realmReturnRef.current = null;
      setRealmReturn(null);
      openProject(id);
    },
    [openProject],
  );

  const handleRealmReturnExit = useCallback(() => {
    const landingExitHandler = landingRealmExitHandlerRef.current;

    if (landingExitHandler) {
      landingExitHandler();
    } else {
      clearRealmReturnIntent();
    }

    window.history.replaceState({}, "", "/");
    realmReturnRef.current = null;
    setPathname("/");
    setRealmReturn(null);
  }, []);

  const registerLandingRealmExitHandler = useCallback((handler: (() => void) | null) => {
    landingRealmExitHandlerRef.current = handler;
  }, []);

  if (realmReturn) {
    const returnProject = findProject(realmReturn.projectId);

    if (!realmReturn.settled && returnProject) {
      return (
        <>
          <div aria-hidden="true" inert>
            <ProjectFrame project={returnProject} onBack={goHome} />
          </div>
          <RealmMode
            projects={projectModules}
            onOpenProject={handleRealmReturnOpenProject}
            onExit={handleRealmReturnExit}
            onEntered={handleRealmReturnEntered}
            entry={realmReturn.entry}
            returnDoorId={realmReturn.projectId}
            restoreScrollY={realmReturn.landingScrollY}
          />
        </>
      );
    }

    return (
      <>
        <LandingPage
          projects={projectModules}
          onOpenProject={openProject}
          onOpenAbout={openAbout}
          externalRealmOpen
          registerExternalRealmExitHandler={registerLandingRealmExitHandler}
        />
        <RealmMode
          projects={projectModules}
          onOpenProject={handleRealmReturnOpenProject}
          onExit={handleRealmReturnExit}
          onEntered={handleRealmReturnEntered}
          entry={realmReturn.entry}
          returnDoorId={realmReturn.projectId}
          restoreScrollY={realmReturn.landingScrollY}
        />
      </>
    );
  }

      if (pathname === "/about" || pathname === "/about/") {
        return (
          <>
            <AboutPage copy={aboutCopy} renderLink={renderAboutLink} />
            {aboutDeepOpen ? (
              <RealmMode
                projects={projectModules}
                onOpenProject={openProject}
                onExit={() => {
                  aboutDeepScrollYRef.current = null;
                  setAboutDeepOpen(false);
                }}
                entry={{ x: 60, y: Math.max(60, window.innerHeight - 60) }}
              />
            ) : null}
          </>
        );
      }

  if (pathname === "/directions") {
    return (
      <Suspense fallback={<div className="project-loading section-shell">Loading directions…</div>}>
        <DesignDirections projects={projectModules} />
      </Suspense>
    );
  }

  if (pathname === "/motion-directions") {
    return (
      <Suspense fallback={<div className="project-loading section-shell">Loading directions…</div>}>
        <HeroMotionDrafts projects={projectModules} />
      </Suspense>
    );
  }

  if (pathname === "/mobile-hero-directions") {
    return (
      <Suspense fallback={<div className="project-loading section-shell">Loading directions…</div>}>
        <MobileHeroDrafts projects={projectModules} />
      </Suspense>
    );
  }

  if (pathname === "/art-directions") {
    return (
      <Suspense fallback={<div className="project-loading section-shell">Loading directions…</div>}>
        <ArtDirections projects={projectModules} />
      </Suspense>
    );
  }

  if (prototypeVariant) {
    return (
      <Suspense fallback={<div className="project-loading section-shell">Loading comparison…</div>}>
        <PortfolioPrototype
          comparisonMode={comparisonMode}
          initialVariant={prototypeVariant}
          projects={projectModules}
        />
      </Suspense>
    );
  }

  if (project) {
    // Same Fragment[div] shape as the realm-return entry branch, so the
    // project page instance survives the back-press commit untouched and the
    // flood starts over the live page instead of a Suspense fallback.
    return (
      <>
        <div>
          <ProjectFrame project={project} onBack={goHome} />
        </div>
      </>
    );
  }

  // A Fragment root keeps the landing instance mounted across the restored
  // realm's exit commit, so its existing focus/artwork exit choreography runs.
  return (
    <>
      <LandingPage projects={projectModules} onOpenProject={openProject} onOpenAbout={openAbout} />
    </>
  );
}
