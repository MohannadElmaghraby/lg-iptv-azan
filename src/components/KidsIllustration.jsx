import React from 'react';

const EMOJI_SVG_MAP = {
  '⭐': 'star',
  '🌟': 'star',
  '🍎': 'apple',
  '🦆': 'duck',
  '🚗': 'car',
  '🏎️': 'car',
  '🌸': 'flower',
  '🎈': 'balloon',
  '🍓': 'strawberry',
  '🐝': 'bee',
  '🚀': 'rocket',
  '🦁': 'lion',
  '🐱': 'cat',
  '🐶': 'dog',
  '🐄': 'cow',
  '🐘': 'elephant',
  '🐦': 'bird',
  '🐟': 'fish',
  '🐑': 'sheep',
  '🍪': 'cookie',
  '🏆': 'trophy',
  '🦋': 'butterfly',
  '🍌': 'banana',
  '🍉': 'watermelon',
  '🥭': 'mango',
  '🍇': 'grapes',
  '🥕': 'carrot',
  '🥛': 'milk',
  '🎁': 'gift',
  '☀️': 'sun',
  '🌙': 'moon',
};

export function mapVisualToKind(visual) {
  return EMOJI_SVG_MAP[visual] || visual;
}

/**
 * Crisp inline SVG cartoon illustrations for LG webOS 4.0 (Chromium 53).
 * Avoids newer Unicode emojis (like Duck, Butterfly, Teddy) that render blank on 2018 TVs.
 */
export default function KidsIllustration({ kind, size = 100 }) {
  const s = size;

  switch (kind) {
    case 'star':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <polygon
            points="50,8 63,35 93,39 71,60 76,90 50,76 24,90 29,60 7,39 37,35"
            fill="#facc15"
            stroke="#f59e0b"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <circle cx="42" cy="48" r="3.5" fill="#78350f" />
          <circle cx="58" cy="48" r="3.5" fill="#78350f" />
          <path d="M43 58 Q50 64 57 58" fill="none" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'apple':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <path d="M50 24 C50 14 57 9 64 9" fill="none" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="62" cy="18" rx="11" ry="6" transform="rotate(-25 62 18)" fill="#22c55e" />
          <path d="M50 28 C30 20 15 34 15 56 C15 78 32 92 46 89 C49 88 51 88 54 89 C68 92 85 78 85 56 C85 34 70 20 50 28 Z" fill="#ef4444" />
          <ellipse cx="34" cy="42" rx="6" ry="12" transform="rotate(18 34 42)" fill="rgba(255,255,255,0.28)" />
        </svg>
      );

    case 'duck':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          {/* Body */}
          <ellipse cx="48" cy="66" rx="31" ry="22" fill="#facc15" />
          {/* Wing */}
          <ellipse cx="44" cy="67" rx="16" ry="11" fill="#eab308" />
          {/* Head */}
          <circle cx="64" cy="36" r="19" fill="#facc15" />
          {/* Orange Beak */}
          <path d="M80 35 C92 35 95 43 81 45 L76 42 Z" fill="#f97316" />
          {/* Eye */}
          <circle cx="69" cy="31" r="3.5" fill="#1e293b" />
          <circle cx="70" cy="30" r="1.2" fill="#ffffff" />
          {/* Tuft */}
          <path d="M60 18 Q58 10 65 13" fill="none" stroke="#eab308" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'car':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <path d="M22 54 L32 32 L68 32 L78 54 Z" fill="#38bdf8" />
          <path d="M35 36 L47 36 L47 52 L27 52 Z" fill="#e0f2fe" />
          <path d="M53 36 L65 36 L73 52 L53 52 Z" fill="#e0f2fe" />
          <rect x="12" y="50" width="76" height="24" rx="10" fill="#0284c7" />
          <circle cx="30" cy="76" r="11" fill="#1e293b" stroke="#94a3b8" strokeWidth="3" />
          <circle cx="70" cy="76" r="11" fill="#1e293b" stroke="#94a3b8" strokeWidth="3" />
          <circle cx="84" cy="59" r="4" fill="#fde047" />
        </svg>
      );

    case 'flower':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <circle cx="50" cy="24" r="16" fill="#f472b6" />
          <circle cx="74" cy="41" r="16" fill="#f472b6" />
          <circle cx="65" cy="70" r="16" fill="#f472b6" />
          <circle cx="35" cy="70" r="16" fill="#f472b6" />
          <circle cx="26" cy="41" r="16" fill="#f472b6" />
          <circle cx="50" cy="50" r="16" fill="#fde047" stroke="#f59e0b" strokeWidth="3" />
          <circle cx="45" cy="47" r="2.5" fill="#78350f" />
          <circle cx="55" cy="47" r="2.5" fill="#78350f" />
          <path d="M45 55 Q50 60 55 55" fill="none" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'balloon':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <path d="M50 74 Q45 84 52 94" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
          <polygon points="45,74 55,74 50,67" fill="#3b82f6" />
          <ellipse cx="50" cy="40" rx="26" ry="31" fill="#3b82f6" />
          <ellipse cx="39" cy="28" rx="6" ry="11" transform="rotate(20 39 28)" fill="rgba(255,255,255,0.35)" />
        </svg>
      );

    case 'strawberry':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <path d="M32 24 L42 15 L50 24 L58 15 L68 24 L50 32 Z" fill="#22c55e" />
          <path d="M22 36 C20 26 35 22 50 24 C65 22 80 26 78 36 C75 62 60 88 50 88 C40 88 25 62 22 36 Z" fill="#f43f5e" />
          <circle cx="38" cy="42" r="2.5" fill="#fde047" />
          <circle cx="54" cy="40" r="2.5" fill="#fde047" />
          <circle cx="64" cy="50" r="2.5" fill="#fde047" />
          <circle cx="44" cy="56" r="2.5" fill="#fde047" />
          <circle cx="56" cy="64" r="2.5" fill="#fde047" />
          <circle cx="48" cy="74" r="2.5" fill="#fde047" />
        </svg>
      );

    case 'bee':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <ellipse cx="38" cy="30" rx="13" ry="18" transform="rotate(-25 38 30)" fill="#bae6fd" opacity="0.85" />
          <ellipse cx="60" cy="30" rx="13" ry="18" transform="rotate(25 60 30)" fill="#bae6fd" opacity="0.85" />
          <ellipse cx="50" cy="58" rx="28" ry="20" fill="#facc15" />
          <rect x="38" y="40" width="8" height="36" rx="3" fill="#1e293b" />
          <rect x="54" y="40" width="8" height="36" rx="3" fill="#1e293b" />
          <circle cx="72" cy="52" r="3" fill="#1e293b" />
        </svg>
      );

    case 'rocket':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <polygon points="32,58 16,74 34,74" fill="#ef4444" />
          <polygon points="68,58 84,74 66,74" fill="#ef4444" />
          <path d="M50 10 C67 26 70 54 64 74 L36 74 C30 54 33 26 50 10 Z" fill="#e2e8f0" />
          <path d="M50 10 C60 20 64 28 65 34 L35 34 C36 28 40 20 50 10 Z" fill="#ef4444" />
          <circle cx="50" cy="48" r="10" fill="#38bdf8" stroke="#0284c7" strokeWidth="3" />
          <polygon points="42,74 58,74 50,92" fill="#f97316" />
        </svg>
      );

    case 'lion':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          {/* Mane */}
          <circle cx="50" cy="50" r="38" fill="#b45309" />
          <circle cx="50" cy="14" r="10" fill="#b45309" />
          <circle cx="80" cy="28" r="10" fill="#b45309" />
          <circle cx="84" cy="58" r="10" fill="#b45309" />
          <circle cx="68" cy="82" r="10" fill="#b45309" />
          <circle cx="32" cy="82" r="10" fill="#b45309" />
          <circle cx="16" cy="58" r="10" fill="#b45309" />
          <circle cx="20" cy="28" r="10" fill="#b45309" />
          {/* Ears & Face */}
          <circle cx="28" cy="28" r="9" fill="#f59e0b" />
          <circle cx="72" cy="28" r="9" fill="#f59e0b" />
          <circle cx="50" cy="52" r="25" fill="#fbbf24" />
          <ellipse cx="50" cy="60" rx="12" ry="9" fill="#fde68a" />
          <polygon points="45,55 55,55 50,61" fill="#78350f" />
          <circle cx="40" cy="45" r="3.5" fill="#1e293b" />
          <circle cx="60" cy="45" r="3.5" fill="#1e293b" />
        </svg>
      );

    case 'cat':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <polygon points="22,42 24,14 44,30" fill="#fb923c" />
          <polygon points="78,42 76,14 56,30" fill="#fb923c" />
          <circle cx="50" cy="56" r="30" fill="#fdba74" />
          <circle cx="39" cy="50" r="4" fill="#1e293b" />
          <circle cx="61" cy="50" r="4" fill="#1e293b" />
          <polygon points="46,58 54,58 50,63" fill="#f43f5e" />
          <path d="M16 54 L32 58 M16 64 L32 62 M84 54 L68 58 M84 64 L68 62" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'dog':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <ellipse cx="22" cy="52" rx="12" ry="22" transform="rotate(14 22 52)" fill="#92400e" />
          <ellipse cx="78" cy="52" rx="12" ry="22" transform="rotate(-14 78 52)" fill="#92400e" />
          <circle cx="50" cy="52" r="28" fill="#d97706" />
          <ellipse cx="50" cy="61" rx="15" ry="12" fill="#fde68a" />
          <circle cx="39" cy="45" r="4" fill="#1e293b" />
          <circle cx="61" cy="45" r="4" fill="#1e293b" />
          <ellipse cx="50" cy="56" rx="6" ry="4.5" fill="#1e293b" />
          <path d="M46 66 Q50 74 54 66" fill="#f43f5e" />
        </svg>
      );

    case 'cow':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <path d="M26 28 Q16 14 28 16" fill="none" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
          <path d="M74 28 Q84 14 72 16" fill="none" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="22" cy="38" rx="11" ry="6" fill="#1e293b" />
          <ellipse cx="78" cy="38" rx="11" ry="6" fill="#1e293b" />
          <circle cx="50" cy="52" r="28" fill="#f8fafc" />
          <circle cx="36" cy="38" r="9" fill="#1e293b" />
          <ellipse cx="50" cy="64" rx="20" ry="14" fill="#fbcfe8" />
          <circle cx="42" cy="63" r="3" fill="#9d174d" />
          <circle cx="58" cy="63" r="3" fill="#9d174d" />
          <circle cx="39" cy="46" r="3.5" fill="#1e293b" />
          <circle cx="61" cy="46" r="3.5" fill="#1e293b" />
        </svg>
      );

    case 'elephant':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <ellipse cx="22" cy="50" rx="18" ry="24" fill="#94a3b8" />
          <ellipse cx="78" cy="50" rx="18" ry="24" fill="#94a3b8" />
          <ellipse cx="22" cy="50" rx="11" ry="16" fill="#fbcfe8" />
          <ellipse cx="78" cy="50" rx="11" ry="16" fill="#fbcfe8" />
          <circle cx="50" cy="48" r="24" fill="#cbd5e1" />
          <path d="M46 54 Q46 84 62 82" fill="none" stroke="#cbd5e1" strokeWidth="11" strokeLinecap="round" />
          <circle cx="40" cy="42" r="3.5" fill="#1e293b" />
          <circle cx="60" cy="42" r="3.5" fill="#1e293b" />
        </svg>
      );

    case 'bird':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <ellipse cx="48" cy="56" rx="28" ry="22" fill="#38bdf8" />
          <ellipse cx="42" cy="58" rx="14" ry="10" fill="#0284c7" />
          <circle cx="66" cy="36" r="16" fill="#38bdf8" />
          <polygon points="80,34 94,39 80,44" fill="#f59e0b" />
          <circle cx="70" cy="33" r="3.2" fill="#1e293b" />
          <line x1="42" y1="77" x2="42" y2="89" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
          <line x1="56" y1="77" x2="56" y2="89" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'fish':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <polygon points="24,50 6,30 6,70" fill="#f97316" />
          <ellipse cx="54" cy="50" rx="32" ry="22" fill="#fb923c" />
          <path d="M46 30 Q54 50 46 70" fill="none" stroke="#ffffff" strokeWidth="4" />
          <circle cx="72" cy="45" r="4" fill="#1e293b" />
          <circle cx="73" cy="44" r="1.4" fill="#ffffff" />
        </svg>
      );

    case 'sheep':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <circle cx="50" cy="32" r="18" fill="#f8fafc" />
          <circle cx="32" cy="46" r="18" fill="#f8fafc" />
          <circle cx="68" cy="46" r="18" fill="#f8fafc" />
          <circle cx="38" cy="66" r="18" fill="#f8fafc" />
          <circle cx="62" cy="66" r="18" fill="#f8fafc" />
          <ellipse cx="26" cy="46" rx="10" ry="6" fill="#334155" />
          <ellipse cx="74" cy="46" rx="10" ry="6" fill="#334155" />
          <ellipse cx="50" cy="54" rx="17" ry="19" fill="#334155" />
          <circle cx="43" cy="50" r="3" fill="#ffffff" />
          <circle cx="57" cy="50" r="3" fill="#ffffff" />
        </svg>
      );

    case 'cookie':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="38" fill="#d97706" stroke="#92400e" strokeWidth="4" />
          <circle cx="36" cy="38" r="5" fill="#451a03" />
          <circle cx="60" cy="34" r="4.5" fill="#451a03" />
          <circle cx="48" cy="54" r="5.5" fill="#451a03" />
          <circle cx="65" cy="60" r="5" fill="#451a03" />
          <circle cx="34" cy="65" r="4.5" fill="#451a03" />
        </svg>
      );

    case 'trophy':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <path d="M26 22 L74 22 L70 52 C68 64 59 70 50 70 C41 70 32 64 30 52 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="3" />
          <path d="M26 28 C14 28 14 48 28 48" fill="none" stroke="#eab308" strokeWidth="5" />
          <path d="M74 28 C86 28 86 48 72 48" fill="none" stroke="#eab308" strokeWidth="5" />
          <rect x="44" y="70" width="12" height="14" fill="#eab308" />
          <rect x="30" y="83" width="40" height="9" rx="4" fill="#b45309" />
        </svg>
      );

    case 'butterfly':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <ellipse cx="32" cy="38" rx="20" ry="16" transform="rotate(-20 32 38)" fill="#a855f7" />
          <ellipse cx="68" cy="38" rx="20" ry="16" transform="rotate(20 68 38)" fill="#a855f7" />
          <ellipse cx="34" cy="64" rx="16" ry="14" transform="rotate(15 34 64)" fill="#ec4899" />
          <ellipse cx="66" cy="64" rx="16" ry="14" transform="rotate(-15 66 64)" fill="#ec4899" />
          <rect x="46" y="28" width="8" height="48" rx="4" fill="#1e293b" />
          <path d="M48 28 Q40 14 34 16 M52 28 Q60 14 66 16" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'banana':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <path d="M20 72 C38 82 72 68 80 22 C84 36 82 76 48 86 C34 90 22 82 20 72 Z" fill="#facc15" stroke="#eab308" strokeWidth="3" />
          <rect x="76" y="18" width="6" height="9" rx="2" fill="#78350f" />
        </svg>
      );

    case 'watermelon':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <path d="M12 42 A38 38 0 0 0 88 42 Z" fill="#16a34a" />
          <path d="M18 42 A32 32 0 0 0 82 42 Z" fill="#ef4444" />
          <circle cx="36" cy="54" r="2.5" fill="#1e293b" />
          <circle cx="50" cy="60" r="2.5" fill="#1e293b" />
          <circle cx="64" cy="54" r="2.5" fill="#1e293b" />
        </svg>
      );

    case 'mango':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <ellipse cx="52" cy="54" rx="26" ry="34" transform="rotate(24 52 54)" fill="#f59e0b" />
          <ellipse cx="58" cy="20" rx="11" ry="5" transform="rotate(-25 58 20)" fill="#22c55e" />
        </svg>
      );

    case 'grapes':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <path d="M50 12 L50 26" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
          <circle cx="38" cy="38" r="12" fill="#9333ea" />
          <circle cx="62" cy="38" r="12" fill="#a855f7" />
          <circle cx="32" cy="56" r="12" fill="#a855f7" />
          <circle cx="50" cy="56" r="12" fill="#9333ea" />
          <circle cx="68" cy="56" r="12" fill="#a855f7" />
          <circle cx="42" cy="74" r="12" fill="#9333ea" />
          <circle cx="58" cy="74" r="12" fill="#7e22ce" />
        </svg>
      );

    case 'carrot':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <path d="M46 28 Q36 10 44 12 M50 28 Q50 8 56 12 M54 28 Q64 12 60 22" fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" />
          <path d="M32 32 C32 24 68 24 68 32 L54 88 C52 92 48 92 46 88 Z" fill="#f97316" />
        </svg>
      );

    case 'milk':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <rect x="28" y="24" width="44" height="64" rx="8" fill="#f8fafc" stroke="#94a3b8" strokeWidth="3" />
          <rect x="34" y="12" width="32" height="14" rx="4" fill="#38bdf8" />
          <rect x="32" y="46" width="36" height="22" rx="4" fill="#bae6fd" />
        </svg>
      );

    case 'gift':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <rect x="18" y="38" width="64" height="50" rx="8" fill="#ef4444" />
          <rect x="14" y="28" width="72" height="16" rx="5" fill="#f87171" />
          <rect x="44" y="28" width="12" height="60" fill="#facc15" />
          <circle cx="40" cy="22" r="9" fill="none" stroke="#facc15" strokeWidth="5" />
          <circle cx="60" cy="22" r="9" fill="none" stroke="#facc15" strokeWidth="5" />
        </svg>
      );

    case 'sun':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="24" fill="#facc15" />
          <g stroke="#f59e0b" strokeWidth="5" strokeLinecap="round">
            <line x1="50" y1="8" x2="50" y2="18" />
            <line x1="50" y1="82" x2="50" y2="92" />
            <line x1="8" y1="50" x2="18" y2="50" />
            <line x1="82" y1="50" x2="92" y2="50" />
            <line x1="20" y1="20" x2="28" y2="28" />
            <line x1="72" y1="72" x2="80" y2="80" />
            <line x1="80" y1="20" x2="72" y2="28" />
            <line x1="28" y1="72" x2="20" y2="80" />
          </g>
        </svg>
      );

    case 'moon':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <path d="M62 16 C40 19 24 36 24 56 C24 76 41 90 62 90 C70 90 77 88 83 84 C69 87 56 83 47 73 C36 60 36 39 48 26 C52 21 57 18 62 16 Z" fill="#facc15" />
        </svg>
      );

    case 'speaker':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100">
          <polygon points="20,40 38,40 58,22 58,78 38,60 20,60" fill="#38bdf8" />
          <path d="M68 38 Q78 50 68 62" fill="none" stroke="#facc15" strokeWidth="5" strokeLinecap="round" />
          <path d="M77 28 Q92 50 77 72" fill="none" stroke="#facc15" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );

    default:
      return <span style={{ fontSize: Math.round(s * 0.78), lineHeight: 1 }}>{kind || '⭐'}</span>;
  }
}
