# Prompt — strongest model round (paste verbatim)

In a WebGL2 ping-pong FBO particle simulation (220k particles, position+velocity in float textures, fullscreen-quad passes only, no CPU readback) driven by a real Friedmann cosmology model a(t), design the physics core for four "fate of the universe" modes extending past the present day — heat death (w=-1), big rip (w<-1, singularity in finite time), big crunch (recollapse), vacuum decay (expanding true-vacuum bubble rewriting the field) — specifying for each: the exact a(t) integration approach and its numerical stability limits, how to drive 220k particles through it in the FBO passes without blowup (especially the rip's finite-time singularity and the crunch's collapse into a point), and how to make the vacuum bubble boundary a physical wavefront rather than a shader crossfade.

## Notes for the user (not part of the prompt)
- The block above is the paste. The reply comes back here for salvage-integration.
- If the reply is thin/generic, the next round moves one constraint back into the prompt (per minimize-iteration §5).
