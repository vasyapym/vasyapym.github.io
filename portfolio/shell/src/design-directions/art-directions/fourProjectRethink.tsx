import type { ReactElement } from "react";
import type { ProjectModule } from "../../../../contracts/project-module";
import { INCUMBENT_MARKS } from "../../shell/ProjectArtwork";
import { RoundSection, type RoundEntry } from "./roundSection";
import {
  RaftD, RaftE, RaftF,
  ForestD, ForestE, ForestF,
  BlastD, BlastE, BlastF,
  PlanckD, PlanckE, PlanckF,
} from "./fourProjectRethink2";

/* Card-art rethink round (card-artwork-rethink R002/R003): raw candidates
   drawn by the chat model with full subject autonomy, six per project from
   two relay batches (A–C = batch 1, D–F = batch 2). The only integration
   repair: batch 1's marks each carried a `<rect width="260" height="160"
   fill="#0d0d10" />` ground which was stripped — the draft card panel already
   paints the card ground and the rect read as a distinct seam; batch 2
   shipped without one. Everything else is the model's code as received.
   Owner picks per project; refinement into the house language follows the
   picks. */

type FourProjectRethinkProps = { projects: readonly ProjectModule[] };

/* ── Raft Cluster ── */

/* RaftA — Heartbeat Ring: a five-node ring with one solid leader sending
   pulses and followers wearing partial election-timer rings. */
export function RaftA() {
  const leader = { x: 130, y: 34 };
  const followers = [
    { x: 196.6, y: 68.5, timer: 62 },
    { x: 171.2, y: 124.5, timer: 30 },
    { x: 88.8, y: 124.5, timer: 80 },
    { x: 63.4, y: 68.5, timer: 46 },
  ];
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="RaftA-dotsWide" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.9" fill="#ff6a5f" />
        </pattern>
        <pattern id="RaftA-dotsCore" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.7" fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="82" rx="104" ry="62" fill="url(#RaftA-dotsWide)" opacity="0.3" />
      <ellipse cx="130" cy="82" rx="62" ry="38" fill="url(#RaftA-dotsCore)" opacity="0.38" />
      {followers.map((f, i) => (
        <line
          key={`l${i}`}
          x1={leader.x}
          y1={leader.y}
          x2={f.x}
          y2={f.y}
          stroke="#8c3a34"
          strokeWidth="2.5"
        />
      ))}
      {followers.map((f, i) => (
        <circle
          key={`m${i}`}
          cx={leader.x + (f.x - leader.x) * 0.55}
          cy={leader.y + (f.y - leader.y) * 0.55}
          r="3.5"
          fill="#ff6a5f"
        />
      ))}
      <circle cx={leader.x} cy={leader.y} r="21" fill="none" stroke="#8c3a34" strokeWidth="2" />
      <circle cx={leader.x} cy={leader.y} r="15" fill="#ff6a5f" />
      {followers.map((f, i) => (
        <g key={`f${i}`}>
          <circle cx={f.x} cy={f.y} r="12" fill="#26262c" />
          <circle
            cx={f.x}
            cy={f.y}
            r="16"
            fill="none"
            stroke="#ff6a5f"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${f.timer} 101`}
            transform={`rotate(-90 ${f.x} ${f.y})`}
          />
        </g>
      ))}
      <rect x="134" y="27" width="3" height="3" fill="#ffffff" />
      <rect x="199" y="64" width="2" height="2" fill="#ffffff" />
    </svg>
  );
}

/* RaftB — Split-Brain Partition: a jagged fault line cuts the cluster into a
   linked, leader-holding majority of three and a greyed, orphaned pair. */
export function RaftB() {
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="RaftB-dotsWide" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.9" fill="#ff6a5f" />
        </pattern>
        <pattern id="RaftB-dotsCore" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.7" fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx="100" cy="84" rx="88" ry="58" fill="url(#RaftB-dotsWide)" opacity="0.3" />
      <ellipse cx="78" cy="86" rx="48" ry="36" fill="url(#RaftB-dotsCore)" opacity="0.38" />
      <line x1="62" y1="56" x2="48" y2="112" stroke="#ff6a5f" strokeWidth="3" />
      <line x1="62" y1="56" x2="98" y2="104" stroke="#ff6a5f" strokeWidth="3" />
      <line x1="48" y1="112" x2="98" y2="104" stroke="#ff6a5f" strokeWidth="3" />
      <line x1="192" y1="62" x2="208" y2="112" stroke="#4a4a52" strokeWidth="3" strokeDasharray="4 5" />
      <line x1="77" y1="57" x2="126" y2="60" stroke="#ff6a5f" strokeWidth="3" strokeLinecap="square" />
      <line x1="109" y1="105" x2="126" y2="106" stroke="#ff6a5f" strokeWidth="3" strokeLinecap="square" />
      <line x1="164" y1="61" x2="181" y2="62" stroke="#4a4a52" strokeWidth="3" strokeLinecap="square" />
      <line x1="164" y1="108" x2="197" y2="111" stroke="#4a4a52" strokeWidth="3" strokeLinecap="square" />
      <polyline
        points="150,18 136,46 154,72 136,98 154,124 140,148"
        fill="none"
        stroke="#ff6a5f"
        strokeWidth="4"
        strokeLinejoin="miter"
      />
      <circle cx="62" cy="56" r="15" fill="#ff6a5f" />
      <circle cx="48" cy="112" r="11" fill="#26262c" stroke="#ff6a5f" strokeWidth="3" />
      <circle cx="98" cy="104" r="11" fill="#26262c" stroke="#ff6a5f" strokeWidth="3" />
      <circle cx="192" cy="62" r="11" fill="#1b1b20" stroke="#4a4a52" strokeWidth="3" />
      <circle cx="208" cy="112" r="11" fill="#1b1b20" stroke="#4a4a52" strokeWidth="3" />
      <rect x="66" y="49" width="3" height="3" fill="#ffffff" />
      <rect x="152" y="69" width="2" height="2" fill="#ffffff" />
    </svg>
  );
}

/* RaftC — Committed Across Replicas: three database cylinders share one coral
   committed band tied together by a single commit line, while the leader fans
   a pending entry out to its followers. */
export function RaftC() {
  const cylinders = [
    { cx: 66, lead: false },
    { cx: 130, lead: true },
    { cx: 194, lead: false },
  ];
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="RaftC-dotsWide" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.9" fill="#ff6a5f" />
        </pattern>
        <pattern id="RaftC-dotsCore" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.7" fill="#ff6a5f" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="84" rx="108" ry="60" fill="url(#RaftC-dotsWide)" opacity="0.3" />
      <ellipse cx="130" cy="84" rx="64" ry="36" fill="url(#RaftC-dotsCore)" opacity="0.38" />
      <rect x="36" y="81" width="188" height="4" fill="#ff6a5f" />
      {cylinders.map(({ cx, lead }) => (
        <g key={`c${cx}`}>
          <path
            d={`M${cx - 22} 52 L${cx - 22} 118 A22 7 0 0 0 ${cx + 22} 118 L${cx + 22} 52 Z`}
            fill="#1d1d23"
          />
          <path
            d={`M${cx - 22} 74 A22 7 0 0 0 ${cx + 22} 74 L${cx + 22} 92 A22 7 0 0 1 ${cx - 22} 92 Z`}
            fill="#ff6a5f"
          />
          <path
            d={`M${cx - 22} 104 A22 7 0 0 0 ${cx + 22} 104`}
            fill="none"
            stroke="#34343c"
            strokeWidth="2"
          />
          <ellipse cx={cx} cy="52" rx="22" ry="7" fill={lead ? "#ff6a5f" : "#34343c"} />
        </g>
      ))}
      <rect x="119" y="22" width="22" height="12" rx="2" fill="none" stroke="#ff6a5f" strokeWidth="2.5" />
      <path d="M130 34 V44" stroke="#ff6a5f" strokeWidth="2.5" strokeDasharray="3 3" />
      <path d="M118 28 Q84 22 70 42" fill="none" stroke="#ff6a5f" strokeWidth="2.5" strokeDasharray="3 4" strokeLinecap="round" />
      <path d="M142 28 Q176 22 190 42" fill="none" stroke="#ff6a5f" strokeWidth="2.5" strokeDasharray="3 4" strokeLinecap="round" />
      <rect x="137" y="49" width="3" height="3" fill="#ffffff" />
      <rect x="74" y="79" width="3" height="3" fill="#ffffff" />
    </svg>
  );
}

/* ── Evening Forest ── */

/* ForestA — Lantern Walker: a lone pixel wanderer holds a lantern that lights
   a patch of trail beside a single pine. */
export function ForestA() {
  const pal: Record<string, string> = { T: "#4fd1a5", D: "#1f7a5f", B: "#17493d", L: "#dafff2" };
  const pine = [
    ".....T.....",
    "....TTT....",
    "...TTTTD...",
    "....TTD....",
    "...TTTTD...",
    "..TTTTTDD..",
    "...TTTTD...",
    "..TTTTTTD..",
    ".TTTTTTTDD.",
    "..TTTTTTD..",
    ".TTTTTTTTD.",
    "TTTTTTTTTDD",
    ".....B.....",
    ".....B.....",
    "....BBB....",
  ];
  const walker = [
    "...TT....",
    "..TTTT...",
    "...TT....",
    "..TTTT...",
    ".TTTTTTT.",
    ".TTTT..T.",
    ".TTTT.LL.",
    "..TTT.LL.",
    "..T..T...",
    ".T....T..",
    ".T....T..",
  ];
  const draw = (rows: string[], ox: number, oy: number, s: number, k: string) =>
    rows.flatMap((row, y) =>
      row.split("").map((c, x) =>
        pal[c] ? (
          <rect key={`${k}-${x}-${y}`} x={ox + x * s} y={oy + y * s} width={s} height={s} fill={pal[c]} />
        ) : null
      )
    );
  const pebbles = [
    [60, 124], [94, 126], [128, 124], [162, 126], [196, 124],
    [78, 134], [118, 136], [158, 134], [198, 136],
  ];
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="ForestA-dotsWide" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.9" fill="#4fd1a5" />
        </pattern>
        <pattern id="ForestA-dotsCore" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.7" fill="#4fd1a5" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="82" rx="106" ry="60" fill="url(#ForestA-dotsWide)" opacity="0.28" />
      <ellipse cx="160" cy="88" rx="60" ry="34" fill="url(#ForestA-dotsCore)" opacity="0.36" />
      <g shapeRendering="crispEdges">
        <rect x="28" y="113" width="204" height="5" fill="#1d4f42" />
        <rect x="166" y="113" width="36" height="5" fill="#2f9c7c" />
        {pebbles.map(([x, y], i) => (
          <rect key={`p${i}`} x={x} y={y} width="6" height="3" fill="#1d4f42" />
        ))}
        {draw(pine, 56, 38, 5, "pine")}
        {draw(walker, 150, 58, 5, "walker")}
        <rect x="40" y="30" width="3" height="3" fill="#2f9c7c" />
        <rect x="212" y="26" width="3" height="3" fill="#2f9c7c" />
        <rect x="182" y="90" width="2" height="2" fill="#ffffff" />
        <rect x="226" y="44" width="2" height="2" fill="#ffffff" />
      </g>
    </svg>
  );
}

/* ForestB — Fork Signpost & Fireflies: a two-arrow wooden signpost stands
   where the trail splits into two stepped paths, with glowing firefly pixels. */
export function ForestB() {
  const pal: Record<string, string> = { T: "#4fd1a5", D: "#1f7a5f" };
  const sign = [
    "......DD......",
    "..TTTTTTTTT...",
    ".TTTTTTTTTT...",
    "..DDDDDDDDD...",
    "......DD......",
    "...TTTTTTTTT..",
    "...TTTTTTTTTT.",
    "...DDDDDDDDD..",
    "......DD......",
    "......DD......",
    "......DD......",
    "......DD......",
    "......DD......",
    ".....DDDD.....",
  ];
  const tuft = ["D.D.D", "DDDDD"];
  const draw = (rows: string[], ox: number, oy: number, s: number, k: string) =>
    rows.flatMap((row, y) =>
      row.split("").map((c, x) =>
        pal[c] ? (
          <rect key={`${k}-${x}-${y}`} x={ox + x * s} y={oy + y * s} width={s} height={s} fill={pal[c]} />
        ) : null
      )
    );
  const steps = [0, 1, 2, 3, 4];
  const flies = [
    [60, 46], [80, 70], [186, 40], [206, 72], [168, 24],
  ];
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="ForestB-dotsWide" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.9" fill="#4fd1a5" />
        </pattern>
        <pattern id="ForestB-dotsCore" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.7" fill="#4fd1a5" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="80" rx="106" ry="60" fill="url(#ForestB-dotsWide)" opacity="0.28" />
      <ellipse cx="130" cy="76" rx="58" ry="36" fill="url(#ForestB-dotsCore)" opacity="0.36" />
      <g shapeRendering="crispEdges">
        <rect x="30" y="110" width="200" height="4" fill="#1d4f42" />
        {steps.map((i) => (
          <rect key={`sl${i}`} x={108 - i * 18} y={114 + i * 6} width="22" height="6" fill="#23604f" />
        ))}
        {steps.map((i) => (
          <rect key={`sr${i}`} x={130 + i * 18} y={114 + i * 6} width="22" height="6" fill="#23604f" />
        ))}
        {draw(sign, 95, 40, 5, "sign")}
        {draw(tuft, 46, 104, 3, "t1")}
        {draw(tuft, 72, 104, 3, "t2")}
        {draw(tuft, 188, 104, 3, "t3")}
        {flies.map(([x, y], i) => (
          <g key={`f${i}`}>
            <rect x={x - 2} y={y - 2} width="8" height="8" fill="#1f5f4d" />
            <rect x={x} y={y} width="4" height="4" fill="#4fd1a5" />
          </g>
        ))}
        <rect x="61" y="47" width="2" height="2" fill="#ffffff" />
        <rect x="187" y="41" width="2" height="2" fill="#ffffff" />
      </g>
    </svg>
  );
}

/* ForestC — Footprints Home: a trail of pixel footprints leads to a small
   cabin with a glowing window and a wisp of chimney smoke. */
export function ForestC() {
  const pal: Record<string, string> = { T: "#4fd1a5", D: "#1f6e58", C: "#2a8a6e", L: "#e2fff4" };
  const cabin = [
    "...........CC...",
    ".......TT..CC...",
    "......TTTT.CC...",
    ".....TTTTTTCC...",
    "....TTTTTTTT....",
    "...TTTTTTTTTT...",
    "..TTTTTTTTTTTT..",
    ".TTTTTTTTTTTTTT.",
    "..DDDDDDDDDDDD..",
    "..DDLLLDDDDDDD..",
    "..DDLLLDDTTDDD..",
    "..DDDDDDDTTDDD..",
    "..DDDDDDDTTDDD..",
    "..DDDDDDDTTDDD..",
  ];
  const draw = (rows: string[], ox: number, oy: number, s: number, k: string) =>
    rows.flatMap((row, y) =>
      row.split("").map((c, x) =>
        pal[c] ? (
          <rect key={`${k}-${x}-${y}`} x={ox + x * s} y={oy + y * s} width={s} height={s} fill={pal[c]} />
        ) : null
      )
    );
  const prints = [
    [42, 148], [58, 141], [76, 137], [92, 130], [110, 126], [124, 119], [134, 114],
  ];
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="ForestC-dotsWide" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.9" fill="#4fd1a5" />
        </pattern>
        <pattern id="ForestC-dotsCore" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.7" fill="#4fd1a5" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="80" rx="106" ry="60" fill="url(#ForestC-dotsWide)" opacity="0.28" />
      <ellipse cx="128" cy="78" rx="56" ry="36" fill="url(#ForestC-dotsCore)" opacity="0.36" />
      <g shapeRendering="crispEdges">
        <rect x="40" y="106" width="180" height="4" fill="#1d4f42" />
        <rect x="104" y="110" width="26" height="3" fill="#2f9c7c" />
        {draw(cabin, 90, 36, 5, "cabin")}
        <rect x="150" y="26" width="6" height="6" fill="#2f7d68" />
        <rect x="158" y="17" width="5" height="5" fill="#2f7d68" />
        <rect x="165" y="9" width="4" height="4" fill="#2f7d68" />
        {prints.map(([x, y], i) => (
          <rect key={`fp${i}`} x={x} y={y} width="5" height="3" fill="#2f9c7c" />
        ))}
        <rect x="46" y="34" width="3" height="3" fill="#2f9c7c" />
        <rect x="214" y="40" width="3" height="3" fill="#2f9c7c" />
        <rect x="112" y="83" width="2" height="2" fill="#ffffff" />
        <rect x="60" y="22" width="2" height="2" fill="#ffffff" />
      </g>
    </svg>
  );
}

/* ── Explosion ── */

/* BlastA — Three-Frame Filmstrip: a sprocketed filmstrip shows spark, then
   burst, then smoke in three left-to-right cells. */
export function BlastA() {
  const holes = Array.from({ length: 16 }, (_, i) => 26 + i * 13.5);
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="BlastA-dotsWide" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.9" fill="#ffb347" />
        </pattern>
        <pattern id="BlastA-dotsCore" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.7" fill="#ffb347" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="80" rx="118" ry="66" fill="url(#BlastA-dotsWide)" opacity="0.28" />
      <ellipse cx="130" cy="80" rx="70" ry="50" fill="url(#BlastA-dotsCore)" opacity="0.36" />
      <rect x="20" y="42" width="220" height="76" rx="3" fill="#1f1b18" />
      {holes.map((x, i) => (
        <g key={`h${i}`}>
          <rect x={x} y="46" width="6" height="5" rx="1" fill="#0d0d10" />
          <rect x={x} y="109" width="6" height="5" rx="1" fill="#0d0d10" />
        </g>
      ))}
      <rect x="32" y="55" width="60" height="50" fill="#0f0d0c" />
      <rect x="100" y="55" width="60" height="50" fill="#0f0d0c" />
      <rect x="168" y="55" width="60" height="50" fill="#0f0d0c" />
      <path d="M62 68 L65 77 L74 80 L65 83 L62 92 L59 83 L50 80 L59 77 Z" fill="#ffb347" />
      <polygon
        points="130,58 133.8,70.8 145.6,64.4 139.2,76.2 152,80 139.2,83.8 145.6,95.6 133.8,89.2 130,102 126.2,89.2 114.4,95.6 120.8,83.8 108,80 120.8,76.2 114.4,64.4 126.2,70.8"
        fill="#ff8a3d"
      />
      <circle cx="130" cy="80" r="11" fill="#ffb347" />
      <circle cx="130" cy="80" r="6" fill="#ffe3b3" />
      <circle cx="190" cy="86" r="11" fill="#6b3a1f" />
      <circle cx="205" cy="84" r="12" fill="#6b3a1f" />
      <circle cx="197" cy="73" r="10" fill="#7d4524" />
      <rect x="182" y="64" width="4" height="4" fill="#ffb347" />
      <rect x="213" y="66" width="3" height="3" fill="#ff8a3d" />
      <rect x="209" y="97" width="3" height="3" fill="#ffb347" />
      <rect x="60.5" y="78.5" width="3" height="3" fill="#ffffff" />
      <rect x="140" y="64" width="2" height="2" fill="#ffffff" />
    </svg>
  );
}

/* BlastB — Exploded Cube: a 2×2×2 block flies apart into evenly spaced
   isometric cubes with a burst flaring through the gaps. */
export function BlastB() {
  const cube = (x: number, y: number, k: string) => (
    <g key={k}>
      <polygon points={`${x},${y} ${x + 19},${y + 11} ${x},${y + 22} ${x - 19},${y + 11}`} fill="#ffe3b3" />
      <polygon points={`${x - 19},${y + 11} ${x},${y + 22} ${x},${y + 44} ${x - 19},${y + 33}`} fill="#ffb347" />
      <polygon points={`${x},${y + 22} ${x + 19},${y + 11} ${x + 19},${y + 33} ${x},${y + 44}`} fill="#c75a24" />
    </g>
  );
  const order: [number, number][] = [
    [162, 79],
    [98, 79],
    [130, 23],
    [130, 98],
    [162, 42],
    [98, 42],
    [130, 61],
  ];
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="BlastB-dotsWide" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.9" fill="#ffb347" />
        </pattern>
        <pattern id="BlastB-dotsCore" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.7" fill="#ffb347" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="84" rx="106" ry="62" fill="url(#BlastB-dotsWide)" opacity="0.28" />
      <ellipse cx="130" cy="84" rx="60" ry="42" fill="url(#BlastB-dotsCore)" opacity="0.36" />
      <path d="M130 18 L134 78 L202 82 L134 86 L130 150 L126 86 L58 82 L126 78 Z" fill="#ff8a3d" />
      {order.map(([x, y], i) => cube(x, y, `c${i}`))}
      <rect x="44" y="40" width="6" height="6" fill="#ff8a3d" />
      <rect x="212" y="36" width="5" height="5" fill="#ffb347" />
      <rect x="40" y="116" width="5" height="5" fill="#ffb347" />
      <rect x="214" y="112" width="6" height="6" fill="#ff8a3d" />
      <rect x="86" y="66" width="3" height="3" fill="#ffffff" />
      <rect x="215" y="38" width="2" height="2" fill="#ffffff" />
    </svg>
  );
}

/* BlastC — Mushroom Plume: a layered cap, stem, condensation collar and dust
   skirt make the unmistakable mushroom-cloud silhouette. */
export function BlastC() {
  const cap: [number, number, number][] = [
    [130, 48, 22],
    [106, 58, 16],
    [154, 58, 16],
    [88, 68, 11],
    [172, 68, 11],
    [118, 40, 14],
    [144, 40, 13],
  ];
  const skirt: [number, number, number][] = [
    [98, 130, 10],
    [114, 125, 12],
    [130, 122, 12],
    [146, 125, 12],
    [162, 130, 10],
  ];
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="BlastC-dotsWide" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.9" fill="#ffb347" />
        </pattern>
        <pattern id="BlastC-dotsCore" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.7" fill="#ffb347" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="80" rx="108" ry="64" fill="url(#BlastC-dotsWide)" opacity="0.28" />
      <ellipse cx="130" cy="62" rx="66" ry="40" fill="url(#BlastC-dotsCore)" opacity="0.36" />
      <ellipse cx="130" cy="138" rx="66" ry="4" fill="#6b3a1f" />
      <path d="M116 80 C119 98 114 114 106 128 L154 128 C146 114 141 98 144 80 Z" fill="#ff8a3d" />
      <ellipse cx="130" cy="100" rx="32" ry="6" fill="none" stroke="#ffe3b3" strokeWidth="3" />
      {skirt.map(([cx, cy, r], i) => (
        <circle key={`s${i}`} cx={cx} cy={cy} r={r} fill="#c75a24" />
      ))}
      {cap.map(([cx, cy, r], i) => (
        <circle key={`c${i}`} cx={cx} cy={cy} r={r} fill="#ffb347" />
      ))}
      <ellipse cx="130" cy="77" rx="46" ry="6" fill="#c75a24" />
      <circle cx="118" cy="36" r="6" fill="#ffe3b3" />
      <circle cx="142" cy="40" r="4" fill="#ffe3b3" />
      <circle cx="104" cy="54" r="4" fill="#ffe3b3" />
      <rect x="68" y="98" width="5" height="5" fill="#ffb347" />
      <rect x="186" y="94" width="4" height="4" fill="#ff8a3d" />
      <rect x="150" y="50" width="3" height="3" fill="#ffffff" />
      <rect x="134" y="108" width="2" height="2" fill="#ffffff" />
    </svg>
  );
}

/* ── Planck to Now ── */

/* PlanckA — First Instant: a scrub knob parked at the very start of the
   timeline sits under a single flaring spark shedding its first particles. */
export function PlanckA() {
  const bits: [number, number, number, string][] = [
    [70, 40, 5, "#a98cff"],
    [84, 86, 4, "#5b3fc4"],
    [180, 38, 4, "#a98cff"],
    [192, 84, 6, "#a98cff"],
    [60, 70, 3, "#5b3fc4"],
    [204, 58, 3, "#a98cff"],
    [100, 24, 3, "#5b3fc4"],
    [166, 100, 4, "#5b3fc4"],
  ];
  const ticks = [70, 100, 130, 160, 190];
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="PlanckA-dotsWide" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.9" fill="#a98cff" />
        </pattern>
        <pattern id="PlanckA-dotsCore" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.7" fill="#a98cff" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="64" rx="96" ry="50" fill="url(#PlanckA-dotsWide)" opacity="0.28" />
      <ellipse cx="130" cy="64" rx="48" ry="30" fill="url(#PlanckA-dotsCore)" opacity="0.38" />
      <polygon points="104,36 130,57 156,36 135,62 156,88 130,67 104,88 125,62" fill="#5b3fc4" />
      <path d="M130 22 L135 57 L172 62 L135 67 L130 104 L125 67 L88 62 L125 57 Z" fill="#a98cff" />
      <circle cx="130" cy="62" r="8" fill="#e4dbff" />
      {bits.map(([x, y, s, c], i) => (
        <rect key={`b${i}`} x={x} y={y} width={s} height={s} fill={c} />
      ))}
      <rect x="40" y="128" width="180" height="4" rx="2" fill="#2a2340" />
      {ticks.map((x) => (
        <rect key={`t${x}`} x={x} y="119" width="2" height="5" fill="#5b3fc4" />
      ))}
      <rect x="40" y="128" width="12" height="4" rx="2" fill="#a98cff" />
      <circle cx="52" cy="130" r="7" fill="#a98cff" stroke="#0d0d10" strokeWidth="3" />
      <circle cx="52" cy="130" r="2.5" fill="#e4dbff" />
      <rect x="143" y="48" width="3" height="3" fill="#ffffff" />
      <rect x="194" y="86" width="2" height="2" fill="#ffffff" />
    </svg>
  );
}

/* PlanckB — Galaxies Ignite: the scrub knob sits mid-timeline beneath a bold
   two-arm spiral galaxy, marking the era when structure formed. */
export function PlanckB() {
  const stars: [number, number, number][] = [
    [58, 34, 3],
    [206, 30, 4],
    [72, 96, 3],
    [196, 98, 3],
    [44, 64, 2],
    [220, 66, 3],
  ];
  const ticks = [70, 100, 130, 160, 190];
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="PlanckB-dotsWide" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.9" fill="#a98cff" />
        </pattern>
        <pattern id="PlanckB-dotsCore" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.7" fill="#a98cff" />
        </pattern>
      </defs>
      <ellipse cx="130" cy="64" rx="98" ry="50" fill="url(#PlanckB-dotsWide)" opacity="0.28" />
      <ellipse cx="130" cy="66" rx="50" ry="30" fill="url(#PlanckB-dotsCore)" opacity="0.38" />
      <g transform="rotate(-18 130 66)">
        <circle cx="130" cy="66" r="15" fill="#5b3fc4" />
        <path
          d="M130 66 C118 50 150 40 168 54 C180 64 172 80 158 82"
          fill="none"
          stroke="#a98cff"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M130 66 C142 82 110 92 92 78 C80 68 88 52 102 50"
          fill="none"
          stroke="#a98cff"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="130" cy="66" r="9" fill="#e4dbff" />
      </g>
      {stars.map(([x, y, s], i) => (
        <rect key={`s${i}`} x={x} y={y} width={s} height={s} fill="#a98cff" />
      ))}
      <rect x="40" y="128" width="180" height="4" rx="2" fill="#2a2340" />
      {ticks.map((x) => (
        <rect key={`t${x}`} x={x} y="119" width="2" height="5" fill="#5b3fc4" />
      ))}
      <rect x="40" y="128" width="90" height="4" rx="2" fill="#a98cff" />
      <circle cx="130" cy="130" r="7" fill="#a98cff" stroke="#0d0d10" strokeWidth="3" />
      <circle cx="130" cy="130" r="2.5" fill="#e4dbff" />
      <rect x="160" y="48" width="3" height="3" fill="#ffffff" />
      <rect x="207" y="31" width="2" height="2" fill="#ffffff" />
    </svg>
  );
}

/* PlanckC — Worlds Form: with the knob scrubbed near the end, a lit ringed
   planet and its small moon mark the late era of planets. */
export function PlanckC() {
  const stars: [number, number, number][] = [
    [56, 36, 3],
    [214, 90, 3],
    [70, 98, 4],
    [44, 70, 2],
    [226, 56, 3],
  ];
  const ticks = [70, 100, 130, 160, 190];
  return (
    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="PlanckC-dotsWide" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.9" fill="#a98cff" />
        </pattern>
        <pattern id="PlanckC-dotsCore" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.7" fill="#a98cff" />
        </pattern>
        <clipPath id="PlanckC-planet">
          <circle cx="130" cy="64" r="24" />
        </clipPath>
      </defs>
      <ellipse cx="130" cy="64" rx="98" ry="50" fill="url(#PlanckC-dotsWide)" opacity="0.28" />
      <ellipse cx="130" cy="64" rx="52" ry="32" fill="url(#PlanckC-dotsCore)" opacity="0.38" />
      <g transform="rotate(-14 130 64)">
        <ellipse cx="130" cy="64" rx="46" ry="11" fill="none" stroke="#e4dbff" strokeWidth="4" />
        <circle cx="130" cy="64" r="24" fill="#5b3fc4" />
        <circle cx="122" cy="57" r="24" fill="#a98cff" clipPath="url(#PlanckC-planet)" />
        <path d="M84 64 A46 11 0 0 0 176 64" fill="none" stroke="#e4dbff" strokeWidth="4" />
      </g>
      <circle cx="194" cy="38" r="5" fill="#e4dbff" />
      {stars.map(([x, y, s], i) => (
        <rect key={`s${i}`} x={x} y={y} width={s} height={s} fill="#a98cff" />
      ))}
      <rect x="40" y="128" width="180" height="4" rx="2" fill="#2a2340" />
      {ticks.map((x) => (
        <rect key={`t${x}`} x={x} y="119" width="2" height="5" fill="#5b3fc4" />
      ))}
      <rect x="40" y="128" width="156" height="4" rx="2" fill="#a98cff" />
      <circle cx="196" cy="130" r="7" fill="#a98cff" stroke="#0d0d10" strokeWidth="3" />
      <circle cx="196" cy="130" r="2.5" fill="#e4dbff" />
      <rect x="116" y="50" width="3" height="3" fill="#ffffff" />
      <rect x="57" y="37" width="2" height="2" fill="#ffffff" />
    </svg>
  );
}

/* ── Round wiring ── */

const RAFT_FOUR_ROUND: readonly { id: string; topline: string; Mark?: () => ReactElement }[] = [
  { id: "current", topline: "current · shift-register ripple", Mark: INCUMBENT_MARKS.raft },
  { id: "a", topline: "candidate a · heartbeat ring", Mark: RaftA },
  { id: "b", topline: "candidate b · split-brain partition", Mark: RaftB },
  { id: "c", topline: "candidate c · committed across replicas", Mark: RaftC },
  { id: "d", topline: "candidate d · crowned broadcast", Mark: RaftD },
  { id: "e", topline: "candidate e · log replication", Mark: RaftE },
  { id: "f", topline: "candidate f · majority partition", Mark: RaftF },
];

const FOREST_FOUR_ROUND: readonly { id: string; topline: string; Mark?: () => ReactElement }[] = [
  { id: "current", topline: "current · dusk treeline", Mark: INCUMBENT_MARKS.fox },
  { id: "a", topline: "candidate a · lantern walker", Mark: ForestA },
  { id: "b", topline: "candidate b · fork signpost & fireflies", Mark: ForestB },
  { id: "c", topline: "candidate c · footprints home", Mark: ForestC },
  { id: "d", topline: "candidate d · lone pine walk", Mark: ForestD },
  { id: "e", topline: "candidate e · creek log-bridge", Mark: ForestE },
  { id: "f", topline: "candidate f · fox on the trail", Mark: ForestF },
];

const BLAST_FOUR_ROUND: readonly { id: string; topline: string; Mark?: () => ReactElement }[] = [
  { id: "current", topline: "current · radial shatter", Mark: INCUMBENT_MARKS.blast },
  { id: "a", topline: "candidate a · three-frame filmstrip", Mark: BlastA },
  { id: "b", topline: "candidate b · exploded cube", Mark: BlastB },
  { id: "c", topline: "candidate c · mushroom plume", Mark: BlastC },
  { id: "d", topline: "candidate d · sprite strip", Mark: BlastD },
  { id: "e", topline: "candidate e · puffball peak", Mark: BlastE },
  { id: "f", topline: "candidate f · ground dome", Mark: BlastF },
];

const PLANCK_FOUR_ROUND: readonly { id: string; topline: string; Mark?: () => ReactElement }[] = [
  { id: "current", topline: "current · epoch ripples", Mark: INCUMBENT_MARKS.spiral },
  { id: "a", topline: "candidate a · first instant", Mark: PlanckA },
  { id: "b", topline: "candidate b · galaxies ignite", Mark: PlanckB },
  { id: "c", topline: "candidate c · worlds form", Mark: PlanckC },
  { id: "d", topline: "candidate d · cmb sky map", Mark: PlanckD },
  { id: "e", topline: "candidate e · galaxy era", Mark: PlanckE },
  { id: "f", topline: "candidate f · recombination", Mark: PlanckF },
];

export function FourProjectRethinkSection({ projects }: FourProjectRethinkProps) {
  return (
    <>
      <RoundSection
        label="card-art rethink · raft"
        name="raft cluster · six mechanisms"
        projectId="raft-cluster"
        thesis="Eighteen raw candidates from two relay batches, six per project, drawn with full subject autonomy. The raft set: election timers wearing down on a heartbeat ring, a split-brain partition with an orphaned minority, three replicas sharing one committed band, a crowned hub broadcasting, aligned logs with a commit-index bar, and a majority/minority fault line. The card copy is the visual contract: crash the leader and watch elections answer."
        round={RAFT_FOUR_ROUND}
        projects={projects}
      />
      <RoundSection
        label="card-art rethink · evening forest"
        name="evening forest · six walks"
        projectId="evening-forest"
        thesis="Six no-missions dusk scenes from two relay batches — deliberate 8-bit pixel art (the copy promises an 8-bit woodland): a lantern lighting a patch of trail, a fork in the path with fireflies, footprints leading to a lit cabin, a lone pine walk, a log-bridge balance over a creek, and a fox trotting between fern and mushrooms."
        round={FOREST_FOUR_ROUND}
        projects={projects}
      />
      <RoundSection
        label="card-art rethink · explosion"
        name="explosion · six frames of chaos"
        projectId="explosion"
        thesis="Order breaking into precision chaos, six ways from two relay batches: a filmstrip of spark-burst-smoke frames, a tidy isometric exploded cube, a layered mushroom plume, an ordered three-frame sprite strip, a stacked puffball at peak with tumbling chunks, and a ground dome lobbing debris on dotted arcs."
        round={BLAST_FOUR_ROUND}
        projects={projects}
      />
      <RoundSection
        label="card-art rethink · planck to now"
        name="planck to now · one timeline, six moments"
        projectId="planck-to-now"
        round={PLANCK_FOUR_ROUND}
        projects={projects}
        thesis="The scrub timeline as the mark itself, six moments from two relay batches: the knob parked at the first instant under a flaring spark, mid-history beneath a two-arm spiral galaxy, a ringed planet and its moon near the end, the CMB all-sky map with a playhead, the galaxy era over a timeline track, and recombination — a playhead parting plasma fog as a freed photon escapes."
      />
    </>
  );
}
