/**
 * Arabic & Latin text normalization and fast ranked instant search
 * Normalizes:
 *  - Arabic tashkeel/diacritics & tatweel stripped
 *  - أ / إ / آ -> ا
 *  - ة -> ه
 *  - ى -> ي
 *  - Latin lowercase & accent removal
 */

const NON_ASCII_RE = /[^\x20-\x7E]/;
const LATIN_ACCENT_RE = /[\u00C0-\u024F]/;
const ARABIC_CHAR_RE = /[\u0600-\u06FF]/;

export function normalizeSearchText(input) {
  if (!input || typeof input !== 'string') return '';

  let s = input;
  // Fast path for plain ASCII strings (skips expensive NFD & Arabic regex passes on 15k+ TV catalogs)
  if (!NON_ASCII_RE.test(s)) {
    return s.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  // Normalize Latin accents via NFD only when accented Latin characters exist
  if (LATIN_ACCENT_RE.test(s) && typeof s.normalize === 'function') {
    s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Normalize Arabic letters & strip tashkeel only when Arabic characters exist
  if (ARABIC_CHAR_RE.test(s)) {
    s = s
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي');
  }

  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function sortCatalogItems(items, sortMode) {
  if (!Array.isArray(items) || items.length <= 1 || !sortMode || sortMode === 'default') {
    return items || [];
  }

  if (sortMode === 'recent') {
    const keyed = new Array(items.length);
    for (let i = 0; i < items.length; i += 1) {
      const it = items[i];
      const ts = Number(it.addedAt) || Number(it.updatedAt) || 0;
      const ord = typeof it.orderIndex === 'number' ? it.orderIndex : i;
      keyed[i] = { it, ts, ord };
    }
    keyed.sort(function (a, b) {
      if (b.ts !== a.ts) return b.ts - a.ts;
      return b.ord - a.ord;
    });
    const out = new Array(keyed.length);
    for (let i = 0; i < keyed.length; i += 1) out[i] = keyed[i].it;
    return out;
  }

  if (sortMode === 'az' || sortMode === 'za') {
    const dir = sortMode === 'az' ? 1 : -1;
    const keyed = new Array(items.length);
    for (let i = 0; i < items.length; i += 1) {
      const it = items[i];
      keyed[i] = { it, k: (it.title || '').toLowerCase() };
    }
    keyed.sort(function (a, b) {
      if (a.k < b.k) return -1 * dir;
      if (a.k > b.k) return 1 * dir;
      return 0;
    });
    const out = new Array(keyed.length);
    for (let i = 0; i < keyed.length; i += 1) out[i] = keyed[i].it;
    return out;
  }

  return items;
}

export function prepareSearchIndex(items) {
  if (!Array.isArray(items)) return [];
  const indexed = new Array(items.length);
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    indexed[i] = {
      item,
      normTitle: normalizeSearchText(item.title || ''),
      normGroup: normalizeSearchText(item.group || ''),
    };
  }
  return indexed;
}

export function rankSearchMatch(normTitle, normGroup, normQuery, tokens) {
  if (!normQuery) return 0;

  // Must match all space-separated tokens in title or group
  for (let i = 0; i < tokens.length; i += 1) {
    const tok = tokens[i];
    if (normTitle.indexOf(tok) === -1 && normGroup.indexOf(tok) === -1) {
      return -1;
    }
  }

  if (normTitle === normQuery) return 1000;
  if (normTitle.indexOf(normQuery) === 0) return 800;

  const wordBoundaryPos = normTitle.indexOf(' ' + normQuery);
  if (wordBoundaryPos !== -1) return 600 - wordBoundaryPos;

  const titlePos = normTitle.indexOf(normQuery);
  if (titlePos !== -1) return 450 - Math.min(titlePos, 200);

  // All tokens matched across title/group
  let tokenInTitleCount = 0;
  for (let i = 0; i < tokens.length; i += 1) {
    if (normTitle.indexOf(tokens[i]) !== -1) tokenInTitleCount += 1;
  }
  if (tokenInTitleCount === tokens.length) return 300;
  if (tokenInTitleCount > 0) return 200 + tokenInTitleCount * 10;

  return 100;
}

/**
 * Search across indexed items (or raw items) with optional category filter ('all' | 'live' | 'movies' | 'series').
 * Returns { results, counts: { all, live, movies, series } }
 */
export function searchCatalog(indexedOrItems, query, options = {}) {
  const { category = 'all', limit = 120 } = options;
  const normQuery = normalizeSearchText(query);
  const counts = { all: 0, live: 0, movies: 0, series: 0 };

  if (!normQuery) {
    return { results: [], counts };
  }

  const tokens = normQuery.split(' ').filter(Boolean);
  const scored = [];

  for (let i = 0; i < indexedOrItems.length; i += 1) {
    const entry = indexedOrItems[i];
    const item = entry.item ? entry.item : entry;
    const normTitle = entry.normTitle !== undefined ? entry.normTitle : normalizeSearchText(item.title || '');
    const normGroup = entry.normGroup !== undefined ? entry.normGroup : normalizeSearchText(item.group || '');

    const score = rankSearchMatch(normTitle, normGroup, normQuery, tokens);
    if (score > 0) {
      counts.all += 1;
      if (item.type === 'live') counts.live += 1;
      else if (item.type === 'movies') counts.movies += 1;
      else if (item.type === 'series') counts.series += 1;

      if (category === 'all' || item.type === category) {
        scored.push({ item, score });
      }
    }
  }

  scored.sort(function (a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return (a.item.title || '').localeCompare(b.item.title || '');
  });

  const sliced = scored.slice(0, limit).map(function (entry) {
    return entry.item;
  });

  return { results: sliced, counts };
}
