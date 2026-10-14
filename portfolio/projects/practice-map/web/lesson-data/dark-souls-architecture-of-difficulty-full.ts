import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: "I. What You're Actually Looking At",
    blocks: [
      {"kind":"p","text":"Dark Souls (FromSoftware, 2011, directed by Hidetaka Miyazaki) is frequently introduced to newcomers with a warning: *it's hard*. This is true but misleading, in the way it would be misleading to introduce Moby-Dick as \"a long book about a whale.\" The difficulty is not the point. The difficulty is the *medium* — the material through which the game communicates everything else it wants to say about persistence, decay, knowledge, and meaning."},
      {"kind":"p","text":"Think of Dark Souls less as a video game with an unusually steep challenge curve and more as a designed system in which failure is a first-class mechanic rather than an error state. Most games treat your death as an interruption of the experience. Dark Souls treats your death as the experience — or at least as its grammar. You will die, the game famously tells you, and it means this descriptively, not as a taunt."},
    ],
  },
  {
    heading: "II. The Core Loop: Souls, Bonfires, and the Economics of Risk",
    blocks: [
      {"kind":"p","text":"The mechanical heart of the game is elegant enough to describe in a paragraph, and deep enough to sustain a decade of analysis."},
      {"kind":"p","text":"You defeat enemies and collect **souls** — a single currency that serves as both experience points and money. You spend souls to level up your character or purchase equipment, but only at specific locations. Until spent, souls travel with you. When you die, you drop everything you're carrying at the spot of your death and respawn at the last **bonfire** — a checkpoint that also, crucially, resurrects every ordinary enemy in the area."},
      {"kind":"p","text":"Here is the masterstroke: you get *one chance* to return to your death site and recover your lost souls. Die again before reaching them, and they are gone permanently."},
      {"kind":"p","text":"What this creates, in economic terms, is a continuous risk-assessment problem. Every moment of play poses the question: *do I press forward with my accumulating wealth, or retreat and bank it?* The game converts your own greed and impatience into its primary antagonist. Enemies kill you, yes — but what *punishes* you is almost always your own decision-making under escalating stakes. This is behavioral economics as level design: loss aversion, sunk-cost reasoning, and risk appetite made playable."},
    ],
  },
  {
    heading: "III. Difficulty as Honest Communication",
    blocks: [
      {"kind":"p","text":"A common misconception is that Dark Souls is unfair. It is, in fact, almost fanatically fair — it is merely *unforgiving*, and these are different properties."},
      {"kind":"p","text":"Nearly every death in Dark Souls is legible in retrospect. The trap had a visual tell. The ambush was foreshadowed by a suspiciously placed item. The boss telegraphed its attack; you simply rolled too early. The game operates on a kind of contract: it will never lie to you, but it will never repeat itself, and it assumes you are paying attention."},
      {"kind":"p","text":"This stands in deliberate opposition to the design orthodoxy of the 2000s, which held that friction should be sanded away — waypoint markers, regenerating health, generous checkpoints, tutorial pop-ups. Dark Souls proposed a counter-thesis: that *earned* competence is categorically more satisfying than *granted* progress. When you finally defeat a boss that killed you fifteen times, nothing about the game changed. **You** changed. The game is, in a real sense, a machine for producing that specific feeling — the moment where external challenge is overcome by internal growth. Scholars of game design sometimes link this to flow theory and to mastery-based intrinsic motivation; players tend to just call it \"the Dark Souls feeling.\""},
    ],
  },
  {
    heading: "IV. The World as Argument: Level Design",
    blocks: [
      {"kind":"p","text":"Lordran — the game's setting — is a single, continuous, interconnected space, folded in on itself like origami. You will descend through a poisoned swamp, climb a ruined fortress, and then unlock a door that deposits you, impossibly, thirty seconds from where you began hours ago."},
      {"kind":"p","text":"These shortcuts are not conveniences; they are *rhetoric*. Each one reframes your mental map of the world and delivers a jolt of comprehension: *oh — I've been here all along*. The level design teaches spatial reasoning the way the combat teaches pattern recognition. The world is a puzzle box, and understanding its geography is a form of progression as real as any statistic on your character sheet."},
      {"kind":"p","text":"Compare this to open-world design, which offers breadth and freedom. Dark Souls offers *density* and *coherence*. Every space exists in verifiable physical relation to every other space. Geeks of a certain disposition will recognize the pleasure here: it is the pleasure of a well-factored system, where every component connects to the whole with no wasted architecture."},
    ],
  },
  {
    heading: "V. Storytelling by Archaeology",
    blocks: [
      {"kind":"p","text":"Dark Souls barely tells you its story. It *buries* it, and hands you a trowel."},
      {"kind":"p","text":"The explicit narrative is minimal: an age of fire is ending; you, an undead, may link the flame or let it die. Everything else — the tragedies of the gods, the betrayals, the metaphysics of the Dark Soul itself — is distributed across item descriptions, environmental details, enemy placement, and cryptic NPC dialogue. A ring's flavor text contradicts a sword's. A corpse's location implies a story no one narrates. The lore community (and it is genuinely a scholarly community, complete with competing interpretive schools) assembles meaning the way archaeologists reconstruct a civilization from potsherds."},
      {"kind":"p","text":"This is sometimes called **environmental storytelling**, but Dark Souls pushes it further into what we might call *hermeneutic gameplay*: interpretation itself becomes play. The story is not delivered; it is *excavated*, and its ambiguities are load-bearing. The game trusts you with uncertainty — a trust most media refuse to extend."},
      {"kind":"p","text":"Thematically, the material rewards the digging. The game's central concepts — the **First Flame** fading, the **Undead Curse**, **Hollowing** (the gradual loss of self that comes from losing one's purpose) — form a meditation on entropy and meaning. Hollowing is the game's most quietly devastating idea: the undead do not die of their wounds; they die of *giving up*. Purpose, not vitality, is the resource that matters. Players who quit the game in frustration have, in the fiction's own terms, gone hollow. The theme and the experience of playing are the same thing. This collapse of metaphor into mechanic is called **ludonarrative harmony**, and Dark Souls is arguably its canonical example."},
    ],
  },
  {
    heading: "VI. Alone Together: The Multiplayer Experiment",
    blocks: [
      {"kind":"p","text":"Dark Souls is a solitary experience haunted by other people. Its multiplayer systems are deliberately strange:"},
      {"kind":"list","items":["**Messages**: Players leave short, template-constrained notes in the world for strangers — warnings, hints, jokes, and lies (\"Try jumping,\" left beside a lethal drop, is a genre of humor unto itself).","**Phantoms and bloodstains**: You glimpse ghostly apparitions of other players going about their own games, and touch bloodstains to watch replays of strangers' deaths — a crowdsourced early-warning system.","**Summoning and invasion**: You may call allies into your world for aid, or be *invaded* by a hostile player, transforming a familiar level into a tense duel."]},
      {"kind":"p","text":"The result is a community that feels less like a lobby and more like a monastery: everyone suffering the same trials separately, leaving marginalia for the pilgrims behind them. It is asynchronous solidarity — one of the most original social designs in the medium's history."},
    ],
  },
  {
    heading: "VII. Legacy: The Adjective-fication of a Noun",
    blocks: [
      {"kind":"p","text":"Dark Souls did what very few works in any medium do: it became a genre. \"Soulslike\" now denotes a whole family of games (and the term escapes gaming entirely — people describe difficult jobs, cities, and relationships as \"the Dark Souls of X\"). Its descendants — Bloodborne, Sekiro, Elden Ring, and hundreds of titles by other studios — all orbit the same insight:"},
      {"kind":"callout","variant":"key","text":"**Respecting the player means demanding something of them.**"},
    ],
  },
  {
    heading: "VIII. For the Beginner: How to Actually Approach It",
    blocks: [
      {"kind":"p","text":"If you intend to play, carry these principles rather than a walkthrough:"},
      {"kind":"list","ordered":true,"items":["**Death is tuition, not failure.** Each death should teach you one specific thing. Name it before you respawn.","**Slow is fast.** Shield up, walk, observe. Nearly all beginner deaths come from haste.","**Everything is optional knowledge, nothing is optional attention.** Read item descriptions. Look up. Look down. The game is always talking.","**Stuck is a direction problem, not a skill problem.** If a wall seems insurmountable, there is almost always another path. Explore laterally.","**Don't go hollow.** The game is beatable by anyone with patience. Its real test was never reflexes."]},
    ],
  },
  {
    heading: "IX. Closing Thesis",
    blocks: [
      {"kind":"p","text":"Dark Souls is best understood as an argument about the relationship between adversity and meaning, made not in words but in systems. It proposes that a world which resists you is a world that can be *known*; that competence earned under pressure constitutes a kind of selfhood; and that even in a universe winding down toward darkness, the act of pressing on — one bonfire at a time — is itself the point."},
      {"kind":"p","text":"Praise the sun."},
    ],
  },
];;
