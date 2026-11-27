import React from 'react';
import AppIcon from './AppIcon.jsx';

export const NAV_ITEMS = [
  { id: 'home', label: 'Home', iconName: 'home' },
  { id: 'live', label: 'Live TV', iconName: 'live' },
  { id: 'movies', label: 'Movies', iconName: 'movies' },
  { id: 'series', label: 'Series', iconName: 'series' },
  { id: 'search', label: 'Search', iconName: 'search' },
  { id: 'favorites', label: 'Favorites', iconName: 'star' },
  { id: 'kids', label: 'Kids & Timer', iconName: 'kids' },
  { id: 'azan', label: 'Prayer & Azan', iconName: 'azan' },
  { id: 'settings', label: 'Sources & Setup', iconName: 'settings' },
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
              <span className="nav-btn-icon">
                <AppIcon name={item.iconName} size={22} />
              </span>
              <span>{item.label}</span>
              {badge !== null && (
                <span className="nav-btn-badge">{badge.toLocaleString()}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div>Asyad TV v1.3.5 • LG OLED E8</div>
        <div>webOS 4.0 • D-Pad &amp; Magic Remote</div>
      </div>
    </aside>
  );
}
