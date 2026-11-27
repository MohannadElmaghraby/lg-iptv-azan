import React, { useState, useEffect } from 'react';
import { fetchXtreamSeriesEpisodes } from '../utils/xtreamClient.js';
import { formatPlaybackTime, findWatchProgressForItem, isResumableProgress } from '../utils/watchProgress.js';

export function ResumePromptModal({ entry, onResume, onStartOver, onClose }) {
  if (!entry) return null;
  return (
    <div className="modal-backdrop" data-modal-scope="resume-modal">
      <div className="modal-card" style={{ width: 620, textAlign: 'center' }}>
        <div style={{ fontSize: 15, color: '#d4af37', fontWeight: 700, marginBottom: 8 }}>
          CONTINUE WATCHING
        </div>
        <h3 style={{ fontSize: 28, margin: '0 0 10px 0' }} dir="auto">
          {entry.title}
        </h3>
        <p style={{ fontSize: 18, color: '#98a2b3', margin: '0 0 24px 0' }}>
          You watched up to <strong style={{ color: '#f5f7fa' }}>{formatPlaybackTime(entry.currentTime)}</strong>
          {entry.duration > 0 ? ' of ' + formatPlaybackTime(entry.duration) : ''}.
        </p>

        <div className="btn-row" style={{ justifyContent: 'center' }}>
          <button
            type="button"
            data-focusable="true"
            className="tv-btn primary"
            onClick={function () { onResume(entry); }}
          >
            ▶ Resume from {formatPlaybackTime(entry.currentTime)}
          </button>
          <button
            type="button"
            data-focusable="true"
            className="tv-btn"
            onClick={function () { onStartOver(entry); }}
          >
            ↺ Start Over
          </button>
          <button
            type="button"
            data-focusable="true"
            className="tv-btn danger"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function SeriesModal({
  seriesItem,
  xtreamCreds,
  watchProgress,
  onPlayEpisode,
  onResumeEpisode,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seasons, setSeasons] = useState({});
  const [activeSeason, setActiveSeason] = useState('');

  const latestSaved = seriesItem ? findWatchProgressForItem(watchProgress, seriesItem) : null;

  useEffect(function () {
    if (!seriesItem || !seriesItem.isSeriesContainer) return;
    let active = true;
    setLoading(true);
    setError('');
    fetchXtreamSeriesEpisodes(xtreamCreds, seriesItem.seriesId)
      .then(function (data) {
        if (!active) return;
        const map = data.episodesBySeason || {};
        setSeasons(map);
        const keys = Object.keys(map);
        const savedSeason = latestSaved && latestSaved.season ? String(latestSaved.season) : '';
        setActiveSeason(savedSeason && map[savedSeason] ? savedSeason : (keys[0] || ''));
        setLoading(false);
      })
      .catch(function (err) {
        if (!active) return;
        setError(err.message || 'Failed to load episodes');
        setLoading(false);
      });
    return function () { active = false; };
  }, [seriesItem, xtreamCreds]);

  if (!seriesItem) return null;

  const seasonKeys = Object.keys(seasons);
  const episodes = activeSeason && seasons[activeSeason] ? seasons[activeSeason] : [];

  return (
    <div className="modal-backdrop" data-modal-scope="series-modal">
      <div className="modal-card">
        <div className="section-header">
          <div>
            <h3 style={{ fontSize: 28, margin: 0 }} dir="auto">{seriesItem.title}</h3>
            <div style={{ fontSize: 15, color: '#98a2b3', marginTop: 4 }} dir="auto">
              {seriesItem.group}
            </div>
          </div>
          <button type="button" data-focusable="true" className="tv-btn small danger" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {/* Always show Resume / Continue Watching banner when this series has saved progress */}
        {latestSaved && (
          <div
            style={{
              padding: '16px 20px',
              marginBottom: 18,
              borderRadius: 16,
              backgroundColor: 'rgba(212, 175, 55, 0.14)',
              border: '2px solid #f0c94d',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ marginRight: 16 }}>
              <div style={{ fontSize: 13, color: '#f0c94d', fontWeight: 800, letterSpacing: '0.5px' }}>
                CONTINUE WATCHING
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#f5f7fa', marginTop: 2 }} dir="auto">
                {latestSaved.season ? 'S' + latestSaved.season + ' ' : ''}
                {latestSaved.episode ? 'E' + latestSaved.episode + ' — ' : ''}
                {latestSaved.title}
              </div>
              <div style={{ fontSize: 14, color: '#cbd5e1', marginTop: 2 }}>
                Watched up to {formatPlaybackTime(latestSaved.currentTime)}
                {latestSaved.duration > 0 ? ' / ' + formatPlaybackTime(latestSaved.duration) : ''}
              </div>
            </div>

            <div className="btn-row" style={{ marginBottom: 0 }}>
              <button
                type="button"
                data-focusable="true"
                className="tv-btn primary"
                style={{ marginBottom: 0 }}
                onClick={function () {
                  if (onResumeEpisode) {
                    onResumeEpisode(latestSaved, latestSaved.currentTime || 0);
                  } else {
                    onPlayEpisode(latestSaved);
                  }
                }}
              >
                ▶ Resume from {formatPlaybackTime(latestSaved.currentTime)}
              </button>
              <button
                type="button"
                data-focusable="true"
                className="tv-btn small"
                style={{ marginBottom: 0 }}
                onClick={function () {
                  if (onResumeEpisode) {
                    onResumeEpisode(latestSaved, 0);
                  } else {
                    onPlayEpisode(latestSaved);
                  }
                }}
              >
                ↺ Start Over
              </button>
            </div>
          </div>
        )}

        {seriesItem.plot && (
          <p style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.5, marginBottom: 18 }} dir="auto">
            {seriesItem.plot}
          </p>
        )}

        {loading && <div style={{ padding: 24, fontSize: 18 }}>Loading seasons &amp; episodes...</div>}
        {error && <div style={{ padding: 16, color: '#fca5a5' }}>{error}</div>}

        {!loading && seasonKeys.length > 0 && (
          <div>
            <div className="btn-row" style={{ marginBottom: 16 }}>
              {seasonKeys.map(function (sk) {
                return (
                  <button
                    key={sk}
                    type="button"
                    data-focusable="true"
                    className={'chip' + (activeSeason === sk ? ' active' : '')}
                    onClick={function () { setActiveSeason(sk); }}
                  >
                    Season {sk}
                  </button>
                );
              })}
            </div>

            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {episodes.map(function (ep) {
                const saved = (watchProgress || []).find(function (w) {
                  return isResumableProgress(w) && (w.id === ep.id || (w.url && ep.url && w.url === ep.url));
                });
                return (
                  <button
                    key={ep.id}
                    type="button"
                    data-focusable="true"
                    className="tv-btn"
                    style={{
                      width: '100%',
                      justifyContent: 'space-between',
                      marginRight: 0,
                      textAlign: 'left',
                    }}
                    onClick={function () {
                      onPlayEpisode(Object.assign({}, ep, {
                        logo: seriesItem.logo,
                        group: seriesItem.title + ' • Season ' + ep.season,
                        seriesId: seriesItem.seriesId,
                        seriesTitle: seriesItem.title,
                      }));
                    }}
                  >
                    <span dir="auto">
                      E{ep.episode} — {ep.title}
                    </span>
                    <span style={{ fontSize: 14, color: '#f0c94d' }}>
                      {saved ? '▶ Resume ' + formatPlaybackTime(saved.currentTime) : (ep.duration || '▶ Play')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
