import React from 'react';

/**
 * IPTV Smarters Pro style animated cyan dual-ring spinner.
 * Pure CSS @keyframes — 100% Chromium 53 / LG webOS 4.0 GPU-friendly.
 */
export default function LoadingSpinner({
  size = 56,
  label = 'Loading...',
  sublabel = '',
  inline = false,
}) {
  if (inline) {
    return (
      <span className="smarters-inline-loader">
        <span
          className="smarters-spinner"
          style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 8)) }}
          aria-hidden="true"
        />
        {label && <span style={{ marginLeft: 8 }}>{label}</span>}
      </span>
    );
  }

  return (
    <div className="smarters-loader-box" role="status" aria-live="polite">
      <div className="smarters-spinner-wrap" style={{ width: size, height: size }}>
        <div className="smarters-spinner" style={{ width: size, height: size }} />
        <div
          className="smarters-spinner-inner"
          style={{
            width: Math.round(size * 0.64),
            height: Math.round(size * 0.64),
            top: Math.round(size * 0.18),
            left: Math.round(size * 0.18),
          }}
        />
      </div>
      {label && <div className="smarters-loader-title">{label}</div>}
      {sublabel && <div className="smarters-loader-sub">{sublabel}</div>}
    </div>
  );
}
