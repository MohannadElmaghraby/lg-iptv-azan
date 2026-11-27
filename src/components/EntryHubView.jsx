import React from 'react';
import MediaCard from './MediaCard.jsx';
import { isFavoriteItem } from '../utils/favorites.js';
import { formatCountdown } from '../utils/azan.js';

export default function EntryHubView({
  catalog,
  continueWatching,
  favorites,
  nextPrayerInfo,
  kidsTimer,
  onNavigate,
  onResumeItem,
  onRemoveContinueItem,
  onClearAllContinue,
  onToggleFavorite,
}) {
  const prayer = nextPrayerInfo && nextPrayerInfo.prayer;
  const countdown = nextPrayerInfo ? formatCountdown(nextPrayerInfo.remainingMs) : '--:--';

  const mainCategories = [
    {
      id: 'live',
      title: 'Live TV',
      ar: 'البث المباشر',
      icon: '📺',
      accent: '#38bdf8',
      meta: catalog.live.length > 0 ? catalog.live.length.toLocaleString() + ' Channels' : 'Browse Live Channels',
    },
    {
      id: 'movies',
      title: 'Movies',
      ar: 'الأفلام',
      icon: '🎬',
      accent: '#f59e0b',
      meta: catalog.movies.length > 0 ? catalog.movies.length.toLocaleString() + ' Movies' : 'Browse Movies',
    },
    {
      id: 'series',
      title: 'Series',
      ar: 'المسلسلات',
      icon: '🎞',
      accent: '#a78bfa',
      meta: catalog.series.length > 0 ? catalog.series.length.toLocaleString() + ' Series' : 'Browse Series',
    },
    {
      id: 'kids',
      title: 'Kids & Timer',
      ar: 'آسر وإياد',
      icon: '🧸',
      accent: '#22c55e',
      meta: kidsTimer && kidsTimer.active ? 'Timer active' : 'Games • Ages 3–4 • Timer',
    },
    {
      id: 'azan',
      title: 'Prayer & Azan',
      ar: 'الصلاة والأذان',
      icon: '🕌',
      accent: '#f0c94d',
      meta: prayer ? prayer.en + ' in ' + countdown : 'Offline Prayer Times',
    },
  ];

  return (
    <div>
      {/* Hero Brand Header */}
      <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 34, margin: '0 0 6px 0', color: '#f0c94d', fontWeight: 900 }}>
            Asyad TV • <span dir="rtl" style={{ unicodeBidi: 'isolate' }}>أسياد</span> TV
          </h1>
          <div style={{ fontSize: 17, color: '#98a2b3' }}>
            Dedicated to <strong style={{ color: '#f5f7fa' }}>Asser &amp; Eyad</strong> (<span dir="rtl">آسر وإياد</span>) — Choose a category to enter
          </div>
        </div>

        <div className="btn-row" style={{ marginBottom: 0 }}>
          <button
            type="button"
            data-focusable="true"
            className="tv-btn"
            style={{ marginBottom: 0 }}
            onClick={function () { onNavigate('search'); }}
          >
            🔍 Search All
          </button>
          <button
            type="button"
            data-focusable="true"
            className="tv-btn"
            style={{ marginBottom: 0 }}
            onClick={function () { onNavigate('favorites'); }}
          >
            ★ Favorites ({favorites.length})
          </button>
          <button
            type="button"
            data-focusable="true"
            className="tv-btn primary"
            style={{ marginBottom: 0 }}
            onClick={function () { onNavigate('settings'); }}
          >
            ⚙ Sources &amp; Setup
          </button>
        </div>
      </div>

      {/* Main Category Tiles */}
      <div className="hub-tiles-row">
        {mainCategories.map(function (cat) {
          return (
            <button
              key={cat.id}
              type="button"
              data-focusable="true"
              data-nav-id={cat.id}
              className="hub-tile"
              style={{ borderTop: '4px solid ' + cat.accent }}
              onClick={function () { onNavigate(cat.id); }}
            >
              <div className="hub-tile-icon">{cat.icon}</div>
              <div className="hub-tile-title">{cat.title}</div>
              <div className="hub-tile-ar" dir="rtl" style={{ color: cat.accent }}>
                {cat.ar}
              </div>
              <div className="hub-tile-meta">{cat.meta}</div>
            </button>
          );
        })}
      </div>

      {/* Continue Watching Row on Entry Screen */}
      {continueWatching && continueWatching.length > 0 && (
        <section style={{ marginTop: 26 }}>
          <div className="section-header">
            <div>
              <h3 className="section-title">Continue Watching</h3>
              <div className="section-subtitle">
                Pick up right where you left off — press ✕ to remove any item
              </div>
            </div>
            <button
              type="button"
              data-focusable="true"
              className="tv-btn small danger"
              onClick={onClearAllContinue}
            >
              Clear All
            </button>
          </div>

          <div className="cards-grid">
            {continueWatching.map(function (entry) {
              return (
                <MediaCard
                  key={entry.id}
                  item={entry}
                  isFavorite={isFavoriteItem(favorites, entry.id)}
                  onSelect={onResumeItem}
                  onToggleFavorite={onToggleFavorite}
                  onRemoveProgress={onRemoveContinueItem}
                  showProgress
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
