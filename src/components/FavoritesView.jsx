import React, { useState, useMemo } from 'react';
import MediaCard from './MediaCard.jsx';

export default function FavoritesView({ favorites, onSelectItem, onToggleFavorite }) {
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(function () {
    if (filter === 'all') return favorites || [];
    return (favorites || []).filter(function (f) { return f.type === filter; });
  }, [favorites, filter]);

  return (
    <div>
      <div className="btn-row" style={{ marginBottom: 18 }}>
        {[
          { id: 'all', label: 'All Favorites' },
          { id: 'live', label: 'Live TV' },
          { id: 'movies', label: 'Movies' },
          { id: 'series', label: 'Series' },
        ].map(function (chip) {
          return (
            <button
              key={chip.id}
              type="button"
              data-focusable="true"
              className={'chip' + (filter === chip.id ? ' active' : '')}
              onClick={function () { setFilter(chip.id); }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '52px 24px' }}>
          <h3 style={{ fontSize: 22, margin: '0 0 8px 0' }}>No Favorites Yet</h3>
          <p style={{ fontSize: 16, color: '#98a2b3', margin: 0 }}>
            Press ☆ on any Live channel, Movie, or Series — or inside the video player OSD — to star it here.
          </p>
        </div>
      ) : (
        <div className="cards-grid">
          {filtered.map(function (item) {
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
      )}
    </div>
  );
}
