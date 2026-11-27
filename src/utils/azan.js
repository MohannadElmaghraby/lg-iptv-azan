import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';
import { readStorage, writeStorage } from './storage.js';

const AZAN_SETTINGS_KEY = 'azan_settings_v1';

export const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const PRAYER_META = {
  fajr: { key: 'fajr', en: 'Fajr', ar: 'الفجر' },
  dhuhr: { key: 'dhuhr', en: 'Dhuhr', ar: 'الظهر' },
  asr: { key: 'asr', en: 'Asr', ar: 'العصر' },
  maghrib: { key: 'maghrib', en: 'Maghrib', ar: 'المغرب' },
  isha: { key: 'isha', en: 'Isha', ar: 'العشاء' },
};

export const CITY_PRESETS = [
  { id: 'cairo', name: 'Cairo, Egypt', ar: 'القاهرة', lat: 30.0444, lon: 31.2357, method: 'Egyptian' },
  { id: 'alexandria', name: 'Alexandria, Egypt', ar: 'الإسكندرية', lat: 31.2001, lon: 29.9187, method: 'Egyptian' },
  { id: 'makkah', name: 'Makkah, Saudi Arabia', ar: 'مكة المكرمة', lat: 21.4225, lon: 39.8262, method: 'UmmAlQura' },
  { id: 'madinah', name: 'Madinah, Saudi Arabia', ar: 'المدينة المنورة', lat: 24.4672, lon: 39.6111, method: 'UmmAlQura' },
  { id: 'riyadh', name: 'Riyadh, Saudi Arabia', ar: 'الرياض', lat: 24.7136, lon: 46.6753, method: 'UmmAlQura' },
  { id: 'dubai', name: 'Dubai, UAE', ar: 'دبي', lat: 25.2048, lon: 55.2708, method: 'Dubai' },
  { id: 'doha', name: 'Doha, Qatar', ar: 'الدوحة', lat: 25.2854, lon: 51.531, method: 'Qatar' },
  { id: 'kuwait', name: 'Kuwait City', ar: 'الكويت', lat: 29.3759, lon: 47.9774, method: 'Kuwait' },
  { id: 'istanbul', name: 'Istanbul, Turkey', ar: 'إسطنبول', lat: 41.0082, lon: 28.9784, method: 'Turkey' },
  { id: 'london', name: 'London, UK', ar: 'لندن', lat: 51.5074, lon: -0.1278, method: 'MuslimWorldLeague' },
  { id: 'toronto', name: 'Toronto, Canada', ar: 'تورونتو', lat: 43.6532, lon: -79.3832, method: 'NorthAmerica' },
  { id: 'newyork', name: 'New York, USA', ar: 'نيويورك', lat: 40.7128, lon: -74.006, method: 'NorthAmerica' },
  { id: 'kualalumpur', name: 'Kuala Lumpur, MY', ar: 'كوالالمبور', lat: 3.139, lon: 101.6869, method: 'Singapore' },
];

export const CALCULATION_METHODS = [
  { id: 'Egyptian', label: 'Egyptian General Authority' },
  { id: 'UmmAlQura', label: 'Umm Al-Qura (Makkah)' },
  { id: 'MuslimWorldLeague', label: 'Muslim World League' },
  { id: 'NorthAmerica', label: 'ISNA (North America)' },
  { id: 'Dubai', label: 'Dubai' },
  { id: 'Qatar', label: 'Qatar' },
  { id: 'Kuwait', label: 'Kuwait' },
  { id: 'Turkey', label: 'Diyanet (Turkey)' },
  { id: 'Karachi', label: 'University of Islamic Sciences, Karachi' },
  { id: 'Singapore', label: 'Singapore' },
  { id: 'MoonsightingCommittee', label: 'Moonsighting Committee' },
  { id: 'Tehran', label: 'Tehran' },
];

export const DEFAULT_AZAN_SETTINGS = {
  cityId: 'cairo',
  cityName: 'Cairo, Egypt',
  latitude: 30.0444,
  longitude: 31.2357,
  method: 'Egyptian',
  madhab: 'Shafi',
  customAudioUrl: '',
  enabled: {
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
  offsets: {
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
};

export function loadAzanSettings() {
  const saved = readStorage(AZAN_SETTINGS_KEY, null);
  if (!saved || typeof saved !== 'object') {
    return DEFAULT_AZAN_SETTINGS;
  }
  return {
    cityId: saved.cityId || DEFAULT_AZAN_SETTINGS.cityId,
    cityName: saved.cityName || DEFAULT_AZAN_SETTINGS.cityName,
    latitude: typeof saved.latitude === 'number' ? saved.latitude : DEFAULT_AZAN_SETTINGS.latitude,
    longitude: typeof saved.longitude === 'number' ? saved.longitude : DEFAULT_AZAN_SETTINGS.longitude,
    method: saved.method || DEFAULT_AZAN_SETTINGS.method,
    madhab: saved.madhab === 'Hanafi' ? 'Hanafi' : 'Shafi',
    customAudioUrl: saved.customAudioUrl || '',
    enabled: Object.assign({}, DEFAULT_AZAN_SETTINGS.enabled, saved.enabled || {}),
    offsets: Object.assign({}, DEFAULT_AZAN_SETTINGS.offsets, saved.offsets || {}),
  };
}

export function saveAzanSettings(settings) {
  writeStorage(AZAN_SETTINGS_KEY, settings);
  return settings;
}

function resolveCalculationParams(methodName, madhabName) {
  const fn = CalculationMethod[methodName] || CalculationMethod.Egyptian;
  const params = fn();
  params.madhab = madhabName === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  return params;
}

export function calculatePrayerSchedule(date = new Date(), settings = DEFAULT_AZAN_SETTINGS) {
  const lat = Number(settings.latitude);
  const lon = Number(settings.longitude);
  const safeLat = isFinite(lat) ? Math.max(-90, Math.min(90, lat)) : 30.0444;
  const safeLon = isFinite(lon) ? Math.max(-180, Math.min(180, lon)) : 31.2357;

  const coords = new Coordinates(safeLat, safeLon);
  const params = resolveCalculationParams(settings.method, settings.madhab);
  const times = new PrayerTimes(coords, date, params);

  const offsets = settings.offsets || {};
  const enabled = settings.enabled || {};

  return PRAYER_KEYS.map(function (key) {
    const baseDate = times[key];
    const offsetMin = Number(offsets[key]) || 0;
    const adjustedDate = new Date(baseDate.getTime() + offsetMin * 60000);
    return {
      key,
      en: PRAYER_META[key].en,
      ar: PRAYER_META[key].ar,
      time: adjustedDate,
      enabled: enabled[key] !== false,
      offsetMin,
    };
  });
}

export function getNextPrayerInfo(now = new Date(), settings = DEFAULT_AZAN_SETTINGS) {
  const todaySchedule = calculatePrayerSchedule(now, settings);
  const nowMs = now.getTime();

  for (let i = 0; i < todaySchedule.length; i += 1) {
    const p = todaySchedule[i];
    if (p.enabled && p.time.getTime() > nowMs) {
      return {
        prayer: p,
        remainingMs: p.time.getTime() - nowMs,
        schedule: todaySchedule,
      };
    }
  }

  // Fallback: check tomorrow's schedule for first enabled prayer
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0, 0);
  const tomorrowSchedule = calculatePrayerSchedule(tomorrow, settings);
  for (let i = 0; i < tomorrowSchedule.length; i += 1) {
    const p = tomorrowSchedule[i];
    if (p.enabled && p.time.getTime() > nowMs) {
      return {
        prayer: p,
        remainingMs: p.time.getTime() - nowMs,
        schedule: todaySchedule,
      };
    }
  }

  return {
    prayer: todaySchedule[0],
    remainingMs: 0,
    schedule: todaySchedule,
  };
}

export function formatPrayerClock(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '--:--';
  let h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return h + ':' + (m < 10 ? '0' + m : m) + ' ' + ampm;
}

export function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = function (n) { return n < 10 ? '0' + n : String(n); };
  if (h > 0) {
    return h + ':' + pad(m) + ':' + pad(s);
  }
  return pad(m) + ':' + pad(s);
}

/**
 * Plays fallback Hijaz-inspired offline Web Audio chime if MP3 is missing or fails.
 */
export function playFallbackAzanChime(onEnded) {
  let stopped = false;
  let timer = null;
  let ctx = null;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      timer = setTimeout(function () {
        if (!stopped && onEnded) onEnded();
      }, 4000);
      return {
        stop: function () {
          stopped = true;
          if (timer) clearTimeout(timer);
        },
      };
    }

    ctx = new AudioCtx();
    if (ctx.state === 'suspended' && ctx.resume) {
      ctx.resume().catch(function () {});
    }

    // Calm Maqam Hijaz motif (D4, Eb4, F#4, G4, A4, F#4, Eb4, D4)
    const notes = [
      { freq: 293.66, start: 0.05, dur: 0.7 },
      { freq: 311.13, start: 0.7, dur: 0.55 },
      { freq: 369.99, start: 1.25, dur: 0.85 },
      { freq: 392.0, start: 2.1, dur: 0.9 },
      { freq: 440.0, start: 3.0, dur: 1.0 },
      { freq: 369.99, start: 4.1, dur: 0.7 },
      { freq: 311.13, start: 4.8, dur: 0.65 },
      { freq: 293.66, start: 5.45, dur: 1.3 },
    ];

    const now = ctx.currentTime;
    for (let i = 0; i < notes.length; i += 1) {
      const n = notes[i];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      gain.gain.setValueAtTime(0.0001, now + n.start);
      gain.gain.linearRampToValueAtTime(0.16, now + n.start + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.05);
    }

    timer = setTimeout(function () {
      if (!stopped && onEnded) onEnded();
    }, 7000);
  } catch (e) {
    timer = setTimeout(function () {
      if (!stopped && onEnded) onEnded();
    }, 4500);
  }

  return {
    stop: function () {
      stopped = true;
      if (timer) clearTimeout(timer);
      if (ctx && ctx.close) {
        ctx.close().catch(function () {});
      }
    },
  };
}

export function playAzanAudio(customUrl, onEnded) {
  const customSrc = customUrl && customUrl.trim();
  const defaultSrc = './audio/azan.mp3';
  const primarySrc = customSrc || defaultSrc;
  let activeFallback = null;
  let audio = null;
  let finished = false;
  let triedDefault = !customSrc;

  const done = function () {
    if (finished) return;
    finished = true;
    if (onEnded) onEnded();
  };

  const handleFailure = function () {
    if (finished) return;
    if (!triedDefault) {
      triedDefault = true;
      startSrc(defaultSrc);
    } else {
      activeFallback = playFallbackAzanChime(done);
    }
  };

  const startSrc = function (src) {
    try {
      audio = new Audio(src);
      audio.volume = 0.95;
      audio.addEventListener('ended', done);
      audio.addEventListener('error', handleFailure);
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(handleFailure);
      }
    } catch (e) {
      handleFailure();
    }
  };

  startSrc(primarySrc);

  return {
    stop: function () {
      finished = true;
      if (audio) {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (e) {
          // ignore
        }
      }
      if (activeFallback) {
        activeFallback.stop();
      }
    },
  };
}
