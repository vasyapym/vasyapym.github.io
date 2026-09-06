# Task brief — redesign the "Explosion" project page + fix mobile + refresh the landing card

You are a senior creative engineer writing a design spec and code for a repository you
cannot see. This brief is self-contained: everything you need is here. Work from it
alone — do **not** ask questions. Make reasonable decisions on anything unspecified and
document those decisions. Your responses will be pasted verbatim to an integrating agent
that will wire and test your code in the real repo, so all code must be **complete and
compilable as written** — no placeholders, no `TODO`, no "…rest unchanged", no truncated
files.

## 0. Delivery protocol — read this first

Full responses have timed out before, so the deliverable is produced across **exactly
four responses**, each kept under roughly 450 lines of output:

- **Response 1 — Part 1, direction lock-in** (§5.1): three candidate creative
  directions, then the locked spec (§0 LOCKED SPEC) for the chosen one. **No code.**
- **Response 2 — Part 2, landing-card copy + page component** (§5.2).
- **Response 3 — Part 3, page stylesheet** (§5.3).
- **Response 4 — Part 4, the three.js renderer** (§5.4).

After each part, end with the exact marker line given in §5 — the user replies
"continue" to trigger the next part.

Rules for all four responses:

- TypeScript strict mode, React 19, three.js 0.185. No new dependencies, no external
  assets (fonts/images/audio), no network calls.
- Part 1's **§0 LOCKED SPEC** is the single source of truth for Parts 2–4. Later parts
  add implementation only and never contradict it; if an unavoidable deviation appears,
  flag it in that part's §0 drift notes.
- If, when starting a later part, your earlier parts are no longer in your context, say
  so in one line instead of guessing — the integrating agent will re-paste them.
- If you hit a length limit, stop cleanly at a file boundary and end with
  `TRUNCATED: <files still owed>` instead of emitting a partial file.

## 1. Context

### The project

"Explosion" is one of six interactive pieces in a personal portfolio (React 19 + Vite 7
+ TypeScript strict + three.js 0.185). It is a real-time structural demolition lab: the
visitor clicks a voxel monument district, a blast carves voxels out of it, a structural
solver collapses anything left without a load path, and rigid-body debris tumbles to
the ground and settles as a ruin.

The simulation core was **just rebuilt in Rust compiled to WebAssembly** (std-only
`cdylib`: DDA ray picking, blast carving, flood-fill support solver, load/stress
solver, 120 Hz fixed substeps, quaternion rigid-body debris pool). The TypeScript side
(`detonate.ts`) loads the `.wasm`, renders with three.js `InstancedMesh`, and drives
camera, FX, and HUD. **The core is done and stays — this pass must not touch it, its
ABI, or `physics-core.ts`.**

### What the owner said (the job)

1. **"It's not good."** — the project page as a whole (visual design, mood, layout,
   copy, scene presentation) is not portfolio-grade. **Full creative freedom: it does
   not need to match the previous style, theme, or approach.**
2. **Landing page project card** — the text is stale; it must reflect the real tech
   stack (Rust → WebAssembly core, three.js, React) and purpose.
3. **Mobile is unusable** — (a) the 3D scene reads far too zoomed / cropped (camera is
   framed for a wide desktop stage); (b) the whole page is too dark, hurting
   readability.

### Design history you should know (do not re-derive)

- The surrounding portfolio shell speaks the "Ink catalogue" language: deep-ink `#0b1317`
  surfaces, translucent light-lined panels, lowercase IBM Plex Mono microcopy, ochre
  `#d39b61` accent. Project pages live inside a dark ink frame with a
  `← Vasily Argounov` back link (the frame chrome is not yours to change).
- The explosion page may **depart** from that language — the owner explicitly grants
  full creative freedom — but it must not clash with the ink chrome that surrounds it.
- Earlier owner verdicts that shaped this build: the physics wasn't convincing (fixed
  by the Rust core); the scene must be a district, not one monument (done: six
  structures); debris must settle as a ruin, not fade away (done). The remaining
  complaint is presentation, not simulation.
- A mobile-hardening pass (taller stage, 40 px touch targets, telemetry wrap guard)
  just landed and the owner STILL calls mobile unusable — so the fix must be structural
  (camera framing + light), not another CSS tweak.

### The scene you are dressing (facts from the wasm core)

- Voxel grid 64×42×26 cells, cell = 0.26 world units → district ≈ **16.6 wide × 10.9
  tall × 6.8 deep**, ground plane at y = 0.
- Six structures on a shared basalt slab: hero arch with two pillar banks + a span
  (center, world x ≈ ±2.55 for the banks), slender tower (left), three-pier bridge
  (right), stepped ziggurat (back-left), domed hall (back-center), obelisk (back-right).
- Per-voxel colors are baked by the core: basalt `0x5a5446`, bone `0xe9e0d0`, ochre
  `0xff9d4d`, lintel `0xd8cdb6`, ember `0xffc77b`, teal accents `0x5bb6bd` (~3.5%),
  brightness jitter ×0.9–1.08. The TS side may repaint instances (x-ray gradient, doom
  tint, ember glow) but the blueprint palette itself is frozen.
- Signature behaviors that must keep working (they are the product's soul and are
  test-pinned): x-ray stress map (`x` key), bullet time (hold Shift), collapse cam
  (auto slow-mo on big cascades), aim-preview chip (`≈ N voxels`), honest miss (a sky
  shot registers but changes nothing), one-click restore with a bottom-up rebuild.

## 2. Hard constraints — the automated browser suite pins these

A headless Puppeteer suite (Chrome, SwiftShader software WebGL) drives the page at
1440×900, 1024×768 and 390×844 (mobile-emulated touch). Every item below is asserted;
your design must keep all of them reachable and passing.

DOM hooks (names / formats fixed — you may restyle them, not rename or reformat them):

- `#explosion-stage canvas` — the WebGL canvas lives inside the stage element.
- First `.explosion-stage-copy span` — text must match `/(\d+)\s+shots/`
  (e.g. `lx-01 · 004 shots` — any prefix is fine, the digits + "shots" are not).
- `.explosion-stage-copy strong` — an integer + `%` = percent standing; exactly `100`
  on load and after restore.
- `.explosion-telemetry` — must contain `N voxels`, `M debris`, `peak X% stress`,
  `Y fps` (regexes: `/(\d+)\s+debris/`, `/peak (\d+)% stress/`, `/voxels/`).
- `.explosion-target-chip` — text `≈ N voxels` while hovering a structure;
  `display:none` over open sky.
- `.explosion-hint` — during the collapse cam its text must match `/dilat/`
  (e.g. "time dilated — collapse cam"); on mobile the engagement is asserted via
  `#explosion-stage[data-engagements]` incrementing.
- `.explosion-control-restore` — a button the suite clicks by its center; nothing may
  cover it at any viewport.
- `.explosion-control-xray[aria-pressed]` and `.explosion-control-sound[aria-pressed]`
  — toggles that flip `aria-pressed`.
- `x` key toggles x-ray (desktop), holding Shift engages bullet time.
- No horizontal overflow at 390 px; zero console/page errors.
- `.explosion-stage-copy` and the chip stay `aria-hidden` (decorative).

Aim geometry (the suite aims shots by stage-box fractions):

- Plinth shots at `fy` 0.82 / 0.84 / 0.86 / 0.88 (measured from the stage top) must hit
  filled voxels on EVERY viewport (390 → 1440). The shared basalt slab spans nearly the
  full district width — so **design the framing so the slab/terrace band sits at stage
  fractions fy ≈ 0.78–0.92 at every aspect** (ground near the bottom edge, district
  filling the frame above it). If your final framing shifts those fractions, state the
  per-viewport fractions explicitly in Part 1 §0 — the integrator will update the test.
- The pillar-cut test computes aim points from camera math it hardcodes: fov 40,
  camera z 20.5, `visibleWidth = 2·20.5·tan(20°)·aspect`, pillar banks at world x
  ±2.55. **If your framing changes fov or camera distance, state the exact final
  constants (fov, camera z, target y) in Part 1 §0 — the integrator will update the
  test's math to match.**
- The sky-miss test clicks upward from `fy` 0.09 and expects open sky — keep the top
  ~15% of the stage free of geometry at 1440×900.

Landing-card copy (asserted on the landing page):

- The card text must contain the exact phrase `voxel monument` and the tag must render
  `/ physics` (so `tag` stays `"physics"`).
- The old phrases `Unlisted kinetic specimen` and `impact test` must NOT appear.

## 3. The mobile diagnosis (why it is unusable today)

Current camera: fov 40 (vertical), position `(0, 4.7, 20.5)`, target `(0, 3.85, 0)`,
fixed. Visible width at the district plane is `2 · 20.5 · tan(20°) · aspect`:

- Desktop stage ≈ 1100×620 (aspect ≈ 1.77) → ≈ 26 world units visible — comfortable.
- Mobile stage ≈ 358×600 (aspect ≈ 0.6) → ≈ **8.9 world units visible** — the 16.6-wide
  district is cropped to half. That is the "too zoomed" complaint.

Current darkness: the stage CSS gradient is `#1a2830 → #131f26 → #221a11`; fog
`0x182830` density 0.014; ground `0x24313a`; ambient 1.55 + hemisphere 0.85 + key 3.2 +
rim point light; ACESFilmic tone mapping, exposure 1.18; renderer alpha over the dark
CSS. On a phone this reads as a dark smear with tiny lit shapes. Fix both decisively:
aspect-aware framing + a meaningfully brighter scene and page (exact values in the
locked spec).

## 4. Current state of the files you will rewrite

All paths are relative to the repo root. The first file is touched for card copy only;
the others are fully replaced.

### 4.1 `portfolio/projects/explosion/project.ts` (landing card descriptor)

```tsx
import type { ProjectModule } from "../../contracts/project-module";

const explosionLuna: ProjectModule = {
  id: "explosion",
  title: "Explosion",
  tag: "physics",
  eyebrow: "Real-time fracture lab",
  description:
    "A long-range structural demolition lab: fracture a whole voxel monument district, watch a live Rust / physics solver reroute loads, and inspect the collapse in x-ray and bullet time.",
  technologies: ["Three.js", "voxel physics", "stress solver", "WebAudio"],
  status: "available",
  accent: "red",
  presentation: {
    className: "presentation-explosion-luna",
    motion: "stack",
    centerLabel: "L / X",
    centerMark: "blast",
    note: "fracture lab",
    motionLabel: "the monument falls",
    instruction: "Open the fracture lab and shoot the monument until it falls.",
    parts: [
      {
        id: "luna-shell",
        label: "Shell",
        className: "presentation-part-luna-shell",
        anchorX: -50,
        anchorY: -18,
        mark: "contours",
        scatterX: -92,
        scatterY: -48,
        scatterZ: 80,
        baseZ: 18,
        rotation: -8,
      },
      {
        id: "luna-shards",
        label: "Shard constellation",
        className: "presentation-part-luna-shards",
        anchorX: 52,
        anchorY: -28,
        mark: "nodes",
        scatterX: 94,
        scatterY: -42,
        scatterZ: 62,
        baseZ: 30,
        rotation: 7,
      },
      {
        id: "luna-ring",
        label: "Impact ring",
        className: "presentation-part-luna-ring",
        anchorX: 18,
        anchorY: 34,
        mark: "route",
        scatterX: 34,
        scatterY: 86,
        scatterZ: 94,
        baseZ: 42,
        rotation: -5,
      },
      {
        id: "luna-core",
        label: "Core",
        className: "presentation-part-luna-core",
        anchorX: -82,
        anchorY: 42,
        mark: "type",
        markLabel: "LX",
        scatterX: -116,
        scatterY: 74,
        scatterZ: 70,
        baseZ: 38,
        rotation: 12,
      },
    ],
  },
  loadPage: () => import("./web/ExplosionLunaPage"),
};

export default explosionLuna;
```

The landing card renders: tag row (`NN / physics` + `technologies.join(" · ")`), the
title, `description`, and `open ↗`. Only `eyebrow`, `description`, `technologies`
(and, if the direction warrants, `presentation.note` / `instruction`) should change.

### 4.2 `portfolio/projects/explosion/web/ExplosionLunaPage.tsx` (page component)

```tsx
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent,
} from "react";
import { hasWebGL, mountSpecimen, type SpecimenHandle } from "./detonate";
import "./explosion-luna.css";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const TECHNIQUES = [
  "structural integrity · flood-fill solver",
  "gpu instancing · two draw calls",
  "adaptive charge depth · ray-marched",
  "live stress solver · loads reroute on impact",
  "procedural webaudio · zero assets",
];

type Telemetry = {
  voxels: number;
  total: number;
  debris: number;
  fps: number;
  slowmo: boolean;
  peakStress: number;
  engagements: number;
};

export default function ExplosionLunaPage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SpecimenHandle | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia(REDUCED_MOTION_QUERY).matches);
  const [hasScene, setHasScene] = useState(true);
  const [impacts, setImpacts] = useState(0);
  const [muted, setMuted] = useState(false);
  const [slowMo, setSlowMo] = useState(false);
  const [xray, setXray] = useState(false);
  const [telemetry, setTelemetry] = useState<Telemetry>({
    voxels: 0,
    total: 0,
    debris: 0,
    fps: 60,
    slowmo: false,
    peakStress: 0,
    engagements: 0,
  });

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const handleChange = () => setReducedMotion(query.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !hasWebGL()) {
      setHasScene(false);
      return;
    }
    const handle = mountSpecimen(stage);
    handleRef.current = handle;
    setHasScene(handle !== null);
    if (!handle) {
      return;
    }
    const poll = window.setInterval(() => {
      setTelemetry({ ...handle.stats });
    }, 400);
    return () => {
      window.clearInterval(poll);
      handle.dispose();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!hasScene || reducedMotion) {
      return;
    }
    const applyShift = (event: KeyboardEvent) => {
      if (event.key !== "Shift") {
        return;
      }
      setSlowMo(event.type === "keydown");
      handleRef.current?.setSlowMo(event.type === "keydown");
    };
    const applyXrayKey = (event: KeyboardEvent) => {
      if (event.key !== "x" && event.key !== "X") {
        return;
      }
      setXray((current) => {
        const next = !current;
        handleRef.current?.setXray(next);
        return next;
      });
    };
    const onBlur = () => {
      setSlowMo(false);
      handleRef.current?.setSlowMo(false);
    };
    window.addEventListener("keydown", applyShift);
    window.addEventListener("keyup", applyShift);
    window.addEventListener("keydown", applyXrayKey);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", applyShift);
      window.removeEventListener("keyup", applyShift);
      window.removeEventListener("keydown", applyXrayKey);
      window.removeEventListener("blur", onBlur);
    };
  }, [hasScene, reducedMotion]);

  const triggerDetonation = (x: number, y: number) => {
    if (reducedMotion || !hasScene) {
      return;
    }
    if (handleRef.current?.detonateAt(x, y)) {
      setImpacts((current) => current + 1);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    triggerDetonation(event.clientX, event.clientY);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    triggerDetonation(bounds.left + bounds.width * 0.5, bounds.top + bounds.height * 0.52);
  };

  const handleRestore = () => {
    handleRef.current?.restore();
    setImpacts(0);
  };

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    handleRef.current?.setMuted(next);
  };

  const toggleXray = () => {
    const next = !xray;
    setXray(next);
    handleRef.current?.setXray(next);
  };

  const standing =
    telemetry.total > 0 ? Math.round((telemetry.voxels / telemetry.total) * 100) : 100;

  return (
    <div className="explosion-field">
      <section className="explosion-page" aria-labelledby="explosion-title">
        <header className="explosion-hero">
          <h1 id="explosion-title">
            One voxel district.
            <span>Tear it down.</span>
          </h1>
          <p className="explosion-lede">
            Every shot carves the structure away for real &mdash; and anything left
            without support comes down on its own. Flip the x-ray to watch the
            load paths decide.
          </p>
          <a className="explosion-enter" href="#explosion-stage">
            Demolish <span aria-hidden="true">↓</span>
          </a>
        </header>

        <section className="explosion-room" aria-label="Specimen room">
          <p className="explosion-room-meta">
            {reducedMotion
              ? "reduced motion · blasts disabled · restore still works"
              : "live · shift = slow motion · damage persists until restored"}
          </p>

          <div
            ref={stageRef}
            id="explosion-stage"
            className={`explosion-stage${!hasScene ? " is-fallback" : ""}`}
            role="button"
            tabIndex={0}
            aria-label="Specimen room. Click or press Enter to detonate."
            data-engagements={telemetry.engagements}
            onPointerDown={handlePointerDown}
            onKeyDown={handleKeyDown}
          >
            <div className="explosion-stage-copy" aria-hidden="true">
              <span>lx-01 · {impacts.toString().padStart(3, "0")} shots</span>
              <strong>{standing}% standing</strong>
                <span className="explosion-telemetry">
                  {telemetry.voxels} voxels · {telemetry.debris} debris · peak{" "}
                  {Math.round(telemetry.peakStress * 100)}% stress · {Math.round(telemetry.fps)} fps
                </span>
            </div>
            {!hasScene ? (
              <>
                <span className="explosion-fallback-mark" aria-hidden="true" />
                <span className="explosion-stage-fallback">webgl unavailable · specimen sealed</span>
              </>
            ) : null}
          </div>

          <div className="explosion-controls">
            <button
              type="button"
              className="explosion-control explosion-control-restore"
              onClick={handleRestore}
            >
              restore monument
            </button>
            <button
              type="button"
              className="explosion-control explosion-control-xray"
              onClick={toggleXray}
              aria-pressed={xray}
            >
              x-ray · {xray ? "on" : "off"}
            </button>
            <button
              type="button"
              className="explosion-control explosion-control-sound"
              onClick={toggleSound}
              aria-pressed={!muted}
            >
              sound · {muted ? "off" : "on"}
            </button>
            <span className="explosion-hint" aria-hidden="true">
              {slowMo
                ? "slow motion engaged"
                : telemetry.slowmo
                  ? "time dilated — collapse cam"
                  : xray
                    ? "stress map · hot = carrying the span"
                    : telemetry.peakStress > 0.72
                      ? "overloaded columns glowing · press x — stress map"
                      : "hold shift — bullet time · press x — stress map"}
            </span>
          </div>
        </section>

        <ul className="explosion-payloads" aria-label="Techniques inside">
          {TECHNIQUES.map((technique, index) => (
            <li key={technique}>
              <span>{String(index + 1).padStart(2, "0")}</span> / {technique}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

### 4.3 `portfolio/projects/explosion/web/explosion-luna.css` (page stylesheet)

```css
.explosion-field {
  min-height: max(480px, calc(100vh - 61px));
  color: var(--ink-text);
  background: var(--ink-bg);
  color-scheme: dark;
  --focus-ring: var(--ink-accent-bright);
}

.explosion-page {
  width: min(100% - 72px, 1200px);
  margin: 0 auto;
  padding: clamp(3rem, 5vw, 4.5rem) 0 6rem;
}

.explosion-hero {
  padding-bottom: clamp(2.5rem, 4vw, 3.5rem);
}

.explosion-hero h1 {
  max-width: 560px;
  margin: 0;
  font-family: var(--display);
  font-size: clamp(2rem, 3.3vw, 3rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 0.97;
}

.explosion-hero h1 span {
  display: block;
  color: var(--ink-accent);
}

.explosion-lede {
  max-width: 520px;
  margin: 1.1rem 0 0;
  color: var(--ink-muted);
  font-size: 0.95rem;
  line-height: 1.55;
}

.explosion-enter {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin-top: 1.4rem;
  color: var(--ink-text);
  font-family: var(--mono);
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 180ms ease, gap 180ms ease;
}

.explosion-enter:hover {
  gap: 0.85rem;
  color: var(--ink-accent-bright);
}

.explosion-room {
  border-top: 1px solid var(--ink-line);
  padding-top: 1.1rem;
}

.explosion-room-meta {
  margin: 0 0 1rem;
  color: var(--ink-faint);
  font-family: var(--mono);
  font-size: 0.72rem;
  letter-spacing: 0.05em;
}

.explosion-stage {
  position: relative;
  min-height: 560px;
  min-height: clamp(500px, 62vh, 720px);
  overflow: hidden;
  border: 1px solid var(--ink-line);
  background:
    radial-gradient(circle at 50% 45%, rgba(228, 166, 105, 0.24), transparent 34%),
    linear-gradient(140deg, #1a2830, #131f26 66%, #221a11);
  cursor: crosshair;
  isolation: isolate;
  touch-action: manipulation;
}

.explosion-stage::before {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(238, 234, 224, 0.075) 1px, transparent 1px), linear-gradient(90deg, rgba(238, 234, 224, 0.075) 1px, transparent 1px);
  background-size: 40px 40px;
  content: "";
  mask-image: linear-gradient(to bottom, transparent, black 24%, black 76%, transparent);
  pointer-events: none;
}

.explosion-stage:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 4px;
}

.explosion-fallback-mark {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.explosion-stage-copy {
  position: absolute;
  z-index: 2;
  top: 1.1rem;
  right: 1.2rem;
  left: 1.2rem;
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
  color: var(--ink-muted);
  font-family: var(--mono);
  font-size: 0.62rem;
  letter-spacing: 0.04em;
  pointer-events: none;
}

.explosion-stage-copy strong {
  color: var(--ink-accent-bright);
  font-weight: 500;
}

.explosion-stage-copy .explosion-telemetry {
  color: var(--ink-faint);
  text-align: right;
}

.explosion-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.9rem;
}

.explosion-control {
  padding: 0.55rem 0.9rem;
  background: transparent;
  border: 1px solid var(--ink-line);
  color: var(--ink-muted);
  font-family: var(--mono);
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition:
    color 160ms ease,
    border-color 160ms ease,
    background 160ms ease;
}

.explosion-control:hover {
  color: var(--ink-accent-bright);
  border-color: var(--ink-accent);
}

.explosion-control:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 3px;
}

.explosion-control[aria-pressed="true"] {
  border-color: var(--ink-accent);
  color: var(--ink-accent-bright);
}

/* Floating verdict of the aim preview: "≈ N voxels" trails the crosshair. */
.explosion-target-chip {
  position: absolute;
  z-index: 3;
  padding: 0.28rem 0.5rem;
  background: rgba(11, 19, 23, 0.86);
  border: 1px solid rgba(255, 199, 123, 0.55);
  color: #ffc77b;
  font-family: var(--mono);
  font-size: 0.66rem;
  letter-spacing: 0.05em;
  white-space: nowrap;
  pointer-events: none;
}

.explosion-hint {
  margin-left: auto;
  color: var(--ink-faint);
  font-family: var(--mono);
  font-size: 0.68rem;
  letter-spacing: 0.05em;
}

.explosion-stage-fallback {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 2rem;
  color: var(--ink-muted);
  font-family: var(--mono);
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-align: center;
}

.explosion-fallback-mark {
  top: 50%;
  left: 50%;
  width: 110px;
  height: 110px;
  border: 1px solid rgba(232, 181, 124, 0.66);
  border-radius: 50%;
  opacity: 0.7;
  transform: translate(-50%, -50%) rotate(45deg);
}

.explosion-fallback-mark::before,
.explosion-fallback-mark::after {
  position: absolute;
  inset: 18px;
  border: 1px dashed var(--ink-accent);
  border-radius: 50%;
  content: "";
}

.explosion-fallback-mark::after {
  inset: 39px;
  background: var(--ink-accent);
  border: 0;
}

.explosion-payloads {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 2.5rem;
  margin: clamp(2.5rem, 4vw, 3.5rem) 0 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--ink-line);
}

.explosion-payloads li {
  padding: 0.85rem 0.2rem;
  border-bottom: 1px solid var(--ink-line-soft);
  color: var(--ink-faint);
  font-family: var(--mono);
  font-size: 0.78rem;
  letter-spacing: 0.05em;
}

.explosion-payloads li span {
  color: var(--ink-accent);
}

@media (max-width: 640px) {
  .explosion-page {
    width: min(100% - 32px, 1200px);
    padding-top: 3rem;
  }

  .explosion-payloads {
    grid-template-columns: 1fr;
  }

  .explosion-stage {
    /* Tall enough for the 58%/78-88% tap bands, never taller than the viewport. */
    min-height: min(600px, 74vh);
  }

  .explosion-stage-copy {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.35rem;
  }

  /* Telemetry line wraps and shrinks instead of clipping at 390px. */
  .explosion-stage-copy .explosion-telemetry {
    font-size: 0.58rem;
    line-height: 1.55;
  }

  .explosion-control {
    min-height: 40px;
  }

  /* Chip trails the pointer inside the stage; cap it so it can never widen the page. */
  .explosion-target-chip {
    max-width: 100%;
  }

  .explosion-hint {
    margin-left: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .explosion-stage {
    cursor: default;
  }
}
```

Shell custom properties available (defined by the surrounding app, do not redefine
globally — if your direction departs from the ink theme, declare local overrides scoped
to `.explosion-field`):

```css
--display: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
--mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
--ink-bg: #0b1317;
--ink-text: #eeeae0;
--ink-muted: rgba(238, 234, 224, 0.68);
--ink-faint: rgba(238, 234, 224, 0.48);
--ink-line: rgba(238, 234, 224, 0.26);
--ink-line-soft: rgba(238, 234, 224, 0.13);
--ink-panel: rgba(238, 234, 224, 0.045);
--ink-accent: #d39b61;
--ink-accent-bright: #e8b57c;
--ink-accent-deep: #b97f45;
```

### 4.4 `portfolio/projects/explosion/web/detonate.ts` (renderer)

```ts
import * as THREE from "three";
import { DetonationSfx } from "./audio";
import { loadPhysicsCore, type PhysicsCore } from "./physics-core";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const CELL = 0.26;
const COLLAPSE_CAM_THRESHOLD = 50;
const COLLAPSE_CAM_DURATION = 2600;
const BUILD_DURATION = 1.15;
const XRAY_HOT = new THREE.Color(0xff5a20);
const XRAY_COOL = new THREE.Color(0x5bb6bd);
const DOOM_TINT = new THREE.Color(0xff4d1a);
const EMBER_GLOW = new THREE.Color(0xffa14d);
const STRESS_GLOW = 0.72;
const SPARK_COUNT = 80;

type Vec3 = readonly [number, number, number];
export type SpecimenStats = { voxels: number; total: number; debris: number; fps: number; slowmo: boolean; peakStress: number; engagements: number };
export type SpecimenHandle = { detonateAt: (x: number, y: number) => boolean; restore: () => void; setMuted: (muted: boolean) => void; setSlowMo: (on: boolean) => void; setXray: (on: boolean) => void; readonly stats: SpecimenStats; dispose: () => void };

type SparkCloud = { points: THREE.Points; positions: Float32Array; velocities: Float32Array; buoyancy: Float32Array; strength: number; age: number; active: boolean };
type Shockwave = { inner: THREE.Mesh; outer: THREE.Mesh; age: number; active: boolean; tiltSeed: number };

export function hasWebGL(): boolean {
  try { const canvas = document.createElement("canvas"); return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl")); } catch { return false; }
}

function isReducedMotion(): boolean { return window.matchMedia(REDUCED_MOTION_QUERY).matches; }
function finiteVector(v: Vec3): boolean { return v.every(Number.isFinite); }

function createRenderer(target: HTMLElement): THREE.WebGLRenderer | null {
  const canvas = document.createElement("canvas");
  canvas.className = "explosion-overlay-canvas";
  canvas.setAttribute("aria-hidden", "true");
  target.appendChild(canvas);
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    return renderer;
  } catch { canvas.remove(); return null; }
}

function createSparkCloud(): SparkCloud {
  const positions = new Float32Array(SPARK_COUNT * 3);
  const velocities = new Float32Array(SPARK_COUNT * 3);
  const buoyancy = new Float32Array(SPARK_COUNT);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xffc77b, size: 0.075, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.visible = false;
  return { points, positions, velocities, buoyancy, strength: 1, age: 0, active: false };
}

export function mountSpecimen(element: HTMLElement): SpecimenHandle | null {
  const renderer = createRenderer(element);
  if (!renderer) return null;
  const reduced = isReducedMotion();
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x182830, 0.014);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);
  const cameraHome = new THREE.Vector3(0, 4.7, 20.5);
  const cameraTarget = new THREE.Vector3(0, 3.85, 0);
  camera.position.copy(cameraHome);
  camera.lookAt(cameraTarget);
  scene.add(new THREE.AmbientLight(0xa8a29a, 1.55), new THREE.HemisphereLight(0xc4dbe8, 0x453a2d, 0.85));
  const key = new THREE.DirectionalLight(0xffd9ae, 3.2); key.position.set(-7, 11, 8); scene.add(key);
  const rim = new THREE.PointLight(0x4bb3c5, 30, 30, 2); rim.position.set(8, 2.5, -7); scene.add(rim);
  const flash = new THREE.PointLight(0xffa14d, 0, 20, 2); scene.add(flash);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(34, 48), new THREE.MeshStandardMaterial({ color: 0x24313a, roughness: 0.94 }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const survey = new THREE.Mesh(new THREE.TorusGeometry(64 * CELL * 0.72, 0.014, 8, 128), new THREE.MeshBasicMaterial({ color: 0xffa14d, transparent: true, opacity: 0.32, depthWrite: false }));
  survey.rotation.x = Math.PI / 2; survey.position.y = 0.02; scene.add(survey);

  const box = new THREE.BoxGeometry(CELL * 0.98, CELL * 0.98, CELL * 0.98);
  const material = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.18, flatShading: true, vertexColors: true });
  const structure = new THREE.InstancedMesh(box, material, 64 * 42 * 26);
  structure.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(64 * 42 * 26 * 3), 3);
  structure.instanceColor.setUsage(THREE.DynamicDrawUsage);
  structure.frustumCulled = false; structure.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(structure);
  const debrisCapacity = element.clientWidth < 720 || window.innerWidth < 720 ? 900 : 1800;
  const debrisMesh = new THREE.InstancedMesh(box, material.clone(), debrisCapacity);
  debrisMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(debrisCapacity * 3), 3);
  debrisMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  debrisMesh.frustumCulled = false; debrisMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); debrisMesh.count = 0; scene.add(debrisMesh);
  const dummy = new THREE.Object3D();
  const tmp = new THREE.Vector3();
  const tmpColor = new THREE.Color();
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const shakeDir = new THREE.Vector2();
  const hitPoint = new THREE.Vector3();
  const sfx = new DetonationSfx();
  const shocks: Shockwave[] = [];
  for (let i = 0; i < 4; i += 1) {
    const inner = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 8, 64), new THREE.MeshBasicMaterial({ color: 0xffc77b, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    const outer = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 8, 64), new THREE.MeshBasicMaterial({ color: 0xffc77b, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    inner.visible = false; outer.visible = false; scene.add(inner); scene.add(outer);
    shocks.push({ inner, outer, age: 0, active: false, tiltSeed: 0 });
  }
  const sparks = Array.from({ length: 5 }, createSparkCloud); sparks.forEach((cloud) => scene.add(cloud.points));
  const chip = document.createElement("span"); chip.className = "explosion-target-chip"; chip.setAttribute("aria-hidden", "true"); chip.style.display = "none"; element.appendChild(chip);

  let core: PhysicsCore | null = null;
  let disposed = false;
  let animation = 0;
  let last = performance.now();
  let xray = false;
  let slowMoHeld = false;
  let collapseUntil = 0;
  let building = false;
  let buildStarted = 0;
  let shake = 0;
  let flashIntensity = 0;
  let overloaded: number[] = [];
  const stats: SpecimenStats = { voxels: 0, total: 0, debris: 0, fps: 60, slowmo: false, peakStress: 0, engagements: 0 };

  const setColor = (instance: number, voxel: number, now: number) => {
    const views = core?.views; if (!views) return;
    const s = views.stressShown[voxel];
    if (views.doomed[voxel]) tmpColor.set(0xff4d1a);
    else if (xray) tmpColor.copy(XRAY_COOL).lerp(XRAY_HOT, s * s * (3 - 2 * s));
    else { tmpColor.setHex(views.color[voxel]); if (s > STRESS_GLOW) tmpColor.lerp(EMBER_GLOW, Math.min(1, (s - STRESS_GLOW) / (1 - STRESS_GLOW)) * 0.55); }
    structure.setColorAt(instance, tmpColor);
  };

  const rebuild = (animated: boolean) => {
    if (!core) return;
    const views = core.views; let count = 0;
    for (let voxel = 0; voxel < views.filled.length; voxel += 1) {
      const instance = views.instanceOfVoxel[voxel];
      if (instance < 0) continue;
      count = Math.max(count, instance + 1);
      const x = voxel % core.width; const z = Math.floor(voxel / core.width) % core.depth; const y = Math.floor(voxel / (core.width * core.depth));
      tmp.set((x - (core.width - 1) * 0.5) * CELL, (y + 0.5) * CELL, (z - (core.depth - 1) * 0.5) * CELL);
      dummy.position.copy(tmp); dummy.scale.setScalar(animated ? 0.001 : 1); dummy.updateMatrix(); structure.setMatrixAt(instance, dummy.matrix); setColor(instance, voxel, performance.now());
    }
    structure.count = count; structure.instanceMatrix.needsUpdate = true; if (structure.instanceColor) structure.instanceColor.needsUpdate = true;
  };

  const repaint = (now: number) => {
    if (!core || !structure.instanceColor) return;
    const views = core.views;
    for (let instance = 0; instance < structure.count; instance += 1) setColor(instance, views.voxelOfInstance[instance], now);
    structure.instanceColor.needsUpdate = true;
  };

  const fireShockwave = (point: THREE.Vector3, strength: number) => {
    const wave = shocks.find((entry) => !entry.active) ?? shocks[0];
    wave.active = true; wave.age = 0; wave.tiltSeed = Math.random();
    wave.inner.rotation.set(Math.sin(wave.tiltSeed * 91.7) * 0.1, 0, Math.sin(wave.tiltSeed * 47.3) * 0.1);
    wave.outer.rotation.copy(wave.inner.rotation);
    wave.inner.visible = true; wave.outer.visible = true;
    wave.inner.position.copy(point); wave.outer.position.copy(point);
    wave.inner.scale.setScalar(0.2); wave.outer.scale.setScalar(0.2);
    wave.inner.userData.strength = strength;
  };
  const fireSparks = (point: THREE.Vector3, strength: number) => {
    const cloud = sparks.find((entry) => !entry.active); if (!cloud) return; cloud.active = true; cloud.age = 0; cloud.strength = strength; cloud.points.visible = true; cloud.points.position.copy(point);
    const attr = cloud.points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const spread = strength * (0.8 + 0.4 * strength);
    for (let i = 0; i < SPARK_COUNT; i += 1) { const o = i * 3; const a = Math.random() * Math.PI * 2; const b = Math.random() * 2 - 1; const r = Math.sqrt(1 - b * b); cloud.buoyancy[i] = Math.random() < 0.2 ? 2.2 : 0; cloud.positions[o] = cloud.positions[o + 1] = cloud.positions[o + 2] = 0; cloud.velocities[o] = Math.cos(a) * r * (2.4 + Math.random() * 5.1) * spread; cloud.velocities[o + 1] = (b * 0.8 + 0.5) * (2.4 + Math.random() * 5.1) * spread; cloud.velocities[o + 2] = Math.sin(a) * r * (2.4 + Math.random() * 5.1) * spread; attr.setXYZ(i, 0, 0, 0); }
    attr.needsUpdate = true;
  };

  const hidePreview = () => { chip.style.display = "none"; previewRing.visible = false; };
  const previewRing = new THREE.Mesh(new THREE.TorusGeometry(3.4 * CELL * 0.85, 0.018, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffc77b, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
  previewRing.visible = false; scene.add(previewRing);

  const updatePreview = (clientX: number, clientY: number) => {
    if (!core || reduced || building) return hidePreview();
    const rect = element.getBoundingClientRect(); ndc.set((clientX - rect.left) / rect.width * 2 - 1, -((clientY - rect.top) / rect.height * 2 - 1)); raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(structure)[0]; if (!hit || hit.instanceId === undefined) return hidePreview();
    const direction: Vec3 = [raycaster.ray.direction.x, raycaster.ray.direction.y, raycaster.ray.direction.z]; const origin: Vec3 = [raycaster.ray.origin.x, raycaster.ray.origin.y, raycaster.ray.origin.z]; const victims = core.preview(origin, direction);
    previewRing.position.copy(hit.point); previewRing.lookAt(camera.position); previewRing.visible = victims > 0; chip.textContent = `≈ ${victims} voxels`; chip.style.display = victims > 0 ? "block" : "none"; chip.style.left = `${clientX - rect.left + 14}px`; chip.style.top = `${clientY - rect.top + 10}px`;
  };
  element.addEventListener("pointermove", (event) => { if (event.pointerType !== "touch") updatePreview(event.clientX, event.clientY); });
  element.addEventListener("pointerleave", hidePreview);

  const handle: SpecimenHandle = {
    detonateAt: (clientX, clientY) => {
      if (!core || reduced || building) return false;
      sfx.resume(); const rect = element.getBoundingClientRect(); ndc.set((clientX - rect.left) / rect.width * 2 - 1, -((clientY - rect.top) / rect.height * 2 - 1)); raycaster.setFromCamera(ndc, camera);
      const origin: Vec3 = [raycaster.ray.origin.x, raycaster.ray.origin.y, raycaster.ray.origin.z]; const direction: Vec3 = [raycaster.ray.direction.x, raycaster.ray.direction.y, raycaster.ray.direction.z];
      const hit = core.pick(origin, direction); const victims = core.blast(origin, direction, 0.96); hitPoint.copy(raycaster.ray.origin).addScaledVector(raycaster.ray.direction, 12);
      if (hit >= 0) {
        shake = Math.min(1.05, shake + 0.4); flashIntensity = 90; flash.position.copy(hitPoint);
        const kickX = hitPoint.x - cameraHome.x; const kickZ = hitPoint.z - cameraHome.z; const kickLen = Math.hypot(kickX, kickZ) || 1;
        shakeDir.set(kickX / kickLen, kickZ / kickLen);
        fireShockwave(hitPoint, 1); fireSparks(hitPoint, 1); sfx.boom(1);
      } else { fireShockwave(hitPoint, 0.28); sfx.thud(); }
      core.refreshViews(); stats.voxels = core.stats.standing; stats.debris = core.stats.debris; stats.peakStress = core.stats.peakStress; if (victims > 0) rebuild(false); return true;
    },
    restore: () => { if (!core) return; core.restore(); core.refreshViews(); stats.voxels = core.stats.standing; stats.debris = 0; building = !reduced; buildStarted = performance.now(); rebuild(!reduced); repaint(performance.now()); sfx.resume(); sfx.rebuild(); },
    setMuted: (muted) => sfx.setMuted(muted),
    setSlowMo: (on) => { slowMoHeld = on; },
    setXray: (on) => { xray = on; repaint(performance.now()); },
    stats,
    dispose: () => { if (disposed) return; disposed = true; cancelAnimationFrame(animation); core?.dispose(); core = null; renderer.dispose(); chip.remove(); previewRing.geometry.dispose(); (previewRing.material as THREE.Material).dispose(); element.querySelector("canvas.explosion-overlay-canvas")?.remove(); },
  };

  const updateVisuals = (dt: number, now: number) => {
    for (const wave of shocks) {
      if (!wave.active) continue;
      wave.age += dt;
      const strength = (wave.inner.userData.strength as number) || 1;
      const innerT = wave.age / 0.62; const outerT = wave.age / 0.9;
      if (innerT >= 1 && outerT >= 1) { wave.active = false; wave.inner.visible = false; wave.outer.visible = false; continue; }
      if (innerT < 1) { wave.inner.scale.setScalar(0.2 + innerT * 4.4 * strength); (wave.inner.material as THREE.MeshBasicMaterial).opacity = (1 - innerT) * 0.65; } else wave.inner.visible = false;
      if (outerT < 1) { wave.outer.scale.setScalar(0.2 + outerT * 2.6 * strength); (wave.outer.material as THREE.MeshBasicMaterial).opacity = (1 - outerT) * 0.3; } else wave.outer.visible = false;
    }
    for (const cloud of sparks) { if (!cloud.active) continue; cloud.age += dt; const t = cloud.age / (0.75 + 0.2 * cloud.strength); if (t >= 1) { cloud.active = false; cloud.points.visible = false; continue; } const attr = cloud.points.geometry.getAttribute("position") as THREE.BufferAttribute; for (let i = 0; i < SPARK_COUNT; i += 1) { const o = i * 3; cloud.velocities[o] *= Math.exp(-2.6 * dt); cloud.velocities[o + 1] = cloud.velocities[o + 1] * Math.exp(-2.6 * dt) - 4.5 * dt + cloud.buoyancy[i] * dt * 2.0; cloud.velocities[o + 2] *= Math.exp(-2.6 * dt); cloud.positions[o] += cloud.velocities[o] * dt; cloud.positions[o + 1] += cloud.velocities[o + 1] * dt; cloud.positions[o + 2] += cloud.velocities[o + 2] * dt; attr.setXYZ(i, cloud.positions[o], cloud.positions[o + 1], cloud.positions[o + 2]); } attr.needsUpdate = true; (cloud.points.material as THREE.PointsMaterial).opacity = 1 - t; }
    if (flashIntensity > 0) { flash.intensity = flashIntensity; flashIntensity *= Math.exp(-12 * dt); } else flash.intensity = 0;
    shake *= Math.exp(-5 * dt); if (shake < 0.01) shakeDir.set(0, 0); camera.position.copy(cameraHome); camera.position.x += (Math.random() - 0.5) * shake * 0.08; camera.position.y += (Math.random() - 0.5) * shake * 0.08; camera.position.x += shakeDir.x * shake * 0.10; camera.position.z += shakeDir.y * shake * 0.10; camera.lookAt(cameraTarget);
    if (building && now - buildStarted >= BUILD_DURATION * 1000) { building = false; rebuild(false); }
    if (core) { const views = core.views; const count = Math.min(core.stats.debris, core.debrisCapacity); for (let i = 0; i < count; i += 1) { const p = i * 3; const q = i * 4; dummy.position.set(views.debrisPos[p], views.debrisPos[p + 1], views.debrisPos[p + 2]); dummy.quaternion.set(views.debrisQuat[q], views.debrisQuat[q + 1], views.debrisQuat[q + 2], views.debrisQuat[q + 3]); dummy.scale.set(views.debrisScale[p] / (CELL * 0.49), views.debrisScale[p + 1] / (CELL * 0.49), views.debrisScale[p + 2] / (CELL * 0.49)); dummy.updateMatrix(); debrisMesh.setMatrixAt(i, dummy.matrix); tmpColor.setHex(views.debrisRgb[i]); debrisMesh.setColorAt(i, tmpColor); } debrisMesh.count = count; debrisMesh.instanceMatrix.needsUpdate = true; if (debrisMesh.instanceColor) debrisMesh.instanceColor.needsUpdate = true; }
  };

  const resize = () => { const rect = element.getBoundingClientRect(); renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false); camera.aspect = rect.width / Math.max(1, rect.height); camera.updateProjectionMatrix(); };
  const frame = (now: number) => { if (disposed) return; const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; if (core) { const dilation = slowMoHeld || now < collapseUntil; core.step(dilation ? dt * (slowMoHeld ? 0.22 : 0.3) : dt, dt); stats.voxels = core.stats.standing; stats.debris = core.stats.debris; stats.peakStress = core.stats.peakStress; if (core.stats.doomed >= COLLAPSE_CAM_THRESHOLD && now >= collapseUntil) { collapseUntil = now + COLLAPSE_CAM_DURATION; stats.slowmo = true; stats.engagements += 1; } else if (now >= collapseUntil) stats.slowmo = false; if (core.stats.worldVersion !== 0 && overloaded.length === 0) overloaded = []; } updateVisuals(dt, now); renderer.render(scene, camera); animation = requestAnimationFrame(frame); };
  const onResize = () => resize(); window.addEventListener("resize", onResize); resize();
  loadPhysicsCore(Math.floor(Math.random() * 0xffffffff), debrisCapacity).then((loaded) => { if (disposed) { loaded.dispose(); return; }    core = loaded; stats.total = loaded.total; stats.voxels = loaded.stats.standing; stats.debris = 0; rebuild(false); repaint(performance.now()); animation = requestAnimationFrame(frame); }).catch(() => { if (!disposed) { element.classList.add("is-fallback"); renderer.dispose(); element.querySelector("canvas.explosion-overlay-canvas")?.remove(); } });
  return handle;
}
```

Dead code you may drop while rewriting (`finiteVector`, the `overloaded` scratch list,
the unused `now` parameter in `setColor`/`repaint`) — but only if behavior is unchanged.

## 5. What each part contains

### 5.1 Response 1 — Part 1, direction lock-in (no code)

1. Three candidate directions, each: name, one-line pitch, one honest risk. Vary
   meaningfully (e.g. mood, framing device, level of ornamentation) — do not offer
   three shades of the same idea.
2. **§0 LOCKED SPEC ≤ 55 lines** for the direction you recommend (pick it yourself;
   the owner granted full creative freedom). The integrator never guesses a value, so:
   - concept: name + ≤3-sentence pitch + why it beats the other two for a demolition
     sim;
   - page palette: exact hex/rgba for page background, panel/line colors, primary
     text, muted text, accent — with the contrast strategy stated (the current build
     is judged too dark on mobile; the spec must visibly raise readability);
   - scene palette: fog color+density, ground color, key/rim/ambient/hemisphere light
     colors + intensities, tone-mapping choice + exposure, canvas clear strategy
     (opaque scene sky vs alpha over CSS);
   - type: roles only (display / mono notation / body) using the shell's `--display`
     and `--mono` stacks — no new font files;
   - layout: region-by-region for desktop ≥1024, tablet ~768, mobile ≤640 — what sits
     where, what hides on mobile, the stage height rule per viewport (the stage must
     stay ≥500 px tall on phones so the tap bands work);
   - camera framing rule (exact formula + constants): how distance and fov depend on
     stage aspect so the full district width (≈16.6 world units + small margin) fits
     on a 390-wide portrait stage; state the final fov, camera distance, and target y
     at aspects ≈0.6 and ≈1.8 so the integrator can update the test's aim math; keep
     the slab band at stage fractions fy ≈ 0.78–0.92 at every aspect (or state the
     shifted fractions);
   - motion rules: what animates, what stays static, reduced-motion behavior;
   - copy: headline, lede, hint strings (keeping every hook format from §2), the
     five-technique list, and the landing-card description + technologies;
   - per-file edit list: what changes in each of the four files.
3. End with the exact line: `END OF PART 1 — reply "continue" for Part 2.`

### 5.2 Response 2 — Part 2, card copy + page component

1. §0 drift notes ≤ 10 lines (ideally "none").
2. `portfolio/projects/explosion/project.ts` — the complete file, changed only in
   `eyebrow`, `description`, `technologies` (and optionally `presentation.note` /
   `instruction`). The description must contain the exact phrase `voxel monument`,
   must name the Rust → WebAssembly core accurately, and stays 1–2 sentences.
   `tag` stays `"physics"`. Technologies: 4–5 honest items, e.g. `"Rust → WebAssembly"`,
   `"three.js instancing"`, `"structural solvers"`, `"WebAudio"`.
3. `portfolio/projects/explosion/web/ExplosionLunaPage.tsx` — the complete file
   implementing the locked spec. Keep: every §2 hook, the mount/dispose effect shape,
   reduced-motion gates, keyboard handlers, telemetry polling, `data-engagements`.
   Everything else (copy, structure, hint logic, section ordering) follows the spec.
4. End with the exact line: `END OF PART 2 — reply "continue" for Part 3.`

### 5.3 Response 3 — Part 3, page stylesheet

1. §0 drift notes ≤ 10 lines (ideally "none").
2. `portfolio/projects/explosion/web/explosion-luna.css` — the complete file per the
   locked spec. Requirements: no horizontal overflow at 390 px; ≥40 px touch targets
   on mobile; the stage sizing rule per viewport; visible focus rings; a
   `prefers-reduced-motion` block; every §2 class present. If the direction departs
   from the ink theme, scope any custom properties to `.explosion-field` so the shell
   is untouched.
3. End with the exact line: `END OF PART 3 — reply "continue" for Part 4.`

### 5.4 Response 4 — Part 4, the renderer

1. §0 drift notes ≤ 10 lines + the final framing constants restated (fov, distance
   rule, target y, exposure) for the integrator's test update.
2. `portfolio/projects/explosion/web/detonate.ts` — the complete file. Must keep
   exactly (§6 seams): the imports of `physics-core` / `audio`, the
   `SpecimenStats` / `SpecimenHandle` types and behavior, the wasm
   init/step/restore/pick/preview/blast wiring, x-ray repaint, bullet-time and
   collapse-cam policies, debris SoA → InstancedMesh copy, pooled shockwaves/sparks,
   allocation-free steady state, resize handling, dispose hygiene. Implement per the
   locked spec: the aspect-aware framing rule (recomputed in `resize`, camera home
   derived from it so shake/kick still work), the brightness pass, and any FX/palette
   changes. The mobile pixel-ratio cap may be tuned ≤1.75 for the software-GL budget.
3. End with the exact line: `END OF PART 4 — deliverable complete.`

## 6. What must not change in `detonate.ts` (integration seams)

- `hasWebGL()`, `mountSpecimen(element)` signatures; `SpecimenStats`/`SpecimenHandle`
  shapes.
- Core wiring: `loadPhysicsCore(seed, debrisCapacity)` with
  `debrisCapacity = element.clientWidth < 720 || window.innerWidth < 720 ? 900 : 1800`;
  `core.step(dtSim, dtReal)` with dilation computed TS-side
  (`slowMoHeld ? 0.22 : 0.3` during collapse windows); `core.pick` → honest-miss path
  (`hit < 0` ⇒ thud + faint ring, nothing changes); `core.blast(origin, dir, 0.96)`;
  `restore()` with the 1.15 s bottom-up build; collapse cam threshold ≥ 50 doomed for
  2600 ms, engagement counter.
- Stats flow from core into the DOM poll; the aim-preview chip flow
  (`core.preview` → `≈ N voxels`, hidden over sky); rebuild/repaint on world changes.
- The renderer stays allocation-free in steady state and dies quietly on wasm failure
  (`is-fallback`).

## 7. Style (all responses)

Code and comments in English. Comments explain constraints and intent (why), not
narration. Idiomatic, dense, well-factored TypeScript/CSS; no dead code. Density beats
verbosity, but **completeness beats everything** — never emit a partial file.

## 8. Definition of done

- Part 1's locked spec is complete enough that the integrator never guesses a value.
- All four files complete; TS strict-clean; React 19 idiomatic; no new deps or assets.
- Every §2 hook survives verbatim; the card copy contains `voxel monument`; tag
  `physics` renders.
- Mobile 390×844: the whole district visible (not cropped), scene and page clearly
  brighter and readable, all controls reachable ≥40 px, no horizontal overflow.
- The suite's aim geometry still works (or exact new constants/fractions are stated
  for the integrator's test update).
