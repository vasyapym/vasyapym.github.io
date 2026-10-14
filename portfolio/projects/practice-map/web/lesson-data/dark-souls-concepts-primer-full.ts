import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: "What It Is, and Why It Matters",
    blocks: [
      {"kind":"p","text":"Dark Souls (FromSoftware, 2011, directed by Hidetaka Miyazaki) is an action role-playing game that has become, somewhat improbably, one of the most influential texts in the history of interactive media. It did not invent any of its individual components. Third-person melee combat, stamina bars, experience points, boss fights, multiplayer intrusion—all existed before. What Dark Souls did was arrange these familiar parts according to a coherent and unusually rigorous philosophy, such that the result felt less like a product and more like an argument about what games can be. The argument has been so persuasive that \"Soulslike\" is now a genre label, and its fingerprints appear on everything from independent darlings to blockbuster franchises."},
      {"kind":"p","text":"If you are new, the essential thing to understand is that Dark Souls is not primarily \"hard.\" It is *consistent*. Its reputation for difficulty is real but misleading, because difficulty is the symptom rather than the design goal. The goal is to make every encounter legible and every death attributable to a decision you made. Once that frame clicks, the game stops feeling punitive and starts feeling like a rather demanding but scrupulously fair teacher."},
    ],
  },
  {
    heading: "The Fiction: Fire, Dark, and a World Running Down",
    blocks: [
      {"kind":"p","text":"The setting is the kingdom of Lordran, and its backstory is delivered in a brief opening cinematic that functions almost like a creation myth. In the beginning there was only grey—unformed, timeless, inhabited by archtrees and immortal dragons. Then came Fire, and with Fire came *disparity*: heat and cold, life and death, light and dark. From the Dark, beings emerged who found Lord Souls within the flame. Gwyn, Lord of Sunlight; Nito, the First of the Dead; the Witch of Izalith; and the Furtive Pygmy, so easily forgotten. With these souls they overthrew the dragons and inaugurated the Age of Fire, an era of gods."},
      {"kind":"p","text":"The crucial conceptual move is that Fire is not permanent. It is a flame, and flames gutter. By the time you arrive, the First Flame is dying, the gods have fled or decayed, and the world exists in a kind of extended twilight. Gwyn himself, terrified of what comes after Fire—the Age of Dark, which is the inheritance of humanity—burned himself as kindling to prolong the age of gods. He did not save the world; he merely delayed the clock, and in doing so initiated a cycle that structures the entire series. Someone must always be found to feed the flame. The question Dark Souls poses, with real philosophical seriousness, is whether perpetuating a dying order is an act of heroism or of cowardice."},
      {"kind":"p","text":"You play as an Undead, a human bearing the Darksign, a curse that prevents true death. Each time you die you revive at a bonfire, but each death erodes you toward \"hollowing\"—a state of mindless, purposeless aggression. Nearly every enemy you fight is a hollow: not a monster, but a person who ran out of reasons to continue. This is the game's quiet thesis statement. Hollowing is not a failure of the body. It is a failure of *will*, and the game's mechanics are built so that you, the player, experience the exact pressures that produce it."},
    ],
  },
  {
    heading: "Souls, Bonfires, and the Economy of Risk",
    blocks: [
      {"kind":"p","text":"The central resource is the soul. Souls serve simultaneously as experience points and currency: you spend them at bonfires to level up, and at merchants to buy equipment. When you die, you drop every soul you are carrying at the spot of your death, and you have one chance to return and reclaim them. Die again before you do, and they are gone permanently."},
      {"kind":"p","text":"This mechanic is deceptively elegant. It converts an abstract quantity into a felt stake. A beginner carrying ten thousand unspent souls through unfamiliar territory experiences genuine tension—not because of a timer or a flashing warning, but because they understand the arithmetic. The game never has to tell you to be careful; the system teaches caution by making recklessness expensive. It also produces the famous \"corpse run,\" the attempt to reach your bloodstain, which is itself a lesson in composure. Most souls are lost not on the first death but on the panicked second attempt."},
      {"kind":"p","text":"Bonfires are the game's checkpoints, but they do more than save progress. Resting at one restores your health and your Estus Flask—a limited-use healing item that refills only at bonfires—but also respawns every ordinary enemy in the world. This is an extraordinarily important design decision. It means that healing is never free; it resets the gauntlet. You are constantly weighing whether to push forward with depleted resources or retreat and face the path again. The bonfire is also where the game's fiction and mechanics fuse: you literally sit by a flame to recover, in a world whose central anxiety is the flame going out."},
    ],
  },
  {
    heading: "Combat as Grammar",
    blocks: [
      {"kind":"p","text":"The combat system is built on stamina, a green bar that drains with every attack, dodge, block, and sprint, and regenerates when you stop. This single constraint does most of the work. You cannot swing indefinitely, you cannot roll indefinitely, and the enemy cannot either. Combat becomes a question of *commitment*. Every action has a wind-up and a recovery during which you are vulnerable, and animations cannot be cancelled. If you press the attack button, you have made a promise you must keep."},
      {"kind":"p","text":"The consequence is that Dark Souls combat reads like a language. Enemies have tells—a raised shoulder, a shift in weight—that precede their attacks, and these tells are consistent. Learning an enemy means learning its vocabulary. Once learned, an encounter that seemed impossible becomes almost conversational. This is why veterans speak of bosses with something close to affection: the Capra Demon, Ornstein and Smough, Artorias. Each one is a specific sentence you had to learn to parse."},
      {"kind":"p","text":"Builds—the allocation of levels into strength, dexterity, intelligence, faith, and so on—are the game's grammar of identity. A heavily armored knight with a greatshield and a pyromancer in rags are playing recognizably the same game but speaking different dialects of it. The system is deep enough that character construction is a hobby unto itself, yet forgiving enough that a beginner picking whatever looks interesting will still, eventually, succeed."},
    ],
  },
  {
    heading: "The World as Argument",
    blocks: [
      {"kind":"p","text":"Lordran's level design is routinely cited as among the finest in the medium, and the reason is *interconnection*. The first game in particular is built as a single contiguous space in which areas loop back on one another through shortcuts, elevators, and unlocked doors. You descend from a cathedral, fight through a town, drop into sewers, and emerge via a hidden path to discover you are now standing beside the bonfire where you began. The feeling this produces—that the world is a real place with a real geography rather than a sequence of levels—is almost architectural in its satisfaction."},
      {"kind":"p","text":"This also serves the game's rejection of hand-holding. There is no map, no quest log, no objective marker. Direction is communicated through the environment itself: a distant tower you can see from the start and will eventually climb, a bell you hear ringing, a path that is simply *harder* to walk down. You are expected to notice things. For many players raised on more explicit design, this is initially disorienting and then liberating. The world is trusting you to be an adult."},
    ],
  },
  {
    heading: "Storytelling by Archaeology",
    blocks: [
      {"kind":"p","text":"Dark Souls tells almost none of its story through cutscenes or dialogue. Instead, narrative is distributed across item descriptions, environmental details, the placement of corpses, and the occasional cryptic remark from a non-player character who may or may not be lying to you. To understand who Artorias was, you read the description on his sword, notice the wolf that guards his grave, and infer the rest. The game is not withholding story; it is relocating it from exposition to interpretation."},
      {"kind":"p","text":"The effect is closer to archaeology than to literature. You are reconstructing a civilization from its artifacts, and the reconstruction is necessarily incomplete and contested. This is why the Dark Souls community produces lore videos running to hours in length, and why those videos disagree. The ambiguity is not a bug. Miyazaki has spoken of reading English fantasy novels as a child in Japan with imperfect comprehension, filling the gaps with his own imagination, and finding that experience more vivid than full understanding. Dark Souls reproduces that condition deliberately."},
    ],
  },
  {
    heading: "Other People, Dimly Glimpsed",
    blocks: [
      {"kind":"p","text":"The multiplayer is asynchronous and oblique. Other players appear as phantoms—white ghosts moving through your world, visible for a moment and then gone. They leave messages on the ground, composed from a fixed vocabulary (\"Try jumping,\" \"Amazing chest ahead,\" \"Be wary of liar\") that is simultaneously useful and a source of the series' distinctive humor. Bloodstains show how others died. You can summon players to help with a boss, or be invaded by one who intends to kill you."},
      {"kind":"p","text":"Covenants—factions with their own rules and rewards—organize this into something like a social ecology. The Warriors of Sunlight exist to help; the Darkwraiths exist to hunt. The game's most beloved character, Solaire of Astora, is a knight who simply wants to find his own sun and who will cheerfully assist you if you let him. His catchphrase, \"Praise the Sun,\" and its accompanying gesture became a cultural shorthand for a particular kind of earnest, uncynical cooperation in a hostile world."},
    ],
  },
  {
    heading: "Why It Endures",
    blocks: [
      {"kind":"p","text":"What makes Dark Souls a durable object of study rather than merely a good game is the unity between its mechanics and its meaning. The world is about persistence in the face of decline; the mechanics demand persistence in the face of failure. The fiction is about a flame that can only be kept alive through sacrifice; the economy makes you sacrifice souls to progress. The curse of the Undead is the loss of purpose; the player's actual risk is not death but *giving up*, which is to say, hollowing."},
      {"kind":"p","text":"Difficulty, in this frame, is not an obstacle to the experience. It is the experience. The game's refusal to accommodate you is what makes its moments of mastery feel earned, and what makes its rare kindnesses—a shortcut discovered, a phantom arriving at the right moment, Solaire's absurd, luminous optimism—land with such force. Dark Souls is a game about a dying world that insists, through its very structure, that continuing is worthwhile. That is why people keep returning to it, and why, more than a decade on, it still sets the terms of the conversation."},
    ],
  },
];;
