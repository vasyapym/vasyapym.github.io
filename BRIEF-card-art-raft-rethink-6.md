# BRIEF — Raft Cluster mark, round 6: evolve the VAULT QUORUM — TEN variants, more nodes

Round context: from the round-5 board of ten different graphic languages, the owner
picked **candidate I "Vault quorum"** ("i like candidate i. let's keep working on it.
**add nodes (not only 3)**"). The vault identity is now the LOCKED working base. This
round evolves it into TEN variants — each still unmistakably the vault at a squint,
each with **5–7 nodes** (candidate I had only 3 keyholes), a readable majority
(quorum arithmetic must be legible: more keys TURNED than empty), and ONE new
mechanism element that gives the variant its own story.

**The vault identity every variant must keep (the squint test):**
- a giant circular vault door as the dominant mass — heavy outer ring, inner ring,
  radial bolts, hub (+ handle bar where the composition allows);
- keyholes-as-nodes seated on a ring inside the rim (the shared KEYHOLE GLYPH below);
- turned keys = committed (solid, seated), empty keyholes = unwritten (dashed);
- the leader identifiable WITHOUT text via a deep-coral ring + coral key/presence;
- the laggard's deficiency (empty dashed keyhole, misaligned part, protruding bolt);
- a visible direction of turn/flow; exactly one `gem-halo` pulse.

**The shared KEYHOLE GLYPH (reuse everywhere, don't reinvent):** circle r 5 (fill
`#0b1317`) + stem wedge `M -2 4 L 2 4 L 3 10 L -3 10 Z`. A TURNED key = glyph ring
stroke `#7d7669` width 2 + solid stem wedge `#7d7669` + key shaft (rect ~3×12 below)
+ key head (disc r 4) — all seated vertically. An EMPTY keyhole = same glyph with all
strokes `#7d7669` DASHED ("3 3", 1.5–2 wide), no key. The LEADER key = glyph ring
stroke `#ff6a5f` width 2 + coral stem + coral key rotated ~30–35° off vertical
(mid-turn) + motion arc (r ~14, dasharray "3 3", stroke `#ff6a5f` width 2) + chevron.
Crown the leader with an extra outer ring r 9.5 stroke `#7d2723` width 3.

**Banned (accumulated):** stepped-cap disc nodes, hairline rims, tick-row logs,
capsule-on-dashed-path signals, three-small-dots-thin-lines archetype, quorum-overprint
giant halftone discs, PCB traces + via donuts, narrative scenes, control-loop
instrumentation read, the round-5 alternates (metro/gears/tape/orrery/press/dishes/
honeycomb/bridge/beacon). Within THIS round: the ten variants must differ in their
added mechanism and composition — not ten dotted rims.

**The family TECHNIQUE (unchanged):** plate `#0b1317` showing through — **never paint
a background rect**; neutral ramp `#26333b #465059 #7d7669 #b6ac95`; paper `#eeeae0
#f4efe4` sparingly; ONE spot colour CORAL `#ff6a5f` (+ deep `#7d2723`); halftone dot
screens; no text, no numbers, no gradients, no filters; crisp primitives; poster
boldness — smallest element ≥ 2.5px (dashed "empty" accents may go to 1.5), strokes
2.5–6, ~30–45 primitives per mark (richer than round 5 — the owner asked for more
elements).

## Hard rules (all ten)

- SVG `viewBox="0 0 260 160"`, `aria-hidden="true"`, NO width/height attributes.
- Nothing outside x 16→244 / y 16→144 except the backdrop ellipse and halo.
- Patterns in `<defs>`, `patternUnits="userSpaceOnUse"`, ids prefixed
  `gem-raft6-<letter>-*` (e.g. `gem-raft6-a-dense`) — `gem-raft-*` and `gem-raft5-*`
  are already live in the same rendered DOM.
- Standard screens per candidate: `dense` (7×7, dot r 1.9, `#ff6a5f`), `sparse`
  (11×11, dot r 1.6, `#7d7669`), `halo` (7×7, dot r 1.9, `#ff6a5f`) — plus extras the
  mechanism needs.
- Halo contract: exactly ONE ellipse `className="gem-halo"` `style={haloVar(0.12)}`
  `opacity={0.12}`, coral dots, over the focal mechanism. Wide sparse backdrop ellipse
  (~rx 104 ry 64, cx ~130 cy ~84, opacity 0.09). `haloVar` exists in module scope.
- Component: `export function RaftVaultA() { … }` … `RaftVaultJ` — one complete
  compilable TSX block per candidate.
- State the node arithmetic in your prose (e.g. "4 of 7 turned = majority").
- Geometry anchors are exact to ±4px; refine only to avoid collisions and note it.

## Output format

One ```tsx block per candidate A–J in order, then ≤2 sentences per candidate: its
mechanism story + node count + coral coverage. No preamble — start at candidate A.
If you hit a length limit, stop at a finished candidate boundary and end with
`TRUNCATED: <letters still owed>`.

---

## CANDIDATE A — "Seven-key majority" (the direct answer: 7 nodes)

The plainest evolution: the candidate-I door grows to SEVEN keyholes and the quorum
becomes an arc — a solid coral span links the four engaged keys.

Anchors:
- DOOR: centre (130,84) r 54, outer ring stroke `#465059` width 5; inner ring r 45
  stroke `#26333b` width 2.5; 6 radial bolts on the rim at 0/60/…/300° (strokes
  r 49→54, width 3, `#465059`); handle bar rounded rect x 108 y 81 w 44 h 6 rx 3
  (fill `#0b1317`, stroke `#465059` 2.5); hub disc r 5.5 (fill `#0b1317`, ring
  `#b6ac95` 2) + glint 2×2 at (129,83).
- KEYHOLES at r 32, 7 positions clockwise from top (computed): (130,52), (155,64),
  (161,91), (144,113), (116,113), (99,91), (105,64).
- TURNED (solid, seated keys): (155,64), (161,91), (144,113).
- LEADER (mid-turn, crowned, coral): (130,52) — glyph + crown ring + coral key
  rotated ~32° + motion arc r 14 + chevron.
- EMPTY (dashed, no key): (116,113), (99,91), (105,64). → 4 of 7 engaged = majority.
- QUORUM SPAN (the new element): solid arc at r 32 from (155,64) through (161,91) to
  (144,113) — path `M 155 64 A 32 32 0 0 1 144 113`, stroke `#ff6a5f` width 3,
  opacity 0.85, plus two end ticks (4px radial strokes at each end, width 2.5) — the
  engaged majority linked as one span.

## CANDIDATE B — "Combination dial" (the door remembers its position)

A central combination dial joins the mechanism: the dial's notch ring IS the log —
notches already passed are solid, the rest dashed — while five keyholes do the voting.

Anchors:
- DOOR: centre (130,84) r 54 with candidate-I DNA (rings, 6 bolts, hub; skip handle —
  the dial replaces it).
- DIAL: disc r 20 at centre (fill `#0b1317`, ring stroke `#465059` width 3); NOTCH
  RING: 12 radial ticks on r 16→20, width 2.5 — ticks 1–7 (clockwise from top)
  stroke `#b6ac95` solid, ticks 8–12 stroke `#7d7669` dasharray "2 2" (the future);
  POINTERS: coral needle from centre to r 17 at ~205° (just past the last solid
  notch — mid-advance), width 3, + small coral hub dot r 3.
- KEYHOLES at r 38 (5 positions clockwise from top): (130,46), (166,72), (152,115),
  (108,115), (94,72).
- LEADER at (130,46) crowned + coral key mid-turn; TURNED at (166,72), (152,115);
  EMPTY dashed at (108,115), (94,72). → 3 of 5 = majority.
- Spoke lines hub→each keyhole, stroke `#26333b` width 2 (under keyholes).

## CANDIDATE C — "Time-lock sweep" (the door on a clock)

The vault is a time-lock: a coral sweep hand has swept 150° of the dial; the swept
sector (committed) is a halftone overprint, the unswept sector dashed; six keyholes
sit at hour stations.

Anchors:
- DOOR: centre (130,84) r 54, candidate-I DNA (rings, bolts, hub; skip handle).
- COMMITTED SECTOR: pie wedge from centre to r 45 spanning 12 o'clock → 150°
  clockwise: path `M 130 84 L 130 39 A 45 45 0 0 1 152.5 122.9 Z` (end point at
  θ150: x=130+45·sin150=152.5, y=84−45·cos150=84+38.97=122.97), fill
  `url(#gem-raft6-c-dense)` opacity 0.3 — under everything else inside the door.
- FUTURE SECTOR: dashed arc r 45 from θ150 back to θ360 (the long way):
  `M 152.5 122.9 A 45 45 0 1 1 121.2 39.9`… compute start/end precisely: end at
  θ360 = top (130,39); draw as TWO dashed arcs via θ250 to keep sweep flag simple —
  or one arc `M 152.5 122.97 A 45 45 0 1 1 130 39` (large-arc, sweep 1), stroke
  `#7d7669` width 2 dasharray "5 5".
- SWEEP HAND: coral line centre→r 30 at θ150 (end (145,110)), width 3.5, round cap;
  counterweight stub opposite (θ330, r 10), width 3; centre pivot disc r 4 coral.
- KEYHOLES at r 36, 6 hour stations clockwise from top: (130,48), (161,66), (161,102),
  (130,120), (99,102), (99,66).
- TURNED (behind the hand): (130,48), (161,66), (161,102). LEADER = (130,48) crowned
  + coral key mid-turn. EMPTY dashed (ahead of the hand): (130,120), (99,102), (99,66).
  → 3 of 6 engaged… note in prose: sweep = replication frontier; majority completes
  at the next turn.

## CANDIDATE D — "Door ajar" (the committed state revealed)

The leaf has swung open on a left hinge: the right half still shields (four keys
engaged on it), the left half reveals the committed log — coral bars on the vault's
inner shelf — with a coral light wedge escaping the gap.

Anchors:
- FRAME: full circle (134,84) r 54, stroke `#465059` width 5, fill none; hinge: two
  short horizontal strokes at (74,64)→(84,64) and (74,104)→(84,104), width 3.5.
- DOOR LEAF (closed right half): path `M 134 30 A 54 54 0 0 1 134 138 Z` — fill
  `#0b1317`, stroke `#465059` width 4 (its flat chord edge is the opening seam);
  two leaf bolts (short radial strokes on the leaf rim at θ30/θ150, width 3).
- INTERIOR (left half): three committed log bars — rounded rects w 26 h 6 rx 2 at
  (98,72), (102,84), (98,96) (centred x): fill `#0b1317` with coral halftone
  `url(#gem-raft6-d-dense)` opacity 0.75; inner shelf line under them
  `M 88 108 L 122 108` stroke `#26333b` width 2.5.
- LIGHT WEDGE (protagonist): coral triangle from the seam flaring out top-left:
  polygon (134,34) (134,52) (96,44), fill `url(#gem-raft6-d-dense)` opacity 0.55.
- KEYHOLES: four on the leaf at (153,51), (170,71), (170,97), (153,117) — top one
  (153,51) is the LEADER (crowned, coral key mid-turn), the other three TURNED
  solid; one on the open side's frame at (98,97) EMPTY dashed. → 4 of 5 engaged.

## CANDIDATE E — "Safe-deposit wall" (each node IS a vault)

Zoom out: the cluster is a wall of five vault doors. The big leader door mid-turn;
two small doors already OPEN with coral-lit interiors; one small door closed
(committing next); the laggard's door sealed with dashed seams.

Anchors:
- LEADER DOOR: centre (92,74) r 38 — full DNA (outer ring 5, inner ring 2.5, 6 bolts,
  hub) + crown ring r 42 stroke `#7d2723` width 3.5 + coral dial core r 6 + coral key
  mid-turn (glyph scale ×1.3) + motion arc; glint.
- SMALL DOORS r 16, ring stroke `#465059` width 3, fill `#0b1317`, tiny hub dot r 2:
  (168,46) OPEN — inner disc r 9 fill `url(#gem-raft6-e-dense)` opacity 0.7 + hasp
  stroke at top; (196,88) CLOSED solid — plain ring + hub; (158,122) OPEN — same as
  (168,46); LAGGARD (114,126) SEALED — ring dashed stroke `#7d7669` dasharray "4 3" +
  X-seam (two short diagonal dashes across the door, width 2, dashed).
- WALL GRID (texture): vertical hairlines x 140 and x 214 from y 30→136, stroke
  `#26333b` width 2; ground line y 136 from x 24→236, stroke `#465059` width 3.
- Direction: coral tick marks beside the leader's dial (two antenna ticks up,
  width 2.5). → 3 of 5 open/engaged = majority.

## CANDIDATE F — "Turning wave" (the turn propagates around the rim)

Seven keys, each with a turn-arc showing HOW FAR its rotation has progressed — the
arcs' phases advance clockwise like a wave; the crest key is coral mid-turn.

Anchors:
- DOOR: centre (130,84) r 54, candidate-I DNA (rings, bolts, handle + hub).
- KEYHOLES at r 34, 7 positions clockwise from top (computed): (130,50), (156,63),
  (163,90), (145,111), (115,111), (97,90), (104,63).
- PHASE ARCS (the new element): each of the first four keys carries an arc centred on
  its keyhole at r 11 spanning its progress — (130,50): 250°→360°+32° coral
  (`#ff6a5f` width 3 — the LEADER, crowned, key mid-turn); (156,63): 250°→300°
  stroke `#b6ac95` width 2.5 opacity 0.8; (163,90): 250°→280° stroke `#b6ac95`
  width 2.5 opacity 0.6; (145,111): 250°→265° stroke `#b6ac95` width 2.5 opacity
  0.4 — a decaying rotation wave clockwise.
- TURNED solid keys at (156,63), (163,90), (145,111); EMPTY dashed at (115,111),
  (97,90), (104,63). → 4 of 7 engaged (leader + 3).
- Wave chevron: small coral chevron at the crest arc's leading end.

## CANDIDATE G — "Bolt-work ring" (the lock mechanism exposed)

The door's inner ring becomes a heavy toothed lock-ring (thick dashed stroke); six
spoke keys engage it from the rim; TURNED keys have RETRACTED their bolts (seated),
the laggard's bolt still PROTRUDES past the rim.

Anchors:
- DOOR: centre (130,84) r 54, outer ring 5 + 6 rim bolts + hub (skip handle).
- LOCK RING (the new element): circle r 44, stroke `#465059` width 7, dasharray
  "7 8" — chunky teeth.
- SPOKE KEYS at r 48 heads, 6 positions clockwise from top: (130,36), (172,60),
  (172,108), (130,132), (88,108), (88,60). Each key = spoke line rim→hub (width 2.5,
  `#26333b`) + glyph at the head position + shaft pointing inward (rect 3×10) +
  head disc r 4.5.
- LEADER: (130,36) — crowned, coral glyph + coral head, rotated ~30° off its spoke,
  motion arc r 12 around it.
- TURNED (seated, solid `#7d7669`): (172,60), (172,108), (130,132); each with its
  bolt RETRACTED: a 6px stub stroke just inside the rim at the spoke angle (width 3,
  `#465059`).
- LAGGARD: (88,108) — dashed glyph + dashed head + bolt PROTRUDING: radial rect
  4×10 sticking OUT of the rim at θ240 ((84,110)→(78,116) as a stroke width 4,
  dashed `#7d7669`) — the door cannot close.
- Extra empty: (88,60) glyph only, dashed, no spoke key. → 4 of 6 engaged.

## CANDIDATE H — "Tumbler stack" (the log as tumblers seeking alignment)

Inside the door, a barrel of three stacked tumbler discs — the replicated log. The
top two discs' gate notches have ALIGNED at the right fence (coral markers); the
bottom disc's gate is misaligned (dashed) — the laggard entry. Five rim keyholes vote.

Anchors:
- DOOR: centre (130,84) r 54, candidate-I DNA (rings, bolts, hub; skip handle).
- TUMBLER STACK (the new element): three discs centred x 130 — disc 1 cy 60 r 17,
  disc 2 cy 84 r 14, disc 3 cy 106 r 11 (fill `#0b1317`, ring stroke `#465059`
  width 3 / 2.5 / 2.5; stack seams: hairlines between them, width 2, `#26333b`).
  GATES: small square notches (5×5, fill `#0b1317`, stroke marker) on each disc's
  right edge at (147,60) and (144,84) — ALIGNED: coral solid squares fill
  `#ff6a5f` opacity 0.9; disc 3's gate rotated away to its left edge (113,106):
  dashed square stroke `#7d7669` dasharray "2 2" — misaligned.
- FENCE BAR (protagonist): coral vertical bar dropping into the aligned gates:
  rect x 143 y 52 w 4 h 38, fill `#ff6a5f`, opacity 0.85 — it slides through gates
  1–2 and STOPS at the misaligned disc (its bottom tip at y 90 clears disc 3's
  offset gate).
- KEYHOLES at r 40, 5 positions clockwise from top: (130,44), (168,72), (154,116),
  (107,116), (92,72). LEADER (130,44) crowned + coral key mid-turn; TURNED (168,72),
  (154,116); EMPTY dashed (107,116), (92,72). → 3 of 5 = majority.

## CANDIDATE I — "Deposit slot" (the write port)

The door gains a deposit slot — the log's write port — with coral entries mid-drop,
and a lower grille window showing the committed pile already inside. Six keyholes.

Anchors:
- DOOR: centre (130,84) r 54, candidate-I DNA (rings, bolts, hub; skip handle).
- SLOT (the new element, top-right): rounded rect centred (152,58) w 36 h 10 rx 5,
  rotated −30° about its centre, fill `#0b1317`, stroke `#ff6a5f` width 2.5; two
  entry bars already inside: rects 12×4 rx 2 fill `#ff6a5f` opacity 0.5/0.7 tucked
  under the slot's lower edge (follow the −30° angle); MID-DROP protagonist: rect
  14×5 rx 2 fill `#ff6a5f` at (166,36) rotated −30° + two motion dashes above it
  (short strokes width 2, dashed "2 3", opacity 0.7).
- COMMITTED WINDOW (lower-left): rounded rect x 92 y 100 w 40 h 18 rx 3, fill
  `url(#gem-raft6-i-dense)` opacity 0.6, stroke `#465059` width 2; three vertical
  grille slats inside (strokes width 2.5, `#26333b`).
- KEYHOLES at r 40, 6 positions (θ 15/75/135/195/255/315 from top): (140,45),
  (169,74), (158,112), (120,123), (93,74), (102,45). LEADER (140,45) crowned + coral
  key mid-turn (nudge the crown r 8 to clear the slot); TURNED (169,74), (158,112),
  (120,123); EMPTY dashed (93,74), (102,45). → 4 of 6 = majority.

## CANDIDATE J — "Quorum bell" (the election answered)

The door sits low with a mounted alarm bell on top — when the majority turns, the
bell rings. Three keys turned (incl. the crowned coral leader), two empty; the bell
mid-swing coral with motion arcs.

Anchors:
- DOOR: centre (134,94) r 48 — full DNA scaled (outer ring 5, inner ring 2.5, 6
  bolts, handle x 116→152 y 91, hub).
- BELL (the new element, top): canopy bracket rect x 122 y 24 w 24 h 5 rx 2 fill
  `#465059`; bell dome: path `M 121 44 A 13 13 0 0 1 147 44 Z` (dome from (121,44)
  arcing over to (147,44)), fill `url(#gem-raft6-j-dense)` opacity 0.85, rim line
  `M 121 44 L 147 44` stroke `#7d2723` width 3; clapper dot r 2.5 `#ff6a5f` at
  (137,50) swung right; SWING ARCS: two dashed arcs left of the dome
  (`M 112 40 A 16 16 0 0 1 120 30` and a shorter one below, stroke `#ff6a5f`
  width 2 dasharray "3 3") + one neutral tick right (stroke `#7d7669` width 2.5).
- KEYHOLES at r 32, 5 positions clockwise from top: (134,60), (164,82), (153,118),
  (115,118), (104,82). LEADER (134,60) crowned + coral key mid-turn; TURNED (164,82),
  (153,118); EMPTY dashed (115,118), (104,82). → 3 of 5 = majority; the bell rings
  BECAUSE the majority just completed.
- Glint 2×2 on the bell rim.

## Self-check (all ten)

- Squint test: every variant is still THE VAULT (big circular door, keyholes, bolts),
  and no two share their added mechanism (span arc / dial / clock sector / open leaf /
  door wall / phase arcs / toothed ring / tumblers / slot / bell).
- Node arithmetic stated and legible: turned (solid, seated) > empty (dashed).
- Every variant: crowned coral leader key mid-turn + motion cue, one coral
  protagonist element, laggard deficiency, direction of turn, coral ≤ 3 groups,
  exactly one `gem-halo` ellipse with `opacity={0.12}`, NO background rect, nothing
  outside the safe area except backdrop+halo.
- Check every anchor against its neighbours for collisions (keyhole crowns r 9.5
  need clearance; slots/bells must not overlap glyphs).

END OF ROUND 6 — deliverable complete.
