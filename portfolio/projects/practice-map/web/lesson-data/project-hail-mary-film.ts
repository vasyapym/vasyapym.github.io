import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: null,
    blocks: [
      {"kind":"p","text":"**The one-sentence pitch:** A man wakes up alone on a spacecraft, unable to remember his mission, while a microscopic organism threatens to dim the Sun—and solving the problem may require him to cooperate with someone from another star."},
      {"kind":"p","text":"The film adapts Andy Weir’s 2021 novel. **Ryan Gosling** plays Ryland Grace; **Sandra Hüller** plays Eva Stratt. **Phil Lord and Christopher Miller** direct, from a screenplay by **Drew Goddard**, who also adapted Weir’s *The Martian*. Its announced theatrical date was **March 20, 2026**."},
      {"kind":"p","text":"This guide starts with the premise, then marks the major spoilers clearly. **The full-story account follows the novel; the film need not preserve every detail.**"},
    ],
  },
  {
    heading: "The beginner’s map: what is going on?",
    blocks: [
      {"kind":"p","text":"Ryland Grace is a former scientist turned schoolteacher. He wakes aboard the *Hail Mary* with two dead crewmates, little memory, and a destination far beyond our solar system. On Earth, scientists have discovered **Astrophage**—a fictional microorganism that absorbs stellar energy. As its population grows, the Sun supplies less light to Earth. That means not merely colder winters, but endangered agriculture and ecosystems."},
      {"kind":"p","text":"Grace’s destination is **Tau Ceti**, a real star roughly **12 light-years** away. Other affected stars appear to be dimming, but Tau Ceti seems to be an exception. Why?"},
      {"kind":"p","text":"The story is part space-survival puzzle, part first-contact story. Its pleasure lies in watching people turn baffling observations into experiments—and in discovering that the best person to solve a problem may not be a person at all."},
      {"kind":"p","text":"**Five terms worth knowing**"},
      {"kind":"list","items":["**Astrophage** — The fictional “star-eater”: a microorganism that harvests stellar energy and also makes extraordinary spacecraft fuel.","**Petrova line** — An infrared clue associated with Astrophage traveling between the Sun and Venus.","**Tau Ceti** — The real nearby star Grace investigates because it appears comparatively unaffected.","**Spin drive** — The story’s Astrophage-powered propulsion system.","**Rocky** — An alien engineer whose encounter with Grace changes the mission—and the kind of story this is."]},
      {"kind":"p","text":"**The crucial distinction:** The stars, light-travel time, climate physics, and need for experimental evidence are real. Astrophage, Rocky’s world, and the remarkable materials and organisms central to the solution are fiction."},
    ],
  },
  {
    heading: "Major story spoilers from the novel below",
  },
  {
    heading: "What happens—and why the ending matters",
    blocks: [
      {"kind":"p","text":"Grace gradually reconstructs two histories: what brought him aboard the ship, and what is happening around Tau Ceti."},
      {"kind":"list","ordered":true,"items":["**Earth identifies the threat.** Astrophage feeds on energy near stars and reproduces in suitable planetary environments. Its spread could reduce sunlight enough to devastate Earth. Eva Stratt leads an emergency effort to investigate and respond."]},
      {"kind":"list","ordered":true,"items":["**The mission is a long-shot investigation, not a routine rescue trip.** Tau Ceti’s apparent resistance makes it the best place to search for an explanation. The *Hail Mary* can send findings home using small automated return probes nicknamed the **Beetles**; getting its human crew home is not the original plan."]},
      {"kind":"list","ordered":true,"items":["**Grace meets Rocky.** Rocky is the surviving engineer of a mission from another star system. His people face the same threat. He perceives and communicates very differently from a human, but he and Grace establish a working language through patient observation, mathematics, experiments, and eventually trust. Neither has all the answers: their expertise is complementary."]},
      {"kind":"list","ordered":true,"items":["**They find a biological countermeasure.** A fictional world in the Tau Ceti system, **Adrian**, harbors **Taumoeba**, a microscopic predator of Astrophage. Grace and Rocky must make it viable under the conditions where it is needed. This is not a magic antidote: it is an ecological intervention with survival, delivery, and containment problems."]},
      {"kind":"list","ordered":true,"items":["**Grace faces a genuinely voluntary choice.** The predator threatens Rocky’s Astrophage fuel through a containment failure. Grace sends the return probes toward Earth, then gives up his immediate route home to rescue Rocky. He ends up living in a protected human environment on Rocky’s world, **Erid**, where he teaches children. Evidence suggests the Sun recovers, though distance means Grace cannot personally witness everything that happened on Earth."]},
      {"kind":"p","text":"A late memory changes how we understand his bravery: **Grace initially refused the mission, and Stratt forced him aboard.** The final rescue is powerful precisely because it is a sacrifice he *chooses*, rather than one assigned to him."},
    ],
  },
  {
    heading: "The geek-friendly science: ingenious questions, extraordinary premises",
    blocks: [
      {"kind":"p","text":"**1. How bad is a dimmer Sun?**"},
      {"kind":"p","text":"Very bad—even before Earth resembles an ice planet."},
      {"kind":"p","text":"Earth absorbs, on average, about **240 watts of sunlight per square metre** after reflection is accounted for. If incoming sunlight fell by an illustrative **10%**, that would remove roughly **24 W/m²**. For perspective, the radiative effect of doubling atmospheric CO₂ is about **3.7 W/m²**. These are not interchangeable climate experiments, but the comparison conveys the scale."},
      {"kind":"p","text":"A simple planetary energy-balance model gives:"},
      {"kind":"p","text":"Here S is incoming solar energy. Reducing S by 10% lowers Earth’s **effective radiating temperature** by about **6–7°C** *before* accounting for changing ice cover, clouds, oceans, and ecosystems. That figure is **not** a direct forecast of average surface temperature; it is a first-principles warning that the perturbation is enormous."},
      {"kind":"p","text":"A subtle point: adding greenhouse gases might offset *some temperature loss*, but it cannot replace sunlight for photosynthesis or recreate the same patterns of heating. “Warm the planet back up” would not, by itself, repair the food system."},
      {"kind":"p","text":"**A physicist’s follow-up question:** Where does the missing energy go? If organisms intercept 10% of the Sun’s total light, that is on the order of **4×10²⁵ watts**. Energy must be stored, transported, or reradiated somehow. The book’s delightfully audacious biological premise leaves substantial real-world thermodynamic questions."},
      {"kind":"p","text":"**2. Could a light-powered engine get there?**"},
      {"kind":"p","text":"The spin drive exploits directed light for thrust. The underlying momentum rule is sound:"},
      {"kind":"p","text":"For a photon rocket, thrust F equals the power P sent backward as light divided by the speed of light c. The difficulty is the staggering amount of power required. To accelerate an illustrative **100-tonne ship at 1 g**, a pure photon exhaust would need about **3×10¹⁴ watts**. Even losing 1% of that power as onboard heat would create a roughly **3-terawatt** cooling problem."},
      {"kind":"p","text":"So the physical principle is real; the story’s extraordinarily capable biological fuel and practical drive are the speculative leap."},
      {"kind":"p","text":"**Relativity helps, but does not provide faster-than-light travel.** At a hypothetical steady **0.9c**, crossing 12 light-years takes about **13.3 years as measured on Earth**, but roughly **5.8 years aboard** because of time dilation. Acceleration and braking would alter those figures. Any message or returning sample also takes years to travel back. Consequently, Earth needs to survive a long interval before help can arrive."},
      {"kind":"p","text":"**3. Why is the cure an ecological problem?**"},
      {"kind":"p","text":"Taumoeba is a **predator**, not a switch that turns Astrophage off. The simplest predator–prey model illustrates the idea:"},
      {"kind":"p","text":"Here A is Astrophage abundance and T is Taumoeba abundance. Astrophage reproduces; encounters allow predators to consume it; predators also die. This toy model omits nutrient limits, environmental chemistry, evolution, and transport—but that is exactly the point. A predator that works on Adrian might fail elsewhere, or evolve, escape containment, and consume Astrophage **where humans need it as fuel**."},
      {"kind":"p","text":"One of the story’s best engineering insights is that **a strong container is not necessarily a biologically secure container**. Material strength, permeability, and long-term containment are different properties."},
      {"kind":"p","text":"**4. Is the first contact scientifically interesting?**"},
      {"kind":"p","text":"Yes, especially because the challenge is not simply to find a universal word for “hello.” Grace and Rocky need **shared reference points**. They can compare counts, measurements, objects, and repeatable events; build a translation; discover mistakes; and revise it. Mathematics helps establish common ground, but it cannot, on its own, communicate trust, humor, or an ethical promise."},
      {"kind":"p","text":"Rocky also keeps the alien encounter from becoming a story about a supposedly superior human intellect. Different evolutionary histories and technologies produce **different blind spots**. Collaboration succeeds because each can do things the other cannot."},
      {"kind":"p","text":"There is an important limit to plausibility: an organism that thrives across extreme environments, harvests immense energy, and functions as compact interstellar fuel is far beyond known biology. The book is best understood as **rigorous problem-solving built on a few fantastical assumptions**, not as a forecast that microbes like Astrophage are likely to exist."},
    ],
    examples: [
      {"title":"Energy balance: the fourth-root law","code":"T_eff ∝ S^(1/4)","explanation":"A simple planetary model: effective temperature scales with the fourth root of incoming sunlight S. A 10% drop in S lowers the effective radiating temperature by roughly 6–7°C before any feedbacks (ice, clouds, oceans) respond."},
      {"title":"Photon-rocket thrust","code":"F = P/c","explanation":"F = P/c: thrust equals the light power P sent backward divided by the speed of light c. Accelerating 100 tonnes at 1 g would demand ~3×10^14 watts — the story's biological fuel is the speculative leap that closes this gap."},
      {"title":"Toy predator–prey model","code":"dA/dt = rA − kAT\ndT/dt = ekAT − mT","explanation":"A (Astrophage) grows at rate rA; encounters (kAT) let Taumoeba consume it; predators die at rate mT. Omitted on purpose: nutrients, chemistry, evolution, transport — which is exactly why the cure is an ecological engineering problem, not a switch."},
    ],
  },
  {
    heading: "The professional lens: risk, leadership, and consent",
    blocks: [
      {"kind":"p","text":"Strip away the spacecraft and *Project Hail Mary* becomes a sharp case study in crisis management:"},
      {"kind":"list","items":["**An anomaly is not yet an explanation.** Tau Ceti’s apparent health is a clue; the mission must test *why* it differs.","**A solution creates new failure modes.** The same organism that could protect stars can destroy the fuel needed to deliver it.","**Communication architecture matters.** The return probes make the mission resilient to the crew’s inability to come home, but they cannot eliminate interstellar delay.","**Technical success is not ethical absolution.** Stratt’s coercion may be understandable in a planetary emergency without becoming morally clean."]},
      {"kind":"p","text":"There is also an observational wrinkle: light from Tau Ceti takes around **12 years** to reach Earth. Astronomers do not see a distant star *as it is right now*. That lag matters both when deciding where to send the mission and when interpreting later evidence that Earth’s Sun has recovered."},
    ],
  },
  {
    heading: "What makes this a film story, not just a stack of equations?",
    blocks: [
      {"kind":"p","text":"Weir supplies unusually cinematic problems: an empty ship, fragmented memory, experiments with visible stakes, and an alien relationship that can be expressed through movement, sound, and work rather than speeches. The adaptation’s central challenge is to make Grace’s *thinking* watchable while preserving Rocky’s otherness."},
      {"kind":"p","text":"The larger emotional structure is elegant. Grace begins as a teacher trying to remember why he is in space. He becomes a scientist learning to communicate across species. In the novel’s ending, he is a teacher again—but his idea of whom he owes his gifts to has grown much larger."},
      {"kind":"p","text":"**Bottom line:** *Project Hail Mary* is not chiefly about one genius defeating a space microbe. It is about how observation becomes knowledge, how knowledge becomes cooperation, and how a reluctant participant can finally choose to be a friend."},
    ],
  },
];
