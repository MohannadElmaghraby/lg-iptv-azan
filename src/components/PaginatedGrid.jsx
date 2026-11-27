import React, { useState, useMemo, useEffect } from 'react';
import MediaCard from './MediaCard.jsx';
import { isFavoriteItem } from '../utils/favorites.js';

const PAGE_SIZE = 36;

export default function PaginatedGrid({
  items,
  groups,
  favorites,
  onSelectItem,
  onToggleFavorite,
  emptyTitle,
  emptySubtitle,
}) {
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [page, setPage] = useState(0);

  useEffect(function () {
    setSelectedGroup('ALL');
    setPage(0);
  }, [items]);

  const filtered = useMemo(function () {
    if (selectedGroup === 'ALL') return items || [];
    return (items || []).filter(function (it) {
      return (it.group || 'Uncategorized') === selectedGroup;
    });
  }, [items, selectedGroup]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);

  const visibleSlice = useMemo(function () {
    const start = safePage * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  if (!items || items.length === 0) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '56px 32px' }}>
        <h3 style={{ fontSize: 24, margin: '0 0 10px 0' }}>{emptyTitle || 'No items available'}</h3>
        <p style={{ fontSize: 16, color: '#98a2b3', margin: 0 }}>
          {emptySubtitle || 'Load an M3U_Plus URL, local .m3u file, or Xtream Codes source in Sources & Setup.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {groups && groups.length > 0 && (
        <div className="btn-row" style={{ marginBottom: 16 }}>
          <button
            type="button"
            data-focusable="true"
            className={'chip' + (selectedGroup === 'ALL' ? ' active' : '')}
            onClick={function () {
              setSelectedGroup('ALL');
              setPage(0);
            }}
          >
            All ({items.length.toLocaleString()})
          </button>
          {groups.slice(0, 28).map(function (grp) {
            return (
              <button
                key={grp}
                type="button"
                data-focusable="true"
                className={'chip' + (selectedGroup === grp ? ' active' : '')}
                dir="auto"
                onClick={function () {
                  setSelectedGroup(grp);
                  setPage(0);
                }}
              >
                {grp}
              </button>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 15, color: '#98a2b3' }}>
            Showing {(safePage * PAGE_SIZE + 1).toLocaleString()}–
            {Math.min((safePage + 1) * PAGE_SIZE, filtered.length).toLocaleString()} of{' '}
            {filtered.length.toLocaleString()} items (Page {safePage + 1} / {totalPages})
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

      <div className="cards-grid">
        {visibleSlice.map(function (item) {
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

      {totalPages > 1 && (
        <div className="btn-row" style={{ marginTop: 14, justifyContent: 'center' }}>
          <button
            type="button"
            data-focusable="true"
            className="tv-btn small"
            disabled={safePage === 0}
            onClick={function () { setPage(Math.max(0, safePage - 1)); }}
          >
            ◀ Previous
          </button>
          <span style={{ margin: '0 16px 10px 4px', fontSize: 16, color: '#98a2b3' }}>
            Page {safePage + 1} of {totalPages}
          </span>
          <button
            type="button"
            data-focusable="true"
            className="tv-btn small"
            disabled={safePage >= totalPages - 1}
            onClick={function () { setPage(Math.min(totalPages - 1, safePage + 1)); }}
          >
            Next ▶
          </button>
        </div>
      )}
    </div>
  );
}
