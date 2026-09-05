// Ashen Mode art-direction round: the incumbent control card plus N candidate
// directions. Every scene is a 320x180 game still drawn to one shared layer
// grammar (sky → sun → clouds → far/mid/near city → ground → knight →
// pickups → atmosphere) so the cards compare side by side.

import type { ReactElement } from "react";

export type AshenVariant = {
  id: string;
  label: string;
  name: string;
  mood: string;
  gameplay: string;
  differentiators: string;
  palette: readonly string[];
  Scene: () => ReactElement;
};

const INK = "#17130f";

// The incumbent: Dark Souls v2 as shipped — slate dusk sky melting into an
// ash-rose horizon, a colossal gothic castle-city in three mist-faded
// silhouette layers with smoldering ember windows, a dying white sun, dark
// stone ground, falling ash, a bone knight with ember eyes, soul wisps and
// ember stars.
export function AshenBaselineScene() {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-label="Current Ashen Mode still" focusable="false">
      <defs>
        <linearGradient id="ashen-base-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d4a5f" />
          <stop offset="0.55" stopColor="#78889f" />
          <stop offset="1" stopColor="#b48f85" />
        </linearGradient>
      </defs>

      {/* sky + dying sun */}
      <rect x="0" y="0" width="320" height="180" fill="url(#ashen-base-sky)" />
      <circle cx="228" cy="112" r="26" fill="#c8d2dd" opacity="0.5" />
      <circle cx="228" cy="112" r="15" fill="#eaf0f6" />

      {/* streaky ember-lit clouds */}
      <rect x="20" y="34" width="88" height="7" rx="3.5" fill="#4f5c70" />
      <rect x="150" y="22" width="70" height="6" rx="3" fill="#4f5c70" />
      <rect x="36" y="42" width="60" height="4" rx="2" fill="#e8a878" opacity="0.55" />

      {/* castle-city, three mist-faded layers */}
      <g fill="#8a929f">
        <rect x="18" y="92" width="16" height="56" />
        <rect x="30" y="78" width="12" height="70" />
        <polygon points="36,60 24,78 48,78" />
        <rect x="86" y="98" width="18" height="50" />
        <rect x="188" y="96" width="14" height="52" />
        <polygon points="195,78 184,96 206,96" />
        <rect x="268" y="88" width="16" height="60" />
        <rect x="280" y="102" width="12" height="46" />
        <polygon points="286,84 274,102 298,102" />
      </g>
      <g fill="#5d6a7c">
        <rect x="0" y="112" width="30" height="36" />
        <rect x="58" y="104" width="20" height="44" />
        <polygon points="68,86 54,104 82,104" />
        <rect x="120" y="116" width="26" height="32" />
        <rect x="152" y="108" width="16" height="40" />
        <rect x="246" y="112" width="24" height="36" />
        <polygon points="258,94 244,112 272,112" />
      </g>
      <g fill="#ffe09a">
        <rect x="63" y="112" width="3" height="4.5" />
        <rect x="71" y="122" width="3" height="4.5" />
        <rect x="127" y="124" width="3" height="4.5" />
        <rect x="137" y="132" width="3" height="4.5" />
        <rect x="251" y="120" width="3" height="4.5" />
        <rect x="259" y="128" width="3" height="4.5" />
        <rect x="90" y="108" width="3" height="4.5" opacity="0.8" />
        <rect x="192" y="106" width="3" height="4.5" opacity="0.8" />
      </g>
      <g fill="#323b49">
        <rect x="0" y="132" width="46" height="16" />
        <rect x="96" y="128" width="70" height="20" />
        <rect x="176" y="134" width="52" height="14" />
        <rect x="238" y="130" width="82" height="18" />
      </g>

      {/* dark stone ground */}
      <rect x="0" y="148" width="320" height="32" fill="#3a3835" />
      <rect x="0" y="148" width="320" height="3.5" fill="#67645f" />
      <g fill="#d98a4e" opacity="0.5">
        <circle cx="40" cy="158" r="1.1" />
        <circle cx="118" cy="164" r="1.1" />
        <circle cx="210" cy="159" r="1.1" />
        <circle cx="282" cy="166" r="1.1" />
      </g>

      {/* iron crate obstacle */}
      <g stroke={INK} strokeWidth="1.4" strokeLinejoin="round">
        <rect x="132" y="130" width="16" height="18" fill="#3a302c" />
        <line x1="132" y1="136" x2="148" y2="136" />
        <line x1="140" y1="130" x2="140" y2="148" />
      </g>
      <circle cx="136" cy="133" r="1" fill="#d4b48c" />
      <circle cx="144" cy="133" r="1" fill="#d4b48c" />

      {/* star pickup with glow */}
      <circle cx="196" cy="106" r="8.5" fill="#cf6d1c" opacity="0.3" />
      <polygon
        points="196,100.5 197.6,104.2 201.6,104.5 198.5,107.1 199.5,111 196,108.8 192.5,111 193.5,107.1 190.4,104.5 194.4,104.2"
        fill="#f2b03e"
      />

      {/* soul wisp */}
      <circle cx="248" cy="94" r="7" fill="#b7d3f2" opacity="0.3" />
      <circle cx="248" cy="94" r="3" fill="#e6f1ff" />

      {/* the ashen knight */}
      <g stroke={INK} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        <path d="M60 130 L54 148 L74 148 L68 130 Z" fill="#522a1e" />
        <rect x="62.5" y="120" width="3.5" height="14" fill="#e8e1d2" />
        <rect x="67" y="120" width="3.5" height="14" fill="#e8e1d2" />
        <rect x="60.5" y="112" width="12" height="10" rx="2.5" fill="#e8e1d2" />
        <polygon points="61.5,109 62.5,103.5 65,109" fill="#e8e1d2" />
        <polygon points="68,109 70.5,103.5 71.8,109" fill="#e8e1d2" />
        <path d="M59.5 113 A6.5 6.5 0 0 1 73.5 113 Z" fill="#6a6d72" />
        <rect x="61.5" y="115.5" width="10" height="4" rx="1" fill="#3d4045" stroke="none" />
        <rect x="63" y="116.8" width="7" height="1.4" fill={INK} stroke="none" />
        <circle cx="65.4" cy="117.5" r="0.6" fill="#e07a34" stroke="none" />
        <circle cx="67.6" cy="117.5" r="0.6" fill="#e07a34" stroke="none" />
        <line x1="76" y1="146" x2="84" y2="100" strokeWidth="2" />
        <line x1="82" y1="104" x2="86" y2="104" strokeWidth="1.6" />
      </g>

      {/* falling ash */}
      <g fill="#c9c1b6">
        <circle cx="30" cy="20" r="1.2" opacity="0.7" />
        <circle cx="104" cy="52" r="1" opacity="0.5" />
        <circle cx="176" cy="30" r="1.2" opacity="0.65" />
        <circle cx="258" cy="46" r="1" opacity="0.5" />
        <circle cx="296" cy="24" r="1.2" opacity="0.7" />
        <circle cx="62" cy="70" r="1" opacity="0.45" />
        <circle cx="142" cy="78" r="1" opacity="0.4" />
        <circle cx="222" cy="66" r="1" opacity="0.5" />
      </g>
    </svg>
  );
}

export const ASHEN_BASELINE: AshenVariant = {
  id: "base",
  label: "incumbent",
  name: "Ashen Dusk (current)",
  mood:
    "The shipped Dark Souls v2 look: a slate dusk sky melting into an ash-rose horizon, a colossal gothic castle-city in three mist-faded silhouette layers, smoldering ember windows, a dying white sun, falling ash. Value does the storytelling — deep slate overhead, one lit horizon, a bone knight as the brightest solid thing on screen.",
  gameplay:
    "Steady pastel-runner pacing reskinned: jump and double jump, bullet-time dash rolls, iron crates, soul wisps to chain, ember stars for the combo. The lament soundtrack crawls at 58-66 bpm while the run itself stays quick — the one place mood and mechanics disagree.",
  differentiators:
    "The control every candidate is judged against: keep what works (menu layout, souls economy, the stars) and judge each direction by what it changes — and whether its changes make the run feel authored, not just re-lit.",
  palette: ["#3d4a5f", "#78889f", "#b48f85", "#eaf0f6", "#e8863c", "#f2b03e", "#3a3835", "#e8e1d2"],
  Scene: AshenBaselineScene,
};

// --- candidate scenes -------------------------------------------------------

export function AshenFrost() {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="frost-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2440" />
          <stop offset="0.55" stopColor="#4a6a8f" />
          <stop offset="1" stopColor="#b9cfdc" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#frost-sky)" />
      <circle cx="252" cy="50" r="15" fill="#eef5fb" />
      <circle cx="246" cy="46" r="3.5" fill="#d3e1ec" />
      <ellipse cx="60" cy="42" rx="42" ry="5" fill="#7d94ad" />
      <ellipse cx="205" cy="72" rx="58" ry="5" fill="#6f86a1" />
      <ellipse cx="295" cy="28" rx="28" ry="4" fill="#8aa1b8" />
      <path d="M0 112V82L10 64L20 82V98H36V72L46 50L56 72V98H88V86L98 66L108 86V98H130V78L142 54L154 78V98H190V90L200 70L210 90V98H236V74L248 48L260 74V98H290V84L300 66L310 84V98H320V112Z" fill="#6f86a1" />
      <path d="M0 132V104L14 88L28 104V118H60V96L72 76L84 96V118H110V108L120 90L130 108V118H166V100L180 80L194 100V118H222V110L232 94L242 110V118H270V98L284 72L298 98V118H320V132Z" fill="#46587a" />
      <polygon points="66,118 70,118 68,127" fill="#b9d6ea" />
      <polygon points="186,118 190,118 188,128" fill="#b9d6ea" />
      <path d="M0 150V120L8 108L16 120V136H40V116L52 100L64 116V136H96V124L104 112L112 124V136H150V120L164 96L178 120V136H216V128L226 114L236 128V136H268V118L282 98L296 118V136H320V150Z" fill="#263248" />
      <rect x="121" y="127" width="2" height="21" fill="#1a2233" />
      <rect x="118" y="121" width="8" height="7" rx="1" fill="#1a2233" />
      <rect x="119.5" y="122.5" width="5" height="4" fill="#bfe3ff" />
      <rect x="50" y="120" width="4" height="7" fill="#bfe3ff" />
      <rect x="162" y="116" width="4" height="8" fill="#bfe3ff" />
      <rect x="282" y="116" width="4" height="8" fill="#bfe3ff" />
      <rect x="72" y="98" width="3" height="5" fill="#8fc4ea" />
      <rect x="284" y="96" width="3" height="5" fill="#8fc4ea" />
      <rect x="0" y="148" width="320" height="4" fill="#e3ecf3" />
      <rect x="0" y="152" width="320" height="28" fill="#4d5d70" />
      <ellipse cx="30" cy="150" rx="30" ry="3" fill="#f4f8fb" />
      <ellipse cx="290" cy="150" rx="34" ry="3" fill="#f4f8fb" />
      <rect x="228" y="148" width="56" height="5" fill="#8ec6e8" />
      <rect x="194" y="146" width="22" height="3" fill="#3d5a70" />
      <polygon points="196,146 199,132 205,138 209,127 214,146" fill="#9fd0ea" />
      <polygon points="199,132 205,138 203,146 198,146" fill="#e8f7ff" />
      <circle cx="140" cy="105" r="9" fill="#a8d8f0" fillOpacity="0.45" />
      <polygon points="140,99 141.5,103 145.7,103.2 142.4,105.8 143.5,109.9 140,107.5 136.5,109.9 137.6,105.8 134.3,103.2 138.5,103" fill="#fff4cf" />
      <circle cx="105" cy="117" r="8" fill="#b7d3f2" fillOpacity="0.5" />
      <path d="M105 122C100 117 100.5 111.5 105 114.5C109.5 111.5 110 117 105 122Z" fill="#eaf6ff" />
      <line x1="53" y1="121" x2="61" y2="134" stroke="#8b98a8" strokeWidth="1.6" />
      <path d="M57 128L49 147L58 145L59 131Z" fill="#3a4f7a" />
      <rect x="56.5" y="138" width="3.2" height="10" fill="#dfe6ee" />
      <rect x="61.5" y="138" width="3.2" height="10" fill="#dfe6ee" />
      <rect x="55.5" y="128" width="10" height="11" rx="1.5" fill="#5b6b82" />
      <rect x="55.5" y="134" width="10" height="1.6" fill="#8b98a8" />
      <rect x="56" y="121.5" width="9.5" height="8" rx="2.5" fill="#8b98a8" />
      <rect x="58.5" y="124.5" width="7.5" height="2" fill="#1a2233" />
      <circle cx="60.5" cy="125.5" r="0.8" fill="#ffd27a" />
      <circle cx="63.5" cy="125.5" r="0.8" fill="#ffd27a" />
      <rect x="64" y="130" width="3" height="7" rx="1" fill="#dfe6ee" />
      <circle cx="70" cy="139" r="8" fill="#ffd27a" fillOpacity="0.3" />
      <rect x="68" y="136" width="4" height="6" rx="1" fill="#ffd27a" />
      <line x1="66" y1="136" x2="70" y2="136" stroke="#1a2233" strokeWidth="1" />
      <circle cx="20" cy="20" r="1.4" fill="#ffffff" />
      <circle cx="70" cy="62" r="1.2" fill="#ffffff" />
      <circle cx="130" cy="30" r="1.6" fill="#ffffff" />
      <circle cx="182" cy="86" r="1.2" fill="#ffffff" />
      <circle cx="240" cy="18" r="1.4" fill="#ffffff" />
      <circle cx="302" cy="72" r="1.2" fill="#ffffff" />
      <circle cx="92" cy="112" r="1.5" fill="#ffffff" />
      <circle cx="270" cy="112" r="1.3" fill="#ffffff" />
    </svg>
  );
}

export function AshenEmber() {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ember-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a0d0d" />
          <stop offset="0.6" stopColor="#8a2418" />
          <stop offset="1" stopColor="#f28a3a" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#ember-sky)" />
      <circle cx="92" cy="80" r="24" fill="#ff6f3a" />
      <circle cx="92" cy="80" r="14" fill="#ffb27a" />
      <ellipse cx="40" cy="30" rx="46" ry="8" fill="#1b0f0d" />
      <ellipse cx="210" cy="50" rx="60" ry="9" fill="#2a1614" />
      <ellipse cx="300" cy="24" rx="30" ry="6" fill="#1b0f0d" />
      <path d="M0 112V82L10 64L20 82V98H36V72L46 50L56 72V98H88V86L98 66L108 86V98H130V78L142 54L154 78V98H190V90L200 70L210 90V98H236V74L248 48L260 74V98H290V84L300 66L310 84V98H320V112Z" fill="#5a2a22" />
      <path d="M0 132V104L14 88L28 104V118H60V96L72 76L84 96V118H110V108L120 90L130 108V118H166V100L180 80L194 100V118H222V110L232 94L242 110V118H270V98L284 72L298 98V118H320V132Z" fill="#3b1a15" />
      <polygon points="10,132 22,84 34,90 30,132" fill="#2a1210" />
      <polygon points="36,100 44,96 46,104 38,108" fill="#2a1210" />
      <path d="M0 150V120L8 108L16 120V136H40V116L52 100L64 116V136H96V124L104 112L112 124V136H150V120L164 96L178 120V136H216V128L226 114L236 128V136H268V118L282 98L296 118V136H320V150Z" fill="#1f0d0b" />
      <rect x="50" y="120" width="4" height="7" fill="#ffb347" />
      <rect x="162" y="116" width="4" height="8" fill="#ffb347" />
      <rect x="282" y="116" width="4" height="8" fill="#ffb347" />
      <rect x="104" y="126" width="3" height="5" fill="#ffb347" />
      <rect x="72" y="98" width="3" height="5" fill="#ff8a3a" />
      <rect x="284" y="96" width="3" height="5" fill="#ff8a3a" />
      <rect x="0" y="148" width="320" height="4" fill="#4a2c26" />
      <rect x="0" y="152" width="320" height="28" fill="#1a0b09" />
      <rect x="8" y="148" width="30" height="32" fill="#ff7a1f" />
      <polygon points="8,150 38,150 34,164 12,168" fill="#4a2c26" />
      <path d="M100 152L112 160L108 170" stroke="#ff7a1f" strokeWidth="1.2" fill="none" />
      <path d="M250 154L262 158L258 168" stroke="#ff7a1f" strokeWidth="1.2" fill="none" />
      <rect x="196" y="130" width="18" height="18" fill="#2b1a15" />
      <polygon points="198,131 202,118 206,126 210,114 213,131" fill="#ff9a3a" />
      <polygon points="203,131 206,123 209,131" fill="#ffd070" />
      <circle cx="140" cy="105" r="9" fill="#ffb347" fillOpacity="0.45" />
      <polygon points="140,99 141.5,103 145.7,103.2 142.4,105.8 143.5,109.9 140,107.5 136.5,109.9 137.6,105.8 134.3,103.2 138.5,103" fill="#fff0c8" />
      <circle cx="105" cy="117" r="8" fill="#8fbfe8" fillOpacity="0.5" />
      <path d="M105 122C100 117 100.5 111.5 105 114.5C109.5 111.5 110 117 105 122Z" fill="#cfe9ff" />
      <path d="M57 128L49 147L58 145L59 131Z" fill="#7a1e14" />
      <rect x="56.5" y="138" width="3.2" height="10" fill="#e0c9b5" />
      <rect x="61.5" y="138" width="3.2" height="10" fill="#e0c9b5" />
      <rect x="55.5" y="128" width="10" height="11" rx="1.5" fill="#4a3a36" />
      <rect x="55.5" y="134" width="10" height="1.6" fill="#6a5a56" />
      <rect x="56" y="121.5" width="9.5" height="8" rx="2.5" fill="#6a5a56" />
      <rect x="58.5" y="124.5" width="7.5" height="2" fill="#140806" />
      <circle cx="60.5" cy="125.5" r="0.8" fill="#ffb347" />
      <circle cx="63.5" cy="125.5" r="0.8" fill="#ffb347" />
      <rect x="64" y="130" width="3" height="7" rx="1" fill="#e0c9b5" />
      <line x1="68" y1="147" x2="68" y2="124" stroke="#6a5a56" strokeWidth="1.6" />
      <line x1="65.5" y1="131" x2="70.5" y2="131" stroke="#6a5a56" strokeWidth="1.4" />
      <circle cx="24" cy="120" r="1.3" fill="#ff9a3a" />
      <circle cx="60" cy="100" r="1" fill="#ffd070" />
      <circle cx="120" cy="140" r="1.4" fill="#ff9a3a" />
      <circle cx="160" cy="60" r="1" fill="#ffd070" />
      <circle cx="230" cy="120" r="1.3" fill="#ff9a3a" />
      <circle cx="270" cy="40" r="1" fill="#ffd070" />
      <circle cx="300" cy="140" r="1.4" fill="#ff9a3a" />
      <circle cx="180" cy="20" r="1" fill="#ffd070" />
    </svg>
  );
}

export function AshenBloom() {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="bloom-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfeaf0" />
          <stop offset="0.6" stopColor="#e8f0d8" />
          <stop offset="1" stopColor="#f5e9c4" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#bloom-sky)" />
      <circle cx="262" cy="38" r="22" fill="#fff3b8" fillOpacity="0.4" />
      <circle cx="262" cy="38" r="14" fill="#fff7d6" />
      <ellipse cx="70" cy="36" rx="40" ry="7" fill="#ffffff" />
      <ellipse cx="190" cy="60" rx="50" ry="6" fill="#f7fbfb" />
      <ellipse cx="300" cy="52" rx="26" ry="5" fill="#ffffff" />
      <path d="M0 112V82L10 64L20 82V98H36V72L46 50L56 72V98H88V86L98 66L108 86V98H130V78L142 54L154 78V98H190V90L200 70L210 90V98H236V74L248 48L260 74V98H290V84L300 66L310 84V98H320V112Z" fill="#8aa78f" />
      <path d="M0 132V104L14 88L28 104V118H60V96L72 76L84 96V118H110V108L120 90L130 108V118H166V100L180 80L194 100V118H222V110L232 94L242 110V118H270V98L284 72L298 98V118H320V132Z" fill="#5c8462" />
      <polygon points="60,96 72,76 84,96" fill="#6fb59c" />
      <polygon points="270,98 284,72 298,98" fill="#6fb59c" />
      <path d="M0 150V120L8 108L16 120V136H40V116L52 100L64 116V136H96V124L104 112L112 124V136H150V120L164 96L178 120V136H216V128L226 114L236 128V136H268V118L282 98L296 118V136H320V150Z" fill="#33573f" />
      <path d="M52 100C58 112 46 122 54 136" stroke="#2e7d4f" strokeWidth="1.5" fill="none" />
      <path d="M164 96C170 108 158 120 166 136" stroke="#2e7d4f" strokeWidth="1.5" fill="none" />
      <rect x="96" y="118" width="40" height="4" fill="#3d6b46" />
      <rect x="96" y="116" width="40" height="2.5" fill="#7fbb5a" />
      <rect x="212" y="92" width="34" height="4" fill="#3d6b46" />
      <rect x="212" y="90" width="34" height="2.5" fill="#7fbb5a" />
      <circle cx="100" cy="114" r="1.8" fill="#e98fb0" />
      <circle cx="120" cy="114" r="1.8" fill="#e98fb0" />
      <circle cx="110" cy="114" r="1.8" fill="#f5d34a" />
      <circle cx="220" cy="88" r="1.8" fill="#e98fb0" />
      <circle cx="238" cy="88" r="1.8" fill="#e98fb0" />
      <circle cx="230" cy="88" r="1.8" fill="#f5d34a" />
      <rect x="0" y="148" width="320" height="4" fill="#7fbb5a" />
      <rect x="0" y="152" width="320" height="28" fill="#4a6b3a" />
      <ellipse cx="150" cy="150" rx="60" ry="2" fill="#8a6a4a" />
      <polygon points="194,148 198,136 204,142 208,130 214,140 218,148" fill="#3d2b1a" />
      <polygon points="200,148 204,144 206,148" fill="#5a3d24" />
      <circle cx="209" cy="136" r="1.6" fill="#c93a4a" />
      <circle cx="140" cy="105" r="9" fill="#fff0a0" fillOpacity="0.5" />
      <polygon points="140,99 141.5,103 145.7,103.2 142.4,105.8 143.5,109.9 140,107.5 136.5,109.9 137.6,105.8 134.3,103.2 138.5,103" fill="#ffd94a" />
      <circle cx="105" cy="117" r="8" fill="#cfeeb0" fillOpacity="0.5" />
      <path d="M105 122C100 117 100.5 111.5 105 114.5C109.5 111.5 110 117 105 122Z" fill="#f3ffd6" />
      <path d="M57 128L49 147L58 145L59 131Z" fill="#7a4a2a" />
      <rect x="56.5" y="138" width="3.2" height="10" fill="#ede3cf" />
      <rect x="61.5" y="138" width="3.2" height="10" fill="#ede3cf" />
      <rect x="55.5" y="128" width="10" height="11" rx="1.5" fill="#6a6d72" />
      <rect x="55.5" y="134" width="10" height="1.6" fill="#8f9297" />
      <polygon points="56,122.5 58.2,116.5 60.8,122.5" fill="#e8e1d2" />
      <polygon points="61.4,122.5 63.4,116.5 65.2,122.5" fill="#e8e1d2" />
      <rect x="56" y="121.5" width="9.5" height="8" rx="2.5" fill="#8f9297" />
      <rect x="58.5" y="124.5" width="7.5" height="2" fill="#2a2a30" />
      <circle cx="60.5" cy="125.5" r="0.8" fill="#ffb347" />
      <circle cx="63.5" cy="125.5" r="0.8" fill="#ffb347" />
      <rect x="64" y="130" width="3" height="7" rx="1" fill="#ede3cf" />
      <line x1="68" y1="147" x2="68" y2="124" stroke="#8f9297" strokeWidth="1.6" />
      <line x1="65.5" y1="131" x2="70.5" y2="131" stroke="#8f9297" strokeWidth="1.4" />
      <ellipse cx="30" cy="70" rx="2" ry="1" fill="#f2a7c2" />
      <ellipse cx="80" cy="90" rx="2" ry="1" fill="#f2a7c2" />
      <ellipse cx="130" cy="50" rx="2" ry="1" fill="#f2a7c2" />
      <ellipse cx="175" cy="130" rx="2" ry="1" fill="#f2a7c2" />
      <ellipse cx="230" cy="60" rx="2" ry="1" fill="#f2a7c2" />
      <ellipse cx="280" cy="30" rx="2" ry="1" fill="#f2a7c2" />
      <ellipse cx="300" cy="120" rx="2" ry="1" fill="#f2a7c2" />
      <ellipse cx="20" cy="130" rx="2" ry="1" fill="#f2a7c2" />
    </svg>
  );
}

export function AshenStorm() {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="storm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#06090f" />
          <stop offset="0.6" stopColor="#141d33" />
          <stop offset="1" stopColor="#2b3852" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#storm-sky)" />
      <circle cx="250" cy="30" r="10" fill="#8a9ab8" fillOpacity="0.3" />
      <ellipse cx="80" cy="34" rx="70" ry="12" fill="#0d1322" />
      <ellipse cx="230" cy="44" rx="80" ry="12" fill="#0b1020" />
      <ellipse cx="160" cy="26" rx="50" ry="8" fill="#10182a" />
      <path d="M246 40L238 62L246 60L236 86L244 84L232 112" stroke="#8fb3ff" strokeWidth="4" strokeOpacity="0.35" fill="none" />
      <path d="M246 40L238 62L246 60L236 86L244 84L232 112" stroke="#eef3ff" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
      <path d="M0 112V82L10 64L20 82V98H36V72L46 50L56 72V98H88V86L98 66L108 86V98H130V78L142 54L154 78V98H190V90L200 70L210 90V98H236V74L248 48L260 74V98H290V84L300 66L310 84V98H320V112Z" fill="#1c2740" />
      <path d="M0 132V104L14 88L28 104V118H60V96L72 76L84 96V118H110V108L120 90L130 108V118H166V100L180 80L194 100V118H222V110L232 94L242 110V118H270V98L284 72L298 98V118H320V132Z" fill="#111827" />
      <path d="M0 150V120L8 108L16 120V136H40V116L52 100L64 116V136H96V124L104 112L112 124V136H150V120L164 96L178 120V136H216V128L226 114L236 128V136H268V118L282 98L296 118V136H320V150Z" fill="#070a12" />
      <path d="M150 136L164 96L178 120" stroke="#8fb3ff" strokeWidth="1" fill="none" />
      <rect x="50" y="120" width="4" height="7" fill="#9fc3ff" />
      <rect x="282" y="116" width="4" height="8" fill="#9fc3ff" />
      <rect x="180" y="100" width="3" height="5" fill="#9fc3ff" />
      <rect x="104" y="126" width="3" height="5" fill="#9fc3ff" />
      <rect x="0" y="148" width="320" height="4" fill="#3f4a60" />
      <rect x="0" y="152" width="320" height="28" fill="#0f141f" />
      <ellipse cx="90" cy="160" rx="22" ry="3" fill="#1c2436" />
      <rect x="130" y="156" width="24" height="1.5" fill="#5a6a8a" fillOpacity="0.6" />
      <rect x="230" y="162" width="30" height="1.5" fill="#5a6a8a" fillOpacity="0.5" />
      <rect x="196" y="130" width="18" height="18" fill="#1b1f2a" />
      <rect x="196" y="130" width="18" height="18" stroke="#eef3ff" strokeWidth="1" fill="none" />
      <circle cx="199" cy="133" r="1.2" fill="#6c7890" />
      <circle cx="211" cy="145" r="1.2" fill="#6c7890" />
      <circle cx="140" cy="105" r="9" fill="#6f9fff" fillOpacity="0.5" />
      <polygon points="140,99 141.5,103 145.7,103.2 142.4,105.8 143.5,109.9 140,107.5 136.5,109.9 137.6,105.8 134.3,103.2 138.5,103" fill="#cfe4ff" />
      <circle cx="105" cy="117" r="8" fill="#7f9fe0" fillOpacity="0.5" />
      <path d="M105 122C100 117 100.5 111.5 105 114.5C109.5 111.5 110 117 105 122Z" fill="#dbe7ff" />
      <path d="M57 128L49 147L58 145L59 131Z" fill="#2d2338" />
      <rect x="56.5" y="138" width="3.2" height="10" fill="#cfd6e2" />
      <rect x="61.5" y="138" width="3.2" height="10" fill="#cfd6e2" />
      <rect x="55.5" y="128" width="10" height="11" rx="1.5" fill="#3a4256" />
      <rect x="55.5" y="134" width="10" height="1.6" fill="#6c7890" />
      <rect x="56" y="121.5" width="9.5" height="8" rx="2.5" fill="#6c7890" />
      <rect x="58.5" y="124.5" width="7.5" height="2" fill="#05070c" />
      <circle cx="60.5" cy="125.5" r="0.8" fill="#a8d0ff" />
      <circle cx="63.5" cy="125.5" r="0.8" fill="#a8d0ff" />
      <rect x="64" y="130" width="3" height="7" rx="1" fill="#cfd6e2" />
      <line x1="67" y1="134" x2="77" y2="121" stroke="#9fb3d8" strokeWidth="1.6" />
      <line x1="64.2" y1="131.6" x2="67.8" y2="134.4" stroke="#6c7890" strokeWidth="1.4" />
      <circle cx="77" cy="121" r="1.5" fill="#eef3ff" />
      <line x1="20" y1="10" x2="16" y2="26" stroke="#9fb3d8" strokeWidth="0.8" />
      <line x1="70" y1="60" x2="66" y2="76" stroke="#9fb3d8" strokeWidth="0.8" />
      <line x1="120" y1="20" x2="116" y2="36" stroke="#9fb3d8" strokeWidth="0.8" />
      <line x1="170" y1="120" x2="166" y2="136" stroke="#9fb3d8" strokeWidth="0.8" />
      <line x1="210" y1="80" x2="206" y2="96" stroke="#9fb3d8" strokeWidth="0.8" />
      <line x1="270" y1="50" x2="266" y2="66" stroke="#9fb3d8" strokeWidth="0.8" />
      <line x1="300" y1="120" x2="296" y2="136" stroke="#9fb3d8" strokeWidth="0.8" />
      <line x1="40" y1="100" x2="36" y2="116" stroke="#9fb3d8" strokeWidth="0.8" />
    </svg>
  );
}

export function AshenGilded() {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="gilded-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a3d6e" />
          <stop offset="0.55" stopColor="#d6875a" />
          <stop offset="1" stopColor="#f7d48d" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#gilded-sky)" />
      <circle cx="60" cy="72" r="30" fill="#f9d98a" fillOpacity="0.35" />
      <circle cx="60" cy="72" r="18" fill="#fff0c0" />
      <ellipse cx="150" cy="40" rx="50" ry="6" fill="#e9a0a0" />
      <ellipse cx="260" cy="62" rx="46" ry="5" fill="#f3c27a" />
      <ellipse cx="40" cy="28" rx="30" ry="4" fill="#d98a8a" />
      <path d="M0 112V82L10 64L20 82V98H36V72L46 50L56 72V98H88V86L98 66L108 86V98H130V78L142 54L154 78V98H190V90L200 70L210 90V98H236V74L248 48L260 74V98H290V84L300 66L310 84V98H320V112Z" fill="#a8788a" />
      <path d="M0 132V104L14 88L28 104V118H60V96L72 76L84 96V118H110V108L120 90L130 108V118H166V100L180 80L194 100V118H222V110L232 94L242 110V118H270V98L284 72L298 98V118H320V132Z" fill="#6e4d66" />
      <circle cx="180" cy="98" r="6" fill="#d9a83c" />
      <circle cx="180" cy="98" r="4" fill="#c94a4a" />
      <circle cx="180" cy="98" r="1.6" fill="#3a6fb0" />
      <path d="M0 150V120L8 108L16 120V136H40V116L52 100L64 116V136H96V124L104 112L112 124V136H150V120L164 96L178 120V136H216V128L226 114L236 128V136H268V118L282 98L296 118V136H320V150Z" fill="#3e2b45" />
      <rect x="48" y="118" width="6" height="12" rx="2" fill="#f6cd6a" />
      <rect x="160" y="114" width="6" height="14" rx="2" fill="#f6cd6a" />
      <rect x="280" y="114" width="6" height="14" rx="2" fill="#f6cd6a" />
      <rect x="102" y="124" width="4" height="8" rx="1.5" fill="#f6cd6a" />
      <rect x="0" y="148" width="320" height="4" fill="#d9c7a9" />
      <rect x="0" y="152" width="320" height="28" fill="#6b5647" />
      <line x1="0" y1="160" x2="320" y2="160" stroke="#8a7460" strokeWidth="0.8" />
      <line x1="0" y1="170" x2="320" y2="170" stroke="#8a7460" strokeWidth="0.8" />
      <rect x="149" y="118" width="2" height="30" fill="#d9a83c" />
      <rect x="142" y="124" width="16" height="2" fill="#d9a83c" />
      <ellipse cx="143" cy="120" rx="1.5" ry="3" fill="#ffe58a" />
      <ellipse cx="150" cy="114" rx="1.5" ry="3" fill="#ffe58a" />
      <ellipse cx="157" cy="120" rx="1.5" ry="3" fill="#ffe58a" />
      <rect x="196" y="132" width="18" height="16" rx="1" fill="#5a3b2a" />
      <rect x="196" y="138" width="18" height="3" fill="#d9a83c" />
      <circle cx="205" cy="140" r="1.5" fill="#f6cd6a" />
      <circle cx="140" cy="105" r="9" fill="#f2b03e" fillOpacity="0.45" />
      <polygon points="140,99 141.5,103 145.7,103.2 142.4,105.8 143.5,109.9 140,107.5 136.5,109.9 137.6,105.8 134.3,103.2 138.5,103" fill="#ffe58a" />
      <circle cx="105" cy="117" r="8" fill="#f4bcd0" fillOpacity="0.5" />
      <path d="M105 122C100 117 100.5 111.5 105 114.5C109.5 111.5 110 117 105 122Z" fill="#ffe9f0" />
      <path d="M57 128L49 147L58 145L59 131Z" fill="#8a2a3a" />
      <rect x="56.5" y="138" width="3.2" height="10" fill="#efe6d2" />
      <rect x="61.5" y="138" width="3.2" height="10" fill="#efe6d2" />
      <rect x="55.5" y="128" width="10" height="11" rx="1.5" fill="#7a5a3a" />
      <rect x="55.5" y="134" width="10" height="1.6" fill="#d9a83c" />
      <rect x="56" y="121.5" width="9.5" height="8" rx="2.5" fill="#d9a83c" />
      <rect x="58.5" y="124.5" width="7.5" height="2" fill="#2a1a22" />
      <circle cx="60.5" cy="125.5" r="0.8" fill="#ffd27a" />
      <circle cx="63.5" cy="125.5" r="0.8" fill="#ffd27a" />
      <rect x="64" y="130" width="3" height="7" rx="1" fill="#efe6d2" />
      <line x1="68" y1="147" x2="68" y2="124" stroke="#d9a83c" strokeWidth="1.6" />
      <line x1="65.5" y1="131" x2="70.5" y2="131" stroke="#d9a83c" strokeWidth="1.4" />
      <circle cx="30" cy="110" r="1" fill="#ffe9a8" />
      <circle cx="90" cy="50" r="1" fill="#ffe9a8" />
      <circle cx="120" cy="130" r="1" fill="#ffe9a8" />
      <circle cx="170" cy="70" r="1" fill="#ffe9a8" />
      <circle cx="220" cy="110" r="1" fill="#ffe9a8" />
      <circle cx="250" cy="30" r="1" fill="#ffe9a8" />
      <circle cx="290" cy="130" r="1" fill="#ffe9a8" />
      <circle cx="200" cy="20" r="1" fill="#ffe9a8" />
    </svg>
  );
}

export function AshenDrowned() {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="drowned-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#041420" />
          <stop offset="0.55" stopColor="#0b4258" />
          <stop offset="1" stopColor="#2b8a9c" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#drowned-sky)" />
      <path d="M0 12Q20 6 40 12T80 12T120 12T160 12T200 12T240 12T280 12T320 12" stroke="#9be9e6" strokeWidth="1.5" fill="none" />
      <ellipse cx="240" cy="24" rx="22" ry="7" fill="#b8f0f0" fillOpacity="0.6" />
      <polygon points="200,14 230,14 262,150 212,150" fill="#6fc7c9" fillOpacity="0.15" />
      <polygon points="90,14 106,14 150,150 116,150" fill="#6fc7c9" fillOpacity="0.12" />
      <path d="M0 112V82L10 64L20 82V98H36V72L46 50L56 72V98H88V86L98 66L108 86V98H130V78L142 54L154 78V98H190V90L200 70L210 90V98H236V74L248 48L260 74V98H290V84L300 66L310 84V98H320V112Z" fill="#1f5a6b" />
      <path d="M0 132V104L14 88L28 104V118H60V96L72 76L84 96V118H110V108L120 90L130 108V118H166V100L180 80L194 100V118H222V110L232 94L242 110V118H270V98L284 72L298 98V118H320V132Z" fill="#14404f" />
      <path d="M0 150V120L8 108L16 120V136H40V116L52 100L64 116V136H96V124L104 112L112 124V136H150V120L164 96L178 120V136H216V128L226 114L236 128V136H268V118L282 98L296 118V136H320V150Z" fill="#0a2a35" />
      <rect x="50" y="120" width="4" height="7" fill="#7cf5d0" />
      <rect x="162" y="116" width="4" height="8" fill="#7cf5d0" />
      <rect x="282" y="116" width="4" height="8" fill="#7cf5d0" />
      <rect x="104" y="126" width="3" height="5" fill="#7cf5d0" />
      <rect x="72" y="98" width="3" height="5" fill="#4fc9a8" />
      <rect x="284" y="96" width="3" height="5" fill="#4fc9a8" />
      <path d="M20 150C26 138 14 130 22 118" stroke="#1e7a5a" strokeWidth="2" fill="none" />
      <path d="M300 150C306 136 294 128 302 114" stroke="#1e7a5a" strokeWidth="2" fill="none" />
      <rect x="0" y="148" width="320" height="4" fill="#3a6a6a" />
      <rect x="0" y="152" width="320" height="28" fill="#0b2328" />
      <circle cx="250" cy="140" r="2" stroke="#bff5f0" strokeWidth="1" fill="none" />
      <circle cx="252" cy="128" r="2.5" stroke="#bff5f0" strokeWidth="1" fill="none" />
      <circle cx="249" cy="114" r="3" stroke="#bff5f0" strokeWidth="1" fill="none" />
      <rect x="196" y="130" width="18" height="18" fill="#3b2a22" />
      <circle cx="198" cy="132" r="2" fill="#b8c9c2" />
      <circle cx="211" cy="145" r="2.5" fill="#b8c9c2" />
      <line x1="214" y1="130" x2="224" y2="118" stroke="#6d8a8a" strokeWidth="1.2" />
      <circle cx="140" cy="105" r="9" fill="#5fd6c0" fillOpacity="0.45" />
      <polygon points="140,99 141.5,103 145.7,103.2 142.4,105.8 143.5,109.9 140,107.5 136.5,109.9 137.6,105.8 134.3,103.2 138.5,103" fill="#c9fff2" />
      <circle cx="105" cy="117" r="8" fill="#8fe6e0" fillOpacity="0.5" />
      <path d="M105 122C100 117 100.5 111.5 105 114.5C109.5 111.5 110 117 105 122Z" fill="#dffbff" />
      <path d="M57 129L46 120L47 134L58 136Z" fill="#2f5a48" />
      <rect x="56.5" y="138" width="3.2" height="10" fill="#cfe0d8" />
      <rect x="61.5" y="138" width="3.2" height="10" fill="#cfe0d8" />
      <rect x="55.5" y="128" width="10" height="11" rx="1.5" fill="#3e5a5e" />
      <rect x="55.5" y="134" width="10" height="1.6" fill="#6d8a8a" />
      <rect x="56" y="121.5" width="9.5" height="8" rx="2.5" fill="#6d8a8a" />
      <rect x="58.5" y="124.5" width="7.5" height="2" fill="#041420" />
      <circle cx="60.5" cy="125.5" r="0.8" fill="#7cf5d0" />
      <circle cx="63.5" cy="125.5" r="0.8" fill="#7cf5d0" />
      <rect x="64" y="130" width="3" height="7" rx="1" fill="#cfe0d8" />
      <line x1="68" y1="147" x2="68" y2="124" stroke="#6d8a8a" strokeWidth="1.6" />
      <line x1="65.5" y1="131" x2="70.5" y2="131" stroke="#6d8a8a" strokeWidth="1.4" />
      <circle cx="67" cy="118" r="1.2" stroke="#cdf5f2" strokeWidth="0.8" fill="none" />
      <circle cx="70" cy="110" r="1.8" stroke="#cdf5f2" strokeWidth="0.8" fill="none" />
      <circle cx="30" cy="80" r="1.5" stroke="#cdf5f2" strokeWidth="0.8" fill="none" />
      <circle cx="120" cy="40" r="2" stroke="#cdf5f2" strokeWidth="0.8" fill="none" />
      <circle cx="180" cy="60" r="1.2" stroke="#cdf5f2" strokeWidth="0.8" fill="none" />
      <circle cx="290" cy="90" r="1.8" stroke="#cdf5f2" strokeWidth="0.8" fill="none" />
      <circle cx="20" cy="30" r="1.2" stroke="#cdf5f2" strokeWidth="0.8" fill="none" />
      <circle cx="160" cy="140" r="1.5" stroke="#cdf5f2" strokeWidth="0.8" fill="none" />
    </svg>
  );
}

export function AshenCarnival() {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="carnival-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#180a2b" />
          <stop offset="0.55" stopColor="#4a1f5a" />
          <stop offset="1" stopColor="#8f3c6e" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#carnival-sky)" />
      <circle cx="250" cy="44" r="16" fill="#f7e07a" />
      <circle cx="258" cy="40" r="14" fill="#2f1442" />
      <ellipse cx="60" cy="50" rx="44" ry="5" fill="#5a2f66" />
      <ellipse cx="190" cy="74" rx="56" ry="5" fill="#6a3a76" />
      <path d="M0 112V82L10 64L20 82V98H36V72L46 50L56 72V98H88V86L98 66L108 86V98H130V78L142 54L154 78V98H190V90L200 70L210 90V98H236V74L248 48L260 74V98H290V84L300 66L310 84V98H320V112Z" fill="#5a2f66" />
      <path d="M0 132V110L18 90L36 110V118H70L88 84L106 118H140V108L156 92L172 108V118H200L220 82L240 118H266V104L282 90L298 104V118H320V132Z" fill="#3a1c48" />
      <polygon points="80,102 88,84 96,102" fill="#b03a4a" />
      <polygon points="212,98 220,82 228,98" fill="#b03a4a" />
      <path d="M0 150V136L20 110L40 136H60L80 104L100 136H150L164 96L178 136H216L236 108L256 136H268L288 100L308 136H320V150Z" fill="#221030" />
      <polygon points="70,120 80,104 90,120" fill="#c94a5a" />
      <polygon points="226,124 236,108 246,124" fill="#c94a5a" />
      <path d="M0 70Q80 96 160 70T320 70" stroke="#6a4a6e" strokeWidth="1" fill="none" />
      <circle cx="40" cy="80" r="3.5" fill="#ff7a4a" />
      <circle cx="120" cy="80" r="3.5" fill="#ffb86b" />
      <circle cx="200" cy="80" r="3.5" fill="#f2d16b" />
      <circle cx="280" cy="80" r="3.5" fill="#ff7a4a" />
      <rect x="78" y="124" width="4" height="7" fill="#ffb86b" />
      <rect x="162" y="118" width="4" height="8" fill="#ffb86b" />
      <rect x="234" y="124" width="4" height="7" fill="#ffb86b" />
      <rect x="286" y="118" width="4" height="8" fill="#ffb86b" />
      <rect x="0" y="148" width="320" height="4" fill="#6a4a6e" />
      <rect x="0" y="152" width="320" height="28" fill="#2a1830" />
      <circle cx="90" cy="150" r="2" fill="#f2d16b" />
      <circle cx="140" cy="150" r="2" fill="#f2d16b" />
      <circle cx="240" cy="150" r="2" fill="#f2d16b" />
      <rect x="196" y="132" width="18" height="16" rx="2" fill="#b03a4a" />
      <rect x="196" y="139" width="18" height="3" fill="#f2d16b" />
      <ellipse cx="205" cy="132" rx="9" ry="2.5" fill="#efe8dc" />
      <circle cx="140" cy="105" r="9" fill="#ff9a4a" fillOpacity="0.45" />
      <polygon points="140,99 141.5,103 145.7,103.2 142.4,105.8 143.5,109.9 140,107.5 136.5,109.9 137.6,105.8 134.3,103.2 138.5,103" fill="#ffe58a" />
      <circle cx="105" cy="117" r="8" fill="#b48ad8" fillOpacity="0.5" />
      <path d="M105 122C100 117 100.5 111.5 105 114.5C109.5 111.5 110 117 105 122Z" fill="#efe1ff" />
      <path d="M57 128L49 147L58 145L59 131Z" fill="#c93a5a" />
      <rect x="56.5" y="138" width="3.2" height="10" fill="#e8e1d2" />
      <rect x="61.5" y="138" width="3.2" height="10" fill="#e8e1d2" />
      <rect x="55.5" y="128" width="10" height="11" rx="1.5" fill="#4a2a4a" />
      <rect x="55.5" y="134" width="10" height="1.6" fill="#8a7a9a" />
      <rect x="56" y="121.5" width="9.5" height="8" rx="2.5" fill="#8a7a9a" />
      <rect x="58.5" y="124.5" width="7.5" height="2" fill="#180a2b" />
      <circle cx="60.5" cy="125.5" r="0.8" fill="#ffb86b" />
      <circle cx="63.5" cy="125.5" r="0.8" fill="#ffb86b" />
      <rect x="64" y="130" width="3" height="7" rx="1" fill="#e8e1d2" />
      <line x1="68" y1="147" x2="68" y2="124" stroke="#8a7a9a" strokeWidth="1.6" />
      <line x1="65.5" y1="131" x2="70.5" y2="131" stroke="#8a7a9a" strokeWidth="1.4" />
      <rect x="20" y="30" width="2.5" height="2.5" fill="#ff7a4a" />
      <rect x="70" y="60" width="2.5" height="2.5" fill="#f2d16b" />
      <rect x="110" y="20" width="2.5" height="2.5" fill="#7ad0ff" />
      <rect x="150" y="130" width="2.5" height="2.5" fill="#e98fb0" />
      <rect x="230" y="60" width="2.5" height="2.5" fill="#f2d16b" />
      <rect x="270" y="110" width="2.5" height="2.5" fill="#ff7a4a" />
      <rect x="300" y="30" width="2.5" height="2.5" fill="#7ad0ff" />
      <rect x="40" y="110" width="2.5" height="2.5" fill="#e98fb0" />
    </svg>
  );
}

export function AshenSalt() {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="salt-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6e0cc" />
          <stop offset="0.6" stopColor="#f0d6a4" />
          <stop offset="1" stopColor="#d8ad74" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#salt-sky)" />
      <circle cx="200" cy="50" r="22" fill="#f7e9c4" fillOpacity="0.6" />
      <circle cx="200" cy="50" r="12" fill="#fffdf0" />
      <rect x="0" y="60" width="320" height="6" fill="#d9b880" fillOpacity="0.35" />
      <rect x="0" y="84" width="320" height="10" fill="#cfa86c" fillOpacity="0.3" />
      <rect x="0" y="104" width="320" height="8" fill="#c99a5e" fillOpacity="0.3" />
      <path d="M0 118V96L30 92L44 60L58 92L100 100L150 94L166 62L176 94L220 102L268 96L284 70L296 96L320 100V118Z" fill="#c8a882" />
      <path d="M0 136V116L40 110L52 84L60 110L110 120L164 112L176 78L184 112L230 118L280 110L290 86L300 110L320 116V136Z" fill="#a67f5a" />
      <path d="M0 150V138L52 124L60 100L68 124L120 134L164 114L170 96L176 114L220 132L282 118L290 98L296 118L320 134V150Z" fill="#7a5636" />
      <rect x="58" y="112" width="4" height="6" fill="#4a3220" />
      <rect x="168" y="106" width="4" height="6" fill="#4a3220" />
      <rect x="288" y="108" width="4" height="6" fill="#4a3220" />
      <rect x="174" y="84" width="3" height="5" fill="#6a4a30" />
      <rect x="0" y="148" width="320" height="4" fill="#efd9a8" />
      <rect x="0" y="152" width="320" height="28" fill="#c9a86c" />
      <path d="M0 160Q40 156 80 160T160 160T240 160T320 160" stroke="#b8945a" strokeWidth="1" fill="none" />
      <path d="M0 172Q40 168 80 172T160 172T240 172T320 172" stroke="#b8945a" strokeWidth="1" fill="none" />
      <ellipse cx="120" cy="150" rx="40" ry="3" fill="#f4e3b8" />
      <ellipse cx="200" cy="149" rx="16" ry="3" fill="#a6844f" fillOpacity="0.6" />
      <rect x="196" y="132" width="18" height="16" fill="#3a302c" fillOpacity="0.5" />
      <circle cx="200" cy="136" r="1.2" fill="#d4b48c" />
      <circle cx="210" cy="144" r="1.2" fill="#d4b48c" />
      <path d="M194 128Q198 124 202 128T210 128T218 128" stroke="#fff6dc" strokeWidth="1" fill="none" strokeOpacity="0.8" />
      <path d="M196 123Q200 119 204 123T212 123" stroke="#fff6dc" strokeWidth="1" fill="none" strokeOpacity="0.6" />
      <circle cx="140" cy="105" r="9" fill="#ffe8a0" fillOpacity="0.5" />
      <polygon points="140,98 142,103 147,103 143,106 145,111 140,108 135,111 137,106 133,103 138,103" fill="#f7c948" />
      <circle cx="250" cy="118" r="8" fill="#bfe6ec" fillOpacity="0.5" />
      <path d="M250 123L245 118Q243 114 247 114Q250 114 250 117Q250 114 253 114Q257 114 255 118Z" fill="#e8fbff" />
      <ellipse cx="46" cy="149" rx="18" ry="2.5" fill="#a6844f" fillOpacity="0.5" />
      <path d="M56 128L50 146L58 142Z" fill="#7a4a3a" />
      <rect x="56" y="140" width="3" height="8" fill="#f3ecdc" />
      <rect x="61" y="140" width="3" height="8" fill="#f3ecdc" />
      <rect x="55" y="130" width="10" height="11" fill="#f3ecdc" />
      <rect x="55" y="122" width="10" height="9" rx="2" fill="#8c8d8a" />
      <rect x="56" y="126" width="8" height="2.5" fill="#2a2a2e" />
      <circle cx="58" cy="127.2" r="0.8" fill="#e07a34" />
      <circle cx="62" cy="127.2" r="0.8" fill="#e07a34" />
      <line x1="67" y1="146" x2="70" y2="124" stroke="#b5b7b0" strokeWidth="2" />
      <rect x="66" y="138" width="6" height="1.5" fill="#6a6d72" />
      <rect x="64" y="132" width="3" height="6" fill="#f3ecdc" />
      <circle cx="30" cy="40" r="1" fill="#fff8e6" />
      <circle cx="90" cy="70" r="1.2" fill="#fff8e6" />
      <circle cx="120" cy="30" r="0.8" fill="#fff8e6" />
      <circle cx="160" cy="130" r="1" fill="#fff8e6" />
      <circle cx="230" cy="80" r="1.2" fill="#fff8e6" />
      <circle cx="270" cy="140" r="0.9" fill="#fff8e6" />
      <circle cx="300" cy="40" r="1" fill="#fff8e6" />
      <circle cx="20" cy="130" r="1.1" fill="#fff8e6" />
    </svg>
  );
}

export function AshenTide() {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="tide-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#25383f" />
          <stop offset="0.65" stopColor="#4f7378" />
          <stop offset="1" stopColor="#8aa79a" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#tide-sky)" />
      <circle cx="80" cy="40" r="18" fill="#c8dcd2" fillOpacity="0.3" />
      <circle cx="80" cy="40" r="10" fill="#e4f0e8" />
      <ellipse cx="200" cy="34" rx="60" ry="9" fill="#2e4448" fillOpacity="0.7" />
      <ellipse cx="270" cy="52" rx="45" ry="7" fill="#33494c" fillOpacity="0.6" />
      <path d="M0 122V100L20 96L28 66L36 96L70 104L110 98L120 60L128 98L170 106L210 100L220 72L228 100L262 106L300 98L308 68L314 98L320 100V122Z" fill="#587a78" />
      <path d="M0 140V118L46 112L54 84L62 112L100 124L150 116L160 84L168 116L206 126L250 116L258 90L266 116L320 122V140Z" fill="#3a5a5a" />
      <path d="M0 150V134L90 126L98 104L106 126L140 138L180 128L188 108L196 128L240 140L286 128L294 110L300 128L320 132V150Z" fill="#23403f" />
      <rect x="52" y="100" width="4" height="6" fill="#9fe0c0" fillOpacity="0.7" />
      <rect x="158" y="104" width="4" height="6" fill="#9fe0c0" fillOpacity="0.7" />
      <rect x="258" y="106" width="4" height="6" fill="#9fe0c0" fillOpacity="0.7" />
      <rect x="0" y="148" width="320" height="4" fill="#b9d6c8" />
      <rect x="0" y="152" width="320" height="28" fill="#1e4446" />
      <path d="M0 158Q30 155 60 158T120 158T180 158T240 158T300 158T320 158" stroke="#4f8a84" strokeWidth="1" fill="none" />
      <path d="M0 168Q30 165 60 168T120 168T180 168T240 168T300 168T320 168" stroke="#3f7570" strokeWidth="1" fill="none" />
      <rect x="66" y="152" width="28" height="14" fill="#9fc8b8" fillOpacity="0.15" />
      <rect x="50" y="154" width="14" height="10" fill="#9fc8b8" fillOpacity="0.15" />
      <rect x="0" y="176" width="320" height="4" fill="#6fa39a" fillOpacity="0.35" />
      <ellipse cx="205" cy="149" rx="15" ry="3" fill="#dfeee6" fillOpacity="0.7" />
      <rect x="196" y="134" width="18" height="14" fill="#2a2e30" />
      <line x1="200" y1="134" x2="197" y2="126" stroke="#4a5052" strokeWidth="2" />
      <line x1="210" y1="134" x2="213" y2="126" stroke="#4a5052" strokeWidth="2" />
      <line x1="205" y1="134" x2="205" y2="125" stroke="#4a5052" strokeWidth="2" />
      <circle cx="200" cy="139" r="1.2" fill="#8fb8a8" />
      <circle cx="140" cy="108" r="9" fill="#9ff0cc" fillOpacity="0.35" />
      <polygon points="140,101 142,106 147,106 143,109 145,114 140,111 135,114 137,109 133,106 138,106" fill="#b8ffd8" />
      <circle cx="250" cy="120" r="8" fill="#bde6ff" fillOpacity="0.4" />
      <path d="M250 125L245 120Q243 116 247 116Q250 116 250 119Q250 116 253 116Q257 116 255 120Z" fill="#e8f6ff" />
      <path d="M56 128L50 146L58 142Z" fill="#3e2a2a" />
      <rect x="56" y="140" width="3" height="8" fill="#d7d3c6" />
      <rect x="61" y="140" width="3" height="8" fill="#d7d3c6" />
      <rect x="55" y="130" width="10" height="11" fill="#d7d3c6" />
      <rect x="55" y="122" width="10" height="9" rx="2" fill="#5a6468" />
      <rect x="56" y="126" width="8" height="2.5" fill="#1c2224" />
      <circle cx="58" cy="127.2" r="0.8" fill="#e07a34" />
      <circle cx="62" cy="127.2" r="0.8" fill="#e07a34" />
      <line x1="67" y1="146" x2="70" y2="124" stroke="#8e989c" strokeWidth="2" />
      <rect x="66" y="138" width="6" height="1.5" fill="#5a6468" />
      <rect x="64" y="132" width="3" height="6" fill="#d7d3c6" />
      <line x1="20" y1="10" x2="17" y2="24" stroke="#b9d6c8" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="60" y1="70" x2="57" y2="84" stroke="#b9d6c8" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="110" y1="20" x2="107" y2="34" stroke="#b9d6c8" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="150" y1="60" x2="147" y2="74" stroke="#b9d6c8" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="190" y1="14" x2="187" y2="28" stroke="#b9d6c8" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="240" y1="80" x2="237" y2="94" stroke="#b9d6c8" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="280" y1="30" x2="277" y2="44" stroke="#b9d6c8" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="300" y1="130" x2="297" y2="144" stroke="#b9d6c8" strokeWidth="1" strokeOpacity="0.6" />
    </svg>
  );
}

export const ASHEN_VARIANTS: readonly AshenVariant[] = [
  {
    id: "frost",
    label: "candidate 1",
    name: "Frostfall Vigil",
    mood:
      "Glacial pre-dawn blues from indigo to pale ice; snow-capped spires, frozen lanterns, icicles. One warm gold lantern in the knight's hand is the only heat in a silent, crystalline cold.",
    gameplay:
      "Steady, tense pacing. Lantern light is your health: it gutters constantly, deep-frost ground patches drain it faster, wisps refuel it. Ice barricades shatter if dashed through while bright.",
    differentiators:
      "Only variant where health is a depleting resource independent of hits; cold ground zones as area hazards; snow-white ground band.",
    palette: ["#1b2440", "#4a6a8f", "#b9cfdc", "#e3ecf3", "#4d5d70", "#ffd27a"],
    Scene: AshenFrost,
  },
  {
    id: "ember",
    label: "candidate 2",
    name: "Ember Tide",
    mood:
      "Volcanic sundown: black-cherry sky, bloated red sun, ash plumes, lava bleeding through window slits and floor cracks. Heat haze, everything smouldering, towers tilting mid-collapse.",
    gameplay:
      "Relentless, accelerating. The city crumbles behind you: ground segments drop into lava on a rising tempo, towers topple across lanes. Burning debris blocks force late double-jumps; no backing off.",
    differentiators:
      "Only variant with a pursuing collapse that punishes slowing; hottest palette; cold-blue wisps as the sole contrast.",
    palette: ["#2a0d0d", "#8a2418", "#f28a3a", "#4a2c26", "#1a0b09", "#ff7a1f"],
    Scene: AshenEmber,
  },
  {
    id: "bloom",
    label: "candidate 3 · chosen",
    name: "Verdigris Bloom",
    mood:
      "Bright overgrown noon: pale cyan-to-cream sky, white clouds, mossy ruins with verdigris copper roofs, pink and yellow blossoms, petals drifting. Hopeful, warm, spring after ruin.",
    gameplay:
      "Medium pace, vertical. Vines and ledges form three climbable lanes; brambles and thorn beds hazard the ground, stars only spawn on upper ledges, wisps trail between lanes. Wall-cling on vines.",
    differentiators:
      "The only daylight, non-grim variant; verticality is the core; hazards are organic, not iron; grass ground band.",
    palette: ["#cfeaf0", "#f5e9c4", "#5c8462", "#33573f", "#7fbb5a", "#e98fb0"],
    Scene: AshenBloom,
  },
  {
    id: "storm",
    label: "candidate 4",
    name: "Storm Bastion",
    mood:
      "Near-black thunderstorm: ink-blue sky, low black clouds, one white bolt outlining spire edges, wet stone reflecting cold rims. Rain in hard diagonals, everything silhouette.",
    gameplay:
      "Tense reaction play. Obstacles stay dark and only telegraph with an electric edge-flash a beat before contact; deflect-timing parry on crates yields sparks and combo, mistimed parry costs a heart.",
    differentiators:
      "Darkest scene; danger is hidden, not visible early; parry replaces jumping as the core verb; rain as weather.",
    palette: ["#06090f", "#141d33", "#2b3852", "#3f4a60", "#0f141f", "#eef3ff"],
    Scene: AshenStorm,
  },
  {
    id: "gilded",
    label: "candidate 5",
    name: "Gilded Requiem",
    mood:
      "Cathedral golden hour: plum to amber sky, low honeyed sun, rose-pink clouds, stained-glass rose windows, gilded arches, marble floor, warm dust motes. Solemn, luminous, ceremonial.",
    gameplay:
      "Chaptered pacing. Candelabra checkpoints split the run into chapters; reaching one tithes a share of your souls to bank progress and refill a heart. Reliquary chests as obstacles; tempo rises per chapter.",
    differentiators:
      "Only variant with checkpoints and a souls-for-safety trade; warmest, most ornate architecture; marble floor rather than dirt or stone.",
    palette: ["#5a3d6e", "#d6875a", "#f7d48d", "#d9c7a9", "#6b5647", "#d9a83c"],
    Scene: AshenGilded,
  },
  {
    id: "drowned",
    label: "candidate 6",
    name: "Drowned Ward",
    mood:
      "Sunken city under a rippling surface: deep navy to teal water, refracted pale sun, drifting light shafts, mint bioluminescent windows, kelp and barnacled iron. Muffled, weightless, eerie-calm.",
    gameplay:
      "Slow, floaty. Half gravity gives long hang-time jumps; an air meter drains and refills in rising bubble columns; hold to sink beneath low chained crates. Roll becomes a short swim burst.",
    differentiators:
      "Only variant that changes gravity and adds a breath resource; the sky is water; particles are bubbles; cape floats upward.",
    palette: ["#041420", "#0b4258", "#2b8a9c", "#3a6a6a", "#0b2328", "#7cf5d0"],
    Scene: AshenDrowned,
  },
  {
    id: "carnival",
    label: "candidate 7",
    name: "Bone Carnival",
    mood:
      "Plague-carnival midnight: violet-to-magenta sky, yellow crescent, strings of paper lanterns, striped tents pitched against dead spires, drums, confetti on cobbles. Festive and sinister at once.",
    gameplay:
      "Rhythm runner locked to the 58-66 bpm lament. Drum-crates and tent ropes land on the beat; gold beat markers on the ground show timing; on-beat jumps double the combo multiplier.",
    differentiators:
      "Only music-timed variant; hazards are predictable by ear, not eye; tents replace towers in mid and near layers; brightest accent palette.",
    palette: ["#180a2b", "#4a1f5a", "#8f3c6e", "#6a4a6e", "#2a1830", "#f2d16b"],
    Scene: AshenCarnival,
  },
  {
    id: "salt",
    label: "candidate 8",
    name: "Salt Noon",
    mood:
      "Bleached salt-flat noon: cream-to-ochre sky, a white sun with no warmth, castle terraces baked to bone and rust, heat bands shimmering, glare pooling on the ground. Silence, dust, overexposure.",
    gameplay:
      "Shade is health: standing in sun drains hearts slowly, building shadows refill them. Crates hide in heat-shimmer and only resolve at the last second; wisps are water-drops. Fast, tense pacing.",
    differentiators:
      "Only overlit/daytime variant; hazards telegraph late through mirage; the environment itself is the damage source, not the obstacles.",
    palette: ["#e6e0cc", "#d8ad74", "#c8a882", "#7a5636", "#c9a86c", "#f7c948"],
    Scene: AshenSalt,
  },
  {
    id: "tide",
    label: "candidate 9",
    name: "Drowned Vespers",
    mood:
      "Flooded castle-city at rainy dusk: deep teal sky, a pale bone moon, spires rising from black water, algae-green windows, rain streaks, submerged causeway glowing faintly beneath the surface. Cold, quiet, sunken.",
    gameplay:
      "The tide rises through the run: the causeway sinks, forcing jumps onto rooftops and balconies. Water slows the knight to roll speed; spiked cages drift on currents. Vertical, deliberate pacing.",
    differentiators:
      "Only water-based variant; the floor itself disappears over time; verticality is mandatory, not optional; hazards move with the current.",
    palette: ["#25383f", "#8aa79a", "#587a78", "#23403f", "#1e4446", "#b8ffd8"],
    Scene: AshenTide,
  },
];

function AshenCard({ variant }: { variant: AshenVariant }) {
  const { Scene } = variant;
  return (
    <article className="ashen-card">
      <div className="ashen-stage">
        <Scene />
      </div>
      <div className="ashen-copy">
        <p className="ashen-topline">{variant.label}</p>
        <h3 className="ashen-name">{variant.name}</h3>
        <p className="ashen-block">
          <span className="ashen-field">visual style</span>
          {variant.mood}
        </p>
        <p className="ashen-block">
          <span className="ashen-field">gameplay feel</span>
          {variant.gameplay}
        </p>
        <p className="ashen-block">
          <span className="ashen-field">key differentiators</span>
          {variant.differentiators}
        </p>
        <div className="ashen-swatches" aria-hidden="true">
          {variant.palette.map((ink) => (
            <span key={ink} className="ashen-swatch" style={{ background: ink }} />
          ))}
        </div>
      </div>
    </article>
  );
}

export function AshenDirectionsSection() {
  return (
    <section className="art-variant-section" aria-label="Ashen Mode art directions">
      <div className="art-variant-head">
        <p className="art-variant-label">ashen mode · gameplay design overhaul</p>
        <h2 className="art-variant-name">nine directions</h2>
        <p className="art-variant-thesis">
          The Dark Souls re-theme is carried but its gameplay design needs a pass — these nine
          candidates each push a different visual and mechanical direction while keeping the menu
          layout, the souls pickup economy and the star pickups. Every still shares one layer
          grammar (sky, city, ground, knight, pickups, atmosphere) so the cards read side by side.
          The owner picked <strong>candidate 3, Verdigris Bloom</strong> — the character stays the
          bone-cat knight in every variant (themes re-skin the world, never the character).
        </p>
      </div>
      <div className="ashen-grid">
        <AshenCard variant={ASHEN_BASELINE} />
        {ASHEN_VARIANTS.map((variant) => (
          <AshenCard key={variant.id} variant={variant} />
        ))}
      </div>
    </section>
  );
}
