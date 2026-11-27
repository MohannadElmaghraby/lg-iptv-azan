import { readStorage, writeStorage } from './storage.js';

const FAVORITES_KEY = 'favorites_v1';

export function loadFavorites() {
  const list = readStorage(FAVORITES_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function saveFavorites(list) {
  writeStorage(FAVORITES_KEY, list);
  return list;
}

export function isFavoriteItem(favorites, itemId) {
  if (!Array.isArray(favorites) || !itemId) return false;
  for (let i = 0; i < favorites.length; i += 1) {
    if (favorites[i].id === itemId) return true;
  }
  return false;
}

export function toggleFavoriteItem(favorites, item) {
  if (!item || !item.id) return favorites || [];
  const current = Array.isArray(favorites) ? favorites : [];
  const exists = isFavoriteItem(current, item.id);
  const next = exists
    ? current.filter(function (f) { return f.id !== item.id; })
    : [
        {
          id: item.id,
          type: item.type || 'live',
          title: item.title || '',
          group: item.group || '',
          logo: item.logo || '',
          url: item.url || '',
          streamId: item.streamId,
          seriesId: item.seriesId,
          isSeriesContainer: Boolean(item.isSeriesContainer),
          source: item.source || 'm3u',
          addedAt: Date.now(),
        },
      ].concat(current);
  saveFavorites(next);
  return next;
}
