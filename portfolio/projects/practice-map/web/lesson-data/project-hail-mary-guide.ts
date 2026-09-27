import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: null,
    blocks: [
      {"kind":"p","text":"*A note on sourcing: I'm confident about the novel. On the film, production details shift, and my information has a cutoff — treat casting, dates and marketing beats below as \"last known\" rather than gospel, and verify anything you're going to quote.*"},
    ],
  },
  {
    heading: "0. What the thing is",
    blocks: [
      {"kind":"p","text":"Andy Weir published *Project Hail Mary* in May 2021. MGM had bought the film rights in March 2020 — before anyone outside the publishing house had read it — reportedly for around $3 million, with Ryan Gosling attached to star and produce. The adaptation is now an Amazon MGM Studios release, directed by **Phil Lord and Christopher Miller**, written by **Drew Goddard**, shot by **Greig Fraser**, and slated for theatres on **20 March 2026**. Gosling plays Ryland Grace; **Sandra Hüller** plays Eva Stratt; Milana Vayntrub, Ken Leung and Lionel Boyce round out the announced ensemble. Rocky — the other lead, and not a human being — has been kept deliberately under wraps."},
      {"kind":"p","text":"Three details are worth holding onto. Goddard also adapted *The Martian*, so this is a screenwriter returning to the same author's operating system. Lord and Miller have not directed a live-action feature since *22 Jump Street* in 2014; everything since has been animation (*The Lego Movie*, the *Spider-Verse* films) or the *Solo* firing. And Fraser is the cinematographer of *Dune* and *Rogue One* — a large-format naturalist who lights with practical sources. That combination tells you the film is aiming for tactile hardware, comic timing, and an animated character carrying half the emotional load."},
    ],
  },
  {
    heading: "1. The premise, spoiler-free",
    blocks: [
      {"kind":"p","text":"A man wakes from a coma with no memory of who he is, aboard a spacecraft, with two dead crewmates. He works out, by degrees, that he is a scientist; that the Sun is dimming; that an organism is eating it; that Earth is facing a famine that will kill billions; and that he has been sent 11.9 light-years to Tau Ceti — the one infected star that isn't dimming — to find out why. There is no way home."},
      {"kind":"p","text":"Then he meets someone else out there, doing exactly the same job for exactly the same reason."},
      {"kind":"p","text":"That's the book. Structurally it runs two timelines: the present-tense mystery aboard the ship, and Grace's memory returning in flashback, filling in how Earth built the thing and how he came to be on it. The amnesia isn't a gimmick for its own sake — it's an epistemological device. It forces the protagonist to *derive* his own situation from evidence, which converts exposition into discovery, and it lets Weir withhold one specific fact until it can detonate."},
    ],
  },
  {
    heading: "2. The concepts",
    blocks: [
      {"kind":"p","text":"**Astrophage**"},
      {"kind":"p","text":"The antagonist is a single-celled organism, roughly ten microns across, black as soot, that lives in a star's chromosphere, absorbs energy, and stores it **as mass**."},
      {"kind":"p","text":"**Beginner:** Think of it as a microscopic solar panel with a perfect battery. It soaks up starlight, gets heavier, and uses that stored energy to fly — emitting light out of its back like a tiny rocket. It breeds on planets with carbon dioxide atmospheres (Venus, in our system), navigating to them by sensing magnetic fields, then flies back to the star. Billions of them are now sitting in the Sun's outer layers, eating its output."},
      {"kind":"p","text":"**Professional:** The conceit is *E = mc²* taken literally as biology. Any stored energy increases a system's mass; astrophage just does it at essentially 100% efficiency, which makes it functionally an antimatter-equivalent fuel that is stable, storable, and — critically — *self-replicating*. You don't manufacture it; you farm it, given CO₂ and heat."},
      {"kind":"list","items":["Gasoline — 4.6 × 10⁷; vs. astrophage: ~2 × 10⁹× worse","Uranium-235 fission — 8.2 × 10¹³; vs. astrophage: ~1,100× worse","D–T fusion — ~3.4 × 10¹⁴; vs. astrophage: ~260× worse","Astrophage (≈ *c*²) — 9.0 × 10¹⁶; vs. astrophage: —"]},
      {"kind":"p","text":"**Geek:** Astrophage releases its energy as monochromatic infrared at **25.984 μm** — the \"Petrova frequency,\" after the astronomer who spots the arc of glowing light running from Venus to the Sun (the Petrova line). Run the numbers: that's 11.54 THz, 385 cm⁻¹, and a photon energy of 47.7 meV. It sits in a part of the far-IR where Earth's atmosphere is effectively opaque to water vapour, which is a quietly good piece of worldbuilding — you'd need space-based instruments to see it at all. Astrophage also holds an internal temperature of exactly 96.415 °C and hunts heat gradients. Note that a *blackbody* peaking at 25.984 μm would be at 111.5 K, so the emission is explicitly not thermal — it's a coherent, directed release. That's the handwave, and it's a clean one: Weir invents a single impossible mechanism and then reasons rigorously from it. That's the difference between science fiction and fantasy with rivets."},
      {"kind":"p","text":"**Why a dimming Sun is worse than you think**"},
      {"kind":"p","text":"The book's threat is a slow, quantifiable, scientifically undeniable civilizational collapse — a deliberate structural mirror of climate change, inverted into cooling. The physics is not gentle. Earth absorbs roughly 240 W/m². A 1% loss of solar output is a forcing of ~2.4 W/m², comparable to everything humanity has done with CO₂ since 1750, in the opposite direction. The projected losses in the novel are an order of magnitude beyond that, into territory the Quaternary has never seen. For calibration: the Maunder Minimum, which gets blamed for the Little Ice Age, involved perhaps a 0.1% change. One of the book's better jokes is that the emergency response includes deliberately maximising the greenhouse effect — burn everything, buy a decade."},
      {"kind":"p","text":"Real-world rhyme, if you want one: **Boyajian's Star** (KIC 8462852), whose genuinely bizarre dimming in 2015 triggered serious \"alien megastructure\" papers, and Betelgeuse's Great Dimming of 2019–20. Stars behaving strangely is a live observational problem, not an invention."},
      {"kind":"p","text":"**The ship, and why nobody comes home**"},
      {"kind":"p","text":"The *Hail Mary* is a photon rocket. Astrophage lines the \"spin drive\" emitters and radiates IR out the back."},
      {"kind":"p","text":"**Beginner:** Light pushes. Very weakly. To get real acceleration out of light you need a preposterous amount of power — so the ship is basically a fuel tank with three people bolted to the front."},
      {"kind":"p","text":"**Professional:** Thrust from a photon drive is *F = P/c*. To pull 1.5 g on even a 100-tonne vehicle you need about 4.5 × 10¹⁴ watts — roughly 25,000 times humanity's total power consumption, pointed out the back, continuously. Waste heat alone would sublimate any real structure; the novel's implicit get-out is that astrophage emission is near-perfectly directional and lossless."},
      {"kind":"p","text":"**Geek — the load-bearing calculation:** For a photon rocket the mass ratio is set by rapidity, *M₀/M₁ = √((1+β)/(1−β))*. At β = 0.92, that's **4.9 per leg**. Accelerate and decelerate to arrive at Tau Ceti: 4.9² ≈ **24×**. Do it again to come home: 4.9⁴ ≈ **576×**. The novel gives the ship roughly two million kilograms of astrophage, which implies a dry mass around 85 tonnes for a one-way trip with a braking burn — and makes a return flight require nearly sixty thousand tonnes of fuel. *This is why it's a suicide mission.* The mission's central moral fact falls directly out of the rocket equation. That's the kind of thing that separates Weir from most of the genre."},
      {"kind":"p","text":"At 0.92c, γ ≈ 2.55: Earth ages something like thirteen years while the crew ages four to six. And the interstellar medium becomes a weapon — an ordinary hydrogen atom arrives as a 1.5 GeV proton, and a single **microgram** dust grain carries the kinetic energy of about 33 kilograms of TNT."},
      {"kind":"p","text":"**Rocky, and first contact as an engineering problem**"},
      {"kind":"p","text":"The other ship at Tau Ceti belongs to an **Eridian** — from 40 Eridani, 16.3 light-years out, a triple system that *Star Trek* fans will recognise as the canonical home of Vulcan. Eridians evolved on a world with a roughly 29-atmosphere ammonia envelope at around 210 °C and about twice Earth's gravity. Consequences, all of which Weir follows through:"},
      {"kind":"list","items":["**No eyes.** Their world is opaque; they perceive by sound, at resolutions that let Rocky hear Grace's heartbeat and digestion.","**No astronomy, for most of their history.** You can't have a Copernican revolution if you've never seen the sky. Their scientific development took a completely different route — superb materials science and mechanics, no digital computing.","**Language as chords.** Rocky speaks in simultaneous frequencies. Contact begins with an FFT and a laptop."]},
      {"kind":"p","text":"**Professional/geek:** The translation sequence is the best thing in the book and it is emphatically *not* Sapir–Whorf. *Arrival* argues that an alien language rewires cognition. *Project Hail Mary* argues the opposite and older thesis — that communication is a pragmatics problem of establishing common ground through ostension and shared referents, with mathematics and physics as the substrate. It's Hans Freudenthal's **Lincos** (1960) in practice, or the anticryptography tradition of Minsky and DeVito: you start with numbers, move to objects both parties can touch, and bootstrap. It also produces the two friends' single most consequential constraint — Rocky's body cannot survive Grace's environment and vice versa. Every scene between them is played through a wall."},
      {"kind":"p","text":"Their partnership is an engineering collaboration first and a friendship second, which is precisely why the friendship lands."},
      {"kind":"p","text":"**Tau Ceti, Adrian, and the answer**"},
      {"kind":"p","text":"Tau Ceti is a real G8V star, 11.9 light-years away, about 78% the Sun's mass, metal-poor, and wrapped in a debris disc roughly ten times the Solar System's. In the novel it is infected like the others — but not dimming. Something is keeping the astrophage in check: a predator, on a planet Grace names **Adrian**. Solve the ecology, ship the predator home, save two civilizations."},
      {"kind":"p","text":"What follows is the novel's finest piece of scientific storytelling, and I won't spoil the mechanism. It turns on a selection-breeding problem with a consequence nobody anticipates — the kind of second-order failure that will be familiar to anyone who has ever engineered a biological system and discovered that the trait you selected for came bundled with one you didn't."},
    ],
  },
  {
    heading: "3. Spoilers — the twist, and whether the film will keep it",
    blocks: [
      {"kind":"p","text":"**Skip to §4 if you haven't read the book.**"},
      {"kind":"p","text":"Two things."},
      {"kind":"p","text":"First, the memory that comes back last: **Grace was a coward.** He is a junior-high science teacher, a former molecular biologist exiled from academia for a paper arguing that life doesn't require liquid water — which is why Stratt recruited him, and which makes him right in the only way that matters. He worked on the project. And when he understood that the crew would not return, he refused to go. Stratt drugged him and put him on the ship. The heroism of the entire third act is retroactively reframed: this is not a hero being tested, it's a man discovering he is better than the person he actually was. It's a genuinely unusual moral architecture, and it is the whole book."},
      {"kind":"p","text":"Second: **he doesn't come home.** He burns his return margin saving Rocky, sends the cure back to Earth aboard four small probes named John, Paul, George and Ringo, and ends the story alive on Erid, in a pressurised habitat, teaching Eridian children — exiled, useful, content. Earth is saved and never learns what happened to him."},
      {"kind":"p","text":"Both of these are the things studios historically sand off. Whether Lord, Miller and Goddard keep the coward reveal at full strength, and whether the last scene stays on Erid, are the two questions that will decide whether this is a good adaptation or merely an expensive one. Goddard's *Martian* was faithful and warm; that's an encouraging precedent. The Beatles-named probes are also, incidentally, an expensive music-rights joke."},
    ],
  },
  {
    heading: "4. Why this is hard to film",
    blocks: [
      {"kind":"p","text":"*The Martian* had a built-in camera: Watney's video logs. *Project Hail Mary* has none of that, and four specific problems:"},
      {"kind":"list","ordered":true,"items":["**Interiority.** The novel is first-person, comic, and mostly a man narrating his own reasoning. Cinema hates this. The amnesia helps — the audience can genuinely learn alongside him — but sustained voiceover is a crutch and Lord and Miller know it.","**Rocky.** A pentaradial, eyeless, five-legged carapace the size of a dog, with no face, who communicates in chords, must become one of the most beloved characters of the decade. There's no facial performance capture solution here. The lineage is WALL-E, Groot, and — the closest structural ancestor — the Drac in *Enemy Mine* (1985). Lord and Miller's animation background is not a curiosity; it's the reason they got the job.","**The chord language.** The film needs a *consistent* acoustic lexicon, not just alien noises. If they build a real one — if a second viewing lets you decode chords before the subtitles — it will be the single best geek payoff in the movie. (Ray Porter's audiobook performance has already set fan expectations for how Rocky sounds; the film is walking into an existing consensus.)","**Dramatising iteration.** The book's pleasure is hypothesis → experiment → failure → revision. That's a *rhythm* problem, not a plot problem, and it lives entirely in the editing."]},
      {"kind":"p","text":"On the plus side: the *Hail Mary*'s three-deck layout (control, lab, dormitory) is a gift for a practical build, and Fraser is the right person to make a windowless cylinder feel like a place."},
    ],
  },
  {
    heading: "5. At altitude: what the story is actually about",
    blocks: [
      {"kind":"p","text":"**Grace as a theory of altruism.** Evolutionary ethics offers two cheap explanations for sacrifice: kin selection and reciprocal altruism. *Project Hail Mary* deliberately voids both. Grace and Rocky share no genes, no biochemistry, no sensory world, and no possibility of future reciprocation — and the climax is each choosing the other over their own species' timeline. The novel is arguing, without ever saying so, that moral consideration can be grounded in something other than shared substrate. That's a serious position, and the book earns it through procedure rather than sentiment: they help each other because they've been working together."},
      {"kind":"p","text":"**Stratt as the state of exception.** Eva Stratt is handed absolute global authority by the UN and uses it — seizing property, suspending treaties, ordering deaths, drugging a man onto a ship. She is Carl Schmitt's sovereign, the one who decides on the exception, rendered as a competent Dutch administrator. The novel admires her and is uneasy about her in roughly equal measure, and it never resolves the tension. In 2021 that read as a thought experiment about pandemic-era emergency powers. In 2026 it will read differently, and Hüller — who specialises in women you cannot quite condemn — is inspired casting."},
      {"kind":"p","text":"**The title.** A Hail Mary is a desperate long throw. It's also a prayer: *Hail Mary, full of grace.* The ship is the Hail Mary; the man is Grace. The book is thoroughly secular and entirely about grace — unearned, arriving late, extended to a stranger who is not even the same kind of thing you are."},
    ],
  },
  {
    heading: "6. Lineage",
    blocks: [
      {"kind":"p","text":"*The Martian* for the procedural comedy; *Arrival* for first contact as intellectual labour (and as a philosophical foil); *Enemy Mine* for the two-species friendship; *2001* and *Solaris* for the interior of a silent ship; *Interstellar* for relativity as grief; *E.T.* and *WALL-E* for the non-human you love. Notably absent: any artificial intelligence. There is no HAL. The only other mind in this story is genuinely alien, and that's a deliberate and increasingly rare choice."},
    ],
  },
  {
    heading: "7. Five things to hold onto",
    blocks: [
      {"kind":"list","ordered":true,"items":["**Astrophage is mass-energy storage at nearly 100% efficiency** — the fuel of the story, the villain of the story, and the reason the ship exists.","**The rocket equation is the plot.** A mass ratio of ~24 for a one-way trip and ~576 for a round trip is why nobody comes home, and therefore why the moral twist works.","**Rocky is the movie.** If the CG and the chord language land, everything else is decoration.","**The amnesia hides a confession, not a mystery.** Grace didn't volunteer.","**Watch whether they keep the ending.** Erid or Earth — that's the tell."]},
    ],
  },
];;
