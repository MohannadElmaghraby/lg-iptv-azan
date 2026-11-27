import React from 'react';
import {
  CITY_PRESETS,
  CALCULATION_METHODS,
  formatPrayerClock,
  formatCountdown,
} from '../utils/azan.js';

export default function PrayerAzanView({
  settings,
  nextPrayerInfo,
  onUpdateSettings,
  onTestAzan,
  onTestAzanWithVideo,
}) {
  const schedule = (nextPrayerInfo && nextPrayerInfo.schedule) || [];
  const nextKey = nextPrayerInfo && nextPrayerInfo.prayer ? nextPrayerInfo.prayer.key : '';

  const handleCityChange = function (cityId) {
    const city = CITY_PRESETS.find(function (c) { return c.id === cityId; });
    if (!city) return;
    onUpdateSettings(
      Object.assign({}, settings, {
        cityId: city.id,
        cityName: city.name,
        latitude: city.lat,
        longitude: city.lon,
        method: city.method,
      })
    );
  };

  const togglePrayer = function (key) {
    const nextEnabled = Object.assign({}, settings.enabled, {
      [key]: settings.enabled[key] === false,
    });
    onUpdateSettings(Object.assign({}, settings, { enabled: nextEnabled }));
  };

  const adjustOffset = function (key, delta) {
    const cur = Number((settings.offsets && settings.offsets[key]) || 0);
    const nextVal = Math.max(-30, Math.min(30, cur + delta));
    const nextOffsets = Object.assign({}, settings.offsets, { [key]: nextVal });
    onUpdateSettings(Object.assign({}, settings, { offsets: nextOffsets }));
  };

  return (
    <div>
      {/* Header & Test Triggers */}
      <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontSize: 26, margin: '0 0 6px 0', color: '#f0c94d' }}>
            🕌 Offline Arabic Azan &amp; Prayer Times
          </h3>
          <div style={{ fontSize: 16, color: '#98a2b3' }}>
            {nextPrayerInfo && nextPrayerInfo.prayer ? (
              <span>
                Next Prayer: <strong style={{ color: '#f5f7fa' }}>{nextPrayerInfo.prayer.en}</strong>{' '}
                (<span dir="rtl">{nextPrayerInfo.prayer.ar}</span>) in{' '}
                <strong style={{ color: '#f0c94d' }}>{formatCountdown(nextPrayerInfo.remainingMs)}</strong>
              </span>
            ) : '100% offline calculation powered by adhan'}
          </div>
        </div>

        <div className="btn-row">
          <button
            type="button"
            data-focusable="true"
            className="tv-btn primary"
            onClick={function () { onTestAzan(nextPrayerInfo && nextPrayerInfo.prayer); }}
          >
            🔔 Test Azan Now
          </button>
          {onTestAzanWithVideo && (
            <button
              type="button"
              data-focusable="true"
              className="tv-btn emerald"
              onClick={onTestAzanWithVideo}
            >
              ▶ Test Azan + Video Auto-Pause
            </button>
          )}
        </div>
      </div>

      {/* Today's 5 Prayer Cards with Per-Prayer Toggle & Minute Offset */}
      <div className="prayer-cards-row">
        {schedule.map(function (p) {
          const isNext = p.key === nextKey;
          return (
            <div className={'prayer-card' + (isNext ? ' next' : '')} key={p.key}>
              <div className="prayer-card-top">
                <span className="prayer-name-en">{p.en}</span>
                <span className="prayer-name-ar" dir="rtl">{p.ar}</span>
              </div>
              <div className="prayer-clock">{formatPrayerClock(p.time)}</div>

              <div className="btn-row" style={{ marginBottom: 0 }}>
                <button
                  type="button"
                  data-focusable="true"
                  className={'tv-btn small' + (p.enabled ? ' emerald' : '')}
                  onClick={function () { togglePrayer(p.key); }}
                >
                  {p.enabled ? '🔔 Azan ON' : '🔕 Muted'}
                </button>
                <button
                  type="button"
                  data-focusable="true"
                  className="tv-btn small"
                  onClick={function () { adjustOffset(p.key, -1); }}
                >
                  -1m
                </button>
                <span style={{ fontSize: 14, color: '#cbd5e1', marginRight: 6, marginBottom: 0 }}>
                  {p.offsetMin > 0 ? '+' + p.offsetMin + 'm' : p.offsetMin + 'm'}
                </span>
                <button
                  type="button"
                  data-focusable="true"
                  className="tv-btn small"
                  onClick={function () { adjustOffset(p.key, 1); }}
                >
                  +1m
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Location, Method, Madhab & Custom MP3 Settings */}
      <div className="panel">
        <h3 className="section-title" style={{ marginBottom: 16 }}>Location &amp; Calculation Settings</h3>

        <div className="form-row">
          <div className="form-field">
            <label className="form-label">City Preset</label>
            <select
              data-focusable="true"
              className="tv-select"
              value={settings.cityId}
              onChange={function (e) { handleCityChange(e.target.value); }}
            >
              {CITY_PRESETS.map(function (c) {
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.ar})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Calculation Method</label>
            <select
              data-focusable="true"
              className="tv-select"
              value={settings.method}
              onChange={function (e) {
                onUpdateSettings(Object.assign({}, settings, { method: e.target.value }));
              }}
            >
              {CALCULATION_METHODS.map(function (m) {
                return (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Asr Madhab</label>
            <select
              data-focusable="true"
              className="tv-select"
              value={settings.madhab}
              onChange={function (e) {
                onUpdateSettings(Object.assign({}, settings, { madhab: e.target.value }));
              }}
            >
              <option value="Shafi">Standard (Shafi / Maliki / Hanbali)</option>
              <option value="Hanafi">Hanafi</option>
            </select>
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 0 }}>
          <div className="form-field">
            <label className="form-label">Custom Latitude</label>
            <input
              type="number"
              step="0.0001"
              data-focusable="true"
              className="tv-input"
              value={settings.latitude}
              onChange={function (e) {
                onUpdateSettings(Object.assign({}, settings, {
                  cityId: 'custom',
                  latitude: parseFloat(e.target.value) || 0,
                }));
              }}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Custom Longitude</label>
            <input
              type="number"
              step="0.0001"
              data-focusable="true"
              className="tv-input"
              value={settings.longitude}
              onChange={function (e) {
                onUpdateSettings(Object.assign({}, settings, {
                  cityId: 'custom',
                  longitude: parseFloat(e.target.value) || 0,
                }));
              }}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Custom Azan Audio MP3 URL (optional)</label>
            <input
              type="text"
              data-focusable="true"
              className="tv-input"
              placeholder="./audio/azan.mp3 (or https://...)"
              value={settings.customAudioUrl || ''}
              onChange={function (e) {
                onUpdateSettings(Object.assign({}, settings, { customAudioUrl: e.target.value }));
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
