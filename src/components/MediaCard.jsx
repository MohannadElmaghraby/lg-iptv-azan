import React, { useState } from 'react';
import { formatPlaybackTime } from '../utils/watchProgress.js';
import AppIcon from './AppIcon.jsx';

export default function MediaCard({
  item,
  isFavorite,
  onSelect,
  onToggleFavorite,
  onRemoveProgress,
  showProgress,
  posterWall,
}) {
  const [imgError, setImgError] = useState(false);
  const typeLabel =
    item.type === 'live' ? 'LIVE' : item.type === 'movies' ? 'MOVIE' : 'SERIES';

  const progressPct =
    showProgress && item.duration > 0
      ? Math.min(99, Math.max(4, Math.round((item.currentTime / item.duration) * 100)))
      : item.progressPercent || 0;

  const ratingNum = item.rating !== undefined && item.rating !== null && String(item.rating).trim() !== '' && String(item.rating) !== '0'
    ? String(item.rating).trim().slice(0, 4)
    : '';

  if (posterWall) {
    return (
      <div className="smarters-poster-wrap">
        <div className="card-action-overlay">
          {onToggleFavorite && (
            <button
              type="button"
              data-focusable="true"
              className={'card-icon-btn' + (isFavorite ? ' starred' : '')}
              onClick={function (e) {
                e.stopPropagation();
                onToggleFavorite(item);
              }}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              title={isFavorite ? 'Unstar' : 'Star Favorite'}
            >
              {isFavorite ? '★' : '☆'}
            </button>
          )}
          {onRemoveProgress && (
            <button
              type="button"
              data-focusable="true"
              className="card-icon-btn remove-btn"
              onClick={function (e) {
                e.stopPropagation();
                onRemoveProgress(item.id);
              }}
              aria-label={'Remove ' + item.title + ' from Continue Watching'}
              title="Remove from Continue Watching"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          data-focusable="true"
          className="smarters-poster-card media-card"
          onClick={function () { onSelect(item); }}
        >
          {ratingNum && <span className="smarters-rating-pill">{ratingNum}</span>}

          {item.logo && !imgError ? (
            <img
              src={item.logo}
              alt={item.title}
              className="smarters-poster-img"
              loading="lazy"
              onError={function () { setImgError(true); }}
            />
          ) : (
            <div className="smarters-poster-fallback">
              <AppIcon
                name={item.type === 'movies' ? 'movies' : 'series'}
                size={68}
                color="#38bdf8"
              />
            </div>
          )}

          <div className="smarters-poster-caption">
            <div className="smarters-poster-title media-title" dir="auto">
              {item.title}
            </div>
            {showProgress && item.currentTime > 0 && (
              <div className="smarters-poster-sub">
                Resume at {formatPlaybackTime(item.currentTime)}
              </div>
            )}
          </div>

          {showProgress && progressPct > 0 && (
            <div className="smarters-poster-progress">
              <div className="smarters-poster-progress-fill" style={{ width: progressPct + '%' }} />
            </div>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="media-card-wrap">
      <div className="card-action-overlay">
        {onToggleFavorite && (
          <button
            type="button"
            data-focusable="true"
            className={'card-icon-btn' + (isFavorite ? ' starred' : '')}
            onClick={function (e) {
              e.stopPropagation();
              onToggleFavorite(item);
            }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            title={isFavorite ? 'Unstar' : 'Star Favorite'}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        )}
        {onRemoveProgress && (
          <button
            type="button"
            data-focusable="true"
            className="card-icon-btn remove-btn"
            onClick={function (e) {
              e.stopPropagation();
              onRemoveProgress(item.id);
            }}
            aria-label={'Remove ' + item.title + ' from Continue Watching'}
            title="Remove from Continue Watching"
          >
            ✕
          </button>
        )}
      </div>

      <button
        type="button"
        data-focusable="true"
        className="media-card"
        onClick={function () { onSelect(item); }}
      >
        <div className={'media-thumb' + (item.type !== 'live' ? ' poster' : '')}>
          {item.logo && !imgError ? (
            <img
              src={item.logo}
              alt={item.title}
              loading="lazy"
              onError={function () { setImgError(true); }}
            />
          ) : (
            <span className="media-placeholder-icon">
              <AppIcon
                name={item.type === 'live' ? 'live' : item.type === 'movies' ? 'movies' : 'series'}
                size={58}
              />
            </span>
          )}
          <span className="media-type-badge">{typeLabel}</span>
        </div>

        <div className="media-card-body">
          <div className="media-title" dir="auto">
            {item.title}
          </div>
          <div className="media-group" dir="auto">
            {showProgress && item.currentTime > 0
              ? 'Resume at ' + formatPlaybackTime(item.currentTime) + (item.duration > 0 ? ' / ' + formatPlaybackTime(item.duration) : '')
              : (item.group || 'General')}
          </div>
          {showProgress && progressPct > 0 && (
            <div className="progress-track">
              <div className="progress-fill" style={{ width: progressPct + '%' }} />
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
