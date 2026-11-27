import { describe, it, expect, beforeEach } from 'vitest';
import {
  upsertWatchProgress,
  getWatchProgressById,
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
});
