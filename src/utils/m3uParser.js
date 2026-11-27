/**
 * Fast M3U / M3U_Plus parser & stream URL normalizer for LG webOS 4.0
 * Handles 10,000+ entries cleanly without regex backtracking bottlenecks.
 */

export function convertOutputTsToM3u8(url, enabled = true) {
  if (!url || typeof url !== 'string') return '';
  if (!enabled) return url;
  // Convert query parameter output=ts or output=mpegts -> output=m3u8
  let next = url.replace(/([?&]output=)(ts|mpegts)(?=&|$)/gi, '$1m3u8');
  // Also handle Xtream-style live path ending in .ts when clearly a live stream URL
  if (/\/live\/[^/]+\/[^/]+\/\d+\.ts(\?.*)?$/i.test(next)) {
    next = next.replace(/\.ts(\?.*)?$/i, '.m3u8$1');
  }
  return next;
}

export function normalizePlaylistUrl(url, convertTsToM3u8 = true) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  return convertOutputTsToM3u8(trimmed, convertTsToM3u8);
}

const SERIES_PATTERNS = [
  /\bS\d{1,2}[\s._-]*E\d{1,3}\b/i,
  /\bSeason\s*\d+/i,
  /\bEpisode\s*\d+/i,
  /\/series\//i,
  /مسلسل/i,
  /حلقة/i,
];

const MOVIE_PATTERNS = [
  /\/movie\//i,
  /\.(mp4|mkv|avi|mov|wmv|flv|m4v)(\?.*)?$/i,
  /أفلام|افلام|فيلم/i,
];

const GROUP_MOVIE_HINTS = /\b(movies?|vod|cinema|films?|4k\s*movies?)\b|أفلام|افلام/i;
const GROUP_SERIES_HINTS = /\b(series|tv\s*shows?|shows|episodes?|anime|dramas?)\b|مسلسلات|انمي/i;

export function classifyEntry(title, group, url) {
  const safeUrl = url || '';
  const safeTitle = title || '';
  const safeGroup = group || '';

  for (let i = 0; i < SERIES_PATTERNS.length; i += 1) {
    if (SERIES_PATTERNS[i].test(safeUrl) || SERIES_PATTERNS[i].test(safeTitle)) {
      return 'series';
    }
  }
  if (GROUP_SERIES_HINTS.test(safeGroup)) {
    return 'series';
  }

  for (let i = 0; i < MOVIE_PATTERNS.length; i += 1) {
    if (MOVIE_PATTERNS[i].test(safeUrl) || MOVIE_PATTERNS[i].test(safeGroup)) {
      return 'movies';
    }
  }
  if (GROUP_MOVIE_HINTS.test(safeGroup)) {
    return 'movies';
  }

  return 'live';
}

function parseExtinfAttributes(headerLine) {
  const attrs = {};
  const attrRegex = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
  let match;
  while ((match = attrRegex.exec(headerLine)) !== null) {
    attrs[match[1].toLowerCase()] = match[2];
  }
  // Extract display title after the last comma outside quotes
  let inQuotes = false;
  let lastComma = -1;
  for (let i = 0; i < headerLine.length; i += 1) {
    const ch = headerLine.charAt(i);
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      lastComma = i;
    }
  }
  const title = lastComma >= 0 ? headerLine.slice(lastComma + 1).trim() : '';
  return { attrs, title };
}

function hashId(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

/**
 * Parse M3U / M3U_Plus text into structured media items.
 * Returns { items, live, movies, series, groups }
 */
export function parseM3U(text, options = {}) {
  const { convertTs = true } = options;
  if (!text || typeof text !== 'string') {
    return { items: [], live: [], movies: [], series: [], groups: { live: [], movies: [], series: [] } };
  }

  const lines = text.split(/\r?\n/);
  const items = [];
  const live = [];
  const movies = [];
  const series = [];
  const groupSets = {
    live: new Set(),
    movies: new Set(),
    series: new Set(),
  };

  let currentMeta = null;
  let currentGroupOverride = '';

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.indexOf('#EXTM3U') === 0) {
      continue;
    }

    if (line.indexOf('#EXTINF:') === 0) {
      const parsed = parseExtinfAttributes(line);
      currentMeta = {
        attrs: parsed.attrs,
        title: parsed.title || parsed.attrs['tvg-name'] || 'Untitled Stream',
      };
      continue;
    }

    if (line.indexOf('#EXTGRP:') === 0) {
      currentGroupOverride = line.slice(8).trim();
      continue;
    }

    if (line.charAt(0) === '#') {
      continue;
    }

    // Stream URL line
    if (/^(https?|rtmp|rtsp|udp|mms):\/\//i.test(line) || line.indexOf('/') === 0 || line.indexOf('.m3u8') !== -1) {
      const meta = currentMeta || { attrs: {}, title: 'Channel ' + (items.length + 1) };
      const group = (meta.attrs['group-title'] || currentGroupOverride || 'Uncategorized').trim() || 'Uncategorized';
      const title = (meta.title || meta.attrs['tvg-name'] || 'Channel ' + (items.length + 1)).trim();
      const mediaType = classifyEntry(title, group, line);
      const streamUrl = mediaType === 'live' ? convertOutputTsToM3u8(line, convertTs) : line;

      const item = {
        id: mediaType + '_' + hashId(title + '|' + line) + '_' + items.length,
        type: mediaType,
        title,
        group,
        logo: meta.attrs['tvg-logo'] || '',
        tvgId: meta.attrs['tvg-id'] || '',
        tvgName: meta.attrs['tvg-name'] || title,
        orderIndex: items.length,
        url: streamUrl,
        rawUrl: line,
        source: 'm3u',
      };

      items.push(item);
      groupSets[mediaType].add(group);
      if (mediaType === 'live') live.push(item);
      else if (mediaType === 'movies') movies.push(item);
      else series.push(item);

      currentMeta = null;
      currentGroupOverride = '';
    }
  }

  return {
    items,
    live,
    movies,
    series,
    groups: {
      live: Array.from(groupSets.live),
      movies: Array.from(groupSets.movies),
      series: Array.from(groupSets.series),
    },
  };
}
