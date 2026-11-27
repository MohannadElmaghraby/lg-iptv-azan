import React from 'react';

export const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'live', label: 'Live TV', icon: '📺' },
  { id: 'movies', label: 'Movies', icon: '🎬' },
  { id: 'series', label: 'Series', icon: '🎞' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'favorites', label: 'Favorites', icon: '★' },
  { id: 'kids', label: 'Kids & Timer', icon: '🧸' },
  { id: 'azan', label: 'Prayer & Azan', icon: '🕌' },
  { id: 'settings', label: 'Sources & Setup', icon: '⚙' },
];

export default function Sidebar({ activeTab, onSelectTab, counts }) {
  return (
    <aside className="tv-sidebar" aria-label="Primary Navigation">
      <div className="brand-box">
        <div className="brand-title-row">
          <h1 className="brand-title">Asyad TV</h1>
          <span className="brand-ar"><span dir="rtl" style={{ unicodeBidi: 'isolate' }}>أسياد</span> TV</span>
        </div>
        <div className="brand-dedication">
          Asser &amp; Eyad • <span dir="rtl">آسر وإياد</span>
        </div>
      </div>

      <nav className="nav-list">
        {NAV_ITEMS.map(function (item) {
          const isActive = activeTab === item.id;
          let badge = null;
          if (item.id === 'live' && counts.live > 0) badge = counts.live;
          else if (item.id === 'movies' && counts.movies > 0) badge = counts.movies;
          else if (item.id === 'series' && counts.series > 0) badge = counts.series;
          else if (item.id === 'favorites' && counts.favorites > 0) badge = counts.favorites;

          return (
            <button
              key={item.id}
              type="button"
              data-focusable="true"
              data-nav-id={item.id}
              className={'nav-btn' + (isActive ? ' active' : '')}
              onClick={function () { onSelectTab(item.id); }}
            >
              <span className="nav-btn-icon">{item.icon}</span>
              <span>{item.label}</span>
              {badge !== null && (
                <span className="nav-btn-badge">{badge.toLocaleString()}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div>LG OLED E8 • webOS 4.0</div>
        <div>D-Pad &amp; Magic Remote Ready</div>
      </div>
    </aside>
  );
}
