import React, { useState, useMemo, useEffect } from 'react';
import MediaCard from './MediaCard.jsx';
import TvKeyboard from './TvKeyboard.jsx';
import { isFavoriteItem } from '../utils/favorites.js';
import { prepareSearchIndex, searchCatalog } from '../utils/search.js';
import { findWatchProgressForItem } from '../utils/watchProgress.js';

const PAGE_SIZE = 36;

export default function CategoryView({
  categoryType, // 'live' | 'movies' | 'series'
  title,
  items,
  groups,
  favorites,
  continueWatching,
  onSelectItem,
  onResumeItem,
  onRemoveContinueItem,
  onToggleFavorite,
  onBackHome,
}) {
  const [selectedMenu, setSelectedMenu] = useState('ALL'); // 'ALL' | 'CONTINUE' | 'FAVORITES' | groupName
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [page, setPage] = useState(0);

  // Reset sidebar menu and search when switching category
  useEffect(function () {
    setSelectedMenu('ALL');
    setQuery('');
    setDebouncedQuery('');
    setShowKeyboard(false);
    setPage(0);
  }, [categoryType]);

  // Fast 80ms debounced instant auto-search while typing
  useEffect(function () {
    const t = setTimeout(function () {
      setDebouncedQuery(query);
      setPage(0);
    }, 80);
    return function () { clearTimeout(t); };
  }, [query]);

  const categoryContinue = useMemo(function () {
    return (continueWatching || []).filter(function (c) {
      if (categoryType === 'movies') return c.type === 'movies';
      if (categoryType === 'series') return c.type === 'series';
      return c.type === 'live';
    });
  }, [continueWatching, categoryType]);

  const categoryFavorites = useMemo(function () {
    return (favorites || []).filter(function (f) { return f.type === categoryType; });
  }, [favorites, categoryType]);

  const groupCounts = useMemo(function () {
    const map = {};
    const list = items || [];
    for (let i = 0; i < list.length; i += 1) {
      const g = list[i].group || 'Uncategorized';
      map[g] = (map[g] || 0) + 1;
    }
    return map;
  }, [items]);

  const baseList = useMemo(function () {
    if (selectedMenu === 'CONTINUE') return categoryContinue;
    if (selectedMenu === 'FAVORITES') return categoryFavorites;
    if (selectedMenu === 'ALL') return items || [];
    return (items || []).filter(function (it) {
      return (it.group || 'Uncategorized') === selectedMenu;
    });
  }, [selectedMenu, items, categoryContinue, categoryFavorites]);

  const searchIndex = useMemo(function () {
    return prepareSearchIndex(baseList);
  }, [baseList]);

  const filteredItems = useMemo(function () {
    if (!debouncedQuery.trim()) return baseList;
    return searchCatalog(searchIndex, debouncedQuery, { category: 'all', limit: 240 }).results;
  }, [baseList, searchIndex, debouncedQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const visibleSlice = useMemo(function () {
    const start = safePage * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, safePage]);

  return (
    <div className="category-workspace">
      {/* Left IPTV Category Menu */}
      <aside className="tv-sidebar" aria-label={title + ' Categories'}>
        <button
          type="button"
          data-focusable="true"
          className="tv-btn small"
          style={{ width: '100%', marginRight: 0, marginBottom: 14, justifyContent: 'flex-start' }}
          onClick={onBackHome}
        >
          ← Back to Categories
        </button>

        <div style={{ padding: '4px 10px 12px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f0c94d' }}>{title}</div>
          <div style={{ fontSize: 13, color: '#98a2b3', marginTop: 2 }}>
            {(items || []).length.toLocaleString()} items
          </div>
        </div>

        <div className="nav-list">
          <button
            type="button"
            data-focusable="true"
            className={'nav-btn' + (selectedMenu === 'ALL' ? ' active' : '')}
            onClick={function () { setSelectedMenu('ALL'); setPage(0); }}
          >
            <span>All Content</span>
            <span className="nav-btn-badge">{(items || []).length.toLocaleString()}</span>
          </button>

          {categoryType !== 'live' && (
            <button
              type="button"
              data-focusable="true"
              className={'nav-btn' + (selectedMenu === 'CONTINUE' ? ' active' : '')}
              onClick={function () { setSelectedMenu('CONTINUE'); setPage(0); }}
            >
              <span>Continue Watching</span>
              <span className="nav-btn-badge">{categoryContinue.length}</span>
            </button>
          )}

          <button
            type="button"
            data-focusable="true"
            className={'nav-btn' + (selectedMenu === 'FAVORITES' ? ' active' : '')}
            onClick={function () { setSelectedMenu('FAVORITES'); setPage(0); }}
          >
            <span>★ Favorites</span>
            <span className="nav-btn-badge">{categoryFavorites.length}</span>
          </button>

          {groups && groups.length > 0 && (
            <div style={{ fontSize: 12, fontWeight: 800, color: '#667085', margin: '14px 10px 8px 10px', textTransform: 'uppercase' }}>
              IPTV Categories
            </div>
          )}

          {(groups || []).map(function (grp) {
            return (
              <button
                key={grp}
                type="button"
                data-focusable="true"
                className={'nav-btn' + (selectedMenu === grp ? ' active' : '')}
                onClick={function () { setSelectedMenu(grp); setPage(0); }}
              >
                <span dir="auto" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
                  {grp}
                </span>
                <span className="nav-btn-badge">{(groupCounts[grp] || 0).toLocaleString()}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Content + Instant Auto-Search */}
      <div className="category-main">
        <div className="panel" style={{ padding: '14px 18px', marginBottom: 18 }}>
          <div className="form-row" style={{ alignItems: 'center', marginBottom: 0 }}>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <input
                type="text"
                data-focusable="true"
                className="tv-input"
                dir="auto"
                placeholder={'Instant search in ' + title + ' (English or العربية)...'}
                value={query}
                onChange={function (e) { setQuery(e.target.value); }}
              />
            </div>
            {query && (
              <button
                type="button"
                data-focusable="true"
                className="tv-btn small danger"
                style={{ marginBottom: 0 }}
                onClick={function () { setQuery(''); }}
              >
                ✕ Clear
              </button>
            )}
            <button
              type="button"
              data-focusable="true"
              className="tv-btn small"
              style={{ marginBottom: 0 }}
              onClick={function () { setShowKeyboard(!showKeyboard); }}
            >
              {showKeyboard ? 'Hide Keyboard' : '⌨ TV Keyboard'}
            </button>
          </div>
        </div>

        {showKeyboard && <TvKeyboard value={query} onChange={setQuery} />}

        {totalPages > 1 && (
          <div className="section-header" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 15, color: '#98a2b3' }}>
              Showing {(safePage * PAGE_SIZE + 1).toLocaleString()}–
              {Math.min((safePage + 1) * PAGE_SIZE, filteredItems.length).toLocaleString()} of{' '}
              {filteredItems.length.toLocaleString()} (Page {safePage + 1} / {totalPages})
            </div>
            <div className="btn-row">
              <button
                type="button"
                data-focusable="true"
                className="tv-btn small"
                disabled={safePage === 0}
                onClick={function () { setPage(Math.max(0, safePage - 1)); }}
              >
                ◀ Prev Page
              </button>
              <button
                type="button"
                data-focusable="true"
                className="tv-btn small"
                disabled={safePage >= totalPages - 1}
                onClick={function () { setPage(Math.min(totalPages - 1, safePage + 1)); }}
              >
                Next Page ▶
              </button>
            </div>
          </div>
        )}

        {visibleSlice.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '52px 24px' }}>
            <h3 style={{ fontSize: 22, margin: '0 0 8px 0' }}>
              {debouncedQuery
                ? 'No matches for "' + debouncedQuery + '"'
                : selectedMenu === 'CONTINUE'
                  ? 'Nothing in Continue Watching yet'
                  : 'No items in this category'}
            </h3>
            <p style={{ fontSize: 15, color: '#98a2b3', margin: 0 }}>
              {items && items.length === 0
                ? 'Load your M3U_Plus URL or Xtream Codes credentials in Sources & Setup.'
                : 'Try another category on the left or clear your search filter.'}
            </p>
          </div>
        ) : (
          <div className="cards-grid">
            {visibleSlice.map(function (item) {
              const isContinue = selectedMenu === 'CONTINUE';
              const savedProg = !isContinue && categoryType !== 'live'
                ? findWatchProgressForItem(continueWatching, item)
                : null;
              const cardItem = savedProg
                ? Object.assign({}, item, {
                    currentTime: savedProg.currentTime,
                    duration: savedProg.duration,
                    progressPercent: savedProg.progressPercent,
                  })
                : item;
              return (
                <MediaCard
                  key={item.id}
                  item={cardItem}
                  isFavorite={isFavoriteItem(favorites, item.id)}
                  onSelect={isContinue ? onResumeItem : onSelectItem}
                  onToggleFavorite={onToggleFavorite}
                  onRemoveProgress={isContinue ? onRemoveContinueItem : null}
                  showProgress={isContinue || Boolean(savedProg)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
