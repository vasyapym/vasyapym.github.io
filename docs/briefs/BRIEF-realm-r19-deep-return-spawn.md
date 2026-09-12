# BRIEF — realm r19, deliverable: the deep-return spawns the lantern near the exited project

Relay brief for the chat model. You have **full design and code autonomy** inside the
pinned contract below — no approval gates, no clarifying questions. Commit to one
design and one set of code blocks; do not end with options. The only thing we
require is that your reasoning is shown in full before the deliverable, at the
depth specified in §4. Superficial output will be rejected.

---

## 1. Situation

### Owner report (verbatim)

> "Deeper mode — the light/cursor position on exit: When in deeper mode, entering
> a project and then exiting it causes the light/cursor (character) to spawn at
> the top of the map. Instead, the cursor should remain near the position of the
> project that was just exited."

### The flow that produces it (r12 mechanism, already shipped — do not restructure)

The landing (`portfolio/shell`) has "the deep" — an opt-in immersive realm
(`RealmMode.tsx` + `realm-scene.ts`). The lantern IS the cursor/character.
Entering a project from the deep ("dive in") runs the scene's dive phase and
calls `onDiveCommit(id)` → the shell's SPA handoff → the realm unmounts and the
project page mounts. Exiting the project (in-page back control or browser Back)
runs App's `beginRealmReturn()`: a **fresh `RealmMode` instance mounts over the
still-mounted project page** (inert wrapper), floods in from
`entry = { x: 60, y: innerHeight − 60 }` (lower-left iris origin), reaches the
scene's settled "active" phase, and App swaps the landing beneath the same realm
instance (one-shot `onEntered`). This is the "deep-return".

### Reproduction (headless Chromium 1440×900, deterministic — orchestrator-verified)

enter realm via the chip → legend button 6 (project `practice-map`, creature
index 6, the deepest door) → panel "dive in →" → project page → browser Back →
the realm floods back over the project → wait for the active phase → read the
dev-only scene snapshots (`window.__realmScene.getLanternSnapshot() /
getDepthSnapshot()`):

```
lantern = { x: 720, y: 90, vx: 0, vy: 0 }      ← exactly vw*0.5, vh*0.1 (top-centre)
depth   = { anchorH: 1800, h: 2250, camYState: 0, range: 1350 }
expected for the exited door 7 (fy 0.9): anchorY = 1620, framed camYState ≈ 1170
```

The lantern parks at the top of the map and the camera stays at the top of the
world, regardless of which project was just exited. Door 7's creature is ~1.3
viewports below — entirely out of view.

### Root-cause chain (confirmed against the code)

1. `App.beginRealmReturn()` builds `RealmReturnState { projectId, entry,
   settled, landingScrollY }` — it **knows `projectId`** but passes only
   `entry` and `restoreScrollY` to the fresh `RealmMode`; the exited project
   identity is dropped on the floor.
2. `RealmMode`'s one empty-deps effect calls `scene.startEnter(e.x, e.y)` —
   iris origin only, no spawn intent.
3. `startEnter` → `resetForEnter()` hard-codes the default spawn:
   `lan.x = vw * 0.5; lan.y = clamp(vh * 0.1, 0, world.h); camYState = 0;
   cam.camY = 0` — the top-centre spawn that a fresh entry from the surface
   wants, and the wrong one for a return.
4. `updateLantern` integrates nothing while `phase !== "active"`, and
   `updateCamera` holds `camYState` unless the lantern leaves its follow band —
   so the wrong spawn persists into the active phase: the visitor re-surfaces
   into the deep at the top, far from the creature they just left.

The scene already contains the correct geometry vocabulary for "place the light
at a door": `warpTo(index)` (keyboard 1–7) parks the lantern near creature `i`
and frames the camera on the creature's **anchor** (r13 law). But `warpTo`
guards `phase === "active"` (the re-entry flood is still "entering"), and — the
trap below — it reads the creature's live swim position, which does not exist
yet at spawn time.

### The placement trap (must be respected; creatures.ts verbatim in §2E)

Creatures are constructed with `x = 0; y = 0` and are placed at their anchors
(`fx·world.w, fy·world.anchorH`) only on their **first `update()` tick**. The
tick loop starts after `startEnter` returns; `resetForEnter()` runs before it.
So at spawn-computation time `creatures[i].x/y` are still `0,0` — a spawn that
reads the live creature position would park the lantern at the world origin.
The spawn must compute from `ANCHORS[i]` and `world.w / world.anchorH`
directly. (The creature is placed exactly at its anchor on its first tick and
leans at most `radius·0.24` from it thereafter, so anchor-based placement is
stable and equivalent to `warpTo`'s post-placement behaviour.)

### World/anchor model (context)

- `ANCHORS`: 7 doors, `fx ∈ [0.2..0.8]`, `fy ∈ [0.26..0.9]`; creature `i` ↔
  `doors[i]` ↔ `projects[i]` (catalogue order; door 7 = index 6 = the deepest).
- `world.anchorH = vh·2` (frozen anchor span, r13 geography law);
  `world.h = anchorH + round(vh·0.5)`; camera range `= max(0, world.h − vh)`.
- `interactR = min(vw, vh)·0.28`; screen mapping `sy(wy) = (wy − camY − vh/2)·zoom + vh/2`.
- `warpTo`'s framing math (the shipped r13 law you must reuse — one framing
  model, not two):
  `camYState = clamp(ANCHORS[i].fy · world.anchorH − vh·0.5, 0, max(0, world.h − vh))`,
  lantern parked at the creature minus `interactR·0.6` in y (see §2D verbatim).

## 2. Current code (verbatim — the only context you get)

### 2A. realm-scene.ts — the spawn (inside `createRealmScene`)

```ts
  function resetForEnter(): void {
    framing.active = false;
    framing.settled = false;
    framing.doorId = null;
    lan.x = vw * 0.5;
    lan.y = clamp(vh * 0.1, 0, world.h);
    lvx = 0;
    lvy = 0;
    speed = 0;
    ignite = 0;
    breath = 0.75;
    breathTarget = 0.75;
    camYState = 0;
    cam.camY = 0;
    cam.zoom = 1;
    camVy = 0;
    idleT = 0;
    lure = 0;
    splashIdx = 0;
    coverDone = false;

    invalidateSceneContinuity();
    lastTickWall = -1;
    pickTouch = null;

    hintAlpha = 0;
    activeT = 0;
    lastNearestId = null;
    lanSx = sx(lan.x);
    lanSy = sy(lan.y);
    prevSx = lanSx;
    prevSy = lanSy;
  }
```

`resetForEnter()` is called twice: once at boot (`createRealmScene` ends with
`resize(); resetForEnter();`) and once inside `startEnter`. Both must keep
working; the boot call has no spawn intent.

### 2B. realm-scene.ts — the phase entry point

```ts
    startEnter(cx, cy) {
      if (destroyed || (phase !== "idle" && phase !== "done")) return;
      chipX = cx;
      chipY = cy;
      resize();
      resetForEnter();
      if (fluid !== null) fluid.setMode("ink");
      finishPhase("entering");
      start();
    },
```

Its interface declaration (line 43) and `warpTo`'s (line 91) in
`export interface RealmScene`:

```ts
  startEnter(chipX: number, chipY: number): void;
```

```ts
  warpTo(index: number): void;
```

### 2C. realm-scene.ts — the world/anchor constants

```ts
const ANCHORS: readonly { readonly fx: number; readonly fy: number }[] = [
  { fx: 0.25, fy: 0.26 },
  { fx: 0.68, fy: 0.3 },
  { fx: 0.46, fy: 0.48 },
  { fx: 0.8, fy: 0.55 },
  { fx: 0.2, fy: 0.68 },
  { fx: 0.52, fy: 0.78 },
  { fx: 0.76, fy: 0.9 },
];
```

### 2D. realm-scene.ts — `warpTo` (the framing law to reuse)

```ts
    warpTo(index) {
      if (phase !== "active") return;
      const i = Math.trunc(index);
      if (i < 0 || i >= creatures.length) return;
      const c = creatures[i];
      lan.x = clamp(c.x, 0, world.w);
      lan.y = clamp(c.y - interactR * 0.6, 0, world.h);
      lvx = 0;
      lvy = 0;
      // frame on the creature's anchor, not the parked lantern (r13)
      camYState = clamp(ANCHORS[i].fy * world.anchorH - vh * 0.5, 0, Math.max(0, world.h - vh));
      cam.camY = camYState;
      camVy = 0;
      lanSx = sx(lan.x);
      lanSy = sy(lan.y);
      prevSx = lanSx;
      prevSy = lanSy;
      invalidateSceneContinuity();
      idleT = 0;
    },
```

### 2E. realm-creatures.ts — the placement trap

```ts
  x = 0; y = 0; glow = 0;
```

```ts
    const nax = this.fx * c.world.w, nay = this.fy * c.world.anchorH;
    if (!this.placed) {
      this.ax = nax; this.ay = nay;
      this.cx = nax; this.cy = nay; this.x = nax; this.y = nay;
      this.placed = true;
      this.placeStart(c);
    } else if (nax !== this.ax || nay !== this.ay) {
```

(The tick loop calls `updateCreatures(dt)` in every phase, but the first tick
happens only after `startEnter` returns — creatures are unplaced during
`resetForEnter`.)

### 2F. RealmMode.tsx — props, refs, and the `startEnter` call site

```tsx
interface RealmModeProps {
  readonly projects: readonly ProjectModule[];
  readonly onOpenProject: (id: string) => void;
  readonly onExit: () => void;
  readonly onEntered?: () => void;
  readonly entry: { readonly x: number; readonly y: number };
  // Deep-return exit target: the landing's original pre-realm scroll offset,
  // threaded through the r11 intent. Absent on the normal landing-owned
  // path — the captured body-lock scrollY is the restore target there.
  readonly restoreScrollY?: number;
}
```

```tsx
export default function RealmMode({ projects, onOpenProject, onExit, onEntered, entry, restoreScrollY }: RealmModeProps) {
```

```tsx
  // latest-value refs so the scene effect can stay empty-deps + strict-safe
  const onOpenRef = useRef(onOpenProject);
  const onExitRef = useRef(onExit);
  const entryRef = useRef(entry);
  const phaseRef = useRef<Phase>("entering");
  // one-shot: App's route swap must observe the settled "active" phase exactly
  // once, immune to Strict Mode effect replays and later phase churn.
  const enteredNotifiedRef = useRef(false);
  const openIdRef = useRef<string | null>(null);
  const mutedRef = useRef(false);
  const lastAria = useRef<string>("");
  onOpenRef.current = onOpenProject;
  onExitRef.current = onExit;
  entryRef.current = entry;
  phaseRef.current = phase;
  openIdRef.current = openId;
  mutedRef.current = muted;
```

```tsx
    const e = entryRef.current;
    scene.startEnter(e.x, e.y);
```

(The scene effect is one big `useEffect(…, [])` — Strict Mode double-invokes
it: create scene → `startEnter` → cleanup destroys → re-create → `startEnter`
again. Whatever you build must be idempotent under that.)

### 2G. App.tsx — the deep-return state and the two mount sites

```tsx
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
```

```tsx
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
```

The unsettled branch (realm over the still-mounted project) and the settled
branch (realm over the fresh landing) — the SAME `RealmMode` instance survives
the swap (second child of the fragment in both branches); both pass `entry` and
`restoreScrollY` from `realmReturn`:

```tsx
          <RealmMode
            projects={projectModules}
            onOpenProject={handleRealmReturnOpenProject}
            onExit={handleRealmReturnExit}
            onEntered={handleRealmReturnEntered}
            entry={realmReturn.entry}
            restoreScrollY={realmReturn.landingScrollY}
          />
```

(appears twice, lines 172–179 and 192–199). The normal landing-owned realm
(`LandingPage` → `RealmMode entry={realmEntry}`) and the r11 landing-restored
realm (fresh boot from the session intent) have **no project context** — they
keep today's behaviour.

## 3. Shipped laws you must not regress

- **r10**: the selection hold (`setLanternHold`) and its open/close/leave/dive
  lifecycle; the lantern must not integrate motion during `entering` regardless
  (`updateLantern`'s `controllable` gate) — a spawned position stays parked
  through the flood.
- **r12**: the deep-return shape — the flood origin is `entry` (lower-left);
  `doLeave` reuses `entry` as the leave-chip point; one `RealmMode` instance
  across the settled swap; one-shot `onEntered`. Do not touch the iris/flood
  origin or the leave choreography.
- **r13**: one framing law — anchor-framed camera (`warpTo` math); selection
  framing (`frameSelection`) stays view-only and is cleared by dive/leave; the
  deep floor geography (`world.h = anchorH + deep`).
- **r16**: the deep-return exit restores the landing's original scroll; the
  probe's r16 leg (dive → deep-return → surface exit → offset restore) must
  stay green.
- **r17**: the Esc prompt parks/resumes the lantern; unrelated to the spawn but
  the spawn must not interfere with the hold.
- React hygiene: no per-frame React state; the scene/audio live in one
  empty-deps strict-safe effect; new values reach it via latest-value refs
  (the `entryRef` pattern) or props read at call time; Strict Mode
  double-invoke must be safe; every listener/timer released in cleanup.
- Reduced motion = settled/instant (no tweens for the spawn framing).
- No new loops, no glow, no blur, no decoration; `--ink-*` tokens, lowercase
  mono chrome, 1px hairlines — this round is spawn choreography.

## 4. Reasoning protocol (mandatory, shown in your reply)

1. **Restate** the failure in your own words: the identity the deep-return
   drops (projectId never reaches the fresh realm), the hard-coded top-centre
   spawn, and why the wrong state persists into the active phase.
2. **Generate wide:** at least **5 materially distinct directions** for carrying
   the exited-door identity into the spawn and placing the lantern/camera —
   e.g. extending `startEnter`'s signature with an optional spawn descriptor; a
   separate scene method called before `startEnter` (a latch `resetForEnter`
   consumes); passing the resolved anchor coordinates instead of a door id;
   mounting-time `warpTo` after the entering phase completes; doing it in
   `App` via `entry`-like props; something better. Sketch each in 2–4
   sentences (mechanism + what the visitor experiences).
3. **Prune in the open:** kill directions against explicit criteria — the
   placement trap (§1/§2E), Strict Mode double-invoke, the boot
   `resetForEnter()` call, the r11 landing-restored realm without project
   context, `warpTo`'s active-phase guard, double-exit safety, the r16 probe
   leg, regression risk (a NEW visible artifact: a teleport after the flood
   clears, a spawn flash, a wrong camera hold). Say why each dies. Keep the
   strongest 1–2.
4. **Develop to depth:** for the survivor(s), state **every concrete value** —
   the exact prop/param names and types, where the door id → index resolution
   happens (RealmMode via `projects` order, or the scene via its own `doors` —
   pick one and justify), the exact spawn math (lantern x/y, clamps,
   `camYState`, `cam.camY`, `lanSx/lanSy/prevSx/prevSy`, continuity reset),
   where it sits inside `resetForEnter`/`startEnter` relative to the existing
   assignments, and the fallback when the id is unknown. No placeholders.
5. **Stress-test:** walk the survivor through: deep-return from door 1 and
   door 7 (the deepest — the framed camYState must land within range, not
   clamp weirdly); chained dives (return → dive into another project → return
   again — the spawn must follow the LAST exited project); unknown/stale door
   id fallback; the normal chip/threshold entry unchanged; the r11
   landing-restored realm unchanged; surface exit from the returned realm
   (r16 leg); open a panel in the returned realm (r10 hold + r13 framing
   still work); direct dive from the returned realm; Escape → prompt → exit;
   reduced motion; degraded (fluid === null); Strict Mode double-invoke;
   resize mid-flood. Name what could break and why it doesn't.
6. **Rank and commit:** one paragraph, then the final deliverable.

## 5. Pinned contract (outcome-level — the mechanism is yours)

1. After exiting a project back into the deep (the r12 deep-return), the
   restored realm's lantern spawns **near the creature of the project that was
   just exited** and the camera is framed so that creature is in view —
   **applied before the first uncovered frame of the re-entry flood** (no
   visible teleport after the veil clears).
2. The spawn framing **reuses the `warpTo` anchor-framing math** (lantern
   parked at the anchor-relative offset, `camYState` per the r13 law) — computed
   from `ANCHORS`/`world`, never from unplaced `creatures[i].x/y`.
3. Normal entries (chip, threshold, r11 landing-restored realm) keep today's
   top-centre spawn and `camYState = 0`.
4. `warpTo`, `setLanternHold`, `frameSelection`, `startDive`, `startLeave`
   semantics are unchanged; the r10 hold stays the only parking mechanism
   (the spawn position itself is not "held" — the first pointer move resumes
   following naturally from the parked point).
5. Plumbing is React-idiomatic: props into `RealmMode`, latest-value ref(s),
   no new React state, the empty-deps effect structure preserved, Strict-safe.
6. A stale/unknown door id degrades to the default spawn (no crash, no
   half-applied state).
7. Reduced motion and the degraded renderer get the identical instant framing
   (values are set directly; there is no tween to disable).
8. The orchestrator extends `tests/realm-probe.mjs` with your gates — list
   them explicitly under `NEW PROBE GATES:` (headless-verifiable only, via the
   existing `window.__realmScene.getLanternSnapshot() / getDepthSnapshot()`
   dev hooks). Add a short `OWNER DEVICE CHECK:` list for what only a real
   device can confirm.

## 6. Deliverable

One reply containing, in this order:

1. The full shown reasoning chain (§4), ending with
   `COMMITTED: <one-line name of the direction>`.
2. The exact code changes as **complete replacement blocks** — for each touched
   region, quote the verbatim current lines (from §2) and give the verbatim
   replacement. No "…" elisions inside code. Every affected call site
   (normal entry, deep-return, boot `resetForEnter`, Strict cleanup) must be
   shown.
3. `NEW PROBE GATES:` — the headless-verifiable gates the orchestrator should
   add (one line each, as probe `check()` names).
4. `OWNER DEVICE CHECK:` — what only a real device can confirm.

Integration (not your job, for context): the orchestrator splices the edits,
runs the type check, production build, and the full realm-probe with your new
gates; the owner re-checks the return feel on real devices.
