import { describe, it, expect, beforeEach } from 'vitest';
import {
  upsertWatchProgress,
  getWatchProgressById,
  findWatchProgressForItem,
  isResumableProgress,
  removeWatchProgressById,
  clearAllWatchProgress,
  loadWatchProgress,
} from '../utils/watchProgress.js';

describe('Continue Watching Resume & Remove Logic', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves watch progress for movies and series above 5s and ignores live TV', () => {
    let list = [];
    list = upsertWatchProgress(list, {
      id: 'live_1',
      type: 'live',
      title: 'Live Channel',
      currentTime: 120,
      duration: 0,
    });
    expect(list.length).toBe(0);

    list = upsertWatchProgress(list, {
      id: 'movie_1',
      type: 'movies',
      title: 'Early Exit Movie',
      currentTime: 3,
      duration: 3600,
    });
    expect(list.length).toBe(0);

    list = upsertWatchProgress(list, {
      id: 'movie_2',
      type: 'movies',
      title: 'Toy Story',
      currentTime: 640,
      duration: 4800,
    });
    expect(list.length).toBe(1);
    expect(list[0].progressPercent).toBe(13);
    expect(isResumableProgress(list[0])).toBe(true);
    expect(loadWatchProgress().length).toBe(1);
  });

  it('removes item when >= 95% complete and supports individual remove & clearAll', () => {
    let list = [];
    list = upsertWatchProgress(list, {
      id: 'ep_1',
      type: 'series',
      title: 'Episode 1',
      currentTime: 300,
      duration: 1000,
    });
    list = upsertWatchProgress(list, {
      id: 'ep_2',
      type: 'series',
      title: 'Episode 2',
      currentTime: 450,
      duration: 1000,
    });
    expect(list.length).toBe(2);

    // Individual remove
    list = removeWatchProgressById(list, 'ep_1');
    expect(list.length).toBe(1);
    expect(getWatchProgressById(list, 'ep_1')).toBeNull();
    expect(getWatchProgressById(list, 'ep_2')).not.toBeNull();

    // Mark >= 95% complete -> auto-removed
    list = upsertWatchProgress(list, {
      id: 'ep_2',
      type: 'series',
      title: 'Episode 2',
      currentTime: 960,
      duration: 1000,
    });
    expect(list.length).toBe(0);

    // Add again & Clear All
    list = upsertWatchProgress(list, {
      id: 'movie_3',
      type: 'movies',
      title: 'Cars',
      currentTime: 500,
      duration: 5000,
    });
    expect(list.length).toBe(1);
    list = clearAllWatchProgress();
    expect(list.length).toBe(0);
    expect(loadWatchProgress().length).toBe(0);
  });

  it('finds saved progress for Xtream series containers, shifted M3U URLs, and titles from anywhere', () => {
    let list = [];
    list = upsertWatchProgress(list, {
      id: 'xt_ep_501',
      type: 'series',
      title: 'Episode 4',
      url: 'http://example.com/series/501.mp4',
      seriesId: '88',
      seriesTitle: 'My Arabic Series',
      season: 2,
      episode: 4,
      currentTime: 620,
      duration: 2400,
    });
    list = upsertWatchProgress(list, {
      id: 'series_oldhash_10',
      type: 'series',
      title: 'Show S01 E02',
      url: 'http://example.com/m3u/show_e02.mp4',
      currentTime: 300,
      duration: 1800,
    });

    // Opening Xtream Series container from Series tab / Search / Favorites
    const matchedSeries = findWatchProgressForItem(list, {
      id: 'xt_series_88',
      type: 'series',
      title: 'My Arabic Series',
      seriesId: 88,
      isSeriesContainer: true,
    });
    expect(matchedSeries).not.toBeNull();
    expect(matchedSeries.id).toBe('xt_ep_501');
    expect(matchedSeries.currentTime).toBe(620);

    // Opening M3U episode whose playlist index shifted (different id, same URL)
    const matchedM3u = findWatchProgressForItem(list, {
      id: 'series_oldhash_99',
      type: 'series',
      title: 'Show S01 E02',
      url: 'http://example.com/m3u/show_e02.mp4',
    });
    expect(matchedM3u).not.toBeNull();
    expect(matchedM3u.currentTime).toBe(300);
  });
});
