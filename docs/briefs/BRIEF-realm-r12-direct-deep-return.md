# BRIEF — realm r12, deliverable: the deep-return transition starts on the project page

Relay brief for the chat model. You have **full design and code autonomy** — no
approval gates, no clarifying questions, no per-decision sign-offs. Choose the
mechanism yourself. The only thing we require is that your reasoning is shown in
full, at the depth specified in §4, **before** the deliverable. Superficial
output will be rejected. If a fact you need is missing, derive the safest
assumption, state it in one line, and proceed.

---

## 1. Situation

### Owner report (verbatim)

> "Reference: Commit 26bad24. When closing a project that was opened in 'the
> deep' mode, the transition currently redirects to the main page first, then
> transitions back to the deep mode. Instead, the transition back to the deep
> mode should begin directly from the project page — no intermediate redirect."

### What r11 (commit 26bad24) shipped, and where the intermediate redirect lives

The landing (`portfolio/shell`) has two faces over one SPA: the **surface** — a
type-led catalogue of 7 projects — and **the deep**, an opt-in immersive realm
(`RealmMode.tsx` + `realm-scene.ts`). In the deep, selecting a creature opens a
panel; the panel's `dive in →` action (or double-click / bare-layer Enter) runs
the iris dive, and at the dive's commit the scene calls back into the shell:

```tsx
      onDiveCommit: (id) => {
        if (!alive) return;
        onOpenRef.current(id);       // SPA handoff; the realm unmounts naturally
      },
```

`onOpenProject` is `App.tsx`'s `openProject`, which pushes a project route and
swaps the rendered tree (`LandingPage` → `ProjectFrame`). **`LandingPage`
unmounts, and with it the entire realm state dies.** r11's fix: a
non-consuming session-scoped return intent
(`sessionStorage["portfolio.realm.return.v1"] = "deep"`, guarded module
`realm-return-intent.ts` with an in-memory fallback), set ONLY at the realm's
dedicated `handleRealmOpenProject` wrapper on the dive commit, cleared by the
normal realm exit (`handleRealmExit`) and defensively by every surface card
handoff; restored in the landing's `useState` lazy initializer during the first
committed render (no consumption effect — Strict-safe, consecutive deep dives
keep restoring).

That works — but the *shape* of the return is what the owner now objects to.
Pressing the project page's in-page back control (or the browser back button)
runs `goHome()`, which pushes a new `/` history entry and swaps the route:

- `ProjectFrame` unmounts (the project page disappears),
- `LandingPage` mounts **as the visible backdrop** at scroll 0
  (`goHome` calls `window.scrollTo({ top: 0 })`),
- `RealmMode` mounts in the same commit (`realmOpen` restored from the intent)
  and floods from the default entry point — but the flood takes ~0.72 s to
  fully cover, so the visitor watches the freshly-mounted surface (the hero)
  under the incoming ink, with the URL bar already flipped to `/`.

That visible landing interlude + URL flip is the "intermediate redirect". The
owner wants the transition to begin **on the project page**: the project page
stays the visible backdrop while the realm floods in; the route/history and the
landing's remount resolve invisibly.

### Rendering facts that matter (mechanism-verified)

- `.realm-layer { position: fixed; inset: 0; z-index: 60; background:
  transparent; }` — "landing shows through the ink flood". Whatever page is
  mounted beneath `RealmMode` is visible until the flood covers it. Mounting the
  realm **over the still-mounted project page** therefore gives "the transition
  begins on the project page" for free.
- Entry flood timing (`realm-scene.ts`): entering ≈ 1.05 s (0.45 s reduced);
  splashes from the entry point every 0.09 s; the full-cover splash fires at
  ~0.72 s (0.3 s reduced); the active phase begins at 1.05 s (0.45 s reduced)
  and the scene then renders the opaque abyss. The shell's probe waits 1700 ms
  after entry before touching input.
- `RealmMode` currently mounts only inside `LandingPage`
  (`{realmOpen ? <RealmMode projects onOpenProject={handleRealmOpenProject}
  onExit={handleRealmExit} entry={realmEntry}/> : null}`), and the landing also
  owns: the inert shell wrapper, the focus-restore choreography (on exit, the
  activator button if usable, else the in-flow threshold entry is scrolled into
  view and focused), the r9 post-exit artwork refresh, and the r10 body scroll
  laws (RealmMode locks the body itself and restores on exit).
- The realm re-enters today with `entry = { x: 60, y: innerHeight − 60 }` (the
  default, lower-left) because no button was clicked. `entry` drives both the
  re-entry flood origin and the eventual exit point
  (`scene.startLeave(entry.x, entry.y)`).

### Deployment facts

Static GitHub Pages site at the domain root. `/projects/<id>/` works because
Vite emits the built `index.html` a second time as `404.html`; the SPA boots,
reads `location.pathname`, and routes to the project. Direct deep links boot
**straight into `ProjectFrame`** — no landing, no realm context, no
sessionStorage (fresh tab or fresh session).

### Verbatim current code

`App.tsx` (the only router, complete):

```tsx
import { lazy, Suspense, useEffect, useState } from "react";
import { findProject, projectModules } from "./catalog/discover-projects";
import LandingPage from "./shell/LandingPage";
import ProjectFrame from "./shell/ProjectFrame";
import type { PrototypeVariant } from "./prototype/PortfolioPrototype";

const DesignDirections = lazy(() => import("./design-directions/DesignDirections"));
const HeroMotionDrafts = lazy(() => import("./design-directions/HeroMotionDrafts"));
const MobileHeroDrafts = lazy(() => import("./design-directions/MobileHeroDrafts"));
const ArtDirections = lazy(() => import("./design-directions/art-directions/ArtDirections"));
const PortfolioPrototype = lazy(() => import("./prototype/PortfolioPrototype"));

function projectIdFromPath(pathname: string): string | undefined {
  const match = pathname.match(/^\/projects\/([^/]+)\/?$/);
  return match?.[1];
}

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
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

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const openProject = (id: string) => {
    window.history.pushState({}, "", `/projects/${id}/`);
    window.scrollTo({ top: 0 });
    setPathname(`/projects/${id}/`);
  };

  const goHome = () => {
    window.history.pushState({}, "", "/");
    window.scrollTo({ top: 0 });
    setPathname("/");
  };

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
    return <ProjectFrame project={project} onBack={goHome} />;
  }

  return <LandingPage projects={projectModules} onOpenProject={openProject} />;
}
```

`realm-return-intent.ts` (complete):

```ts
const REALM_RETURN_KEY = "portfolio.realm.return.v1";
const REALM_RETURN_VALUE = "deep";

let volatileIntent: boolean | undefined;

export function readRealmReturnIntent(): boolean {
  if (volatileIntent !== undefined) {
    return volatileIntent;
  }

  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(REALM_RETURN_KEY) === REALM_RETURN_VALUE;
  } catch {
    return false;
  }
}

export function rememberRealmReturnIntent(): void {
  volatileIntent = true;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(REALM_RETURN_KEY, REALM_RETURN_VALUE);
  } catch {
    // Preserve SPA returns in memory when session storage is unavailable.
  }
}

export function clearRealmReturnIntent(): void {
  volatileIntent = false;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(REALM_RETURN_KEY);
  } catch {
    // Preserve surface intent in memory when session storage is unavailable.
  }
}
```

`LandingPage.tsx` (realm-relevant fragments, verbatim):

```tsx
  const onOpenProject = useCallback(
    (id: string) => {
      clearRealmReturnIntent();
      openProject(id);
    },
    [openProject],
  );

  const handleRealmOpenProject = useCallback(
    (id: string) => {
      rememberRealmReturnIntent();
      openProject(id);
    },
    [openProject],
  );
```

```tsx
  // The deep-return intent (r11) is restored during the initial render —
  // a landing that remounts after a deep-opened project boots straight into
  // the realm; reads are non-destructive, no consumption effect exists.
  const [realmOpen, setRealmOpen] = useState(readRealmReturnIntent);
  const [realmChipVisible, setRealmChipVisible] = useState(false);
  const [realmEntry, setRealmEntry] = useState<{ x: number; y: number }>(() => ({
    x: 60,
    y: typeof window === "undefined" ? 60 : Math.max(60, window.innerHeight - 60),
  }));
```

```tsx
  const handleRealmExit = useCallback(() => {
    clearRealmReturnIntent();
    realmArtworkRefreshPendingRef.current = true;
    realmRestoreFocusRef.current = true;
    setRealmOpen(false);
  }, []);
```

```tsx
  return (
    <main ref={pageRef} className="signal-index">
      <div
        className="signal-index-shell"
        aria-hidden={realmOpen || undefined}
        inert={realmOpen || undefined}
      >
```

```tsx
                onClick={(event) => {
                  if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                    event.preventDefault();
                    onOpenProject(project.id);
                  }
                }}
```

```tsx
      {realmOpen ? (
        <RealmMode
          projects={projects}
          onOpenProject={handleRealmOpenProject}
          onExit={handleRealmExit}
          entry={realmEntry}
        />
      ) : null}
```

`ProjectFrame.tsx` (back control, verbatim; the page content below is a lazy
project page inside a Suspense + error boundary — unchanged):

```tsx
export default function ProjectFrame({ project, onBack }: ProjectFrameProps) {
  const ProjectPage = useMemo(() => lazy(project.loadPage), [project]);

  return (
    <main className="project-frame">
      <header className="project-frame-topbar">
        <div className="project-frame-nav section-shell">
          <button className="back-link" type="button" onClick={onBack}>
            <span aria-hidden="true">←</span> Vasily Argounov
          </button>
          <span className="project-frame-label">{project.title}</span>
        </div>
      </header>
```

`RealmMode.tsx` (contract fragments, verbatim):

```tsx
interface RealmModeProps {
  readonly projects: readonly ProjectModule[];
  readonly onOpenProject: (id: string) => void;
  readonly onExit: () => void;
  readonly entry: { readonly x: number; readonly y: number };
}

type Phase = "entering" | "active" | "leaving" | "diving";
```

```tsx
    const e = entryRef.current;
    scene.startEnter(e.x, e.y);
```

```tsx
  const doLeave = useCallback(() => {
    if (
      phaseRef.current === "leaving" ||
      phaseRef.current === "diving"
    ) return;

    phaseRef.current = "leaving";
    cancelRealmGestureRef.current?.(); // an in-flight gesture must not survive departure
    setOpenId(null);
    setPhase("leaving");

    leaveGateRef.current?.begin();

    const entry = entryRef.current;
    const scene = sceneRef.current;
    if (scene) {
      scene.startLeave(entry.x, entry.y); // reuse entry as the chip-equivalent
    } else {
      leaveGateRef.current?.sceneDone();
    }
  }, []);
```

```tsx
      className={
        "realm-layer realm-exit-layer" +
        (degraded ? " realm-layer--degraded" : "") +
        (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
          ? " realm-reduced" : "")
      }
```

### Probe facts

`tests/realm-probe.mjs` (98 gates, headless Chrome + Vite dev server) can:
drive the dive handoff (legend button click → `.realm-panel-dive` click),
`page.goBack()`, `page.reload()`, `window.location.href = "/"`, click the
in-page `.back-link`; assert `.realm-layer` presence, `.signal-index-shell`
inert, `getComputedStyle(document.body).position === "fixed"`, the sessionStorage
intent value, `window.location.pathname`, `.realm-panel.is-open`,
`.realm-iris`, computed styles, and screenshots. The desktop r11 leg it must be
re-authored against (verbatim):

```js
  // ── r11: returning from a deep-opened project restores the deep ──
  const ret = await browser.newPage();
  await ret.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  collectErrors(ret);
  await open(ret);
  await enterRealm(ret);
  await ret.evaluate(() => document.querySelectorAll(".realm-legend-btn")[2]?.click());
  await wait(500);
  check("r11: entry and panel opening write no return intent",
    await ret.evaluate(() =>
      window.sessionStorage.getItem("portfolio.realm.return.v1") === null));
  await ret.evaluate(() => document.querySelector(".realm-panel-dive")?.click());
  check("r11: committed dive records the deep-return intent",
    await until(ret, () =>
      window.sessionStorage.getItem("portfolio.realm.return.v1") === "deep", 5000));
  check("r11: dive hands off to the project page",
    await until(ret, () => window.location.pathname.includes("projects"), 5000));
  await ret.evaluate(() => document.querySelector(".back-link")?.click());
  check("r11: in-page back restores the deep (no surface detour)",
    await until(ret, () =>
      document.querySelector(".realm-layer") !== null &&
      window.location.pathname === "/", 5000));
  await wait(1700); // the re-entry flood must reach the active phase before input
  check("r11: restored realm owns the screen from the first commit",
    await until(ret, () =>
      document.querySelector(".signal-index-shell")?.inert === true &&
      getComputedStyle(document.body).position === "fixed", 4000));
  await exitViaButton(ret);
  check("r11: normal exit from a restored realm clears the intent",
    await until(ret, () =>
      document.querySelector(".realm-layer") === null &&
      window.sessionStorage.getItem("portfolio.realm.return.v1") === null, 5000));
  check("r11: exit from a restored realm focuses the threshold fallback",
    await until(ret, () =>
      document.activeElement?.classList.contains("realm-threshold-enter") === true, 3000));
  await ret.evaluate(() => {
    document.querySelector(".signal-index-card")
      ?.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await wait(400);
  await ret.evaluate(() => document.querySelector(".signal-index-card")?.click());
  check("r11: surface card still hands off to a project page",
    await until(ret, () => window.location.pathname.includes("projects"), 5000));
  check("r11: surface handoff keeps the intent cleared",
    await ret.evaluate(() =>
      window.sessionStorage.getItem("portfolio.realm.return.v1") === null));
  await ret.evaluate(() => document.querySelector(".back-link")?.click());
  check("r11: surface project still returns to the surface",
    await until(ret, () =>
      document.querySelector(".realm-layer") === null &&
      window.location.pathname === "/", 5000));
  await ret.close();
```

Other r11 legs with the same embedded law (`layer mounted ⇒ pathname === "/"`):
"r11: browser back restores the deep" (retBack), "r11: second deep return still
restores the deep (non-consuming intent)" (retBack), "r11: project reload then
in-page back restores the deep (session storage)" (retReload), "r11 reduced:
return restores the deep with the settled reduced path" (retReduced). Leg
"r11: same-tab root navigation after reload restores the deep" boots the app
fresh AT `/` (no project page mounted) — it must keep working unchanged. Leg
"r11: fresh-context direct project boot returns to the surface" (no intent) —
unchanged.

## 2. Goal

**Primary:** leaving a project that was opened from the deep (in-page back
control or browser back) re-enters the deep **with the project page as the
transition's starting backdrop** — the flood begins while the project page is
still what the visitor sees. No landing/surface interlude is ever visible
between the back press and the flood; the URL/history resolution and the
landing's remount happen invisibly — either beneath the fully opaque flood or
at the realm's exit commit. You choose the timing and the mechanism; state both
and why.

- All r11 return paths keep working: in-page back, browser back, hard reload on
  the project page + back, same-tab root navigation to `/`.
- Diving again from the restored deep opens the next project normally and the
  return intent persists (consecutive deep dives keep working).
- Normal exit from the restored deep lands on the surface (landing at `/`),
  focus restored, intent cleared.
- Reduced motion keeps its settled re-entry path.

## 3. Invariants (violations reject the work)

- A project opened from the **surface** must keep returning to the **surface**;
  the intent is set only at the realm→project dive handoff and cleared by the
  normal realm exit and defensively by every surface handoff (r11 law, unchanged).
- **Exactly one** `RealmMode` dialog instance is ever mounted. If the restored
  realm lives outside the landing (e.g. App-level), the landing's own realm
  mount must be suppressed while an external realm is open — never two dialogs,
  never a second flood.
- The visitor never sees the surface during re-entry: no surface-mode paint,
  no scroll-jump flash, no animation under the incoming realm on any return
  path. The flood starts over the project page.
- While the restored realm is open over the project page, the project page's
  shell is inert/aria-hidden (no focus escape into the covered page); the
  realm's focus trap, esc chain, aria-live announcements and legend all work.
- After the realm's exit from a restored session the visitor is on the surface
  (landing at `/`), a usable surface control receives focus (the threshold
  fallback law), and the intent is cleared.
- Do not regress: the r9/r10 exit staging (canvas retirement at opacity 0,
  watchdog, settlement floor), the exact instant scroll restoration on the
  normal surface exit, the r10 lantern hold, the dive→SPA handoff itself, the
  touch/direct-dive laws, and the hero-exit freeze during a session.
- App's other routes (`/directions`, `/motion-directions`,
  `/mobile-hero-directions`, `/art-directions`, the `?prototype=` query) keep
  their current behavior; the GitHub Pages 404-boot fresh context (no intent)
  keeps returning to the surface.
- Strict Mode safe: double mounts and double-invoked effects are idempotent;
  every listener/timer owned by an effect is released in its cleanup.
- Reduced motion: the re-entry uses the realm's existing settled path.
- Audio must fail silently if the browser refuses to resume without a fresh
  gesture; never throw, never console-noise.
- No new loops, glow, blur, decoration; `--ink-*` tokens, lowercase mono
  chrome, 1px hairlines. React hygiene: no per-frame React state.

## 4. Reasoning protocol (mandatory, shown in your reply)

1. **Restate** the failure in your own words: the back press routes home before
   the realm re-enters, so the freshly-mounted landing is the flood's backdrop
   and the URL flips mid-transition; the owner wants the project page to be the
   backdrop and the route to resolve invisibly.
2. **Generate wide:** at least **5 materially distinct directions**. Sketch
   territory (mechanism + what the visitor experiences, 2–4 sentences each):
   an App-level realm mount that overlays the still-mounted `ProjectFrame` and
   defers the home swap to the realm's exit commit; lifting realm ownership
   fully into `App` (LandingPage becomes event-driven); a `ProjectFrame`-owned
   realm overlay wired by new props; replacing the back push with
   `history.back()` plus a `history.state` flag so the popstate resolves the
   deep without a new entry; painting a full-screen veil over the project page
   BEFORE the route swap and releasing it once the landing's realm is active;
   something better.
3. **Prune in the open:** kill directions against explicit criteria — §3
   invariants, the one-dialog law, Strict Mode remounts, the browser-back
   popstate semantics (back while immersed in the restored deep: decide what
   happens and protect against two mounted realms), the reload-continuity
   tradeoff (a deferred swap leaves the URL at the project path while
   immersed — a reload then boots the project page, not the deep; replacing
   the URL under the cover avoids that), blast radius on App's other routes,
   the r9/r10 exit choreography's assumptions about the landing being mounted
   throughout. Say why each dies. Keep the strongest 1–2.
4. **Develop to depth:** for the survivor(s) state **every concrete value** —
   exact App state names and initial values; which callback sets/clears what;
   the render tree at every moment (what App renders while the restored realm
   is open over the project page; what it renders after the swap; what the
   landing renders when an external realm is open and how its
   `useState(readRealmReturnIntent)` initializer is guarded); the entry
   coordinates for the re-entry flood (you pick — the default lower-left, the
   back button's rect, or something else — and say why); the exact URL/history
   operations (push vs replace, and when); the exit sequencing relative to
   RealmMode's staged teardown (`onExit` fires after the layer is at opacity
   0 and canvases are retired); focus restoration after exit; Strict Mode
   replays; the reduced-motion path; audio resume. No placeholders, no
   "adjust to taste".
5. **Stress-test:** walk the survivor through: dive → in-page back → flood
   over the project page, no surface paint; dive → browser back → same;
   re-entry → normal exit → surface + threshold fallback focus + cleared
   intent; re-entry → dive again → next project page (intent persists,
   exactly one realm); browser back WHILE immersed in the restored deep
   (pathname flips to `/` under a mounted App-level realm — name the exact
   outcome and prove no double mount); surface card → back → surface; hard
   reload on the project → in-page back → flood over the project page;
   same-tab root navigation; fresh 404-boot project (no intent) → back →
   surface; Strict Mode double mount of both trees; panel open → Escape
   chains; reduced motion; audio resume after reload. Name what could break
   and why it doesn't.
6. **Rank and commit:** one paragraph, then the deliverable. You decide — do
   not end with options, do not ask for approval.

## 5. Deliverable

One reply containing, in this order:

1. The full shown reasoning chain (§4), ending with
   `COMMITTED: <one-line name of the direction>`.
2. The exact code changes as **complete replacement blocks** — for each touched
   region, quote the verbatim current lines (from §1's quoted code, or anchor
   with the nearest quoted region + a one-line description if the region is not
   quoted) and give the verbatim replacement. No `…` elisions inside code.
   Every affected path (mount, guard, exit, Strict cleanup) must be shown.
3. A short list titled `NEW PROBE GATES:` — for each **existing r11 gate whose
   body changes** (the ones embedding `layer mounted ⇒ pathname === "/"`),
   name it and give its replacement `check()` body in one line; then list the
   new gates (one line each, as probe `check()` names). Headless-verifiable
   only.
4. A short `OWNER DEVICE CHECK:` list of what only a real device can confirm.

## 6. Integration (not your job, for context)

The orchestrator splices the edits, runs `tsc --noEmit`, the production build,
and the probe with your gates (98 + new), commits and pushes; the owner
re-checks the transition feel on real devices (iPhone re-entry feel, audio
resume after reload, focus with VoiceOver).
