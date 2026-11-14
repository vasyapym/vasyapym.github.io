<!-- lesson-meta: {"practicePrompt":"Set a probe at 2 rₛ and at 1.01 rₛ, compute √(1 − rₛ/r) for each, and convert 3 probe seconds into far seconds at both radii to see the two conversions disagree. Then say in one sentence whose seconds each bare number reports.","checkPrompt":"Without notes, reproduce the hover ratio and its values at 2 rₛ and 1.01 rₛ, and explain why its zero coincides with the death of the hovering observer. Then say whose clock owns the frozen image at the edge and the arrival time of the last photon."} -->
<!-- lesson-theory: {"problem":"Two excellent clocks tell incompatible stories about one fall — the diver crosses at a definite reading, the ship sees her freeze at the edge forever — and neither can be dismissed as broken.","model":"A clock reports only proper time, the seconds along its own path, so two clocks on different paths can disagree while both stay right, like two odometers on different roads. The hover ratio is not a brokenness meter but a conversion factor between radii, and the far-away bookkeeping time is one chart among several, matching no clock near the horizon.","mechanics":"Proper time is the state a clock keeps: it counts seconds along its own path, so two aluminum clocks 33 cm apart in height already disagree measurably, and the gap widens wherever the field is stronger. The hover ratio √(1 − rₛ/r) is the conversion state: it depends only on the radius, reads about 0.71 at 2 rₛ and 0.10 at 1.01 rₛ, and reaches zero exactly where the thrust needed to hold station becomes infinite — a limit of an impossible observer, not a place anyone stands. Coordinate time is bookkeeping state: the t in the formula matches the far clock at infinity and no clock anywhere else, and the blow-up of the dr² term at rₛ is a fault of the chart, not of the geometry, since the later coordinates cover the crossing smoothly and curvature there is finite. The falling clock adds a motion state: for a diver dropped from rest far away dτ/dt = 1 − rₛ/r, and the missing square root comes from the Lorentz factor of her speed c√(rₛ/r) past each hovering observer she passes. The watcher's image is a light state: signals from closer to the horizon take longer to climb out and redshift exponentially in ship time with an e-folding time of 2rₛ/c, and only a finite number of photons leave before the crossing, so a last photon with a definite arrival time exists in the ship's log.","pitfalls":["Treating the slower tick of a lower clock as clockwork trouble; it applies equally to springs, quartz, atoms and heartbeats.","Adding a probe log of 3 seconds to a ship log of 3 seconds and believing the resulting 6 describes any real stretch of time.","Reading the zero of the hover ratio at the horizon as time stopping for someone who is there, though it describes a hover no rocket could maintain.","Mistaking the blow-up of the dr² term in Schwarzschild coordinates at rₛ for a physical singularity; curvature there is finite.","Trusting the type label alone: a ProbeSeconds taken at 2 rₛ and one taken at 1.01 rₛ are not the same second, since only the radius carries the rate.","Saying the diver never crosses the horizon; that never belongs to the ship's clock, hers reaches a definite reading and keeps going.","Taking the frozen image as photons arriving forever; only a finite number leave before the crossing, and the fading runs exponentially in the watcher's time.","Applying the hover ratio to a falling clock and losing the motion factor; the Lorentz term supplies an extra square root, so 0.71 hovering becomes 0.50 falling at 2 rₛ.","Assuming big holes are the dangerous ones for a diver: tidal forces destroy her well outside a 10-solar-mass horizon, while Sagittarius A* allows about 26 seconds from horizon to center."],"whenNot":"The lesson covers a single spherical non-rotating mass in Schwarzschild geometry and classical light signals; it makes no claim about rotating holes, Hawking radiation, or what awaits at the center."} -->

# Black holes and gravitational time dilation

A diver steps off a ship holding station far above a black hole and lets go. Her wristwatch and the ship's chronometer were synchronized before she left. Both are excellent clocks, and neither will fail. From the ship, the watcher sees her fall, slow, redden, and dim, closing on the edge of the hole and never quite reaching it. The diver sees nothing of the kind. Her watch ticks at its usual rate, she crosses the edge at a definite reading on its face, and the crossing feels like nothing at all.

So there are two good clocks with two stories that cannot both be the whole truth. The question is not which clock is lying. It is whose seconds those are.

Neither watch is broken
A clock does not measure time in general. It measures the time along its own path: the seconds that pass for the thing carrying it. Physicists call this proper time. Since Albert Einstein's relativity, special in 1905 and general in 1915, it has been the only kind of time a clock can be trusted to report.

Two clocks that take different paths can disagree when they are compared, and both can be right, the way two odometers driven on different roads can both be right about the distance between the same two cities.

Gravity makes paths differ even for clocks that sit still. A clock lower in a gravitational field runs slow compared with one higher up. This is not an effect on the clockwork. It applies equally to springs, quartz, atoms, and heartbeats. In 2010, a group at the National Institute of Standards and Technology in Boulder, Colorado, compared two aluminum-ion clocks whose heights differed by 33 cm. The lower one fell behind measurably, by a few parts in 10¹⁷1; over a 79-year life, that is about ninety billionths of a second. It is real, it has been measured, and it is not a reason to move into the basement.

Near Earth the effect is small because Earth's gravity is weak. Near a black hole it is not small, and the question from the opening stops being a matter of the 17th decimal place.

A square root with a horizon in it
In late 1915 Karl Schwarzschild, an astronomer serving with the German army on the Russian front, found the first exact solution of Einstein's equations: the geometry outside a single, spherical, non-rotating mass. He sent it to Einstein, who presented it to the Prussian Academy of Sciences in January 19162. Schwarzschild died that May.

His solution contains a length, now called the Schwarzschild radius and written rₛ, equal to 2GM/c². Here M is the mass, G is Newton's gravitational constant, and c is the speed of light.

For the Sun, rₛ is about 2.95 km. For a black hole of 10 solar masses it is about 30 km. For Sagittarius A*, the hole of roughly four million solar masses at the center of the Milky Way3, it is about 12 million km, a fifth of Mercury's distance from the Sun. The sphere of radius rₛ is the event horizon, the surface from inside which no signal can climb back out.

Schwarzschild's geometry also says how fast a clock runs if it hovers at a fixed value of r — the coordinate Schwarzschild chose, not a stride through space — held in place by a rocket, compared with a clock very far away. The ratio is √(1 − rₛ/r). Far from the hole, rₛ/r is close to zero and the ratio is close to 1: a probe second and a far second are nearly the same. At r = 2 rₛ the ratio is about 0.71. At 1.01 rₛ it is about 0.10, so the probe clock ticks once for every 10 ticks of the far clock. At the horizon itself the ratio reaches zero.

That zero is where the phrase “time stops at the horizon” comes from, and the phrase deserves suspicion. The formula describes a clock that hovers, and hovering near a horizon is expensive. The thrust needed to hold still grows without limit as r approaches rₛ4. For a 10-solar-mass hole, hovering at 1.01 rₛ takes more than a trillion times Earth's surface gravity. For Sagittarius A* it takes millions of times.

At the horizon no rocket is enough. The ratio reaches zero exactly where the observer it describes stops being possible. It is a limit, not a place anyone stands.

In Schwarzschild's coordinates, the term multiplying dr² blows up at r = rₛ, which for decades made the horizon look like a physical singularity. It is not one. Curvature there is finite, and for a supermassive hole it is small.

Georges Lemaître showed in 1933 that the trouble lies in the coordinates. Eddington's and Finkelstein's coordinates, and later Kruskal's and Szekeres's, cover the crossing smoothly. The t behind √(1 − rₛ/r) is a bookkeeping time. It matches the far clock at infinity and no clock anywhere else. “Time stops at the horizon” means that one particular bookkeeping scheme runs out of pages.

Seconds that do not add
Leave the diver for a moment and take a simpler pair: a probe hovering at 1.01 rₛ and the ship far above it. Each keeps a log. Suppose the probe reports “3 seconds since the last signal” and the ship writes “3 seconds” in the next column.

The two numbers look the same. Adding them gives 6, a number that describes nothing. Three probe seconds correspond to about 30 far seconds. Combining them takes the conversion factor, and the conversion factor depends on where the probe is.

This is the exact sense in which neither clock is right and neither is wrong. Each one reports its own proper time faithfully. What a bare “3” leaves out is whose seconds they are. A physicist keeps that information in her head, or in a subscript. A program can keep it in its types.

In TypeScript, a branded type is an ordinary number with an invisible label attached. A ProbeSeconds and a FarSeconds are both plain numbers at runtime, but the compiler objects if you pass one for the other or add them together. The only way from one to the other is a function that takes the radius and applies the square root.

The brand alone is not quite enough, and the reason is physical. A ProbeSeconds recorded at 2 rₛ and one recorded at 1.01 rₛ are not the same kind of second either. The label says which clock. Only the radius says the rate. A conversion that forgets r is the type-level version of “time slows down near a black hole”: true, but missing the part that says by how much.

Below, a probe holds station above a black hole, and you decide how far down it goes. Two clocks run beside each other, one aboard the probe and one far away, with the ratio between them. Bring the probe down gradually and watch the probe clock slow against the far one. Look for where the ratio changes fastest. Then push toward r = rₛ and watch the far clock work to keep up.

What the diver does instead
Wherever you stopped the probe, it was holding itself up. The diver is not. She falls freely, and compared with the far clock, a falling clock near a black hole runs slower than a hovering one at the same height, because she is also moving fast past every hovering observer she passes.

Even so, nothing special happens to her at rₛ. There is no wall and no flash. Her watch passes the horizon at some definite reading and keeps going.

How long she has after that depends on the size of the hole. For Sagittarius A*, if she fell from rest far away, her watch shows about 26 seconds from horizon to center, and no path at all gives her more than about a minute. For a 10-solar-mass hole the same interval is a fraction of a millisecond, and tidal forces would have pulled her apart well before the horizon. In this one respect, large holes are the gentler kind.

For a diver dropped from rest far away, Schwarzschild's geometry gives dτ/dt = 1 − rₛ/r, where τ is her proper time and t is the far observer's time coordinate. A hovering clock has √(1 − rₛ/r). The extra factor comes from special relativity. A hovering observer at r measures the diver passing at v = c√(rₛ/r), and the Lorentz factor 1/√(1 − v²/c²) supplies exactly the missing square root. At 2 rₛ, hovering gives 0.71 and falling gives 0.50. Both ratios go to zero at the horizon, and both zeros come from comparing against t, which stops being a useful clock there. The diver's own τ stays finite and smooth.

The watcher's story is about light, not about the diver. Every tick of her watch could send a signal upward. Each signal sent from closer to the horizon takes longer to climb out and arrives stretched to longer wavelengths. The signals from her last moments outside are spread across the ship's entire future.

So the watcher's final image of her is frozen and fading at the edge, and that image is an accurate record of light that left her before she crossed.

J. Robert Oppenheimer and Hartland Snyder made the same point about a collapsing star in 1939. To a distant observer the star approaches its Schwarzschild radius forever, while an observer riding on its surface reaches it in a finite time5. Both logs are correct, and they record different things. One is the diver's proper time. The other is the time her messages arrive at the ship.

The “never” in “never sees her cross” is a statement about the ship's clock, and the ship's clock is not hers.

Late in the fall, the redshift of the diver's signals grows exponentially in the watcher's time, with an e-folding time of 2rₛ/c, which is 4GM/c³. For 10 solar masses that is about 0.2 ms. For Sagittarius A* it is about 80 s.

So “frozen at the horizon forever” is true of a classical light field and false of any detector. Only a finite number of photons leave her before she crosses, and one of them is the last. The frozen image is a limit, like the zero on the hovering clock.

In practice the watcher does not wait forever. Light comes in photons, the stretching is exponential, and for a hole of 10 solar masses the image fades below any detector in well under a second.

Somewhere in the ship's log is the arrival time of the last photon the diver ever sends upward. It carries a reading from her watch, a few ticks short of the horizon, in seconds that were never the ship's to count.

Footnotes
C. W. Chou, D. B. Hume, T. Rosenband, and D. J. Wineland, “Optical Clocks and Relativity,” Science 329, 1630–1633 (2010). https://doi.org/10.1126/science.1192720 ↩

Karl Schwarzschild, “Über das Gravitationsfeld eines Massenpunktes nach der Einsteinschen Theorie,” Sitzungsberichte der Königlich Preußischen Akademie der Wissenschaften (1916), 189–196. English translation by S. Antoci and A. Loinger: https://arxiv.org/abs/physics/9905030 ↩

Event Horizon Telescope Collaboration, “First Sagittarius A* Event Horizon Telescope Results. I.” The Astrophysical Journal Letters 930, L12 (2022). https://doi.org/10.3847/2041-8213/ac6674 ↩

Edwin F. Taylor, John Archibald Wheeler, and Edmund Bertschinger, Exploring Black Holes: Introduction to General Relativity, 2nd edition (draft), freely published at https://eftaylor.com/exploringblackholes ↩

J. R. Oppenheimer and H. Snyder, “On Continued Gravitational Contraction,” Physical Review 56, 455 (1939). https://doi.org/10.1103/PhysRev.56.455 ↩
