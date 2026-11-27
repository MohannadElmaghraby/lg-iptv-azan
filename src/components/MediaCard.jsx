import React, { useState } from 'react';
import { formatPlaybackTime } from '../utils/watchProgress.js';

export default function MediaCard({
  item,
  isFavorite,
  onSelect,
  onToggleFavorite,
  onRemoveProgress,
  showProgress,
}) {
  const [imgError, setImgError] = useState(false);
  const typeLabel =
    item.type === 'live' ? 'LIVE' : item.type === 'movies' ? 'MOVIE' : 'SERIES';

  const progressPct =
    showProgress && item.duration > 0
      ? Math.min(99, Math.max(4, Math.round((item.currentTime / item.duration) * 100)))
      : item.progressPercent || 0;

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
              {item.type === 'live' ? '📺' : item.type === 'movies' ? '🎬' : '🎞'}
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
