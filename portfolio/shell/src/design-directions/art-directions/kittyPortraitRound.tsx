// Cat portrait round: attempt 2 (current) vs ten concept candidates. Each is
// shown at both sizes the select screen actually renders (96px desktop,
// 68px mobile) on the light card surface the portrait sits on. The ten
// candidates came from a delegated concept rethink (framing, energy, graphic
// language, bow treatment all vary); the round supersedes the earlier
// with-bow / without-bow comparison.

import type { ReactElement } from "react";

// Attempt 2 — the portrait currently live in CharacterPortraits.tsx.
function AttemptTwoPortrait() {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="#3a3142"
      strokeWidth={3}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M24 31 Q25 18 28.5 8.5 Q30 6 31.5 8.5 Q37 16 46 21 Z" fill="#ffffff" />
      <path d="M76 31 Q75 18 71.5 8.5 Q70 6 68.5 8.5 Q63 16 54 21 Z" fill="#ffffff" />
      <path d="M29.5 26.5 Q30 18 32 12.5 Q37 17 42 21.5 Z" fill="#f6a9c0" stroke="none" />
      <path d="M70.5 26.5 Q70 18 68 12.5 Q63 17 58 21.5 Z" fill="#f6a9c0" stroke="none" />
      <circle cx="50" cy="44" r="30" fill="#ffffff" />
      <path d="M76.6 36.9 A27.5 27.5 0 0 1 36.25 67.8 Q69.8 69.65 76.6 36.9 Z" fill="#ece4ee" stroke="none" />
      <circle cx="32" cy="53" r="3.5" fill="#f6a9c0" stroke="none" />
      <circle cx="68" cy="53" r="3.5" fill="#f6a9c0" stroke="none" />
      <ellipse cx="39" cy="42" rx="4.5" ry="6" fill="#3a3142" stroke="none" />
      <ellipse cx="61" cy="42" rx="4.5" ry="6" fill="#3a3142" stroke="none" />
      <circle cx="37.7" cy="39.7" r="1.5" fill="#ffffff" stroke="none" />
      <circle cx="59.7" cy="39.7" r="1.5" fill="#ffffff" stroke="none" />
      <polygon points="50,52 46.5,48.5 53.5,48.5" fill="#f6a9c0" stroke="none" />
      <path d="M45 55 Q47.5 58.5 50 55 Q52.5 58.5 55 55" strokeWidth={2} />
      <path d="M17 45 Q24 45.5 31 48" strokeWidth={2} />
      <path d="M17 56 Q24 55.5 31 53" strokeWidth={2} />
      <path d="M83 45 Q76 45.5 69 48" strokeWidth={2} />
      <path d="M83 56 Q76 55.5 69 53" strokeWidth={2} />
      <path d="M73 79 Q69 85 66 91 Q70 92 73 91 Q75 85 78 80 Z" fill="#e94f64" />
      <path d="M81 80 Q85 85 88 91 Q84 92 81 91 Q79 85 76 79 Z" fill="#e94f64" />
      <path d="M77 75 C72 62 58 62 59 71 C60 79 70 80 77 75 Z" fill="#e94f64" />
      <path d="M77 75 C82 62 96 62 95 71 C94 79 84 80 77 75 Z" fill="#e94f64" />
      <ellipse cx="77" cy="75" rx="4.2" ry="5" fill="#e94f64" />
    </svg>
  );
}

export function KittyPSentinel() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-hidden="true" focusable="false" fill="none" stroke="#3a3142" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
      <path d="M16 100 C18 82 30 72 50 72 C70 72 82 82 84 100 Z" fill="#ffffff" />
      <path d="M36 74 C40 80 60 80 64 74 C60 72 40 72 36 74 Z" fill="#ece4ee" stroke="none" />
      <path d="M27 38 L22 12 L43 24 Z" fill="#ffffff" />
      <path d="M29 33 L26 19 L37 25 Z" fill="#ffc9d8" stroke="none" />
      <path d="M73 38 L78 12 L57 24 Z" fill="#ffffff" />
      <path d="M71 33 L74 19 L63 25 Z" fill="#ffc9d8" stroke="none" />
      <path d="M24 46 C24 29 34 21 50 21 C66 21 76 29 76 46 C76 60 65 69 50 69 C35 69 24 60 24 46 Z" fill="#ffffff" />
      <path d="M33 45 Q39 41 45 45 Q39 48 33 45 Z" fill="#3a3142" stroke="none" />
      <path d="M55 45 Q61 41 67 45 Q61 48 55 45 Z" fill="#3a3142" stroke="none" />
      <ellipse cx="31" cy="54" rx="4" ry="2.5" fill="#ffc9d8" stroke="none" />
      <ellipse cx="69" cy="54" rx="4" ry="2.5" fill="#ffc9d8" stroke="none" />
      <path d="M46 52 L54 52 L50 57 Z" fill="#ffd44d" strokeWidth={2} />
      <path d="M50 57 V60" strokeWidth={2} />
      <path d="M30 53 L12 49 M30 58 L12 60 M70 53 L88 49 M70 58 L88 60" strokeWidth={2} />
      <path d="M47 78 C39 70 32 72 34 80 C36 87 44 85 47 78 Z" fill="#e94f64" />
      <path d="M53 78 C61 70 68 72 66 80 C64 87 56 85 53 78 Z" fill="#e94f64" />
      <circle cx="50" cy="78" r="3.5" fill="#d13a50" />
    </svg>
  );
}

export function KittyPSprinter() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-hidden="true" focusable="false" fill="none" stroke="#3a3142" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
      <path d="M4 48 H14 M2 56 H10 M6 64 H14" strokeWidth={2} />
      <path d="M40 54 C28 52 20 42 26 32 C28 28 33 29 31 33 C27 40 32 48 42 50 Z" fill="#ffffff" />
      <path d="M44 64 L22 76 L26 82 L50 70 Z" fill="#ffffff" />
      <path d="M62 68 L70 86 L76 84 L70 66 Z" fill="#ffffff" />
      <path d="M40 52 C46 46 66 46 74 52 C80 58 76 70 62 70 C48 70 38 66 36 60 C34 56 36 54 40 52 Z" fill="#ffffff" />
      <path d="M46 66 L36 88 L42 90 L54 72 Z" fill="#ffffff" />
      <path d="M68 62 L92 72 L90 78 L66 70 Z" fill="#ffffff" />
      <path d="M64 52 L44 44 L46 40 L65 50 Z" fill="#e94f64" />
      <path d="M65 54 L46 50 L46 54 L65 57 Z" fill="#e94f64" />
      <path d="M65 42 C65 33 71 28 79 28 C87 28 92 34 92 42 C92 50 86 55 78 55 C70 55 65 50 65 42 Z" fill="#ffffff" />
      <path d="M70 32 L66 18 L79 29 Z" fill="#ffffff" />
      <path d="M71 30 L69 22 L76 28 Z" fill="#ffc9d8" stroke="none" />
      <path d="M82 30 L88 17 L88 33 Z" fill="#ffffff" />
      <path d="M83 29 L86 22 L86 30 Z" fill="#ffc9d8" stroke="none" />
      <ellipse cx="84" cy="41" rx="2.5" ry="3.5" fill="#3a3142" stroke="none" />
      <path d="M79 36 L87 38" strokeWidth={2} />
      <path d="M89 46 L93 45 L92 49 Z" fill="#ffd44d" strokeWidth={2} />
      <path d="M85 48 L97 45 M85 51 L97 53" strokeWidth={2} />
      <path d="M67 54 C62 44 52 48 58 55 Z" fill="#e94f64" />
      <path d="M67 54 C60 62 52 58 58 53 Z" fill="#e94f64" />
      <circle cx="67" cy="54" r="3" fill="#d13a50" />
    </svg>
  );
}

export function KittyPCameo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-hidden="true" focusable="false" fill="none" stroke="#3a3142" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx="50" cy="50" rx="40" ry="46" fill="#fceef4" />
      <path d="M40 26 L44 8 L56 22 Z" fill="#ffffff" />
      <path d="M42 25 L44 13 L52 21 Z" fill="#ffc9d8" stroke="none" />
      <path d="M62 22 L68 6 L74 31 Z" fill="#ffffff" />
      <path d="M70 30 C62 18 44 18 36 30 C32 36 28 40 26 46 C24 50 26 52 30 54 C30 58 32 62 38 64 C48 68 60 64 66 72 L70 84 L84 84 L84 44 C84 36 78 30 70 30 Z" fill="#ffffff" />
      <path d="M31 42 Q36 39 41 41 Q37 44 31 42 Z" fill="#3a3142" stroke="none" />
      <ellipse cx="37" cy="50" rx="3" ry="2" fill="#ffc9d8" stroke="none" />
      <circle cx="25" cy="48" r="2.5" fill="#ffd44d" strokeWidth={2} />
      <path d="M28 53 Q31 56 34 54" strokeWidth={2} />
      <path d="M32 55 L16 51 M33 59 L17 60" strokeWidth={2} />
      <path d="M77 33 L70 29 L71 38 Z" fill="#e94f64" />
      <path d="M79 33 L86 29 L85 38 Z" fill="#e94f64" />
      <circle cx="78" cy="33" r="2.5" fill="#d13a50" />
    </svg>
  );
}

export function KittyPCrest() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-hidden="true" focusable="false" fill="none" stroke="#3a3142" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
      <path d="M50 12 L84 20 V50 C84 70 68 82 50 90 C32 82 16 70 16 50 V20 Z" fill="#fceef4" />
      <path d="M32 38 L28 20 L44 28 Z" fill="#ffffff" />
      <path d="M34 34 L32 25 L40 29 Z" fill="#ffc9d8" stroke="none" />
      <path d="M68 38 L72 20 L56 28 Z" fill="#ffffff" />
      <path d="M66 34 L68 25 L60 29 Z" fill="#ffc9d8" stroke="none" />
      <path d="M30 46 C30 32 38 26 50 26 C62 26 70 32 70 46 C70 56 62 62 50 62 C38 62 30 56 30 46 Z" fill="#ffffff" />
      <ellipse cx="42" cy="45" rx="3" ry="2.5" fill="#3a3142" stroke="none" />
      <ellipse cx="58" cy="45" rx="3" ry="2.5" fill="#3a3142" stroke="none" />
      <path d="M38 39 L46 41 M62 39 L54 41" strokeWidth={2} />
      <path d="M47 51 L53 51 L50 55 Z" fill="#ffd44d" strokeWidth={2} />
      <path d="M34 50 L20 48 M34 54 L20 56 M66 50 L80 48 M66 54 L80 56" strokeWidth={2} />
      <path d="M34 74 L22 72 L26 79 L22 86 L34 84 Z" fill="#d13a50" />
      <path d="M66 74 L78 72 L74 79 L78 86 L66 84 Z" fill="#d13a50" />
      <path d="M34 74 H66 V84 H34 Z" fill="#e94f64" />
    </svg>
  );
}

export function KittyPBadge() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-hidden="true" focusable="false" fill="none" stroke="#3a3142" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
      <circle cx="50" cy="50" r="44" fill="#ffffff" />
      <circle cx="50" cy="50" r="37" fill="#fceef4" />
      <path d="M29 42 L25 15 L44 26 Z" fill="#ffffff" />
      <path d="M31 37 L29 24 L39 28 Z" fill="#ffc9d8" stroke="none" />
      <path d="M71 42 L75 15 L56 26 Z" fill="#ffffff" />
      <path d="M69 37 L71 24 L61 28 Z" fill="#ffc9d8" stroke="none" />
      <path d="M26 50 C26 32 36 24 50 24 C64 24 74 32 74 50 C74 64 64 72 50 72 C36 72 26 64 26 50 Z" fill="#ffffff" />
      <circle cx="41" cy="49" r="2.8" fill="#3a3142" stroke="none" />
      <circle cx="59" cy="49" r="2.8" fill="#3a3142" stroke="none" />
      <path d="M46 57 L54 57 L50 62 Z" fill="#ffd44d" strokeWidth={2} />
      <path d="M47 65 Q50 68 53 65" strokeWidth={2} />
      <path d="M30 58 L8 54 M30 63 L8 66 M70 58 L92 54 M70 63 L92 66" strokeWidth={2} />
      <path d="M47 86 C38 78 30 82 34 90 C38 96 45 92 47 86 Z" fill="#e94f64" />
      <path d="M53 86 C62 78 70 82 66 90 C62 96 55 92 53 86 Z" fill="#e94f64" />
      <circle cx="50" cy="86" r="3.5" fill="#d13a50" />
    </svg>
  );
}

export function KittyPPapercut() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-hidden="true" focusable="false" fill="none" stroke="#3a3142" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
      <path d="M27 47 L33 27 L53 21 L73 27 L79 47 L71 69 L53 77 L35 69 Z" fill="#ece4ee" stroke="none" />
      <path d="M38 73 L62 73 L60 86 L40 86 Z" fill="#ffffff" />
      <path d="M24 44 L30 24 L50 18 L70 24 L76 44 L68 66 L50 74 L32 66 Z" fill="#ffffff" />
      <path d="M30 30 L24 8 L46 22 Z" fill="#ffffff" />
      <path d="M31 27 L28 15 L40 22 Z" fill="#ffc9d8" stroke="none" />
      <path d="M70 30 L76 8 L54 22 Z" fill="#ffffff" />
      <path d="M69 27 L72 15 L60 22 Z" fill="#ffc9d8" stroke="none" />
      <path d="M37 44 L42 41 L47 44 L42 47 Z" fill="#3a3142" stroke="none" />
      <path d="M53 44 L58 41 L63 44 L58 47 Z" fill="#3a3142" stroke="none" />
      <path d="M46 52 L54 52 L50 58 Z" fill="#ffd44d" strokeWidth={2} />
      <path d="M30 54 L12 50 M30 59 L12 61 M70 54 L88 50 M70 59 L88 61" strokeWidth={2} />
      <path d="M47 84 L34 76 L37 92 Z" fill="#e94f64" />
      <path d="M53 84 L66 76 L63 92 Z" fill="#e94f64" />
      <rect x="46" y="80" width="8" height="8" fill="#d13a50" />
    </svg>
  );
}

export function KittyPRiso() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-hidden="true" focusable="false" fill="none" stroke="#3a3142" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
      <path d="M19 51 C19 33 31 25 47 25 C63 25 75 33 75 51 C75 67 63 77 47 77 C31 77 19 67 19 51 Z" fill="#ece4ee" stroke="none" />
      <path d="M25 40 L20 10 L43 24 Z" fill="#ffffff" />
      <path d="M27 34 L24 18 L36 25 Z" fill="#ffc9d8" stroke="none" />
      <path d="M75 40 L80 10 L57 24 Z" fill="#ffffff" />
      <path d="M73 34 L76 18 L64 25 Z" fill="#ffc9d8" stroke="none" />
      <path d="M22 48 C22 30 34 22 50 22 C66 22 78 30 78 48 C78 64 66 74 50 74 C34 74 22 64 22 48 Z" fill="#ffffff" />
      <ellipse cx="40" cy="47" rx="3.5" ry="4.5" fill="#3a3142" stroke="none" />
      <ellipse cx="60" cy="47" rx="3.5" ry="4.5" fill="#3a3142" stroke="none" />
      <path d="M46 56 L54 56 L50 61 Z" fill="#ffd44d" strokeWidth={2} />
      <circle cx="28" cy="60" r="2.2" fill="#3a3142" stroke="none" />
      <circle cx="33" cy="65" r="2" fill="#3a3142" stroke="none" />
      <circle cx="24" cy="63" r="1.4" fill="#3a3142" stroke="none" />
      <circle cx="28" cy="68" r="1.6" fill="#3a3142" stroke="none" />
      <circle cx="38" cy="69" r="1.6" fill="#3a3142" stroke="none" />
      <circle cx="34" cy="71" r="1.2" fill="#3a3142" stroke="none" />
      <circle cx="66" cy="58" r="2" fill="#f6a9c0" stroke="none" />
      <circle cx="71" cy="62" r="1.6" fill="#f6a9c0" stroke="none" />
      <circle cx="66" cy="64" r="1.4" fill="#f6a9c0" stroke="none" />
      <circle cx="61" cy="62" r="1.2" fill="#f6a9c0" stroke="none" />
      <path d="M30 56 L10 52 M30 61 L10 63 M70 56 L90 52 M70 61 L90 63" strokeWidth={2} />
      <path d="M28 74 C20 66 14 70 18 78 C21 83 27 80 28 74 Z" fill="#e94f64" />
      <path d="M32 74 C36 64 44 68 40 76 C38 80 33 78 32 74 Z" fill="#e94f64" />
      <circle cx="30" cy="74" r="3" fill="#d13a50" />
    </svg>
  );
}

export function KittyPTailTied() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-hidden="true" focusable="false" fill="none" stroke="#3a3142" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
      <path d="M28 98 C26 72 34 58 50 58 C66 58 74 72 72 98 Z" fill="#ffffff" />
      <path d="M32 96 C32 80 36 70 44 66 C40 76 38 86 38 96 Z" fill="#ece4ee" stroke="none" />
      <path d="M68 82 C84 80 92 66 86 52 C84 48 80 48 81 53 C86 66 80 76 66 77 Z" fill="#ffffff" />
      <path d="M30 36 L26 16 L43 26 Z" fill="#ffffff" />
      <path d="M31 32 L29 22 L38 27 Z" fill="#ffc9d8" stroke="none" />
      <path d="M62 36 L66 16 L50 25 Z" fill="#ffffff" />
      <path d="M61 32 L63 22 L55 26 Z" fill="#ffc9d8" stroke="none" />
      <path d="M28 44 C28 30 36 24 46 24 C56 24 64 30 64 44 C64 55 56 61 46 61 C36 61 28 55 28 44 Z" fill="#ffffff" />
      <path d="M35 44 Q40 40 45 44 Q40 47 35 44 Z" fill="#3a3142" stroke="none" />
      <path d="M49 44 Q54 40 59 44 Q54 47 49 44 Z" fill="#3a3142" stroke="none" />
      <path d="M44 51 L52 51 L48 56 Z" fill="#ffd44d" strokeWidth={2} />
      <path d="M30 52 L14 48 M30 57 L14 59 M62 52 L78 48 M62 57 L78 59" strokeWidth={2} />
      <path d="M84 49 C78 38 70 42 76 50 Z" fill="#e94f64" />
      <path d="M86 50 C96 42 98 52 90 56 Z" fill="#e94f64" />
      <circle cx="85" cy="50" r="3" fill="#d13a50" />
    </svg>
  );
}

export function KittyPBandana() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-hidden="true" focusable="false" fill="none" stroke="#3a3142" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
      <path d="M16 100 C18 82 30 72 50 72 C70 72 82 82 84 100 Z" fill="#ffffff" />
      <path d="M26 68 L74 68 L50 94 Z" fill="#e94f64" />
      <path d="M50 68 L74 68 L50 94 Z" fill="#d13a50" stroke="none" />
      <path d="M27 38 L22 12 L43 24 Z" fill="#ffffff" />
      <path d="M29 33 L26 19 L37 25 Z" fill="#ffc9d8" stroke="none" />
      <path d="M73 38 L78 12 L57 24 Z" fill="#ffffff" />
      <path d="M71 33 L74 19 L63 25 Z" fill="#ffc9d8" stroke="none" />
      <path d="M24 46 C24 29 34 21 50 21 C66 21 76 29 76 46 C76 60 65 69 50 69 C35 69 24 60 24 46 Z" fill="#ffffff" />
      <path d="M34 45 Q40 42 46 45 Q40 50 34 45 Z" fill="#3a3142" stroke="none" />
      <path d="M54 45 Q60 42 66 45 Q60 50 54 45 Z" fill="#3a3142" stroke="none" />
      <path d="M35 39 L45 41 M65 39 L55 41" strokeWidth={2} />
      <path d="M46 52 L54 52 L50 57 Z" fill="#ffd44d" strokeWidth={2} />
      <path d="M50 57 V60" strokeWidth={2} />
      <path d="M30 53 L12 49 M30 58 L12 60 M70 53 L88 49 M70 58 L88 60" strokeWidth={2} />
      <path d="M74 74 L86 80 L84 86 L72 78 Z" fill="#e94f64" />
      <path d="M75 72 L88 70 L86 76 Z" fill="#e94f64" />
      <circle cx="72" cy="72" r="4" fill="#d13a50" />
    </svg>
  );
}

export function KittyPPerched() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-hidden="true" focusable="false" fill="none" stroke="#3a3142" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
      <path d="M12 96 H88" strokeWidth={2} />
      <path d="M64 90 C78 94 90 88 88 78 C87 73 81 73 83 78 C85 86 76 88 64 86 Z" fill="#ffffff" />
      <path d="M30 94 C30 72 36 60 50 60 C64 60 70 72 70 94 Z" fill="#ffffff" />
      <ellipse cx="41" cy="92" rx="6" ry="4" fill="#ffffff" />
      <ellipse cx="59" cy="92" rx="6" ry="4" fill="#ffffff" />
      <path d="M32 32 L27 12 L44 22 Z" fill="#ffffff" />
      <path d="M33 28 L31 18 L40 24 Z" fill="#ffc9d8" stroke="none" />
      <path d="M68 32 L73 12 L56 22 Z" fill="#ffffff" />
      <path d="M67 28 L69 18 L60 24 Z" fill="#ffc9d8" stroke="none" />
      <path d="M30 40 C30 26 38 20 50 20 C62 20 70 26 70 40 C70 52 62 58 50 58 C38 58 30 52 30 40 Z" fill="#ffffff" />
      <path d="M38 41 Q42 37 46 41 M54 41 Q58 37 62 41" strokeWidth={2} />
      <path d="M46 48 L54 48 L50 53 Z" fill="#ffd44d" strokeWidth={2} />
      <path d="M32 50 L14 46 M32 55 L14 57 M68 50 L86 46 M68 55 L86 57" strokeWidth={2} />
      <path d="M47 63 C39 55 33 58 35 66 C37 72 44 69 47 63 Z" fill="#e94f64" />
      <path d="M53 63 C61 55 67 58 65 66 C63 72 56 69 53 63 Z" fill="#e94f64" />
      <circle cx="50" cy="63" r="3.5" fill="#d13a50" />
    </svg>
  );
}

// The pick — Sprinter concept restyled to a standing Hello-Kitty-inspired
// figure, then cropped to an upper-body bust like the knight portrait; this
// is the live KittyPortrait in CharacterPortraits.tsx.
function BustPortrait() {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="#3a3142"
      strokeWidth={3}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <ellipse cx="28" cy="80" rx="5.5" ry="9" fill="#ffffff" transform="rotate(-14 28 80)" />
      <ellipse cx="72" cy="80" rx="5.5" ry="9" fill="#ffffff" transform="rotate(14 72 80)" />
      <path d="M 31 100 C 31 87 36 77 43 63 L 57 63 C 64 77 69 87 69 100 Z" fill="#e94f64" />
      <rect x="45" y="70" width="10" height="7.5" rx="2" fill="#d13a50" stroke="none" />
      <path d="M 22 27 C 18.5 17 23.5 8 30 8 C 36 8 39.5 12 41 17.8 A 34 23 0 0 1 59 17.8 C 60.5 12 64 8 70 8 C 76.5 8 81.5 17 78 27 A 34 23 0 1 1 22 27 Z" fill="#ffffff" />
      <path d="M 25.5 23.5 C 24.5 16.5 26.5 13 29.5 12.5 C 32 13.5 33.5 16 34.5 20 Z" fill="#f6a9c0" stroke="none" />
      <path d="M 74.5 23.5 C 75.5 16.5 73.5 13 70.5 12.5 C 68 13.5 66.5 16 65.5 20 Z" fill="#f6a9c0" stroke="none" />
      <ellipse cx="50" cy="58" rx="14" ry="2.8" fill="#ece4ee" stroke="none" />
      <path d="M 70 13.5 C 66.5 7.5 61 8.5 62 13.5 C 63 18.5 67.5 18.5 70 13.5 Z" fill="#e94f64" />
      <path d="M 70 13.5 C 73.5 7.5 79 8.5 78 13.5 C 77 18.5 72.5 18.5 70 13.5 Z" fill="#e94f64" />
      <circle cx="70" cy="13.5" r="3" fill="#d13a50" />
      <ellipse cx="36" cy="46" rx="2.8" ry="3.8" fill="#3a3142" stroke="none" />
      <ellipse cx="64" cy="46" rx="2.8" ry="3.8" fill="#3a3142" stroke="none" />
      <ellipse cx="50" cy="49.5" rx="3.5" ry="2.5" fill="#ffd44d" strokeWidth={2} />
      <path d="M 9 44 L 27 46.5" strokeWidth={2} />
      <path d="M 9 51 L 27 51" strokeWidth={2} />
      <path d="M 9 58 L 28 55.5" strokeWidth={2} />
      <path d="M 91 44 L 73 46.5" strokeWidth={2} />
      <path d="M 91 51 L 73 51" strokeWidth={2} />
      <path d="M 91 58 L 72 55.5" strokeWidth={2} />
    </svg>
  );
}

// The pick's source pose — the full standing figure before the upper-body
// crop, kept for the record.
function StandingPortrait() {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="#3a3142"
      strokeWidth={3}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M 20 84 L 27 84" stroke="#f6a9c0" />
      <path d="M 18 90 L 25 90" stroke="#f6a9c0" />
      <rect x="37" y="84" width="11" height="14" rx="5" fill="#ffffff" />
      <rect x="52" y="84" width="11" height="14" rx="5" fill="#ffffff" />
      <ellipse cx="29" cy="71" rx="6" ry="9.5" fill="#ffffff" transform="rotate(-12 29 71)" />
      <path d="M 34 61 Q 34 59 36 59 L 64 59 Q 66 59 66 61 L 69 85 Q 69.5 88 66 88 L 34 88 Q 30.5 88 31 85 Z" fill="#e94f64" />
      <rect x="44" y="70" width="12" height="8" rx="2" fill="#d13a50" stroke="none" />
      <path d="M 24 21 C 21 8 25 2 31 2 C 37 2 42 5 45 8.4 A 30 26 0 0 1 55 8.4 C 58 5 63 2 69 2 C 75 2 79 8 76 21 A 30 26 0 1 1 24 21 Z" fill="#ffffff" />
      <path d="M 27 18 C 25.5 10 27.5 6 31 5.5 C 34.5 6 37.5 8.5 40 11 Z" fill="#f6a9c0" stroke="none" />
      <path d="M 73 18 C 74.5 10 72.5 6 69 5.5 C 65.5 6 62.5 8.5 60 11 Z" fill="#f6a9c0" stroke="none" />
      <ellipse cx="50" cy="55" rx="11" ry="2.5" fill="#ece4ee" stroke="none" />
      <ellipse cx="72" cy="58" rx="6" ry="10" fill="#ffffff" transform="rotate(28 72 58)" />
      <path d="M 26 17 C 22 11 16 12 17 17 C 18 22 23 22 26 17 Z" fill="#e94f64" />
      <path d="M 26 17 C 30 11 36 12 35 17 C 34 22 29 22 26 17 Z" fill="#e94f64" />
      <circle cx="26" cy="17" r="2.8" fill="#d13a50" />
      <ellipse cx="40" cy="32" rx="2.8" ry="3.8" fill="#3a3142" stroke="none" />
      <ellipse cx="60" cy="32" rx="2.8" ry="3.8" fill="#3a3142" stroke="none" />
      <ellipse cx="50" cy="38" rx="3.5" ry="2.5" fill="#ffd44d" strokeWidth={2} />
      <path d="M 17 31 L 30 34" strokeWidth={2} />
      <path d="M 17 38 L 30 38" strokeWidth={2} />
      <path d="M 17 45 L 30 42" strokeWidth={2} />
      <path d="M 83 31 L 70 34" strokeWidth={2} />
      <path d="M 83 38 L 70 38" strokeWidth={2} />
      <path d="M 83 45 L 70 42" strokeWidth={2} />
    </svg>
  );
}

type PortraitEntry = { label: string; name: string; look: string; Mark: () => ReactElement };

const PORTRAITS: readonly PortraitEntry[] = [
  {
    label: "the pick · live",
    name: "Hello bust (upper body)",
    look: "Proportions matched to the official Hello Kitty art (reference-images/hello-kitty.png): a flat-wide 1.48:1 head with small ears, wide-set low face, long whiskers, the bow worn on the upper-right ear, red pinafore at the crop line. Now live in the game.",
    Mark: BustPortrait,
  },
  {
    label: "the pick's source pose",
    name: "Hello Standing (full)",
    look: "The standing bipedal figure before the crop — kept for the record of how the bust was framed.",
    Mark: StandingPortrait,
  },
  {
    label: "attempt 2 · rejected",
    name: "the old reference",
    look: "Round head, ribbon bow, glossy eyes, w-mouth — kept only as the bar the pick had to beat.",
    Mark: AttemptTwoPortrait,
  },
  {
    label: "candidate 1",
    name: "Sentinel",
    look: "Stoic frontal bust mirroring the knight's poster framing; half-lidded ink eyes, tall ears, long whiskers, red bow moved to the throat as a collar.",
    Mark: KittyPSentinel,
  },
  {
    label: "candidate 2",
    name: "Sprinter",
    look: "Full mini-figure lunging right with speed lines; four legs and a raised tail sell motion, nape bow streams behind as two red ribbons.",
    Mark: KittyPSprinter,
  },
  {
    label: "candidate 3",
    name: "Cameo",
    look: "Cameo oval with a left-facing profile bust; nose bump, two ears and forward whiskers make it unmistakably cat, tiny bow at the nape.",
    Mark: KittyPCameo,
  },
  {
    label: "candidate 4",
    name: "Crest",
    look: "Heraldic escutcheon with a stern cat mask; slanted brows match the knight's gravity, the bow reinterpreted as a red ribbon scroll below.",
    Mark: KittyPCrest,
  },
  {
    label: "candidate 5",
    name: "Badge",
    look: "Round sticker with white rim; ears and whiskers punch through the disc so the cat reads at 68px, bow dangles at the bottom edge.",
    Mark: KittyPBadge,
  },
  {
    label: "candidate 6",
    name: "Papercut",
    look: "Faceted paper-cut head with an offset shadow layer; ears stacked on top as separate cut-outs, folded angular bow at the collar.",
    Mark: KittyPPapercut,
  },
  {
    label: "candidate 7",
    name: "Riso",
    look: "Riso-print poster face: misregistered shadow plate, flat halftone dots for shading and blush, bow tied asymmetrically at the jaw.",
    Mark: KittyPRiso,
  },
  {
    label: "candidate 8",
    name: "TailTied",
    look: "Seen from behind, head turned over the shoulder; the body silhouette and raised tail with the bow at its tip carry the identity.",
    Mark: KittyPTailTied,
  },
  {
    label: "candidate 9",
    name: "Bandana",
    look: "Bow dropped; a red neckerchief knotted at the side keeps the signature colour while narrowed brows read as a runner, not a doll.",
    Mark: KittyPBandana,
  },
  {
    label: "candidate 10",
    name: "Perched",
    look: "Classic sitting-cat silhouette on a ledge, tail wrapped; serene closed-arc eyes avoid kawaii, ears and whiskers dominate, bow at the collar.",
    Mark: KittyPPerched,
  },
];

// Two sizes side by side = the exact desktop/mobile renders of the select card.
function PortraitCard({ entry }: { entry: PortraitEntry }) {
  const { Mark } = entry;
  return (
    <article className="ashen-card">
      <div className="portrait-round-stage">
        <span className="portrait-round-box" style={{ width: 96, height: 96 }}>
          <Mark />
        </span>
        <span className="portrait-round-box" style={{ width: 68, height: 68 }}>
          <Mark />
        </span>
      </div>
      <div className="ashen-copy">
        <p className="ashen-topline">{entry.label}</p>
        <h3 className="ashen-name">{entry.name}</h3>
        <p className="ashen-block">{entry.look}</p>
      </div>
    </article>
  );
}

export function KittyPortraitRoundSection() {
  return (
    <section className="art-variant-section" aria-label="Cat portrait round">
      <div className="art-variant-head">
        <p className="art-variant-label">cat portrait · concept rethink · decided</p>
        <h2 className="art-variant-name">sprinter, restyled standing</h2>
        <p className="art-variant-thesis">
          The owner picked <strong>Sprinter</strong> and directed: make it read as Hello Kitty,
          make it stand, then crop it to the upper body like the knight portrait. The first card
          below — head + jumper shoulders in the frame — is live in the game's character select.
          The source pose and the other nine concepts remain for reference.
        </p>
      </div>
      <div className="ashen-grid">
        {PORTRAITS.map((entry) => (
          <PortraitCard key={entry.label} entry={entry} />
        ))}
      </div>
    </section>
  );
}
