import React, { useState, useMemo, useEffect } from 'react';
import MediaCard from './MediaCard.jsx';
import TvKeyboard from './TvKeyboard.jsx';
import AppIcon from './AppIcon.jsx';
import { isFavoriteItem } from '../utils/favorites.js';
import {
  normalizeSearchText,
  prepareSearchIndex,
  searchCatalog,
  sortCatalogItems,
} from '../utils/search.js';
import { findWatchProgressForItem, formatPlaybackTime } from '../utils/watchProgress.js';
import { formatCountdown } from '../utils/azan.js';
import { readStorage, writeStorage } from '../utils/storage.js';

const PAGE_SIZE = 25;
const INITIAL_GROUP_LIMIT = 60;
const RECENT_LIST_LIMIT = 100;
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
  nextPrayerInfo,
  kidsTimer,
  onSelectItem,
  onResumeItem,
  onRemoveContinueItem,
  onToggleFavorite,
  onBackHome,
  onOpenAzan,
  onOpenKids,
}) {
  const [selectedMenu, setSelectedMenu] = useState('ALL'); // 'ALL' | 'CONTINUE' | 'RECENT' | 'FAVORITES' | groupName
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [catQuery, setCatQuery] = useState('');
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
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
    setSortOpen(false);
  };

  // Reset sidebar selection and search when switching category (keep remembered sortMode!)
  useEffect(function () {
    setSelectedMenu('ALL');
    setSidebarOpen(true);
    setCatQuery('');
    setShowAllGroups(false);
    setSearchOpen(false);
    setSortOpen(false);
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

  const recentlyAddedCount = Math.min((items || []).length, RECENT_LIST_LIMIT);

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
    if (selectedMenu === 'RECENT') return sortCatalogItems(items || [], 'recent').slice(0, RECENT_LIST_LIMIT);
    if (selectedMenu === 'FAVORITES') return categoryFavorites;
    if (selectedMenu === 'ALL') return items || [];
    return byGroup[selectedMenu] || [];
  }, [selectedMenu, items, byGroup, categoryContinue, categoryFavorites]);

  // Lazy search index: ZERO blocking work on 15k+ items until the user actually types a search query
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
    if (selectedMenu === 'CONTINUE' || selectedMenu === 'RECENT') return baseList;
    return sortCatalogItems(baseList, sortMode);
  }, [baseList, searchIndex, hasSearchQuery, debouncedQuery, sortMode, selectedMenu]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const visibleSlice = useMemo(function () {
    const start = safePage * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, safePage]);

  const activeCategoryLabel =
    selectedMenu === 'ALL'
      ? 'ALL ' + title.toUpperCase()
      : selectedMenu === 'CONTINUE'
        ? 'CONTINUE WATCHING'
        : selectedMenu === 'RECENT'
          ? 'RECENTLY ADDED'
          : selectedMenu === 'FAVORITES'
            ? 'FAVORITES'
            : selectedMenu;

  const isPosterWall = categoryType === 'movies' || categoryType === 'series';
  const activeIconName = categoryType === 'live' ? 'live' : categoryType === 'movies' ? 'movies' : 'series';
  const prayer = nextPrayerInfo && nextPrayerInfo.prayer;
  const countdown = nextPrayerInfo ? formatCountdown(nextPrayerInfo.remainingMs) : '--:--';
  const activeSortObj = SORT_OPTIONS.find(function (s) { return s.id === sortMode; }) || SORT_OPTIONS[0];

  return (
    <div className="smarters-workspace">
      {/* Left Collapsible IPTV Smarters Pro Sidebar */}
      {sidebarOpen && (
        <aside className="smarters-sidebar" aria-label={title + ' Categories'}>
          <div className="smarters-sidebar-header">
            <button
              type="button"
              data-focusable="true"
              className="smarters-icon-btn"
              onClick={onBackHome}
              title="Back to Categories"
              aria-label="Back to Categories"
            >
              ←
            </button>

            <div className="smarters-brand-center">
              <AppIcon name={activeIconName} size={30} color="#22d3ee" style={{ marginRight: 10 }} />
              <span>ASYAD</span>
              <span style={{ color: '#22d3ee', marginLeft: 5 }}>TV</span>
            </div>

            <button
              type="button"
              data-focusable="true"
              className="smarters-icon-btn"
              onClick={function () { setSidebarOpen(false); }}
              title="Collapse Categories Sidebar"
              aria-label="Collapse Categories Sidebar"
            >
              ✕
            </button>
          </div>

          {/* Search in Categories */}
          <div className="smarters-cat-search-wrap">
            <AppIcon name="search" size={18} color="#94a3b8" />
            <input
              type="text"
              data-focusable="true"
              className="smarters-cat-search-input"
              dir="auto"
              aria-label="Search in categories"
              placeholder="Search in categories"
              value={catQuery}
              onChange={function (e) { setCatQuery(e.target.value); }}
            />
            {catQuery && (
              <button
                type="button"
                data-focusable="true"
                className="smarters-icon-btn"
                style={{ minWidth: 32, height: 32, fontSize: 14, padding: 0 }}
                onClick={function () { setCatQuery(''); }}
                aria-label="Clear category search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Flat Full-Width IPTV Category List */}
          <div className="smarters-cat-list">
            {categoryType !== 'live' && (
              <button
                type="button"
                data-focusable="true"
                className={'smarters-cat-row' + (selectedMenu === 'CONTINUE' ? ' active' : '')}
                onClick={function () { setSelectedMenu('CONTINUE'); setPage(0); }}
              >
                <span className="smarters-cat-label">
                  <span className="smarters-cat-text">CONTINUE WATCHING</span>
                </span>
                <span className="smarters-cat-count">{categoryContinue.length}</span>
              </button>
            )}

            <button
              type="button"
              data-focusable="true"
              className={'smarters-cat-row' + (selectedMenu === 'RECENT' ? ' active' : '')}
              onClick={function () { setSelectedMenu('RECENT'); setPage(0); }}
            >
              <span className="smarters-cat-label">
                <span className="smarters-cat-text">RECENTLY ADDED</span>
              </span>
              <span className="smarters-cat-count">{recentlyAddedCount}</span>
            </button>

            <button
              type="button"
              data-focusable="true"
              className={'smarters-cat-row' + (selectedMenu === 'ALL' ? ' active' : '')}
              onClick={function () { setSelectedMenu('ALL'); setPage(0); }}
            >
              <span className="smarters-cat-label">
                <span className="smarters-cat-text">ALL CONTENT</span>
              </span>
              <span className="smarters-cat-count">{(items || []).length.toLocaleString()}</span>
            </button>

            <button
              type="button"
              data-focusable="true"
              className={'smarters-cat-row' + (selectedMenu === 'FAVORITES' ? ' active' : '')}
              onClick={function () { setSelectedMenu('FAVORITES'); setPage(0); }}
            >
              <span className="smarters-cat-label">
                <AppIcon name="star" size={18} color="#facc15" style={{ marginRight: 10 }} />
                <span className="smarters-cat-text">FAVORITES</span>
              </span>
              <span className="smarters-cat-count">{categoryFavorites.length}</span>
            </button>

            {visibleGroups.map(function (grp) {
              return (
                <button
                  key={grp}
                  type="button"
                  data-focusable="true"
                  className={'smarters-cat-row' + (selectedMenu === grp ? ' active' : '')}
                  onClick={function () { setSelectedMenu(grp); setPage(0); }}
                >
                  <span className="smarters-cat-label">
                    <AppIcon name={activeIconName} size={18} color="#22d3ee" style={{ marginRight: 10 }} />
                    <span className="smarters-cat-text" dir="auto">{grp}</span>
                  </span>
                  <span className="smarters-cat-count">{(groupCounts[grp] || 0).toLocaleString()}</span>
                </button>
              );
            })}

            {!catQuery.trim() && !showAllGroups && filteredGroups.length > INITIAL_GROUP_LIMIT && (
              <div style={{ padding: '12px 18px' }}>
                <button
                  type="button"
                  data-focusable="true"
                  className="tv-btn small"
                  style={{ width: '100%', marginRight: 0 }}
                  onClick={function () { setShowAllGroups(true); }}
                >
                  Show all {filteredGroups.length} categories
                </button>
              </div>
            )}

            {catQuery.trim() && filteredGroups.length === 0 && (
              <div style={{ fontSize: 15, color: '#94a3b8', padding: '16px 22px' }}>
                No matching categories
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Right Main Area: Slim Smarters Pro Header + Tall Poster Wall */}
      <div className="smarters-main">
        <header className="smarters-topbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {!sidebarOpen && (
              <>
                <button
                  type="button"
                  data-focusable="true"
                  className="smarters-icon-btn"
                  style={{ marginRight: 10 }}
                  onClick={onBackHome}
                  title="Back to Categories"
                  aria-label="Back to Categories"
                >
                  ←
                </button>
                <button
                  type="button"
                  data-focusable="true"
                  className="smarters-icon-btn"
                  style={{ marginRight: 12 }}
                  onClick={function () { setSidebarOpen(true); }}
                  title="Show Categories Sidebar"
                  aria-label="Show Categories Sidebar"
                >
                  ☰
                </button>
              </>
            )}

            {kidsTimer && kidsTimer.active && onOpenKids && (
              <button
                type="button"
                data-focusable="true"
                className="status-pill kids-timer"
                style={{ marginRight: 10, padding: '6px 12px', fontSize: 13 }}
                onClick={onOpenKids}
              >
                <AppIcon name="kids" size={16} style={{ marginRight: 6 }} />
                <span>{formatPlaybackTime(kidsTimer.remainingSeconds)}</span>
              </button>
            )}

            {prayer && onOpenAzan && (
              <button
                type="button"
                data-focusable="true"
                className="status-pill prayer"
                style={{ padding: '6px 14px', fontSize: 14 }}
                onClick={onOpenAzan}
                title="Next Prayer Countdown"
              >
                <span dir="rtl" style={{ marginRight: 6 }}>{prayer.ar}</span>
                <span>• {prayer.en} {countdown}</span>
              </button>
            )}
          </div>

          {/* Centered Active Category Name */}
          <div className="smarters-topbar-center" dir="auto">
            <AppIcon name={activeIconName} size={24} color="#22d3ee" style={{ marginRight: 10 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeCategoryLabel}</span>
          </div>

          {/* Right Action Icons: Search Toggle + Sort Menu (⋮) */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              data-focusable="true"
              className={'smarters-icon-btn' + (searchOpen || query ? ' active' : '')}
              style={{ marginRight: 10 }}
              onClick={function () {
                setSearchOpen(!searchOpen);
                setSortOpen(false);
              }}
              title={'Search in ' + title}
              aria-label={'Search in ' + title}
            >
              <AppIcon name="search" size={22} />
            </button>

            <button
              type="button"
              data-focusable="true"
              className={'smarters-icon-btn' + (sortOpen || sortMode !== 'default' ? ' active' : '')}
              onClick={function () {
                setSortOpen(!sortOpen);
                setSearchOpen(false);
              }}
              title={'Sort: ' + activeSortObj.label}
              aria-label="Sort options"
            >
              <span style={{ fontSize: 14, marginRight: 6 }}>{activeSortObj.label}</span>
              <span>⋮</span>
            </button>
          </div>
        </header>

        {/* Expandable Instant Search Bar (always fast, supports English & Arabic) */}
        {(searchOpen || query) && (
          <div className="smarters-toolbar-drawer">
            <div className="form-row" style={{ alignItems: 'center', marginBottom: showKeyboard ? 12 : 0 }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <input
                  type="text"
                  data-focusable="true"
                  className="tv-input"
                  dir="auto"
                  placeholder={'Instant search in ' + activeCategoryLabel + ' (English or العربية)...'}
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
            {showKeyboard && <TvKeyboard value={query} onChange={setQuery} />}
          </div>
        )}

        {/* Expandable Persistent Sort Bar */}
        {sortOpen && (
          <div className="smarters-toolbar-drawer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8', marginRight: 14 }}>
              Sort {title} (remembered):
            </span>
            {SORT_OPTIONS.map(function (opt) {
              return (
                <button
                  key={opt.id}
                  type="button"
                  data-focusable="true"
                  className={'chip' + (sortMode === opt.id ? ' active' : '')}
                  style={{ marginBottom: 0, padding: '8px 16px', fontSize: 15 }}
                  onClick={function () { handleSetSort(opt.id); }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Poster Wall / Channel Grid */}
        <div className="smarters-grid-scroll">
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 15, color: '#94a3b8' }}>
                Showing {(safePage * PAGE_SIZE + 1).toLocaleString()}–
                {Math.min((safePage + 1) * PAGE_SIZE, filteredItems.length).toLocaleString()} of{' '}
                {filteredItems.length.toLocaleString()} • Page {safePage + 1} / {totalPages}
              </div>
              <div className="btn-row" style={{ marginBottom: 0 }}>
                <button
                  type="button"
                  data-focusable="true"
                  className="tv-btn small"
                  style={{ marginBottom: 0 }}
                  disabled={safePage === 0}
                  onClick={function () { setPage(Math.max(0, safePage - 1)); }}
                >
                  ◀ Prev
                </button>
                <button
                  type="button"
                  data-focusable="true"
                  className="tv-btn small"
                  style={{ marginBottom: 0 }}
                  disabled={safePage >= totalPages - 1}
                  onClick={function () { setPage(Math.min(totalPages - 1, safePage + 1)); }}
                >
                  Next ▶
                </button>
              </div>
            </div>
          )}

          {visibleSlice.length === 0 ? (
            <div className="panel" style={{ textAlign: 'center', padding: '56px 24px' }}>
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
                  : 'Choose another category on the left or clear your search filter.'}
              </p>
            </div>
          ) : (
            <div className={isPosterWall ? ('smarters-poster-grid' + (!sidebarOpen ? ' expanded' : '')) : 'cards-grid'}>
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
                    posterWall={isPosterWall}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
