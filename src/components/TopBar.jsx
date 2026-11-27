import React from 'react';
import { formatCountdown } from '../utils/azan.js';
import { formatPlaybackTime } from '../utils/watchProgress.js';
import AppIcon from './AppIcon.jsx';

export default function TopBar({
  title,
  sourceLabel,
  isSourceLoaded,
  nextPrayerInfo,
  kidsTimer,
  now,
  showBackButton,
  onBackHome,
  onOpenAzan,
  onOpenKids,
}) {
  const prayer = nextPrayerInfo && nextPrayerInfo.prayer;
  const countdown = nextPrayerInfo ? formatCountdown(nextPrayerInfo.remainingMs) : '--:--';

  const clockStr = now
    ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        {showBackButton && onBackHome && (
          <button
            type="button"
            data-focusable="true"
            className="tv-btn small"
            style={{ marginBottom: 0, marginRight: 16 }}
            onClick={onBackHome}
          >
            ← Back to Categories
          </button>
        )}
        <h2 className="page-heading">{title}</h2>
        <span className={'source-pill' + (isSourceLoaded ? ' online' : '')}>
          {sourceLabel || 'No Playlist Loaded'}
        </span>
      </div>

      <div className="top-bar-right">
        {kidsTimer && kidsTimer.active && (
          <button
            type="button"
            data-focusable="true"
            className="status-pill kids-timer"
            onClick={onOpenKids}
            title="Kids Watch Timer"
          >
            <AppIcon name="kids" size={18} style={{ marginRight: 6 }} />
            <span>Kids Timer: {formatPlaybackTime(kidsTimer.remainingSeconds)}</span>
          </button>
        )}

        {prayer && (
          <button
            type="button"
            data-focusable="true"
            className="status-pill prayer"
            onClick={onOpenAzan}
            title="Next Prayer Countdown"
          >
            <span dir="rtl" style={{ marginRight: 8 }}>{prayer.ar}</span>
            <span>• {prayer.en} in {countdown}</span>
          </button>
        )}

        <div className="clock-pill">{clockStr}</div>
      </div>
    </header>
  );
}
