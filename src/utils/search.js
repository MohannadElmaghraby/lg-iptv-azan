/**
 * Arabic & Latin text normalization and fast ranked instant search
 * Normalizes:
 *  - Arabic tashkeel/diacritics & tatweel stripped
 *  - أ / إ / آ -> ا
 *  - ة -> ه
 *  - ى -> ي
 *  - Latin lowercase & accent removal
 */

export function normalizeSearchText(input) {
  if (!input || typeof input !== 'string') return '';

  let s = input;
  // Normalize Latin accents via NFD
  if (typeof s.normalize === 'function') {
    s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Strip Arabic tashkeel / harakat / tatweel
  s = s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '');

  // Normalize Arabic letters
  s = s
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');

  return s.toLowerCase().replace(/\s+/g, ' ').trim();
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
