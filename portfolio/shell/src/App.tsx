import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { findProject, projectModules } from "./catalog/discover-projects";
import LandingPage from "./shell/LandingPage";
import ProjectFrame from "./shell/ProjectFrame";
import RealmMode from "./shell/RealmMode";
import {
  clearRealmReturnIntent,
  readRealmReturnIntent,
  readRealmReturnScrollY,
  rememberRealmReturnIntent,
} from "./shell/realm-return-intent";
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
    window.history.pushState({}, "", `/projects/${id}/`);
    window.scrollTo({ top: 0 });
    setPathname(`/projects/${id}/`);
  }, []);

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

    window.history.pushState({}, "", "/");
    window.scrollTo({ top: 0 });
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
          externalRealmOpen
          registerExternalRealmExitHandler={registerLandingRealmExitHandler}
        />
        <RealmMode
          projects={projectModules}
          onOpenProject={handleRealmReturnOpenProject}
          onExit={handleRealmReturnExit}
          onEntered={handleRealmReturnEntered}
          entry={realmReturn.entry}
          restoreScrollY={realmReturn.landingScrollY}
        />
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
      <LandingPage projects={projectModules} onOpenProject={openProject} />
    </>
  );
}
