import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: "The Foundation: Death as Currency, Death as Teacher",
    blocks: [
      {"kind":"p","text":"Dark Souls (FromSoftware, 2011) is built around a single elegant economic loop. Enemies drop **souls**, a unified currency used for both leveling up and purchasing. When you die — and you will, constantly — you drop all held souls at the point of death, marked by a **bloodstain**. Reach that spot again without dying and you recover them; die on the way, and they vanish forever. This \"corpse run\" mechanic transforms every soul into a wager. The game never punishes you with lost progress in the traditional sense — you keep items, shortcuts, and levels — but the *threat* of loss creates a persistent psychological tension that defines the experience. Understanding that death is informational rather than punitive is the first conceptual leap every player must make: each death teaches enemy placement, attack timing, or level geometry. The community mantra \"**git gud**\" is often deployed mockingly, but at its core it expresses the game's genuine thesis — all difficulty here is knowledge and execution, not grind."},
    ],
  },
  {
    heading: "Bonfires, Estus, and the Rhythm of Risk",
    blocks: [
      {"kind":"p","text":"**Bonfires** are the game's checkpoints, but they're also its metronome. Resting at one refills your **Estus Flask** (your renewable healing resource, a design innovation that solved the classic RPG problem of hoardable consumables) — but also respawns every non-boss enemy in the world. This creates the game's fundamental rhythm: push out from a bonfire, spend resources, and decide continuously whether to press deeper or bank your souls. **Kindling** a bonfire (spending Humanity) increases your Estus charges there, deepening your investment in specific locations. The genius is that healing is *interruptible* — drinking Estus locks you into a slow animation, so healing mid-combat is itself a tactical gamble."},
    ],
  },
  {
    heading: "Hollowing, Humanity, and the Undead Curse",
    blocks: [
      {"kind":"p","text":"Your character is **Undead**, branded with the **Darksign**, doomed to resurrect at bonfires until losing their mind and going **Hollow**. Mechanically, you toggle between **Hollow form** (your default, shriveled state after death) and **Human form**, restored by consuming **Humanity** — a stackable, mysterious item represented as a black sprite. Human form allows summoning cooperative phantoms and kindling bonfires, but also opens you to **invasion** by hostile players. Humanity also functions as a stat: your \"soft humanity\" counter boosts item discovery and curse resistance. Thematically, this is the game's central metaphor — Hollowing represents the loss of purpose. A character goes Hollow, in lore terms, when they give up. Many players have noted the meta-textual reading: the player who quits the game *is* the Hollow."},
    ],
  },
  {
    heading: "Stats, Builds, and the Grammar of Character Growth",
    blocks: [
      {"kind":"p","text":"Leveling raises your **Soul Level (SL)** by investing in stats: **Vitality** (HP), **Endurance** (stamina and equip load), **Strength** and **Dexterity** (weapon requirements and scaling), **Attunement** (spell slots), **Intelligence** (sorcery), **Faith** (miracles), and **Resistance** (famously useless — a running joke). Two advanced concepts govern efficient investment:"},
      {"kind":"p","text":"**Soft caps**: nearly every stat has diminishing returns past certain breakpoints (e.g., Endurance stops giving stamina at 40). PhD-level build-crafting — \"**min-maxing**\" — means knowing these curves and stopping investment precisely where returns collapse."},
      {"kind":"p","text":"**Scaling**: weapons carry letter grades (S/A/B/C/D/E) indicating how much bonus damage they derive from your stats. A \"**quality build**\" splits Strength/Dexterity for weapons scaling with both; a \"**pure STR**\" build chases S-scaling on upgraded heavy weapons. Upgrade paths (regular, raw, elemental, crystal, and the covenant-tied paths like Divine or Occult) further modify scaling, and choosing them is an optimization problem: elemental weapons ignore stats entirely, making them ideal for low-level or caster builds but a trap for stat-invested characters."},
      {"kind":"p","text":"**Equip load** produces one of the most consequential hidden systems: staying under 25% of your capacity gives the fastest roll; under 50% gives the standard \"mid roll\"; above that you **fat roll** — a slow, punishable flop that the community treats as a mortal sin. Managing weight versus **poise** (see below) is the core armor calculus."},
    ],
  },
  {
    heading: "The Combat Layer: Stamina, Poise, and Frames",
    blocks: [
      {"kind":"p","text":"Everything in Dark Souls combat runs through the **stamina bar**. Attacking, blocking, rolling, and sprinting all drain it; running dry mid-exchange is often fatal. Shields have a **stability** stat determining how much stamina blocking costs; if a hit exhausts your stamina through a raised shield, you get **guard broken** and staggered."},
      {"kind":"p","text":"**Poise** is the game's most misunderstood and most debated stat: a hidden meter determining how much punishment you absorb before your attack animation is interrupted (**stagger** or **hitstun**). High-poise \"**havel monster**\" builds in PvP could trade hits with impunity, and the community has spent a literal decade reverse-engineering poise breakpoints (e.g., 53 poise to tank certain weapon classes)."},
      {"kind":"p","text":"**I-frames** (invincibility frames) are the seconds of intangibility during a roll's animation — the reason dodging *through* attacks works. Fast rolls have more i-frames; the sequel-and-community obsession with i-frame counts, roll distance, and recovery frames constitutes the game's applied physics. Related vocabulary: **hitboxes** (the invisible collision volumes of attacks — and the eternal complaint about \"bad hitboxes\" on grab attacks), **hyperarmor** (poise granted during certain heavy attack animations), and **animation canceling**."},
      {"kind":"p","text":"The critical-hit systems reward mastery: a **parry** (deflecting an attack with precise shield or weapon timing) opens a devastating **riposte**; circling behind an enemy enables a **backstab**. In PvP, **backstab fishing** — circling opponents endlessly trying to force the backstab animation — defined (and for many, degraded) the original game's dueling meta, especially given latency (\"**lagstabs**\")."},
    ],
  },
  {
    heading: "The Multiplayer Weave: Summons, Invasions, Covenants",
    blocks: [
      {"kind":"p","text":"Dark Souls' online design is deliberately oblique. Players leave **soapstone signs** to be summoned as cooperative **phantoms** (gold for allies, red for hostile duelists via the Red Sign Soapstone). **Invaders** enter your world uninvited to kill you. Matchmaking is governed by **soul level ranges**, which spawned two crucial meta-concepts: the **meta level** (community-agreed PvP levels, e.g., SL120, where builds are complete but matchmaking stays populated) and **twinking** — building a low-level character with endgame gear to bully new players in early areas. A **gank** is a coordinated multi-player ambush on a single invader; **gank squads** and honorable **fight clubs** (organized dueling gatherings, famously at the Burg or Oolacile Township) represent the two poles of PvP culture."},
      {"kind":"p","text":"**Covenants** are joinable factions with distinct multiplayer roles: **Darkwraiths** invade to steal humanity, **Blades of the Darkmoon** invade sinners as cosmic police, **Forest Hunters** defend Darkroot Garden, **Gravelord Servants** curse other worlds with black phantoms, and the **Warriors of Sunlight** — the beloved \"**sunbros**\" — specialize in jolly cooperation. Solaire of Astora, their exemplar, gave the community its universal greeting: **\"Praise the Sun!\"** and the \\[T]/ emoticon."},
    ],
  },
  {
    heading: "Lore and the Art of Fragmented Storytelling",
    blocks: [
      {"kind":"p","text":"Dark Souls narrates almost nothing directly. Its story lives in **item descriptions**, environmental staging, and NPC fragments — a method now called **environmental storytelling**, elevated to scholarly obsession by community \"**lore hunters**\" (most famously the YouTuber VaatiVidya). The essential cosmology: the world began as grey stasis ruled by **Everlasting Dragons** until the **First Flame** appeared, introducing disparity — heat and cold, life and death, light and dark. Beings found **Lord Souls** within the flame: **Gwyn**, Lord of Sunlight; **Nito**, First of the Dead; the **Witch of Izalith**; and the furtive pygmy, who found the **Dark Soul** — the seed of humanity itself (hence \"Humanity\" the item)."},
      {"kind":"p","text":"The flame, however, fades. Gwyn, terrified of the coming **Age of Dark** (the age that arguably *belongs* to humans), sacrificed himself to **link the fire**, artificially prolonging the Age of Fire. Your quest — gathering the Lord Souls to succeed him — culminates in the game's central choice: link the flame again (perpetuating a possibly doomed cycle) or walk away and usher in the Dark. The profound ambiguity — whether the \"good\" ending exists at all, whether the gods' narrative is propaganda — is the lore community's foundational debate. Later games confirm the **cycle** repeats endlessly, making Dark Souls a meditation on entropy, denial, and the ethics of perpetuating dying orders."},
      {"kind":"p","text":"NPC **questlines** embody this obliquity: characters like Siegmeyer, Solaire, and Big Hat Logan follow fragile, easily-broken chains of encounters that usually end in tragedy or Hollowing — miss one flag and their story silently dies. The community's collective mapping of these invisible quest structures is itself a form of distributed scholarship."},
    ],
  },
  {
    heading: "World Design: The Interconnected Whole",
    blocks: [
      {"kind":"p","text":"The original Dark Souls is revered for its **interconnected world design**: Lordran folds back on itself vertically and horizontally, with **shortcuts** (unlockable doors, ladders kicked down) converting exploration into permanent knowledge. Standing at Firelink Shrine, you can see half the game's areas. This \"legible world\" — contrasted with the more segmented sequels — is why level-design analysts treat Dark Souls 1's first half as a masterclass, and its post-Lordvessel second half (Lost Izalith's infamous unfinished state) as the cautionary counterexample."},
    ],
  },
  {
    heading: "Advanced and Community Esoterica",
    blocks: [
      {"kind":"p","text":"Once fluent in the above, the deep-end vocabulary opens up. **NG+** (New Game Plus) restarts the world with harder enemies while keeping your character, stacking to NG+7. **SL1 runs** (beating the game without ever leveling) and **no-hit runs** are the prestige challenge formats. Speedrunners exploit **sequence breaks**, the **Sen's Fortress skip**, **wrong warps**, and the legendary **moveswap** glitch. **Fashion Souls** denotes building armor sets for aesthetics over stats — a genuine endgame for many. **Cheese** means trivializing a fight through exploits (poison arrows against certain bosses, or luring enemies off ledges — **gravity remains the game's most lethal boss**). **DPS checks**, **status buildup** (bleed, poison, toxic, curse — the last of which halves your max HP until cured, the game's cruelest mechanic), **elemental resistances**, and **split damage** inefficiency round out the damage-theory layer. **Poise-backed trading**, **spacing**, **whiff punishing**, and **roll-catching** (timing attacks to hit an opponent's roll recovery) constitute the PvP graduate curriculum."},
      {"kind":"p","text":"Finally, the game's influence produced a genre label — the **Soulslike** — and exported its vocabulary (bonfire-equivalents, corpse runs, stamina combat, obtuse lore) across the industry, culminating in FromSoftware's own lineage: Demon's Souls before it, Bloodborne, Sekiro, and Elden Ring after."},
    ],
  },
  {
    heading: "The Unifying Idea",
    blocks: [
      {"kind":"p","text":"If one concept binds all of this together, it is *earned knowledge*. Dark Souls hides its systems, its story, and its safety, then rewards the player who treats confusion as invitation rather than failure. Every term above — from Estus to i-frames to the Age of Dark — was excavated collectively, by millions of players comparing notes. The game's true innovation may be that its community's decade-long act of interpretation is not commentary *on* the work; it is the work, completing itself. Praise the Sun."},
    ],
  },
];;
