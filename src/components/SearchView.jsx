import React, { useState, useEffect, useMemo } from 'react';
import TvKeyboard from './TvKeyboard.jsx';
import MediaCard from './MediaCard.jsx';
import { prepareSearchIndex, searchCatalog } from '../utils/search.js';
import { isFavoriteItem } from '../utils/favorites.js';

export default function SearchView({
  allItems,
  favorites,
  onSelectItem,
  onToggleFavorite,
}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [showKeyboard, setShowKeyboard] = useState(true);

  const searchIndex = useMemo(function () {
    return prepareSearchIndex(allItems || []);
  }, [allItems]);

  // Instant ~100ms debounced auto-search as each letter is typed
  useEffect(function () {
    const timer = setTimeout(function () {
      setDebouncedQuery(query);
    }, 100);
    return function () { clearTimeout(timer); };
  }, [query]);

  const { results, counts } = useMemo(function () {
    return searchCatalog(searchIndex, debouncedQuery, { category, limit: 72 });
  }, [searchIndex, debouncedQuery, category]);

  const chips = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'live', label: 'Live TV', count: counts.live },
    { id: 'movies', label: 'Movies', count: counts.movies },
    { id: 'series', label: 'Series', count: counts.series },
  ];

  return (
    <div>
      <div className="panel" style={{ padding: '18px 22px', marginBottom: 18 }}>
        <div className="form-row" style={{ alignItems: 'center', marginBottom: 0 }}>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <input
              type="text"
              data-focusable="true"
              className="tv-input"
              dir="auto"
              placeholder="Search Live TV, Movies & Series (English or العربية)..."
              value={query}
              onChange={function (e) { setQuery(e.target.value); }}
            />
          </div>
          <button
            type="button"
            data-focusable="true"
            className="tv-btn"
            style={{ marginBottom: 0 }}
            onClick={function () { setShowKeyboard(!showKeyboard); }}
          >
            {showKeyboard ? 'Hide Keyboard' : 'Show TV Keyboard'}
          </button>
        </div>
      </div>

      {showKeyboard && (
        <TvKeyboard value={query} onChange={setQuery} />
      )}

      <div className="btn-row" style={{ marginBottom: 16 }}>
        {chips.map(function (c) {
          return (
            <button
              key={c.id}
              type="button"
              data-focusable="true"
              className={'chip' + (category === c.id ? ' active' : '')}
              onClick={function () { setCategory(c.id); }}
            >
              {c.label} {debouncedQuery ? '(' + c.count + ')' : ''}
            </button>
          );
        })}
      </div>

      {!debouncedQuery ? (
        <div className="panel" style={{ textAlign: 'center', padding: '36px 24px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Instant English &amp; Arabic Auto-Search
          </div>
          <div style={{ fontSize: 15, color: '#98a2b3' }}>
            Type with the TV keyboard or remote — Arabic letters (أ/إ/آ, ة, ى, tashkeel) and Latin accents are normalized automatically across Live TV, Movies, and Series.
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '36px 24px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
            No matches found for &ldquo;<span dir="auto">{debouncedQuery}</span>&rdquo;
          </div>
          <div style={{ fontSize: 15, color: '#98a2b3' }}>
            Try fewer words or switch category chips above.
          </div>
        </div>
      ) : (
        <div className="cards-grid">
          {results.map(function (item) {
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
      )}
    </div>
  );
}
