import { readStorage, writeStorage } from './storage.js';

const WATCH_PROGRESS_KEY = 'watch_progress_v1';
const MAX_CONTINUE_ITEMS = 40;
export const MIN_RESUME_SECONDS = 5;
export const COMPLETE_THRESHOLD_RATIO = 0.95;

export function formatPlaybackTime(totalSeconds) {
  const secs = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = function (n) { return n < 10 ? '0' + n : String(n); };
  if (h > 0) {
    return h + ':' + pad(m) + ':' + pad(s);
  }
  return m + ':' + pad(s);
}

export function loadWatchProgress() {
  const list = readStorage(WATCH_PROGRESS_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function saveWatchProgressList(list) {
  const safeList = Array.isArray(list) ? list.slice(0, MAX_CONTINUE_ITEMS) : [];
  writeStorage(WATCH_PROGRESS_KEY, safeList);
  return safeList;
}

export function isResumableProgress(entry) {
  if (!entry) return false;
  const cur = Number(entry.currentTime) || 0;
  const dur = Number(entry.duration) || 0;
  if (cur < MIN_RESUME_SECONDS) return false;
  if (dur > 0 && cur / dur >= COMPLETE_THRESHOLD_RATIO) return false;
  return true;
}

/**
 * Save or update watch progress for a Movie or Series episode.
 * If playback reached >= 95% of duration, removes it from Continue Watching.
 */
export function upsertWatchProgress(currentList, payload) {
  if (!payload || !payload.id) return currentList || [];
  if (payload.type === 'live') return currentList || [];

  const cur = Number(payload.currentTime) || 0;
  const dur = Number(payload.duration) || 0;
  const list = Array.isArray(currentList) ? currentList : [];

  // Completed watching -> remove from Continue Watching
  if (dur > 0 && cur / dur >= COMPLETE_THRESHOLD_RATIO) {
    const filtered = list.filter(function (item) { return item.id !== payload.id; });
    return saveWatchProgressList(filtered);
  }

  // Too early -> do not clutter Continue Watching yet
  if (cur < MIN_RESUME_SECONDS) {
    return list;
  }

  const nextEntry = {
    id: payload.id,
    type: payload.type || 'movies',
    title: payload.title || 'Untitled',
    group: payload.group || '',
    logo: payload.logo || '',
    url: payload.url || '',
    currentTime: Math.floor(cur),
    duration: Math.floor(dur),
    progressPercent: dur > 0 ? Math.min(99, Math.round((cur / dur) * 100)) : 0,
    seriesId: payload.seriesId || null,
    seriesTitle: payload.seriesTitle || '',
    season: payload.season || null,
    episode: payload.episode || null,
    source: payload.source || 'm3u',
    isKidsLesson: Boolean(payload.isKidsLesson),
    lessonId: payload.lessonId || null,
    updatedAt: Date.now(),
  };

  const withoutExisting = list.filter(function (item) { return item.id !== payload.id; });
  const next = [nextEntry].concat(withoutExisting);
  return saveWatchProgressList(next);
}

export function getWatchProgressById(list, id) {
  if (!Array.isArray(list) || !id) return null;
  for (let i = 0; i < list.length; i += 1) {
    if (list[i].id === id) return list[i];
  }
  return null;
}

/**
 * Find the most recent resumable watch progress entry for any Movie, Episode,
 * or Xtream Series container regardless of where the user opened it from.
 */
export function findWatchProgressForItem(list, item) {
  if (!Array.isArray(list) || list.length === 0 || !item) return null;

  // 1. Exact item id match
  for (let i = 0; i < list.length; i += 1) {
    const w = list[i];
    if (w && w.id === item.id && isResumableProgress(w)) return w;
  }

  // 2. Xtream Series container -> match most recently watched episode of this series
  if (item.isSeriesContainer || item.seriesId) {
    const targetSeriesId = item.seriesId ? String(item.seriesId) : '';
    const targetTitle = (item.title || '').trim().toLowerCase();
    for (let i = 0; i < list.length; i += 1) {
      const w = list[i];
      if (!w || !isResumableProgress(w)) continue;
      if (targetSeriesId && w.seriesId && String(w.seriesId) === targetSeriesId) {
        return w;
      }
      if (targetTitle && w.seriesTitle && w.seriesTitle.trim().toLowerCase() === targetTitle) {
        return w;
      }
    }
  }

  // 3. Exact stream URL match (survives M3U playlist index shifts)
  if (item.url) {
    for (let i = 0; i < list.length; i += 1) {
      const w = list[i];
      if (w && w.url && w.url === item.url && isResumableProgress(w)) return w;
    }
  }

  // 4. Same media type + exact title fallback (survives rotating M3U auth tokens)
  if (item.title && item.type && item.type !== 'live') {
    const targetTitle = item.title.trim().toLowerCase();
    for (let i = 0; i < list.length; i += 1) {
      const w = list[i];
      if (
        w &&
        w.type === item.type &&
        w.title &&
        w.title.trim().toLowerCase() === targetTitle &&
        isResumableProgress(w)
      ) {
        return w;
      }
    }
  }

  return null;
}

export function removeWatchProgressById(list, id) {
  const safeList = Array.isArray(list) ? list : [];
  const next = safeList.filter(function (item) { return item.id !== id; });
  return saveWatchProgressList(next);
}

export function clearAllWatchProgress() {
  return saveWatchProgressList([]);
}
