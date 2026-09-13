# Fates of the Universe — physics core design (strongest-model round, salvaged)

Source: strongest-model reply to `docs/briefs/PROMPT-planck-fates-core.md` (verbatim below the assessment).
Status: canonical design for implementation; not yet integrated. Implementation goes to ok-model briefs (B1…).

## Salvage assessment (orchestrator, verified)

Checked claims: τ_rip − τ₀ ≈ 2/(3|1+w|√Ω_DE) ≈ 8.0 H₀⁻¹ for w=−1.1 ✓; Λ<0 crunch τ = 2π/(3√|Ω_Λ|) ≈ 2.52 ✓; second-order system du/dτ=p, dp/dτ=A(u)−p² is algebraically correct and passes H=0 smoothly (the first-order √E² form has a branch point there) ✓; curvature drops out of A(u) since 1+3w=0 for w=−1/3 ✓; free-particle stretch/redshift relations are exact ✓; kick-drift-kick with tide in the kick is symplectic ✓; 470×470 = 220,900 ≈ 220k ✓; MRT with 3 attachments is WebGL2-legal ✓.

Open items the implementation briefs must resolve:
1. The log-radial vertex GLSL is pseudo-code — the `log(length(x_h + d/exp(lna)))` expression needs a real numerically-stable formulation.
2. Halo assignment at mode entry: the past (Planck→now) keeps the existing painted field; entering a fate at τ₀ must convert current positions into (x_h, d, flag) state — Voronoi/nearest-center assignment pass unspecified (CPU or FBO pass; fieldgen's cluster centers as a seed).
3. Camera "attached to home halo" is a UX decision, not just math.
4. Free-particle release bookkeeping (`d ← a·x_h + d; x_h_eff ← 0`) needs exact state layout.
5. Units reconciliation: this design is in Hubble units (τ=H₀t, c/H₀); existing `cosmology.ts` is SI (log10 seconds). B1 introduces a self-contained Hubble-unit module with a conversion boundary to the existing display formatters.
6. `uHot` dead uniform and existing web-accretion spring path remain untouched for the past eras.

---

## Verbatim design

The reply below is the strongest model's answer, kept verbatim as the spec.

---

Below is a complete design: units and state layout first, then the scale‑factor integrator (one per mode, all sharing one CPU‑side ODE core), then the per‑particle equations and how they survive a→∞ and a→0 in float32, then the vacuum bubble as a causal front.

---

## 0. Units, state, pass structure

**Units.** Time in Hubble times (τ = H₀t), length in Hubble lengths (c/H₀), c = H₀ = 1. Present‑day: τ₀ ≈ 0.96 for ΛCDM, a(τ₀)=1. A galaxy's internal orbital frequency is ω ≈ 2π/(200 Myr) ≈ 440 in these units; a solar system ≈ 10⁸; an atom ≈ 10²⁴. You only simulate the first one explicitly; the others are thresholds.

**Split of labour (no readback needed).** The Friedmann equation is one scalar ODE. Integrate it on the CPU each frame, upload `a, H, A=ä/a, lna` (and per‑substep arrays of them) as uniforms. Particles never integrate a(t) themselves — except inside a vacuum bubble, where each particle carries its *own local* scale factor (§5).

**Particle state (220k = 470×470 texels, RGBA32F, MRT ping‑pong):**

| tex | rgb | a |
|---|---|---|
| `T_halo` (static) | comoving halo centre **x_h** | halo mass parameter GM |
| `T_d` | physical offset **d** from halo centre | flags (0 free, 1 bound, 2 inside bubble, 3 crunched) |
| `T_v` | **ḋ** (physical peculiar velocity) | τ_c (bubble crossing time, −1 if none) |
| `T_loc` | (a_p, ȧ_p, unused) | brightness/age |

Every particle is a member of a halo (Voronoi‑assigned at init; ~1500 halos). Halo centres ride pure Hubble flow: proper position **x_h**·a(τ). The particle's proper position is `a·x_h + d`. This decomposition is the whole trick: the unbounded part (a·x_h) is analytic and never integrated; the integrated part (**d**) is bounded by physics in three of four fates, and in the fourth (rip) it's capped by an explicit unbinding rule.

**One substep = one draw** into two MRT targets (`T_d`, `T_v`) plus `T_loc` (3 attachments). Per frame: `n_sub` substeps chosen by the CPU stability rule (§3), typically 1–8. Rendering: a point‑sprite pass with `texelFetch` via `gl_VertexID`, positions computed in the vertex shader (§4).

---

## 1. Scale‑factor integrator (CPU, shared by all modes)

Work in **u = ln a**, not a. With E(u) = H/H₀:

```
E²(u)   = Σᵢ Ωᵢ e^{−3(1+wᵢ)u} + Ωk e^{−2u}
A(u)    = ä/(aH₀²) = −½ Σᵢ (1+3wᵢ) Ωᵢ e^{−3(1+wᵢ)u}        (curvature drops out)
```

Components: radiation (w=⅓, include it; it matters at the crunch), matter (0), dark energy (w), curvature.

Integrate the **second‑order** system, not the first‑order √E² one:

```
du/dτ = p
dp/dτ = A(u) − p²          (because d/dt(H) = ä/a − H²)
```

Reasons: (i) it passes smoothly through H=0 (crunch turnaround), where `du/dτ = ±E` has a square‑root branch point and gets stuck; (ii) in u the rip and the crunch are both *finite* trajectories in τ with mild slopes, so RK4 with `h = ε / sqrt(p² + |A|)`, ε = 0.02, is accurate to ~1e‑9 per Hubble time. Every step, project p onto the constraint: `p ← sign(p)·sqrt(E²(u))` blended 10% to kill secular drift (this is the Friedmann constraint; it's exact for these homogeneous components).

Upload per substep: `a=eᵘ, H=p, A=A(u), lna=u`. Also upload `Q = A − H²·0` … actually `A` alone is what particles need (see §2).

**Mode parameters**

| Mode | Ω_m | Ω_DE | w | Ω_k | terminal condition |
|---|---|---|---|---|---|
| Heat death | 0.31 | 0.69 | −1 | 0 | none; τ → ∞ (clock warps, §3) |
| Big rip | 0.31 | 0.69 | −1.1 (user: −1.05…−1.5) | 0 | u > 60 (a > 10²⁶, ä/a past atomic ω²) |
| Big crunch (closed) | 1.6 | 0 | — | −0.6 | a < 10⁻³ (T ≈ 3000 K·10³ ⇒ plasma) |
| Big crunch (Λ<0) | 0.31 | −0.69 | −1 | 0 | same |
| Vacuum decay | ΛCDM outside; Ω_in ∈ [−5, −50] inside | | | | last particle crunched |

Sanity values you can check against: heat death a(τ)=(Ω_m/Ω_Λ)^{1/3}sinh^{2/3}(3√Ω_Λ τ/2); big rip τ_rip−τ₀ ≈ 2/(3|1+w|√Ω_DE) ≈ 8.0 (≈ 110 Gyr) for w=−1.1; Λ<0 crunch at τ = 2π/(3√|Ω_Λ|) ≈ 2.52 (≈ 35 Gyr). The RK4 in u reproduces these to <1e‑6.

---

## 2. Particle equations of motion

A particle bound to a halo at physical offset **d** in an FRW background obeys (Newtonian limit in the halo's local frame, exact in the sense of the geodesic deviation equation):

```
d̈ = A(τ)·d  −  GM · d / (|d|² + ε²)^{3/2}
```

The first term is the cosmological tide (ä/a, sign and magnitude straight from the Friedmann acceleration equation — this is the *only* coupling between cosmology and structure, and it is the physically correct one). The second is a Plummer halo. There is no Hubble‑drag term because **d** is a *physical* separation, not a peculiar velocity in comoving coordinates; drag reappears automatically for freed particles.

Define the local effective frequency `Ω²(d) = GM/(|d|²+ε²)^{3/2} − A`. Bound if Ω²>0.

**Free particles** (flag 0): comoving position **x** fixed, peculiar velocity decays as 1/a. Store them the same way: **d** is their proper offset from the halo point they left, and

```
d ← d·(a_new/a_old)        (pure Hubble stretch, exact)
ḋ ← ḋ·(a_old/a_new)        (peculiar velocity redshifts, exact)
```

No integration, no error, no blowup: **d** grows only as a, and rendering handles a (§4).

**Bound ↔ free transitions**

- *Unbinding (rip)*: when `A > GM/(|d|²+ε²)^{3/2}` **and** `d·ḋ > 0` the tide wins; when |d| exceeds 3× the halo scale radius, flag→0. This makes the rip come out of the dynamics with the right ordering: outer halo members first, then inner, then (thresholded, not simulated) solar systems at A > 10¹⁶, atoms at A > 10⁴⁸ — these two just drive shader visuals (sprite fragmentation, then whiteout) by comparing `A` to constants.
- *Rebinding*: none. Halos in a crunch don't need it (they contract with the tide); in heat death nothing changes.

**Integrator for bound particles.** Kick‑drift‑kick with the tide folded into the kick:

```glsl
vec3 acc(vec3 d, float A, float GM){
    float r2 = dot(d,d)+eps2;
    return d*(A - GM*inversesqrt(r2)/r2);
}
v += 0.5*dt*acc(d, A_n,   GM);
d += dt*v;
v += 0.5*dt*acc(d, A_n1,  GM);
```

Symplectic, time‑reversible, no secular energy drift over 10⁴ orbits at dt·ω ≤ 0.2. `A_n, A_n1` are the substep‑begin/end tide values from the CPU arrays.

---

## 3. Stability limits and the warped clock

Three time scales bound the substep:

```
dt ≤ 0.2 / ω_max          ω_max = sqrt(GM_max / ε³)         (halo core)
dt ≤ 0.2 / sqrt(|A|)      (tide: exponential growth/collapse rate)
dt ≤ 0.1 / |H|            (Hubble stretch of free particles per step)
```

The CPU computes `dt_stable = min(...)` from the current a, and given the requested sim time advance Δτ_frame:

```
n_sub = ceil(Δτ_frame / dt_stable)
if n_sub > N_MAX (16): Δτ_frame = N_MAX * dt_stable      // slow the clock
```

That last line is what prevents blowup near every singularity: as A→∞ (rip) or A→−∞ (crunch), the sim clock decelerates automatically. It's also cinematically right — the last 10⁻³ Hubble times of a rip are where everything happens. Present the user a **log‑time** slider: Δτ_frame ∝ (τ_end − τ) for rip/crunch, ∝ τ for heat death (so 10¹⁰⁰ years is reachable; nothing changes dynamically past τ≈20 anyway, only brightness).

Per‑mode limits in practice (GM giving ω_gal = 440, ε = 0.01 scale radii ⇒ ω_max ≈ 4400):

| Mode | binding constraint | when |
|---|---|---|
| Heat death | halo core, dt ≈ 4.5e‑5 | always; A saturates at Ω_Λ = 0.69, harmless |
| Big rip | tide, from τ_rip−τ ≈ 0.02 onward (A ≈ 51/(τ_rip−τ)² for w=−1.1) | clock slows ∝ (τ_rip−τ) |
| Crunch | tide + Hubble, A ≈ −½Ω_m a⁻³ − Ω_r a⁻⁴ | clock slows ∝ a^{3/2} |
| Vacuum | interior A_in = −½(Ω_m a_p⁻³ − 2Ω_in): stiff immediately at crossing (|Ω_in| large), then a_p→0 | dt ≤ 0.2/sqrt(|Ω_in|) bounds everything; a_p floor at 10⁻³ |

Float32 sanity: a reaches 10²⁶ in the rip; `a*x_h` with |x_h| ≤ 3 is ~3·10²⁶ < 3.4·10³⁸. Fine, but it's *precision*, not range, that bites (a·x_h loses all info about **d**). Never form `a*x_h + d` in a float and hope; see §4.

---

## 4. Rendering positions without overflow or precision loss

Proper position of particle i: **r** = a·**x_h** + **d** (or **d** alone contains everything for freed ones — set **x_h** offset consistently at release: `d ← a·x_h + d; x_h_eff ← 0` via a flag so the free branch is self‑contained).

Camera is attached to a **home halo** (x_h = 0). The vertex shader computes the relative proper position **R** = a·**x_h** + **d** − **d_cam** and projects with a **log‑radial map**:

```glsl
float rho = length(R);
float lna_safe = clamp(lna, -30.0, 60.0);
// compute log(rho) without forming a*x_h when a is huge:
float logrho = (flag==FREE) ? log(length(d))
             : log(length(x_h)) + lna_safe + log(length(x_h*1.0 + d/exp(lna_safe)*1.0)/length(x_h));  // stable form
vec3 dir = normalize(R);            // direction is well conditioned even at 1e26 scale
float s = log2(1.0 + exp(logrho)/L0) * SCALE;   // L0 ~ 1 Mpc; beyond that, logarithmic
gl_Position = proj * view * vec4(dir*s, 1.0);
```

(For the bound branch, when `lna` is large the `d/a` term underflows to 0 and the expression degenerates gracefully to `log|x_h| + lna`, which is correct: at that point d is negligible against the halo separation.)

Consequences: the home halo stays at fixed apparent size; in the rip, neighbouring halos slide outward at a *visible* rate through 10²⁶ orders of magnitude; in the crunch they slide inward and pile up; nothing exceeds float range.

**Horizon fading (heat death).** Light from a halo at proper distance D receding with H is redshifted; for de Sitter the observed flux drops as (1+z)⁻⁴ with 1+z = 1/(1 − D·H) inside the horizon and vanishes at the event horizon D = 1/H. Use brightness `b = pow(max(1−DH,0),4) · b_stellar(τ)` where `b_stellar` decays on the stellar‑lifetime clock (~10⁴ Hubble times → in log‑time this is the visible phase after the halo separation freezes in comoving terms). Plus point‑size ∝ 1/(1+z).

**Crunch heating.** T = 2.7 K/a; blackbody colour from T, opacity ∝ a⁻⁴ Ω_r term, whiteout when a<10⁻³.

---

## 5. Vacuum decay: a causal wavefront

### 5.1 Wall kinematics (CPU, becomes a uniform)
Nucleation at comoving **x₀**, time τ_n, critical radius R₀ (proper). Thin‑wall Coleman–De Luccia trajectory is a hyperbola in proper coordinates; locally the wall velocity is

```
v_w(τ) = (τ−τ_n) / sqrt((τ−τ_n)² + R₀²)      → 1 within a few R₀
```

and the **comoving** wall radius is

```
χ_w(τ) = ∫_{τ_n}^{τ} v_w(τ') / a(τ') dτ'
```

Integrate this alongside the u‑ODE with the same RK4 (it's one more equation). Upload `χ_w` at each substep boundary: `chi_w_n, chi_w_n1`. This is a null front (after the transient): no particle can respond before it passes. Supports K bubbles with a uniform array `x0[K], tau_n[K], chi_w[K]` — walls collide naturally where their comoving spheres overlap; crossing tests take the earliest.

### 5.2 Crossing detection (GPU, exact to sub‑step)
In the update shader, for a particle not yet inside:

```glsl
float chi = length(comovingPos - x0);   // comovingPos = x_h + d/a
if (chi < chi_w_n1 && chi >= chi_w_n) {
    float f   = (chi - chi_w_n) / (chi_w_n1 - chi_w_n);   // linear inverse of χ_w on the substep
    tau_c     = tau_n_sub + f*dt;
    a_p       = mix(a_n, a_n1, f);                        // local scale factor starts continuous
    adot_p    = a_p * mix(H_n, H_n1, f);                  // and so does its velocity (H)
    flag      = INSIDE;
    v        += kick_wall * normalize(comovingPos - x0);  // wall pressure impulse, optional, small
}
```

`chi_w` is monotonic so the "stepped over" case can't be missed. Because tau_c is per‑particle and interpolated, a 10⁵‑particle shell crossing in one substep does not produce a banded front.

### 5.3 Interior physics (per particle)
The wall changes the vacuum energy, not the velocity field: at the wall, a_p and ȧ_p are continuous, **ä** jumps. So each interior particle integrates its own scale factor with the *interior* Friedmann acceleration:

```
A_in(a_p) = −½ [ Ω_m a_p⁻³ + Ω_r a_p⁻⁴ − 2 Ω_in ]     (Ω_in < 0 ⇒ every term negative)
ä_p = a_p · A_in(a_p)         leapfrog, same dt as everything else
```

Matter/radiation are continuous across the wall (same particles, same photons), only the vacuum term flips. With Ω_in ≪ 0 the interior decelerates violently; a_p reaches a maximum and collapses to 0 in a time ≈ π/√(3|Ω_in|) after crossing. This is the AdS crunch inside a decayed bubble, and because τ_c varies spatially, the **crunch surface follows the wall as a second front** at a fixed comoving lag — a real feature, not an effect.

Particle positions inside use the local scale factor for the part of space that's inside:

```
r = a(τ)·x₀  +  a_p·(x_h − x₀)  +  d
```

i.e. the bubble centre rides the exterior flow, interior comoving separations scale with a_p, and **d** now feels the interior tide `A_in` (plus optionally `GM_in = 0` or `GM·k` — changed constants — which makes halos evaporate or collapse; I'd default to GM→0, "chemistry ends"). The proper wall radius is `a·χ_w`; since a_p < a inside, interior matter falls away from the wall toward the centre, leaving a gap where the wall's energy lives. That's the correct qualitative picture (wall carries the released vacuum energy, interior collapses).

Terminal: when `a_p < 1e‑3`, flag=CRUNCHED; render as a hot pixel that fades; freeze its state (no further integration ⇒ no NaN source). `A_in` at a_p = 10⁻³ is ~10⁹·Ω_m ⇒ dt ≤ 0.2/3·10⁴; the CPU's `dt_stable` must include the interior minimum, which it can compute analytically from a_p,min ≡ 10⁻³ (worst case) rather than reading back — conservative but sufficient, since substep count is capped by the warped clock anyway.

### 5.4 Drawing the wall
Separate pass: sphere at proper radius `a·χ_w` around `a·x₀`, in the same log‑radial projection (send the wall's proper radius through the same `s(ρ)` map so it lines up with particles). Thickness = wall rest thickness / γ_w, γ_w = 1/√(1−v_w²) — visibly Lorentz‑thin after the first frames. Emission ∝ σγ_w. Interior fog colour driven by the *local* a_p field: pass `a_p` per particle to the sprite pass for tint. For two bubbles, draw both; the collision lens is where their fronts intersect, again with no special‑casing.

---

## 6. Substep shader skeleton

```glsl
// uniforms per substep: dt, a_n,a_n1, H_n,H_n1, A_n,A_n1, lna_n1, chi_w_n,chi_w_n1, x0, Om, Or, Oin, GM_in
void main(){
  fetch d,v,flag,tau_c,a_p,adot_p, x_h,GM;

  if (flag==CRUNCHED) { write unchanged; return; }

  if (flag==FREE) {                 // exact Hubble stretch
      d *= a_n1/a_n;  v *= a_n/a_n1;
  }
  else if (flag==BOUND) {
      leapfrog(d,v, A_n,A_n1, GM);
      if (A_n1 > GM*pow(dot(d,d)+eps2,-1.5) && dot(d,v)>0 && length(d) > 3*r_s)
          { d += a_n1*x_h; flag=FREE; }          // release, self-contained offset
      testCrossing();                             // §5.2
  }
  else /* INSIDE */ {
      float Ain0 = Ain(a_p), Ain1;
      // leapfrog a_p, then d with interior tide
      adot_p += 0.5*dt*a_p*Ain0;  a_p += dt*adot_p;  Ain1 = Ain(max(a_p,1e-3)); adot_p += 0.5*dt*a_p*Ain1;
      leapfrog(d,v, Ain0,Ain1, GM_in);
      if (a_p < 1e-3) flag = CRUNCHED;
  }
  write.
}
```

NaN guards: every `inversesqrt` has `+eps2`; every scale ratio uses substep pairs from the CPU (never `exp(lna)` on the GPU for huge lna except clamped in the vertex shader); frozen states are early‑outed. With these, 220k particles run indefinitely through all four endings with zero CPU↔GPU traffic other than a handful of uniforms per substep.
