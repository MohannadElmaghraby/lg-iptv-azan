import { describe, it, expect } from 'vitest';
import {
  calculatePrayerSchedule,
  getNextPrayerInfo,
  DEFAULT_AZAN_SETTINGS,
} from '../utils/azan.js';

describe('Offline Arabic Azan Calculator (adhan)', () => {
  it('calculates all 5 daily prayers in chronological order for Cairo', () => {
    const date = new Date(2026, 4, 15, 9, 0, 0);
    const schedule = calculatePrayerSchedule(date, DEFAULT_AZAN_SETTINGS);
    expect(schedule.map((p) => p.key)).toEqual(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']);
    for (let i = 1; i < schedule.length; i += 1) {
      expect(schedule[i].time.getTime()).toBeGreaterThan(schedule[i - 1].time.getTime());
    }
  });

  it('applies Asr Madhab (Hanafi vs Shafi) and minute offsets', () => {
    const date = new Date(2026, 4, 15, 9, 0, 0);
    const shafi = calculatePrayerSchedule(date, { ...DEFAULT_AZAN_SETTINGS, madhab: 'Shafi' });
    const hanafi = calculatePrayerSchedule(date, { ...DEFAULT_AZAN_SETTINGS, madhab: 'Hanafi' });
    expect(hanafi[2].time.getTime()).toBeGreaterThan(shafi[2].time.getTime());

    const offsetSettings = {
      ...DEFAULT_AZAN_SETTINGS,
      offsets: { ...DEFAULT_AZAN_SETTINGS.offsets, dhuhr: 7 },
    };
    const withOffset = calculatePrayerSchedule(date, offsetSettings);
    expect(withOffset[1].time.getTime() - shafi[1].time.getTime()).toBe(7 * 60000);
  });

  it('respects per-prayer enable toggles in getNextPrayerInfo', () => {
    const date = new Date(2026, 4, 15, 2, 0, 0);
    const settings = {
      ...DEFAULT_AZAN_SETTINGS,
      enabled: {
        fajr: false,
        dhuhr: true,
        asr: true,
        maghrib: true,
        isha: true,
      },
    };
    const nextInfo = getNextPrayerInfo(date, settings);
    expect(nextInfo.prayer.key).toBe('dhuhr');
  });
});
