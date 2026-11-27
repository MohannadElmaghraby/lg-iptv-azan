import React, { useState, useMemo, useEffect } from 'react';
import MediaCard from './MediaCard.jsx';
import TvKeyboard from './TvKeyboard.jsx';
import { isFavoriteItem } from '../utils/favorites.js';
import {
  normalizeSearchText,
  prepareSearchIndex,
  searchCatalog,
  sortCatalogItems,
} from '../utils/search.js';
import { findWatchProgressForItem } from '../utils/watchProgress.js';
import { readStorage, writeStorage } from '../utils/storage.js';

const PAGE_SIZE = 25;
const INITIAL_GROUP_LIMIT = 50;
const SORT_PREFS_KEY = 'category_sort_v1';

const SORT_OPTIONS = [
  { id: 'default', label: 'Default' },
  { id: 'recent', label: 'Most Recent' },
  { id: 'az', label: 'A–Z' },
  { id: 'za', label: 'Z–A' },
];

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
  const [catQuery, setCatQuery] = useState('');
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [page, setPage] = useState(0);

  // Remembered sort preference per section ('live' | 'movies' | 'series')
  const [sortPrefs, setSortPrefs] = useState(function () {
    return readStorage(SORT_PREFS_KEY, {});
  });
  const sortMode = (sortPrefs && sortPrefs[categoryType]) || 'default';

  const handleSetSort = function (nextMode) {
    const nextPrefs = Object.assign({}, sortPrefs || {}, { [categoryType]: nextMode });
    setSortPrefs(nextPrefs);
    writeStorage(SORT_PREFS_KEY, nextPrefs);
    setPage(0);
  };

  // Reset sidebar menu and search when switching category (keep remembered sortMode!)
  useEffect(function () {
    setSelectedMenu('ALL');
    setCatQuery('');
    setShowAllGroups(false);
    setQuery('');
    setDebouncedQuery('');
    setShowKeyboard(false);
    setPage(0);
  }, [categoryType]);

  // Fast 100ms debounced instant auto-search while typing
  useEffect(function () {
    const t = setTimeout(function () {
      setDebouncedQuery(query);
      setPage(0);
    }, 100);
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

  // Single linear pass to pre-bucket items by IPTV category -> O(1) menu switching for 15k+ items
  const { byGroup, groupCounts } = useMemo(function () {
    const buckets = Object.create(null);
    const counts = Object.create(null);
    const list = items || [];
    for (let i = 0; i < list.length; i += 1) {
      const it = list[i];
      const g = it.group || 'Uncategorized';
      if (!buckets[g]) {
        buckets[g] = [it];
        counts[g] = 1;
      } else {
        buckets[g].push(it);
        counts[g] += 1;
      }
    }
    return { byGroup: buckets, groupCounts: counts };
  }, [items]);

  // Instant Arabic/English search across left-hand IPTV categories
  const filteredGroups = useMemo(function () {
    const all = groups || [];
    const norm = normalizeSearchText(catQuery);
    if (!norm) return all;
    return all.filter(function (g) {
      return normalizeSearchText(g).indexOf(norm) !== -1;
    });
  }, [groups, catQuery]);

  const visibleGroups = useMemo(function () {
    if (catQuery.trim() || showAllGroups || filteredGroups.length <= INITIAL_GROUP_LIMIT) {
      return filteredGroups;
    }
    return filteredGroups.slice(0, INITIAL_GROUP_LIMIT);
  }, [filteredGroups, catQuery, showAllGroups]);

  const baseList = useMemo(function () {
    if (selectedMenu === 'CONTINUE') return categoryContinue;
    if (selectedMenu === 'FAVORITES') return categoryFavorites;
    if (selectedMenu === 'ALL') return items || [];
    return byGroup[selectedMenu] || [];
  }, [selectedMenu, items, byGroup, categoryContinue, categoryFavorites]);

  // Lazy search index: ZERO blocking work on 15k+ items until the user actually types a search query!
  const hasSearchQuery = debouncedQuery.trim().length > 0;
  const searchIndex = useMemo(function () {
    if (!hasSearchQuery) return null;
    return prepareSearchIndex(baseList);
  }, [baseList, hasSearchQuery]);

  const filteredItems = useMemo(function () {
    if (hasSearchQuery && searchIndex) {
      const searched = searchCatalog(searchIndex, debouncedQuery, { category: 'all', limit: 240 }).results;
      return sortMode === 'default' ? searched : sortCatalogItems(searched, sortMode);
    }
    if (selectedMenu === 'CONTINUE') return baseList;
    return sortCatalogItems(baseList, sortMode);
  }, [baseList, searchIndex, hasSearchQuery, debouncedQuery, sortMode, selectedMenu]);

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
            <div style={{ margin: '14px 4px 10px 4px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#667085', margin: '0 6px 8px 6px', textTransform: 'uppercase' }}>
                IPTV Categories ({filteredGroups.length})
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  data-focusable="true"
                  className="tv-input"
                  dir="auto"
                  aria-label="Search categories"
                  placeholder="Search categories..."
                  style={{ padding: '8px 12px', fontSize: 14, flex: 1 }}
                  value={catQuery}
                  onChange={function (e) { setCatQuery(e.target.value); }}
                />
                {catQuery && (
                  <button
                    type="button"
                    data-focusable="true"
                    className="tv-btn small danger"
                    style={{ marginLeft: 6, marginRight: 0, marginBottom: 0, padding: '8px 10px' }}
                    onClick={function () { setCatQuery(''); }}
                    aria-label="Clear category search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {visibleGroups.map(function (grp) {
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

          {!catQuery.trim() && !showAllGroups && filteredGroups.length > INITIAL_GROUP_LIMIT && (
            <button
              type="button"
              data-focusable="true"
              className="tv-btn small"
              style={{ width: '100%', marginTop: 8, marginRight: 0 }}
              onClick={function () { setShowAllGroups(true); }}
            >
              Show all {filteredGroups.length} categories
            </button>
          )}

          {catQuery.trim() && filteredGroups.length === 0 && (
            <div style={{ fontSize: 13, color: '#98a2b3', padding: '10px 10px' }}>
              No matching categories
            </div>
          )}
        </div>
      </aside>

      {/* Main Content + Instant Auto-Search + Remembered Sort */}
      <div className="category-main">
        <div className="panel" style={{ padding: '14px 18px', marginBottom: 18 }}>
          <div className="form-row" style={{ alignItems: 'center', marginBottom: 12 }}>
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

          {/* Persistent Sort Controls */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#98a2b3', marginRight: 12 }}>
              Sort:
            </span>
            {SORT_OPTIONS.map(function (opt) {
              return (
                <button
                  key={opt.id}
                  type="button"
                  data-focusable="true"
                  className={'chip' + (sortMode === opt.id ? ' active' : '')}
                  style={{ marginBottom: 0, padding: '6px 14px', fontSize: 14 }}
                  onClick={function () { handleSetSort(opt.id); }}
                >
                  {opt.label}
                </button>
              );
            })}
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
