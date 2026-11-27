import React, { useState } from 'react';
import { KIDS_PLAYLIST_PRESETS } from '../data/kidsLessons.js';

export default function SettingsView({
  sourceConfig,
  convertTsToM3u8,
  loadingSource,
  sourceStatus,
  onToggleConvertTs,
  onLoadM3uUrl,
  onLoadM3uFileText,
  onLoadXtream,
  onClearCatalog,
}) {
  const [m3uUrl, setM3uUrl] = useState((sourceConfig && sourceConfig.m3uUrl) || '');
  const [xtServer, setXtServer] = useState((sourceConfig && sourceConfig.xtream && sourceConfig.xtream.serverUrl) || '');
  const [xtUser, setXtUser] = useState((sourceConfig && sourceConfig.xtream && sourceConfig.xtream.username) || '');
  const [xtPass, setXtPass] = useState((sourceConfig && sourceConfig.xtream && sourceConfig.xtream.password) || '');

  const handleFileChange = function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      if (ev.target && typeof ev.target.result === 'string') {
        onLoadM3uFileText(ev.target.result, file.name);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      {/* Playback Compatibility Toggle */}
      <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 820 }}>
          <h3 className="section-title" style={{ marginBottom: 6 }}>
            LG webOS 4.0 Stream Compatibility
          </h3>
          <div style={{ fontSize: 15, color: '#98a2b3' }}>
            Automatically rewrite <code>output=ts</code> to <code>output=m3u8</code> (HLS) for smoother playback on your 2018 LG OLED E8, with automatic native <code>&lt;video&gt;</code> fallback.
          </div>
        </div>
        <button
          type="button"
          data-focusable="true"
          className={'tv-btn' + (convertTsToM3u8 ? ' emerald' : '')}
          onClick={function () { onToggleConvertTs(!convertTsToM3u8); }}
        >
          {convertTsToM3u8 ? '✓ output=ts → m3u8: ON' : 'output=ts → m3u8: OFF'}
        </button>
      </div>

      {sourceStatus && (
        <div
          className="panel"
          style={{
            borderColor: sourceStatus.error ? 'rgba(239, 68, 68, 0.5)' : 'rgba(16, 185, 129, 0.45)',
            color: sourceStatus.error ? '#fca5a5' : '#6ee7b7',
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {sourceStatus.message}
        </div>
      )}

      {/* M3U / M3U_Plus URL + File Upload */}
      <div className="panel">
        <h3 className="section-title" style={{ marginBottom: 14 }}>M3U / M3U_Plus Playlist</h3>
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">M3U / M3U_Plus URL (saved locally in browser)</label>
            <input
              type="text"
              data-focusable="true"
              className="tv-input"
              placeholder="http://host/get.php?username=...&password=...&type=m3u_plus&output=ts"
              value={m3uUrl}
              onChange={function (e) { setM3uUrl(e.target.value); }}
            />
          </div>
        </div>

        <div className="btn-row">
          <button
            type="button"
            data-focusable="true"
            className="tv-btn primary"
            disabled={loadingSource || !m3uUrl.trim()}
            onClick={function () { onLoadM3uUrl(m3uUrl.trim()); }}
          >
            {loadingSource ? 'Loading Playlist...' : 'Load & Save M3U URL'}
          </button>

          <label className="tv-btn" data-focusable="true" tabIndex={0} style={{ cursor: 'pointer' }}>
            📁 Upload Local .m3u / .m3u8
            <input
              type="file"
              accept=".m3u,.m3u8,.txt"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </label>

          <button
            type="button"
            data-focusable="true"
            className="tv-btn emerald"
            disabled={loadingSource}
            onClick={function () {
              const url = KIDS_PLAYLIST_PRESETS[0].url;
              setM3uUrl(url);
              onLoadM3uUrl(url);
            }}
          >
            Load Free Public Kids M3U
          </button>
        </div>
      </div>

      {/* Xtream Codes API */}
      <div className="panel">
        <h3 className="section-title" style={{ marginBottom: 14 }}>Xtream Codes API</h3>
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Server URL</label>
            <input
              type="text"
              data-focusable="true"
              className="tv-input"
              placeholder="http://example.com:8080"
              value={xtServer}
              onChange={function (e) { setXtServer(e.target.value); }}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Username</label>
            <input
              type="text"
              data-focusable="true"
              className="tv-input"
              placeholder="Username"
              value={xtUser}
              onChange={function (e) { setXtUser(e.target.value); }}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Password</label>
            <input
              type="password"
              data-focusable="true"
              className="tv-input"
              placeholder="Password"
              value={xtPass}
              onChange={function (e) { setXtPass(e.target.value); }}
            />
          </div>
        </div>

        <div className="btn-row" style={{ marginBottom: 0 }}>
          <button
            type="button"
            data-focusable="true"
            className="tv-btn primary"
            disabled={loadingSource || !xtServer.trim() || !xtUser.trim()}
            onClick={function () {
              onLoadXtream({
                serverUrl: xtServer.trim(),
                username: xtUser.trim(),
                password: xtPass.trim(),
              });
            }}
          >
            {loadingSource ? 'Connecting...' : 'Connect & Save Xtream Codes'}
          </button>

          <button
            type="button"
            data-focusable="true"
            className="tv-btn danger"
            onClick={onClearCatalog}
          >
            Clear Saved Source
          </button>
        </div>
      </div>
    </div>
  );
}
