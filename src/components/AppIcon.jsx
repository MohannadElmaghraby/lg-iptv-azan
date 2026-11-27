import React from 'react';

/**
 * Crisp inline SVG icons for LG webOS 4.0 (Chromium 53).
 * Avoids newer Unicode emojis (🎞, 🧸, 🕌, ⏱, etc.) that render as empty boxes on 2018 LG TVs.
 */
export default function AppIcon({ name, size = 24, color, style }) {
  const s = size;
  const wrapStyle = Object.assign(
    {
      display: 'inline-block',
      verticalAlign: 'middle',
      flexShrink: 0,
    },
    style || {}
  );

  switch (name) {
    case 'live':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" style={wrapStyle} aria-hidden="true">
          <rect x="6" y="16" width="52" height="36" rx="7" fill="#0f2942" stroke={color || '#38bdf8'} strokeWidth="4" />
          <line x1="22" y1="16" x2="15" y2="6" stroke={color || '#38bdf8'} strokeWidth="4" strokeLinecap="round" />
          <line x1="42" y1="16" x2="49" y2="6" stroke={color || '#38bdf8'} strokeWidth="4" strokeLinecap="round" />
          <polygon points="27,26 27,42 42,34" fill="#38bdf8" />
          <circle cx="48" cy="24" r="3.5" fill="#ef4444" />
          <line x1="22" y1="57" x2="42" y2="57" stroke={color || '#38bdf8'} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'movies':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" style={wrapStyle} aria-hidden="true">
          <rect x="8" y="24" width="48" height="32" rx="6" fill="#2c1f08" stroke={color || '#f59e0b'} strokeWidth="4" />
          <path d="M8 24 L56 24 L53 12 L11 12 Z" fill="#f59e0b" />
          <line x1="20" y1="12" x2="16" y2="24" stroke="#1c1204" strokeWidth="4" />
          <line x1="34" y1="12" x2="30" y2="24" stroke="#1c1204" strokeWidth="4" />
          <line x1="48" y1="12" x2="44" y2="24" stroke="#1c1204" strokeWidth="4" />
          <polygon points="27,32 27,48 41,40" fill="#fde68a" />
        </svg>
      );

    case 'series':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" style={wrapStyle} aria-hidden="true">
          <rect x="6" y="14" width="52" height="38" rx="6" fill="#1e1538" stroke={color || '#a78bfa'} strokeWidth="4" />
          <rect x="11" y="19" width="6" height="6" rx="1.5" fill="#c4b5fd" />
          <rect x="11" y="30" width="6" height="6" rx="1.5" fill="#c4b5fd" />
          <rect x="11" y="41" width="6" height="6" rx="1.5" fill="#c4b5fd" />
          <rect x="47" y="19" width="6" height="6" rx="1.5" fill="#c4b5fd" />
          <rect x="47" y="30" width="6" height="6" rx="1.5" fill="#c4b5fd" />
          <rect x="47" y="41" width="6" height="6" rx="1.5" fill="#c4b5fd" />
          <rect x="21" y="21" width="22" height="24" rx="3" fill="#2e1f5e" stroke="#a78bfa" strokeWidth="2.5" />
          <polygon points="29,27 29,39 39,33" fill="#e9d5ff" />
        </svg>
      );

    case 'kids':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" style={wrapStyle} aria-hidden="true">
          <circle cx="17" cy="18" r="9" fill="#d97706" stroke="#92400e" strokeWidth="3" />
          <circle cx="17" cy="18" r="4.5" fill="#fde68a" />
          <circle cx="47" cy="18" r="9" fill="#d97706" stroke="#92400e" strokeWidth="3" />
          <circle cx="47" cy="18" r="4.5" fill="#fde68a" />
          <circle cx="32" cy="34" r="22" fill="#f59e0b" stroke="#92400e" strokeWidth="3" />
          <ellipse cx="32" cy="40" rx="11" ry="8.5" fill="#fef3c7" />
          <circle cx="24" cy="30" r="3" fill="#1f2937" />
          <circle cx="40" cy="30" r="3" fill="#1f2937" />
          <ellipse cx="32" cy="36.5" rx="4" ry="2.8" fill="#451a03" />
          <path d="M27 42 Q32 46 37 42" fill="none" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'azan':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" style={wrapStyle} aria-hidden="true">
          <path
            d="M36 10 C24 13 16 23 16 35 C16 48 26 57 39 57 C45 57 50 55 54 51 C47 53 39 51 34 45 C27 38 26 27 31 18 C33 15 34 12 36 10 Z"
            fill={color || '#f0c94d'}
          />
          <polygon
            points="47,14 49.5,20 56,20.5 51,24.5 52.5,31 47,27.5 41.5,31 43,24.5 38,20.5 44.5,20"
            fill={color || '#f0c94d'}
          />
        </svg>
      );

    case 'search':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" style={wrapStyle} aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke={color || 'currentColor'} strokeWidth="2.4" />
          <line x1="15.5" y1="15.5" x2="21" y2="21" stroke={color || 'currentColor'} strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      );

    case 'timer':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" style={wrapStyle} aria-hidden="true">
          <line x1="9" y1="2.5" x2="15" y2="2.5" stroke={color || 'currentColor'} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="12" cy="13.5" r="8" fill="none" stroke={color || 'currentColor'} strokeWidth="2.2" />
          <line x1="12" y1="13.5" x2="12" y2="9" stroke={color || 'currentColor'} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="12" y1="13.5" x2="15.5" y2="15" stroke={color || 'currentColor'} strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    case 'bell':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" style={wrapStyle} aria-hidden="true">
          <path d="M18 15V10a6 6 0 0 0-12 0v5l-2 2.5h16L18 15z" fill={color || 'currentColor'} />
          <circle cx="12" cy="20" r="2" fill={color || 'currentColor'} />
        </svg>
      );

    case 'bellOff':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" style={wrapStyle} aria-hidden="true">
          <path d="M18 15V10a6 6 0 0 0-12 0v5l-2 2.5h16L18 15z" fill="none" stroke={color || 'currentColor'} strokeWidth="2" />
          <line x1="3" y1="3" x2="21" y2="21" stroke={color || '#ef4444'} strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );

    case 'speaker':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" style={wrapStyle} aria-hidden="true">
          <polygon points="3,9 8,9 14,4 14,20 8,15 3,15" fill={color || 'currentColor'} />
          <path d="M17 8.5 Q20 12 17 15.5" fill="none" stroke={color || 'currentColor'} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M19.5 6 Q23.5 12 19.5 18" fill="none" stroke={color || 'currentColor'} strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    case 'game':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" style={wrapStyle} aria-hidden="true">
          <rect x="3" y="9" width="26" height="15" rx="7" fill="#1e293b" stroke={color || '#38bdf8'} strokeWidth="2.5" />
          <line x1="10" y1="13.5" x2="10" y2="19.5" stroke="#38bdf8" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="7" y1="16.5" x2="13" y2="16.5" stroke="#38bdf8" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="21" cy="14.5" r="1.8" fill="#facc15" />
          <circle cx="24" cy="17.5" r="1.8" fill="#22c55e" />
        </svg>
      );

    case 'learn':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" style={wrapStyle} aria-hidden="true">
          <polygon points="16,5 30,12 16,19 2,12" fill={color || '#f0c94d'} />
          <path d="M8 15.5 V22.5 C8 25 12 27 16 27 C20 27 24 25 24 22.5 V15.5" fill="none" stroke={color || '#f0c94d'} strokeWidth="2.5" />
          <line x1="28" y1="13" x2="28" y2="23" stroke={color || '#f0c94d'} strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );

    case 'folder':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" style={wrapStyle} aria-hidden="true">
          <path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" fill={color || '#f0c94d'} />
        </svg>
      );

    case 'globe':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" style={wrapStyle} aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke={color || 'currentColor'} strokeWidth="2" />
          <ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke={color || 'currentColor'} strokeWidth="1.8" />
          <line x1="3" y1="12" x2="21" y2="12" stroke={color || 'currentColor'} strokeWidth="1.8" />
        </svg>
      );

    case 'settings':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" style={wrapStyle} aria-hidden="true">
          <circle cx="12" cy="12" r="3.5" fill="none" stroke={color || 'currentColor'} strokeWidth="2.4" />
          <path
            d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"
            stroke={color || 'currentColor'}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'home':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" style={wrapStyle} aria-hidden="true">
          <path d="M3 11.5 L12 4 L21 11.5 V20 H15 V14 H9 V20 H3 Z" fill={color || 'currentColor'} />
        </svg>
      );

    case 'star':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" style={wrapStyle} aria-hidden="true">
          <polygon
            points="12,2 15,9 22,9.5 16.8,14 18.5,21 12,17.2 5.5,21 7.2,14 2,9.5 9,9"
            fill={color || '#facc15'}
          />
        </svg>
      );

    case 'wave':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" style={wrapStyle} aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill="#facc15" stroke="#f59e0b" strokeWidth="3" />
          <circle cx="22" cy="26" r="3.8" fill="#78350f" />
          <circle cx="42" cy="26" r="3.8" fill="#78350f" />
          <path d="M20 38 Q32 50 44 38" fill="none" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
          <circle cx="16" cy="35" r="4" fill="#fb7185" opacity="0.5" />
          <circle cx="48" cy="35" r="4" fill="#fb7185" opacity="0.5" />
        </svg>
      );

    default:
      return null;
  }
}
