import React from 'react';
import MediaCard from './MediaCard.jsx';
import { isFavoriteItem } from '../utils/favorites.js';

export default function HomeView({
  catalog,
  continueWatching,
  favorites,
  onSelectItem,
  onResumeItem,
  onRemoveContinueItem,
  onClearAllContinue,
  onToggleFavorite,
  onNavigate,
}) {
  const livePreview = (catalog.live || []).slice(0, 12);
  const moviesPreview = (catalog.movies || []).slice(0, 12);

  return (
    <div>
      {/* Quick Welcome Banner */}
      <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: 26, margin: '0 0 6px 0', color: '#f0c94d' }}>
            Asyad TV • <span dir="rtl" style={{ unicodeBidi: 'isolate' }}>أسياد</span> TV
          </h3>
          <div style={{ fontSize: 16, color: '#98a2b3' }}>
            Dedicated to <strong style={{ color: '#f5f7fa' }}>Asser &amp; Eyad</strong> (<span dir="rtl">آسر وإياد</span>) — Fast OLED IPTV, Kids Learning &amp; Offline Arabic Azan
          </div>
        </div>
        <div className="btn-row">
          <button
            type="button"
            data-focusable="true"
            className="tv-btn primary"
            onClick={function () { onNavigate('search'); }}
          >
            🔍 Search All
          </button>
          <button
            type="button"
            data-focusable="true"
            className="tv-btn"
            onClick={function () { onNavigate('kids'); }}
          >
            🧸 Kids &amp; Timer
          </button>
          <button
            type="button"
            data-focusable="true"
            className="tv-btn"
            onClick={function () { onNavigate('azan'); }}
          >
            🕌 Prayer &amp; Azan
          </button>
          <button
            type="button"
            data-focusable="true"
            className="tv-btn"
            onClick={function () { onNavigate('settings'); }}
          >
            ⚙ Sources
          </button>
        </div>
      </div>

      {/* Continue Watching Section */}
      {continueWatching && continueWatching.length > 0 && (
        <section style={{ marginBottom: 28 }}>
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

      {/* Favorites Quick Row */}
      {favorites && favorites.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div className="section-header">
            <h3 className="section-title">★ Favorites</h3>
            <button
              type="button"
              data-focusable="true"
              className="tv-btn small"
              onClick={function () { onNavigate('favorites'); }}
            >
              View All ({favorites.length})
            </button>
          </div>
          <div className="cards-grid">
            {favorites.slice(0, 6).map(function (item) {
              return (
                <MediaCard
                  key={item.id}
                  item={item}
                  isFavorite
                  onSelect={onSelectItem}
                  onToggleFavorite={onToggleFavorite}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Live TV Preview */}
      {livePreview.length > 0 ? (
        <section style={{ marginBottom: 28 }}>
          <div className="section-header">
            <h3 className="section-title">📺 Live TV ({catalog.live.length.toLocaleString()})</h3>
            <button
              type="button"
              data-focusable="true"
              className="tv-btn small"
              onClick={function () { onNavigate('live'); }}
            >
              Browse All Live TV ▶
            </button>
          </div>
          <div className="cards-grid">
            {livePreview.map(function (item) {
              return (
                <MediaCard
                  key={item.id}
                  item={item}
                  isFavorite={isFavoriteItem(favorites, item.id)}
                  onSelect={onSelectItem}
                  onToggleFavorite={onToggleFavorite}
                />
              );
            })}
          </div>
        </section>
      ) : (
        <div className="panel" style={{ textAlign: 'center', padding: '42px 24px' }}>
          <h3 style={{ fontSize: 24, margin: '0 0 10px 0' }}>Ready for Your IPTV Playlist</h3>
          <p style={{ fontSize: 16, color: '#98a2b3', margin: '0 0 22px 0' }}>
            Connect an M3U_Plus URL, upload a local .m3u file, sign in with Xtream Codes, or load free public channels.
          </p>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              data-focusable="true"
              className="tv-btn primary"
              onClick={function () { onNavigate('settings'); }}
            >
              ⚙ Configure IPTV Source
            </button>
            <button
              type="button"
              data-focusable="true"
              className="tv-btn emerald"
              onClick={function () { onNavigate('kids'); }}
            >
              🧸 Open Kids Learning (Asser &amp; Eyad)
            </button>
          </div>
        </div>
      )}

      {/* Movies Preview */}
      {moviesPreview.length > 0 && (
        <section>
          <div className="section-header">
            <h3 className="section-title">🎬 Movies ({catalog.movies.length.toLocaleString()})</h3>
            <button
              type="button"
              data-focusable="true"
              className="tv-btn small"
              onClick={function () { onNavigate('movies'); }}
            >
              Browse All Movies ▶
            </button>
          </div>
          <div className="cards-grid">
            {moviesPreview.map(function (item) {
              return (
                <MediaCard
                  key={item.id}
                  item={item}
                  isFavorite={isFavoriteItem(favorites, item.id)}
                  onSelect={onSelectItem}
                  onToggleFavorite={onToggleFavorite}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
