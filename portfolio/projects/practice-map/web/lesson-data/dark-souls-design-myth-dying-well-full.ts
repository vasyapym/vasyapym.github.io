import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: "1. The ninety-second orientation",
    blocks: [
      {"kind":"p","text":"*Dark Souls* (FromSoftware, 2011, directed by Hidetaka Miyazaki) is a third-person action RPG set in Lordran, a decaying kingdom at the end of an age. You play an undead nobody — cursed to die, revive, and slowly lose your mind — who escapes an asylum and wanders into a ruined world to either prolong its dying order or let it end. You fight with sword, shield, spell, and patience. You die constantly. You get better."},
      {"kind":"p","text":"That summary is accurate and almost completely useless, which is itself the first lesson: *Dark Souls* is a game whose reputation (\"the hard one\") has utterly eclipsed what it actually is. What it actually is, is one of the most internally coherent pieces of design in the medium — a game where the combat system, the level architecture, the economy, the multiplayer, and the theology all argue for the same thing. That coherence is why people won't shut up about it."},
    ],
  },
  {
    heading: "2. Ancestry: where this thing came from",
    blocks: [
      {"kind":"p","text":"FromSoftware was not a prestige studio in 2009. It made *King's Field* (1994), a sluggish first-person dungeon crawler notable for oppressive atmosphere and a near-total refusal to explain itself, plus the *Armored Core* mech series. Miyazaki joined the company in 2004 as a career-changer — he'd been at Oracle — and took over a troubled project nobody wanted, on the reasonable logic that if it was already failing, nobody would mind if he did whatever he liked with it."},
      {"kind":"p","text":"That project became *Demon's Souls* (2009). Sony declined to publish it in the West; it was widely considered too obscure, too punishing, too strange. It was picked up regionally and became a cult success on word of mouth. *Dark Souls* followed in 2011 as a spiritual successor on multiple platforms, free of Sony's involvement, and detonated."},
      {"kind":"p","text":"Two influences matter for understanding the aesthetic. The first is Kentaro Miura's manga *Berserk* — the source of the game's hulking armor silhouettes, absurd greatswords, and a particular brand of grim, exhausted heroism. The second is an anecdote Miyazaki tells about reading English-language fantasy novels as a child in Japan without fully understanding the English. He filled the comprehension gaps with imagination, and found the half-understood version more vivid than any complete one. That experience became a *design methodology*. Hold onto it; we'll return to it in section 7."},
    ],
  },
  {
    heading: "3. The core loop: souls, bonfires, and the economics of dread",
    blocks: [
      {"kind":"p","text":"Here is the machine at the center of the game."},
      {"kind":"p","text":"**Souls** are simultaneously your currency and your experience points. You spend them to level up, to buy equipment, to upgrade weapons. You get them by killing things. When you die, you drop every soul you're carrying where you fell, and you respawn at the last **bonfire** — a checkpoint, a save point, and a place to refill your **Estus Flask** (your limited, bonfire-replenished healing item). You get exactly one attempt to walk back to your bloodstain and reclaim what you lost. Die on the way, and the old pile is gone forever, replaced by the new one."},
      {"kind":"p","text":"Resting at a bonfire also respawns every ordinary enemy in the world."},
      {"kind":"p","text":"Read those three rules together and you'll see something elegant. Souls aren't a resource you *have*; they're a resource you *carry*. Every soul in your pocket is a wager on your own competence over the next five minutes. The game has fused its progression system to loss aversion — the well-documented asymmetry where losing something hurts roughly twice as much as gaining it pleases — and the result is that walking through a corridor with 30,000 unspent souls feels materially different from walking through the same corridor with none. The level didn't change. Your relationship to it did. Virtually no other RPG makes the player's *psychological state* a variable the designer can tune."},
      {"kind":"p","text":"The enemy respawn does parallel work. Because the world resets but your knowledge doesn't, the second traversal of any area is a test of what you learned the first time. Difficulty doesn't drop because the game got easier; it drops because you did the reading. This is the game teaching you, in its only language, that it rewards attention."},
    ],
  },
  {
    heading: "4. Combat as a conversation",
    blocks: [
      {"kind":"p","text":"New players bounce off *Dark Souls* combat because they arrive with habits from games that are, structurally, about **reaction**. *Dark Souls* is about **commitment**."},
      {"kind":"p","text":"**Stamina** is the governing concept. A green bar depletes when you attack, roll, block, or sprint, and regenerates when you don't. It is a tempo governor: it forbids the panicked button-mashing that works in most action games, and it converts every exchange into a resource negotiation. Can I fit a second swing in before I need to roll? If I block that, will I have enough left to escape the follow-up?"},
      {"kind":"p","text":"Then there's the **commitment frame**. When you swing a greatsword, you are *in* that animation. You cannot cancel it. The enemy's attack, likewise, has a wind-up (a \"tell\"), an active window, and a recovery. Combat is therefore not reflex-testing but *pattern-reading and spacing*: you learn that the Black Knight's overhead takes a long beat, you learn precisely how long, and you learn where to stand so that his recovery becomes your opening. People describe boss fights as dances, which is twee but structurally correct — they're rhythmic, learnable, and *deterministic*. The same input produces the same result. The game is hard but it is not random, and that distinction is the entire moral foundation of its difficulty."},
      {"kind":"p","text":"Three more terms you'll meet. **I-frames** (invincibility frames): your dodge roll makes you briefly untouchable — roughly a third of a second — meaning the correct answer to a giant flaming sword is often to roll *toward and through* it, which takes most players twenty hours to emotionally accept. **Poise**: a hidden stat from heavy armor that lets you absorb hits without flinching, so you can finish your swing. **Equip load**: carry under a quarter of your capacity and you roll fast; under half and you roll adequately; over half and you perform a sad, lethal flop. Your build is therefore a genuine trade-off between absorbing damage and avoiding it, not a straight power curve."},
    ],
  },
  {
    heading: "5. The world as a machine",
    blocks: [
      {"kind":"p","text":"If you take one thing from this lesson as a designer, take this one. *Dark Souls* has arguably the best-constructed game world of its generation, and the reason is **interconnection without fast travel**."},
      {"kind":"p","text":"For the first half of the game you cannot teleport. Lordran is instead a single continuous, obsessively vertical space that folds back on itself. You descend from the hub of Firelink Shrine into a graveyard, climb up through a ruined city into a cathedral parish, and then open a shortcut — an elevator — that drops you back at Firelink in ten seconds, having walked a loop of several hours. The game is a Metroidvania wearing a dark fantasy costume: the \"keys\" are shortcuts, ladders kicked down, doors unbarred from the far side, and each one you open collapses the map a little more."},
      {"kind":"p","text":"The emotional payoff is specific and hard to replicate. A shortcut in *Dark Souls* is not a convenience; it is a *monument to a journey you survived*. The elevator means something because you remember the long way. When the game later gives you limited warping (via the Lordvessel, roughly at the midpoint), it is a reward for having internalized the geography, not a substitute for doing so."},
      {"kind":"p","text":"The corollary — and this is the part modern open-world designers tend to skip — is that the world is *legible*. You can stand on a high ledge and see three other areas you've been to, below and around you. Lordran is coherent as a physical place, not as a checklist of icons. Navigation is a skill the game teaches and then tests."},
    ],
  },
  {
    heading: "6. Death as grammar",
    blocks: [
      {"kind":"p","text":"Now the difficulty question, handled properly."},
      {"kind":"p","text":"*Dark Souls* is not hard because its numbers are inflated. It is hard because it declines to do three things other games do: it doesn't tell you what to do, it doesn't soften failure, and it doesn't assume you'll quit."},
      {"kind":"p","text":"Jesper Juul's *The Art of Failure* (2013) frames the central paradox of games: we generally avoid failure in life, yet pay money for experiences that reliably produce it. His answer is that failure in games is *informative* — it tells you that you are deficient in a way you can fix, and the fixing is the pleasure. *Dark Souls* is close to a pure expression of that thesis. Every death is a legible sentence: you got greedy with that third swing; you didn't check the corner; you spent stamina on a block you should have dodged. The game's famous fairness isn't an absence of cheap shots (there are plenty, especially the first time) but the fact that *failure is always explicable*. Nothing kills you for reasons you cannot reconstruct."},
      {"kind":"p","text":"This also produces the most-cited case of **ludonarrative harmony** — the inverse of Clint Hocking's \"ludonarrative dissonance,\" his 2007 complaint that *BioShock*'s story and mechanics argued opposite positions. In *Dark Souls*, the central mechanical fact (you die and respawn) *is* the central narrative fact (you are an undead, cursed to revive, slowly going hollow). Your respawning isn't a concession to playability that the fiction politely ignores. It's the premise. The death counter is diegetic. You are not failing the story; you are living it."},
      {"kind":"p","text":"And hollowing — the lore-condition where undead who lose purpose become mindless husks — is the game's quiet statement about the player. The failure state isn't death. The failure state is giving up."},
    ],
  },
  {
    heading: "7. The lore problem, or: how to tell a story by refusing to",
    blocks: [
      {"kind":"p","text":"*Dark Souls* has a ten-minute opening cinematic, a handful of cryptic NPCs, and then nothing. No journal, no codex, no quest log, no map. The overwhelming majority of its narrative is deposited in **item descriptions** — a paragraph on a ring, a sentence on a soul, an adjective on a piece of armor — and in **environmental storytelling**: the architecture of a room, the arrangement of corpses, what a boss is chained to and why."},
      {"kind":"p","text":"Henry Jenkins, in \"Game Design as Narrative Architecture\" (2004), distinguished *embedded* narrative (information the designer hides in the space for the player to excavate) from *enacted* narrative (events the player causes). *Dark Souls* is maximally embedded. The story has already happened. You are an archaeologist."},
      {"kind":"p","text":"The sharper frame comes from literary theory. Roland Barthes separated the *readerly* text, which positions you as a consumer of a finished meaning, from the *writerly* text, which conscripts you into producing meaning. Wolfgang Iser called the productive omissions in a text *Leerstellen* — blanks the reader must fill for the work to function at all. *Dark Souls* is engineered around blanks. Miyazaki's childhood experience of half-understood English novels was converted into a deliberate authorial strategy: withhold enough that the player's imagination becomes a load-bearing component of the fiction."},
      {"kind":"p","text":"The empirical proof is the community. The entire genre of lore video essays, hundreds of hours of it, exists because the text generates interpretation faster than it resolves it. That isn't a failure of exposition. It's the exposition working."},
      {"kind":"p","text":"A practical caution for beginners: this means you will not understand the plot on your first playthrough, and you are not supposed to. Absorb mood first. Meaning accretes."},
    ],
  },
  {
    heading: "8. The myth: fire, dark, and an ending with no right answer",
    blocks: [
      {"kind":"p","text":"Here is the cosmology, which you can read as a thesis."},
      {"kind":"p","text":"Once there was only grey fog and everlasting dragons. Then the First Flame arose, and with it *disparity* — heat and cold, life and death, light and dark. Four beings found Lord Souls in the flame: Gwyn, Lord of Sunlight; Nito, first of the dead; the Witch of Izalith; and the Furtive Pygmy, \"so easily forgotten,\" who found the **Dark Soul**. They overthrew the dragons and inaugurated the Age of Fire."},
      {"kind":"p","text":"Ages end. The Flame fades. Gwyn, rather than permit this, burned himself as fuel — \"linking the fire\" — buying time at the cost of becoming a hollow cinder of a god. The Undead Curse, your curse, is a side effect of a world kept artificially alive past its term. And the Pygmy's Dark Soul? It's humanity. We are the dark ones. The thing Gwyn's order spent an age suppressing is the thing you are made of."},
      {"kind":"p","text":"At the end, you choose: link the fire yourself, burning your body to extend a dying age, or walk away and let the flame die, becoming Dark Lord and ushering in the Age of Dark — the age of humanity."},
      {"kind":"p","text":"The game will not tell you which is correct, and the refusal is the point. Read it as a critique of institutional preservation: an order so committed to its own continuation that it immolates generations of individuals to postpone a transition that is, in any case, natural. Read it through Nietzsche's eternal recurrence, since the sequels confirm the cycle has repeated many times and the \"sacrifice\" has become mere routine. Read it thermodynamically — entropy is not a villain to be defeated but a condition to be accepted. Read it as a game about whether to be the person who keeps the lights on in a building that should be condemned."},
      {"kind":"p","text":"All of these are supported. None are confirmed. See section 7."},
    ],
  },
  {
    heading: "9. Asynchronous multiplayer: the loneliest crowd",
    blocks: [
      {"kind":"p","text":"*Dark Souls*' online design deserves study on its own, because it solved a social problem by *constraining language*."},
      {"kind":"p","text":"You cannot type in *Dark Souls*. You can write messages on the ground that other players will see in their worlds, but only by assembling them from a fixed vocabulary of templates and nouns: \"Try jumping,\" \"Be wary of ambush ahead,\" \"Praise the Sun.\" You can also see ghostly replays of how other players died on the spot where they died — which is a warning system, a joke delivery mechanism, and a memento mori all at once."},
      {"kind":"p","text":"The consequence is a multiplayer culture that is weirdly, famously warm. Harassment is structurally impossible because the game never gave anyone the words for it. What's left is a constrained poetry of wit, genuine help, and lies (\"amazing chest ahead,\" placed at the edge of a cliff). You are simultaneously alone in a dead world and surrounded by evidence of thousands of other people suffering identically. That is a remarkable emotional achievement, and it came from *removing* a feature rather than adding one."},
      {"kind":"p","text":"Layered on top is live co-op (summon a friendly phantom through your world) and **invasions** (a hostile player enters your world uninvited). Invasions are the controversial part, and the honest assessment is that they are designed as an environmental hazard with a human brain, not as a fair duel — they make the world feel genuinely unsafe in a way scripted threats cannot."},
    ],
  },
  {
    heading: "10. The genre, and the discourse it's trapped in",
    blocks: [
      {"kind":"p","text":"\"Soulslike\" is now a genre term, which means it is now contested. The defensible core: stamina-mediated, commitment-heavy melee combat; checkpoints that restore healing but respawn enemies; a death penalty involving recoverable lost currency; interconnected level design; minimal explicit narration. *Sekiro* (2019) is barely one by that definition; *Elden Ring* (2022) is one spread across an open world, and its 25-million-plus sales turned a cult form into a mainstream expectation."},
      {"kind":"p","text":"You will also encounter the accessibility debate, which flares up roughly annually. The strong case for difficulty options is straightforward: disabled players and time-poor players are excluded from a major artwork by a parameter, and excluding people is a cost. The strong case against is that the *Souls* games are specifically about the relationship between effort and meaning — that the ending lands because of what it cost — and that an adjustable cost is a different work. Both positions are serious. The lazy version of the second one (\"git gud\") is not an argument, it's a mating call. Note that *Dark Souls* already contains a de facto difficulty system: summon help, over-level, use a shield build, use magic, or consult the wiki, all of which the game permits without comment."},
    ],
  },
  {
    heading: "11. If you're actually going to play it",
    blocks: [
      {"kind":"p","text":"Play the original, ideally the *Remastered* version, and start there rather than with *Elden Ring*, if your goal is to understand the form rather than just enjoy a game. Pick the Knight if you want the gentlest start — decent armor, a shield that blocks everything in the early game — or the Pyromancer if you want the single most forgiving damage tool, since the pyromancy flame scales with upgrades rather than stats and is good in every build. Take the Master Key as your starting gift."},
      {"kind":"p","text":"Early on, level Vitality (health) and Endurance (stamina), and don't spread points thin. Upgrade one weapon rather than hoarding ten; a +5 longsword will serve you better than an unupgraded exotic. Two-hand your weapon to stagger things. When you're carrying a lot of souls, spend them — the souls you're hoarding are a liability, not a savings account."},
      {"kind":"p","text":"Then the hard part: unlearn hurry. When a new room opens, assume there's something around the corner, because there is. When a boss kills you, resist the urge to immediately re-enter — spend thirty seconds identifying which attack actually got you. The game is slow on purpose, and playing it impatiently is playing a different, worse game."},
      {"kind":"p","text":"And when you die for the fortieth time to the same enemy and then finally, on the forty-first, take it apart without being touched — pay attention to how that feels, because that feeling is the entire thesis. Nothing in the game was lowered to meet you. You went up."},
      {"kind":"p","text":"Praise the sun."},
    ],
  },
];;
