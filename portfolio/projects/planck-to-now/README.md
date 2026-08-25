# Planck to Now

GPU-accelerated Three.js/WebGL playback of cosmic history on a logarithmic time axis, from the Planck epoch to the present day.

The particle field is a real GPGPU simulation: positions and velocities live in ping-pong float framebuffers and are integrated every frame (curl-noise turbulence for the hot plasma, spring accretion toward the cosmic web once structure forms). Clicking the scene perturbs the field — a shock ripple in the plasma era, a gravity well in the web era. When WebGL2 float render targets are unavailable the app falls back to the original vertex-shader path (`?static=1` forces it).

## Run locally

```bash
npm install
npm run verify        # typecheck + cosmology tests + build
npm run test:smoke    # headless-Chrome smoke of gpgpu, fallback, scrub, poke
```

Open `index.html` through a static server after building. The portfolio shell serves the standalone view at `/planck-to-now/` and embeds it on `/projects/planck-to-now`.

Controls are keyboard- and pointer-driven: pause or resume playback, restart the timeline, adjust speed, orbit the camera, zoom the scene, scrub the timeline by clicking or dragging it, and click the field to perturb it.
