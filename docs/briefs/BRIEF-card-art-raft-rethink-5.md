# BRIEF — Raft Cluster mark, round 5: TEN concepts, ten graphic languages

Round context (owner verdict history, escalating): rounds 1–3 rejected for reusing one
micro-grammar ("you keep making the same. completely rethink but still consistent");
round 4's two grammar-break candidates (quorum overprint / copper trace) were stopped
with "these are not these"; the owner then paused and now returns with: the current
"control loop" mark is **good but boring — it needs more visual interest, a fresh
concept, still serving its purpose.** This round ships **TEN candidates, each a
DIFFERENT concept and graphic language**, for an owner pick.

**Banned vocabulary (accumulated from every prior round — none of it may appear):**
stepped-cap disc nodes, hairline node rims, tick-row logs, capsule-on-a-dashed-path
signals, the "three small dots connected by thin lines" archetype, three giant halftone
discs with a triple overlap (round 4A), PCB traces + via donuts + crowned write-head pad
(round 4B), narrative scenes with actors (round 1 rethink), instrumentation/control-loop
read (that is the incumbent).

**The family TECHNIQUE — keep all of it:** dark editorial ink catalogue, plate `#0b1317`
showing through (**never paint a background rect** — the card stage provides it);
neutral ink ramp `#26333b #465059 #7d7669 #b6ac95`; paper `#eeeae0 #f4efe4` sparingly;
ONE spot colour CORAL `#ff6a5f` (+ deep `#7d2723`); halftone dot screens; film-grain
print feel; no text, no numbers, no gradients, no filters; crisp primitives; exactly one
`gem-halo` pulse; bold poster masses — smallest element ≥ 2.5px, strokes 2.5–6 wide,
~25–45 primitives per mark.

**What every mark must still say (Raft consensus, read in under a second):**
1. exactly THREE nodes; the leader identifiable WITHOUT text via a deep-coral ring +
   coral halftone/solid presence;
2. committed state vs unwritten future as two visibly different textures;
3. one live coral protagonist in flight (the entry/vote/signal);
4. the laggard's deficiency (a gap, a dashed wall, a missed arrival);
5. visible direction of flow.

Coral ≤ 3 element groups per mark (the crown+core counts as one).

## Hard rules (all ten)

- SVG `viewBox="0 0 260 160"`, `aria-hidden="true"`, NO width/height attributes.
- Nothing outside x 16→244 / y 16→144 except the backdrop ellipse and halo.
- Patterns in `<defs>`, `patternUnits="userSpaceOnUse"`, ids prefixed **per candidate**
  as `gem-raft5-<letter>-*` (e.g. `gem-raft5-a-dense`) — prior rounds already occupy
  `gem-raft-a/b-*` on the same rendered page, so the `raft5` infix is mandatory.
- Standard screens per candidate: `dense` (7×7, dot r 1.9, `#ff6a5f`), `sparse`
  (11×11, dot r 1.6, `#7d7669`), `halo` (7×7, dot r 1.9, `#ff6a5f`) — plus any extra
  pattern the concept needs (neutral ink dots etc.).
- Halo contract: exactly ONE ellipse `className="gem-halo"` `style={haloVar(0.12)}`
  `opacity={0.12}`, coral dots, over the focal point. Wide sparse backdrop ellipse
  (~rx 104 ry 64, cx ~130 cy ~84, opacity 0.09). `haloVar` exists in module scope.
- Component: `export function RaftCandidateA() { … }` — one complete, compilable TSX
  block per candidate, no placeholders.
- Geometry anchors below are exact to ±4px unless told otherwise; refine only where
  needed to avoid collisions, and note any deviation.

## Output format

One ```tsx block per candidate, in order, then ≤2 sentences per candidate: what makes
its language new + coral coverage estimate. No plan, no preamble — go straight to
candidate A. If you hit a length limit, stop cleanly at a finished candidate boundary
and end with `TRUNCATED: <letters still owed>`.

---

# PART 1 OF 2 — candidates A–E

## CANDIDATE A — "Metro line" (the log as a transit trunk)

Transit-map language: one heavy trunk line (the log) with station discs (the nodes).
Committed track is solid and lit; the unbuilt extension beyond the leader is dashed.
The leader is the crowned interchange terminus; the coral train is the entry in flight;
the laggard station is offline (dashed ring, skipped-service squiggle).

Anchors:
- TRUNK (committed): line x 24→186 at y 88, stroke `#465059` width 7, round caps.
- EXTENSION (future): line x 194→236 at y 88, stroke `#7d7669` width 3.5, dasharray "8 6".
- FOLLOWER stations: discs r 7.5 fill `#0b1317` ring `#b6ac95` width 2.5, core dot r 2.5
  `#7d7669`, at x 64 and x 110 on the trunk (y 88).
- LAGGARD station at x 150: same disc but ring dashed (stroke `#7d7669` width 2.5,
  dasharray "4 3"), core dot r 2 `#7d7669` opacity 0.7.
- LEADER interchange at x 176: disc r 11 fill `#0b1317`; deep-coral ring r 12 stroke
  `#7d2723` width 3.5; inner coral halftone disc r 7 `url(#gem-raft5-a-dense)`
  opacity 0.85; white glint 2×2 at (−3,−4) from centre; two coral antenna ticks up
  ((171,74)→(169,68) and (181,74)→(183,68), width 2.5).
- TRAIN (protagonist): coral rounded rect 16×8 rx 4 fill `#ff6a5f` centred (128, 84)
  riding the trunk; two decay dots behind: r 2.5 at (144, 84) opacity 0.7, r 2 at
  (152, 84) opacity 0.5.
- SKIPPED SERVICE at the laggard: dashed curve `M 136 80 Q 146 62 156 68` stroke
  `#7d7669` width 2, dasharray "3 4" — a loop that overshoots and misses the station.
- DIRECTION: two neutral chevrons under the trunk pointing LEFT at (100, 98) and
  (72, 98), stroke `#7d7669` width 2.5.
- Halo over the train/interchange zone: cx ~150 cy ~82.

## CANDIDATE B — "Gear train" (consensus as meshing machinery)

Machine language: three chunky gears, tooth rings as thick dashed-stroke circles. The
leader gear's hub is crowned and coral; the mesh zones where teeth interleave are
stamped with small coral halftone wedges (the consensus contacts); the laggard gear has
a missing tooth. Rotation chevrons give the direction of flow.

Anchors (refine so tooth rings nearly touch or interleave):
- LEADER gear: centre (92, 80) r 30 — fill `#0b1317`, body ring stroke `#465059`
  width 3; TOOTH RING: circle r 33 fill none stroke `#b6ac95` width 6, dasharray "6 7"
  (chunky blocks); crown ring r 30 stroke `#7d2723` width 4; hub: coral halftone disc
  r 12 `url(#gem-raft5-b-dense)` opacity 0.8 + solid coral core r 4.5; glint 2×2 at
  (−3,−4); rotation arrow: arc r 21 from 190°→240° stroke `#7d7669` width 2.5 + chevron
  at its end.
- FOLLOWER gear: centre (158, 102) r 21 — fill `#0b1317`, ring stroke `#465059`
  width 3, tooth ring r 24 stroke `#465059` width 5.5 dasharray "5 6", hub dot r 3.5
  `#7d7669`.
- LAGGARD gear: centre (200, 54) r 17 — fill `#0b1317`, ring dashed stroke `#7d7669`
  width 2.5 dasharray "4 3", tooth ring r 20 stroke `#7d7669` width 5 dasharray "5 6"
  BUT with one tooth gap facing the follower (rotate the dasharray phase so a gap sits
  at ~225°), hub dot r 3 `#7d7669`.
- MESH WEDGES (coral, the consensus contacts): two small halftone-filled triangles
  (~10×8) `url(#gem-raft5-b-dense)` opacity 0.75 at the leader↔follower contact
  ~(126, 94) and follower↔laggard contact ~(180, 76).
- PROTAGONIST: coral dot r 4 at (126, 60) escaping upward from the leader along a thin
  dashed neutral arc `M 112 56 Q 122 52 126 60`… (a spark flying off the train), trail
  dot r 2.5 opacity 0.6 at (118, 54).
- Halo over the leader gear: cx ~100 cy ~76.

## CANDIDATE C — "Punched tape" (the log as vintage paper tape)

Vintage-computing language: a long paper tape band across the plate carries the log.
Punched holes = committed entries (the plate shows through); the leader is the crowned
punch head stamping the fresh hole; two reader shoes below are the followers; the
laggard's shoe is dashed and mis-fed; the un-punched tail is a dashed empty outline.

Anchors:
- TAPE (committed section): rect x 22 y 66 width 164 height 40, fill `#465059`, rx 2.
- TAPE TAIL (unwritten): dashed outline rect x 190 y 66 width 46 height 40, fill none,
  stroke `#7d7669` width 2.5, dasharray "6 5".
- EDGE PERF DOTS: 6 circles r 1.5 fill `#26333b` along the top edge inside the tape at
  x 34…164 step 26, y 72; same along the bottom edge y 100 (only inside the solid tape).
- PUNCHED HOLES (committed entries): circles r 4.5 fill `#0b1317` at x 44/72/100/128/156,
  y 86.
- FRESH HOLE (protagonist, mid-punch): circle r 4.5 fill `#0b1317` at x 176 y 86 with a
  coral halftone burst ring around it: circle r 8 fill `url(#gem-raft5-c-dense)`
  opacity 0.8; two coral sparks up: (172,76)→(170,71) and (180,76)→(182,71) stroke
  `#ff6a5f` width 2.
- LEADER punch head above the fresh hole at (176, 46): disc r 10 fill `#0b1317`,
  deep-coral ring r 10 stroke `#7d2723` width 3.5, core coral disc r 4; a short bold
  press ram: rect x 172.5 y 54 width 7 height 8 fill `#465059`; glint 2×2 at (−3,−4).
- FOLLOWER reader shoes below the tape: rounded rects 22×10 rx 3 fill `#26333b` stroke
  `#465059` width 2 at centres (58, 118) and (102, 118), each with a riser line from
  tape bottom (y 106) width 3 stroke `#465059`.
- LAGGARD reader at (146, 124) — dropped lower (mis-feed): same shoe but dashed stroke
  `#7d7669` dasharray "4 3", riser dashed, and its read window (inner rect 10×4) empty.
- DIRECTION: feed chevron on the tape left edge pointing left at (30, 86), stroke
  `#b6ac95` width 2.5.
- Halo over the punch head: cx ~170 cy ~64.

## CANDIDATE D — "Orrery" (the cluster as an orbital diagram)

Astronomical-diagram language: the leader is the sun at centre; the two followers ride
bold orbit rings whose swept (committed) arcs are solid and whose unswept arcs are
dashed; a coral transfer moon flies from the sun to the first orbit (the entry in
flight); the laggard's orbit is mostly dashed with a broken gap — it has not swept its
share.

Anchors:
- SUN (leader) at (130, 82): disc r 13 fill `#0b1317`; deep-coral ring r 13 stroke
  `#7d2723` width 4; inner coral halftone disc r 9 `url(#gem-raft5-d-dense)`
  opacity 0.75; core dot r 3.5 `#ff6a5f`; white glint 2×2 at (−3,−4).
- ORBIT 1 (follower 1): circle centre (130,82) r 34, stroke `#465059` width 3 — drawn
  as TWO arcs: solid from 120°→40° (going clockwise the long way, ~280°) and dashed
  remainder (dasharray "5 5") — the committed sweep vs the future.
- ORBIT 2 (laggard): circle r 52, stroke `#7d7669` width 3 — solid only from 200°→260°
  (~60°, it just started), dashed elsewhere with ONE 18° gap at ~300° bridged by a
  dotted sub-arc (dasharray "1 6", opacity 0.7) — the missed pass.
- FOLLOWER MOON on orbit 1 at angle ~30° → position ~(159, 65): disc r 5.5 fill
  `#26333b` ring `#b6ac95` width 2, tiny core dot r 1.8 `#7d7669`.
- LAGGARD MOON on orbit 2 at angle ~230° → position ~(96, 121): disc r 5 fill `#26333b`
  dashed ring stroke `#7d7669` width 2 dasharray "3 3".
- TRANSFER (protagonist): coral moon r 4.5 at (170, 47) on a thin dashed coral spoke
  `M 141 74 L 166 50` (dasharray "2 4", stroke `#ff6a5f` width 1.5 opacity 0.8), trail
  dot r 2.5 opacity 0.6 at (175, 44).
- DIRECTION: two neutral rotation chevrons sitting on orbit 1 at ~150° and orbit 2 at
  ~30°, stroke `#7d7669` width 2.5.
- Halo over the sun: cx ~132 cy ~80.

## CANDIDATE E — "Printing press" (the log as a printed sheet)

Print-shop language: a paper sheet (the log) feeds right-to-left under three rollers.
The leader is the big crowned roller at the print frontier laying fresh coral ink;
printed (committed) area is a coral halftone overprint on the sheet; the blank sheet
ahead is the unwritten future; the laggard station missed its stamp (dashed, empty slot).

Anchors:
- SHEET: rect x 22 y 96 width 200 height 28, fill `#b6ac95`, rx 2. Feed direction
  chevrons ON the sheet pointing left at (196, 110) and (178, 110), stroke `#26333b`
  width 2.5.
- PRINTED (committed) overprint: rect x 22 y 96 width 128 height 28 fill
  `url(#gem-raft5-e-dense)` opacity 0.5 (clamp to the sheet's rounded corner by
  clipping to the sheet rect).
- FRONTIER: vertical dashed line x 150 from y 96→124 stroke `#7d7669` width 2,
  dasharray "4 4" (the edge of the written future).
- FRESH ENTRY (protagonist): solid coral rect 12×8 rx 2 at (136, 106) — the entry the
  roller just laid, half over the printed field.
- LEADER roller: circle (150, 66) r 21 — fill `#0b1317`, body ring stroke `#465059`
  width 3, deep-coral crown ring r 21 stroke `#7d2723` width 4, hub coral halftone
  disc r 10 `url(#gem-raft5-e-dense)` opacity 0.8 + core r 4; rotation chevron on r 15
  at 210°; two coral crown ticks up ((145,44)→(143,38) and (155,44)→(157,38) width 2.5);
  glint 2×2 at (−3,−4). Axle line down to the sheet: rect x 147.5 y 87 width 5 height 9
  fill `#465059`.
- FOLLOWER station rollers (already stamped their copies): two smaller rollers r 9,
  fill `#0b1317` ring stroke `#465059` width 2.5, hubs dot r 2.5 `#7d7669`, at (96, 80)
  and (60, 80), each with a thin press arm down to the sheet; their stamped copies:
  small dark rects 10×6 fill `#26333b` at (96, 106) and (60, 106).
- LAGGARD station at (36, 84): roller circle r 9 DASHED ring stroke `#7d7669` dasharray
  "4 3", hub dot opacity 0.6; its copy slot on the sheet: dashed outline rect 10×6 at
  (36, 106) — the missed stamp. (Leftmost = furthest behind.)
- Halo over the frontier/roller: cx ~146 cy ~76.

END OF PART 1 — reply "continue" for Part 2.

---

# PART 2 OF 2 — candidates F–J

## CANDIDATE F — "Dish array" (the cluster as a radio telescope field)

Observatory language: three dishes on a hairline ground line. The leader dish (crowned
hub) broadcasts a bold coral wavefront toward the first follower (solid arcs mid-flight
= committed replication); the laggard dish is tilted away — its wavefront is dashed and
stops short (the missed write). Solid signal lobes vs dashed corridors = committed vs
future.

Anchors:
- GROUND: line x 24→236 at y 128, stroke `#465059` width 3, round caps.
- LEADER dish at (66, 96): bowl = path `M 52 96 A 16 16 0 0 1 80 96` rotated −25° about
  (66, 96) so it opens up-right, stroke `#465059` width 5 fill none; feed strut line
  from bowl centre (66,96) to (76, 84) width 2.5 stroke `#7d7669`; hub: coral disc r 4
  + deep-coral crown ring r 7.5 stroke `#7d2723` width 3 at (78, 82); mast line
  (66, 104)→(66, 128) width 3.5 stroke `#465059`.
- WAVEFRONT (protagonist): two concentric arc segments centred on the leader hub
  travelling right: arc r 26 from −55°→25° stroke `#ff6a5f` width 3.5 opacity 0.85;
  arc r 40 from −55°→25° stroke `#ff6a5f` width 2.5 opacity 0.5.
- FOLLOWER dish at (146, 100): same bowl rotated +15° opening up-left (receiving);
  hub neutral disc r 4 + ring r 7.5 stroke `#465059` width 3; a solid received-lobe
  wedge: small halftone triangle (~14×10) `url(#gem-raft5-f-dense)` opacity 0.7 at
  (130, 88) facing the dish.
- LAGGARD dish at (210, 96): bowl rotated −70° (tilted AWAY, opening up-right at the
  sky, not at the leader); ring dashed stroke `#7d7669` width 2.5 dasharray "4 3"; its
  would-be wavefront: dashed arc r 30 centred on the leader from 10°→40° stroke
  `#7d7669` width 2 dasharray "3 4" opacity 0.7, STOPPING 16px short of the dish.
- FUTURE corridor: two dashed hairlines fanning right from the leader above the ground:
  `M 92 74 L 232 58` and `M 92 78 L 232 44`, stroke `#7d7669` width 1.5 dasharray
  "4 6" opacity 0.5 — the not-yet-written channels.
- DIRECTION: chevron on the wavefront axis at (112, 84) pointing right, stroke
  `#7d7669` width 2.5.
- Halo over the wavefront: cx ~110 cy ~80.

## CANDIDATE G — "Honeycomb" (consensus as three sealed cells)

Tiling language: three big hexagons tile the plate. A heavy neutral "common wall" path
snakes through all three cells — that chain is the replicated log; its committed prefix
is overprinted in coral halftone, its future tail dashed. The leader cell is crowned
with a deep-coral inner ring; the laggard cell's outer wall is dashed (not yet sealed).

Anchors (pointy-top hexagons, R 27; tile so walls are shared, drawn once):
- HEX GRID: centres A(104, 62) leader, B(156, 62) follower, C(130, 105) laggard;
  outlines stroke `#465059` width 3.5 fill `#0b1317`, shared walls drawn once.
- LEADER cell: inner ring = hexagon path at R 19 centred A, stroke `#7d2723` width 4;
  coral halftone fill inside (hexagon R 19 fill `url(#gem-raft5-g-dense)` opacity
  0.35); crown ticks at its top vertex: (100, 24)→(99, 18) and (108, 24)→(109, 18)
  stroke `#ff6a5f` width 2.5.
- LOG PATH: polyline through the cells `M 84 76 L 104 50 L 130 66 L 156 50 L 176 76`
  stroke `#465059` width 5, round joins — committed prefix `M 84 76 L 104 50 L 130 66`
  OVERPRINTED stroke `url(#gem-raft5-g-dense)` width 7 opacity 0.8; future tail
  `M 156 50 L 176 76`… actually swap: committed = through leader+follower cells, tail
  from (156,50)→(176,76) dashed stroke `#7d7669` width 3 dasharray "6 5".
- PROTAGONIST: coral hexagon (pointy-top, R 6) solid fill `#ff6a5f` at (143, 74) riding
  the log path between the cells, trail dot r 2.5 opacity 0.6 at (136, 68).
- LAGGARD cell C: outer wall dashed on its three lower edges (stroke `#7d7669` width 3,
  dasharray "5 4" overdrawn on the shared outline); its log slot: small dashed hexagon
  R 5 centred (130, 105) stroke `#7d7669` dasharray "3 3" — the entry it will seal.
- DIRECTION: chevron on the log path at (117, 58) pointing right-up, stroke `#7d7669`
  width 2.5.
- Halo over the B–C wall junction: cx ~140 cy ~80.

## CANDIDATE H — "Suspension bridge" (the log as an unfinished span)

Civil-engineering language: the log is a bridge deck. Two towers + a far pier are the
three nodes; the decked, cable-suspended span is the committed prefix; the far span is
dashed deck with bare dashed cables (unwritten); the laggard pier stands short of the
dashed deck — a visible gap. The coral maintenance gondola on the deck is the entry in
flight; the leader tower is crowned.

Anchors:
- DECK (committed): line x 24→176 at y 96, stroke `#465059` width 6, round caps.
- DECK (future): dashed line x 182→232 at y 96, stroke `#7d7669` width 3 dasharray
  "7 6".
- MAIN CABLE (committed side): path `M 24 88 Q 44 56 64 56 Q 100 92 136 48` stroke
  `#b6ac95` width 2.5 — up over follower tower, sag, up to leader tower top.
- SUSPENDERS: 5 vertical hairlines width 2 stroke `#7d7669` opacity 0.7 from cable to
  deck at x 84/98/112 (y from sag curve ≈ 78→96) and x 50/58 (≈ 70→96)… compute from
  the Q curve approximately.
- FOLLOWER tower at x 64: two verticals x 60/68 from y 96→56 + one crossbeam at y 66,
  stroke `#465059` width 3.5; cap: ring circle r 4.5 at (64, 52) stroke `#465059`
  width 2.5.
- LEADER tower at x 136: two verticals x 131/141 from y 96→46 + crossbeams at y 58 and
  y 72, stroke `#465059` width 4; crown: deep-coral ring r 7 at (136, 42) stroke
  `#7d2723` width 3.5 + coral core r 3 + glint 2×2 at (−3,−4); two coral crown ticks
  ((131,34)→(129,28) and (141,34)→(143,28) width 2.5).
- FUTURE cable: dashed curve `M 141 48 Q 180 84 232 88` stroke `#7d7669` width 2.5
  dasharray "6 5" — bare cable, no deck under most of it.
- LAGGARD pier at x 208: two dashed verticals x 204/212 from y 128 up to y 110 + dashed
  cap rect x 202 y 108 width 12 height 5 — all stroke `#7d7669` dasharray "4 3"; the
  gap between pier top (y 108) and future deck (y 96) is the deficiency.
- PROTAGONIST: coral gondola rect 12×7 rx 2 fill `#ff6a5f` ON the deck at (104, 89),
  trail dots r 2.5 opacity 0.7 at (118, 89), r 2 opacity 0.5 at (124, 89).
- GROUND: hairline x 24→236 at y 128, stroke `#26333b` width 3 opacity 0.8.
- Halo over the deck mid-span: cx ~110 cy ~84.

## CANDIDATE I — "Vault quorum" (commitment as a three-key vault)

Security-mechanism language: one giant circular vault door fills the plate. Three
keyholes sit at 120°. Two keys are already TURNED (committed — solid, seated); the
leader's key is coral and mid-turn with a motion arc (the protagonist); the laggard's
keyhole is empty and dashed (the deficiency). Quorum read = two of three turned.

Anchors:
- DOOR: circle (130, 84) r 54 — outer ring stroke `#465059` width 5; inner ring r 45
  stroke `#26333b` width 2.5; BOLTS: 6 short radial strokes on the rim at 0/60/…/300°,
  from r 49→r 54, stroke `#465059` width 3.
- HUB + HANDLE: centre disc r 5.5 fill `#0b1317` ring `#b6ac95` width 2; handle bar:
  rounded rect x 108 y 81 width 44 height 6 rx 3 fill `#0b1317` stroke `#465059`
  width 2.5 (under the keyholes' spokes).
- KEYHOLE SPOKES: three thin lines from hub to each keyhole position stroke `#26333b`
  width 2 — top (130, 52), lower-left (102, 100), lower-right (158, 100) (at r 32,
  120° apart).
- LEADER keyhole (top): outer coral ring r 9.5 at (130, 52) stroke `#7d2723` width 3;
  keyhole = circle r 5 fill `#0b1317` stroke `#ff6a5f` width 2 + stem wedge
  `M 128 56 L 132 56 L 133 62 L 127 62 Z` fill `#ff6a5f`; KEY mid-turn: coral key —
  shaft rect 3×14 rotated 35° about (130, 52) pointing up-left, head circle r 4.5
  fill `#ff6a5f` at the outer end; motion arc r 14 from −80°→−20° stroke `#ff6a5f`
  width 2 dasharray "3 3" + chevron.
- FOLLOWER keyhole (lower-right): key TURNED and seated: stem wedge vertical fill
  `#7d7669`, circle r 5 stroke `#7d7669` width 2 fill `#0b1317`, key shaft rect 3×12
  vertical below, head disc r 4 fill `#7d7669` — all solid (it voted).
- LAGGARD keyhole (lower-left): dashed circle r 5 stroke `#7d7669` dasharray "3 3",
  dashed stem wedge outline, NO key — empty; a small dashed "awaited key" slot: dashed
  rounded rect 8×12 rotated −35° at (96, 92) stroke `#7d7669` dasharray "3 3".
- GLINT: white 2×2 on the hub.
- Halo over the leader keyhole: cx ~130 cy ~56.

## CANDIDATE J — "Beacon chain" (the cluster as a hilltop signal line)

Signalling-topology language: a bold stepped ridge silhouette carries three beacon
masts. Lit coral dot-paths run ridge-top from the first beacon to the crowned leader
beacon (committed spans); the span beyond is dashed dark with a GAP before the unlit
laggard beacon (missed light); one coral spark is mid-air between leader and laggard
(the live signal). No scenery beyond the ridge — the topology stays foreground.

Anchors:
- RIDGE (one big mass): polygon `16,144 16,118 48,118 78,96 108,96 130,60 152,96
  182,96 208,112 244,112 244,144` fill `#26333b` — stepped mountain, peak under the
  leader.
- BEACON 1 (follower) at (58, 96): mast line (58, 96)→(58, 76) stroke `#b6ac95`
  width 3.5; cage: rect x 52 y 68 width 12 height 9 fill `#0b1317` stroke `#b6ac95`
  width 2; flame: small halftone disc r 3.5 `url(#gem-raft5-j-dense)` opacity 0.6.
- LEADER beacon at (130, 60) on the peak: mast (130, 60)→(130, 38) stroke `#465059`
  width 4; cage rect x 122 y 28 width 16 height 11 fill `#0b1317` stroke `#7d2723`
  width 3; flame: coral halftone disc r 5 `url(#gem-raft5-j-dense)` opacity 0.85 +
  solid coral core r 2.5; two coral crown ticks ((124,24)→(122,18) and (136,24)→(138,18)
  width 2.5); white glint 2×2 at (126, 30).
- LAGGARD beacon at (196, 96): mast (196, 96)→(196, 78) stroke `#7d7669` width 3; cage
  rect x 190 y 70 width 12 height 9 fill `#0b1317` stroke `#7d7669` width 2 dasharray
  "3 3"; NO flame (unlit).
- LIT SPANS (committed): coral dot-paths along the ridge crest: circles r 2 fill
  `#ff6a5f` at (70, 92), (82, 88), (94, 84), (106, 76) opacity 0.9 — beacon 1 → leader;
  below-left of beacon 1 two fading dots r 2 opacity 0.5/0.3 at (46, 102), (36, 108).
- DARK SPAN (future + gap): dashed ridge path `M 152 96 Q 168 94 182 96` stroke
  `#7d7669` width 2 dasharray "4 5" opacity 0.7, ending 14px short of the laggard.
- PROTAGONIST: coral spark r 4 at (166, 78) mid-air between leader and laggard on a
  thin dashed arc `M 138 46 Q 158 56 166 78` stroke `#ff6a5f` width 1.5 dasharray
  "2 4" opacity 0.8; trail dot r 2.5 opacity 0.6 at (172, 84).
- Two white star glints 2×2 at (92, 44) and (222, 60), opacity 0.55.
- Halo over the leader beacon: cx ~130 cy ~46.

## Self-check (all ten)

- Squint test: A transit line, B machinery, C paper tape, D orbital diagram, E print
  shop, F observatory, G tiling, H bridge, I vault, J signal ridge — TEN different
  first impressions; zero shared elements with rounds 1–4 or each other beyond the
  family palette/screens/halo.
- Every mark: 3 nodes, crowned leader, committed-vs-future textures, one coral
  protagonist, laggard deficiency, visible direction, coral ≤ 3 groups, exactly one
  `gem-halo` ellipse with `opacity={0.12}`, NO background rect, nothing outside the
  safe area except backdrop+halo.
- Check every anchor against its neighbours for collisions; keep ~25–45 primitives.

END OF PART 2 — deliverable complete.
