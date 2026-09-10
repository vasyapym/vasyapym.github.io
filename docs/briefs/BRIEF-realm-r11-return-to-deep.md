# BRIEF — realm r11, deliverable: exiting a project opened from the deep returns to the deep

Relay brief for the chat model. You have **full design and code autonomy** — no
approval gates, no clarifying questions, no per-decision sign-offs. Choose the
mechanism yourself. The only thing we require is that your reasoning is shown in
full, at the depth specified in §4, before the deliverable. Superficial output
will be rejected.

---

## 1. Situation (owner report, verbatim)

> "while in the the deep/realm mode you enter the project and get out of it it
> should redirect to the deep/real mode. if it is not possible in static github
> pages add other button to get back to the deep instead of 'surface' mode."

The landing (`portfolio/shell`) has two faces over one SPA: the **surface** — a
type-led catalogue of 7 projects — and **the deep**, an opt-in immersive realm
(`RealmMode.tsx` + `realm-scene.ts`). In the deep, selecting a creature opens a
panel; pressing its dive action (or double-click / bare-layer Enter) runs the
iris dive, and at the dive's commit the scene calls back into the shell:

```ts
onDiveCommit: (id) => {
  if (!alive) return;
  onOpenRef.current(id);       // SPA handoff; the realm unmounts naturally
},
```

`onOpenProject` is `App.tsx`'s `openProject`, which pushes a project route and
swaps the rendered tree (`LandingPage` → `ProjectFrame`). **`LandingPage`
unmounts, and with it the entire realm state dies.**

The failure, mechanism-verified:

- `realmOpen` is LandingPage-local React state. The route swap unmounts
  `LandingPage` (and `RealmMode`).
- Leaving the project — the in-page back control (`ProjectFrame`'s
  `← Vasily Argounov` button) or the browser back button — lands on `/`, which
  remounts `LandingPage` with `realmOpen = false`. That is the **surface**.
- So the visitor dives from the deep into a project, gets out of the project,
  and is dumped on the surface instead of back in the deep. The owner wants the
  deep back.

Routing facts (verbatim current `App.tsx`, the only router):

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

Deployment facts: the site is a **static GitHub Pages site** at the domain root
(`vasyapym.github.io`). `/projects/<id>/` works because Vite emits the built
`index.html` a second time as `404.html` (GitHub Pages serves `404.html` for
unknown routes, the SPA boots, reads `location.pathname`, and routes to the
project). Direct deep links into a project therefore boot the app **straight
into `ProjectFrame`** — no landing, no realm context, no sessionStorage either
(fresh tab or fresh session).

### The relevant landing state (LandingPage.tsx, verbatim fragments)

```tsx
type LandingPageProps = {
  projects: readonly ProjectModule[];
  onOpenProject: (id: string) => void;
};

export default function LandingPage({ projects, onOpenProject }: LandingPageProps) {
  // …
  const [realmOpen, setRealmOpen] = useState(false);
  const [realmChipVisible, setRealmChipVisible] = useState(false);
  const [realmEntry, setRealmEntry] = useState<{ x: number; y: number }>(() => ({
    x: 60,
    y: typeof window === "undefined" ? 60 : Math.max(60, window.innerHeight - 60),
  }));
```

```tsx
  const handleRealmExit = useCallback(() => {
    realmArtworkRefreshPendingRef.current = true;
    realmRestoreFocusRef.current = true;
    setRealmOpen(false);
  }, []);
```

```tsx
  const handleRealmEnter = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const control = event.currentTarget;
    const rect = control.getBoundingClientRect();
    realmActivatorRef.current = control;
    realmRestoreFocusRef.current = false;
    // Read before React hides/inerts either entry control.
    setRealmEntry({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    setRealmOpen(true);
  }, []);
```

On exit, the landing restores focus: if `realmActivatorRef.current` (the button
that triggered entry) is still usable it gets focus, otherwise the in-flow
threshold entry button (`realmSectionEnterRef`, the `enter the deep` control
mid-page) is scrolled into view and focused. There are two entry controls: the
threshold section button mid-page, and a floating chip (`realm-enter-chip`)
that appears when the page is scrolled past the threshold.

```tsx
      {realmOpen ? (
        <RealmMode
          projects={projects}
          onOpenProject={onOpenProject}
          onExit={handleRealmExit}
          entry={realmEntry}
        />
      ) : null}
```

The **same** `onOpenProject` prop is handed to both the surface catalogue cards
and to `RealmMode`. A surface card click calls it directly — this must keep
behaving as today (project → back → **surface**).

### The realm's props and the only realm→project path (RealmMode.tsx, verbatim)

```tsx
interface RealmModeProps {
  readonly projects: readonly ProjectModule[];
  readonly onOpenProject: (id: string) => void;
  readonly onExit: () => void;
  readonly entry: { readonly x: number; readonly y: number };
}
```

```tsx
      onDiveCommit: (id) => {
        if (!alive) return;
        onOpenRef.current(id);       // SPA handoff; the realm unmounts naturally
      },
```

`entry: {x, y}` drives the entry reveal (the veil flood / iris from a point) and
is reused as the exit point (`scene.startLeave(entry.x, entry.y)`). Opening a
panel does NOT leave the realm — only the dive commits the project handoff.

### The project page's back control (ProjectFrame.tsx, verbatim fragment)

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

`onBack` = `goHome` — it pushes a **new** `/` history entry (not `history.back`
unless the visitor uses the browser back button, which returns to the previous
entry — still `/`).

## 2. Goal

**Primary:** when the visitor leaves a project that was entered from the deep
(via the in-page back control, the browser back button, or a hard reload of the
project page followed by any return to `/`), the landing remounts **already in
the deep** — the realm is open again, as if they had never left it. This is
fully achievable in a static SPA; the GitHub Pages constraint only rules out
*server-side* state, which is not needed. Do not implement the fallback button
unless your own analysis proves some return path cannot carry the intent.

**Accepted fallback (only if needed):** a "return to the deep" affordance on
the project page, shown only when that page was entered from the deep, styled
in the household voice; the surface back control stays untouched for
surface-entered projects.

## 3. Invariants (violations reject the work)

- A project opened from the **surface** must keep returning to the **surface**.
  The return-to-deep intent may be set **only** at the realm→project dive
  handoff — never by a catalogue card click.
- The intent is cleared by a normal realm exit (`← surface` / Escape), so a
  later surface session is unaffected.
- Do not regress: the r9/r10 exit staging (canvas retirement at opacity 0,
  watchdog, settlement floor), exact instant scroll restoration, the r10
  lantern hold, the dive→SPA handoff itself, the touch/direct-dive laws.
- Strict Mode safe: double mount of `LandingPage` and double-invoke of any
  mount effect you add must be idempotent (re-entering the realm twice is a
  no-op; nothing throws; no leaked listeners/timers).
- Reduced motion: the re-entry must use the realm's existing reduced path —
  settled, no flood drama.
- Audio must fail silently if the browser refuses to resume the context
  without a fresh gesture (the dive click happened on the previous landing
  mount; a hard reload wipes that gesture). Never throw, never console-noise
  on this path.
- The landing must not visibly flash, scroll-jump, or animate under the
  incoming realm on re-entry (the shell goes `inert`/`aria-hidden` immediately;
  the realm owns the screen from the first frame, as today).
- No new loops, glow, blur, decoration; `--ink-*` tokens, lowercase mono
  chrome, 1px hairlines. React hygiene: no per-frame React state; every
  listener/timer owned by an effect is released in its cleanup.

## 4. Reasoning protocol (mandatory, shown in your reply)

1. **Restate** the failure in your own words: the realm state dying with the
   landing unmount, and every return path (in-page back push, browser back
   popstate, hard reload + back) remounting the landing in surface mode.
2. **Generate wide:** at least **5 materially distinct directions**. Sketch
   territory: a `sessionStorage` intent flag set at the dive commit and consumed
   by the landing on mount; a `history.state` field pushed onto the project
   entry (and/or replaceState on the `/` entry) so the intent travels with the
   history entry and survives reload; lifting the realm intent into `App.tsx`;
   keeping `LandingPage` mounted across the route swap (outlet-style); a
   project-page deep-return button; something better. 2–4 sentences each —
   mechanism + what the visitor experiences.
3. **Prune in the open:** kill directions against explicit criteria — §3
   invariants, the surface-project regression, Strict Mode remounts, the
   GitHub Pages 404-boot path (fresh boot into `ProjectFrame`), reload
   survival, history-entry semantics (browser back vs the pushed `/` entry),
   blast radius (touching App's routing risks the other routes). Say why each
   dies. Keep the strongest 1–2.
4. **Develop to depth:** for the survivor(s) state **every concrete value** —
   storage key names and payloads, exactly where the flag is set (which
   callback) and cleared (which paths), the mount-time ordering in
   `LandingPage` (what runs before the first paint, how the entry point is
   chosen when no button was clicked — you pick the entry coordinates and say
   why), how the intent survives the in-page back push (a new `/` entry) vs the
   browser-back popstate, what happens on the 404-boot direct deep link, and
   the reduced-motion path. No placeholders, no "adjust to taste".
5. **Stress-test:** walk the survivor through: dive → in-page back → deep
   re-opens; dive → browser back → deep re-opens; dive → hard reload on the
   project → in-page back → deep re-opens; surface card → back → surface, no
   realm flash; after a return, exit the realm normally → surface; then open a
   project from the surface → back → surface; two projects back-to-back from
   the deep; Strict Mode double mount; dive while a panel is open; Escape
   chains after re-entry; reduced motion; audio resume after hard reload;
   focus restoration after the later exit; the 404-boot direct deep link with
   no intent present. Name what could break and why it doesn't.
6. **Rank and commit:** one paragraph, then the deliverable. You decide — do
   not end with options, do not ask for approval.

## 6. Deliverable

One reply containing, in this order:

1. The full shown reasoning chain (§4), ending with
   `COMMITTED: <one-line name of the direction>`.
2. The exact code changes as **complete replacement blocks** — for each touched
   region, quote the verbatim current lines (from §5's quoted code) and give
   the verbatim replacement. No `…` elisions inside code. Every affected path
   (set, clear, consume, Strict cleanup) must be shown.
3. A short list titled `NEW PROBE GATES:` naming the headless-verifiable gates
   the orchestrator should add to `tests/realm-probe.mjs` (one line each, as
   probe `check()` names). The probe harness can: drive the dive handoff
   (legend click → `.realm-panel-dive`), `page.goBack()`, `page.reload()`,
   click the in-page `.back-link`, and assert the realm layer
   (`.realm-exit-layer`) is mounted again.
4. A short `OWNER DEVICE CHECK:` list of what only a real device can confirm
   (re-entry feel on iPhone, audio resume after reload, focus behavior).

Integration (not your job, for context): the orchestrator splices the edits,
runs the type check, production build, and the 70-gate probe with your new
gates; the owner re-checks the return feel on real devices.
