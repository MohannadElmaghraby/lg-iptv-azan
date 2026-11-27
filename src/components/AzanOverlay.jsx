import React from 'react';
import { formatPrayerClock } from '../utils/azan.js';

export default function AzanOverlay({ activePrayer, wasVideoPaused, onDismiss }) {
  if (!activePrayer) return null;

  return (
    <div className="azan-overlay" data-modal-scope="azan-overlay">
      <div className="azan-box">
        <svg width="78" height="78" viewBox="0 0 80 80" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="rgba(212, 175, 55, 0.12)" stroke="#d4af37" strokeWidth="2" />
          <path
            d="M46 20 C35 23 28 32 28 42 C28 53 37 62 48 62 C52 62 56 61 59 58 C53 60 47 59 42 54 C36 49 35 39 39 31 C41 26 43 23 46 20 Z"
            fill="#f0c94d"
          />
          <polygon points="56,24 58,29 63,29 59,32 61,37 56,34 51,37 53,32 49,29 54,29" fill="#f0c94d" />
        </svg>

        <div className="azan-title-ar" dir="rtl">
          حان الآن موعد أذان {activePrayer.ar}
        </div>
        <div className="azan-title-en">
          Time for {activePrayer.en} Prayer • {formatPrayerClock(activePrayer.time || new Date())}
        </div>

        <div style={{ fontSize: 17, color: '#98a2b3', marginBottom: 28 }}>
          {wasVideoPaused
            ? 'Your video has been paused automatically and will resume when Azan finishes.'
            : 'Playing Arabic Azan — press OK or Back on your LG remote to dismiss.'}
        </div>

        <button
          type="button"
          data-focusable="true"
          className="tv-btn primary"
          onClick={onDismiss}
        >
          ✓ Dismiss &amp; {wasVideoPaused ? 'Resume Playback' : 'Return'}
        </button>
      </div>
    </div>
  );
}
