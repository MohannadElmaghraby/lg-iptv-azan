import React, { useState, useEffect, useRef } from 'react';
import { WEBOS_KEYS } from '../utils/spatialNav.js';
import { formatPlaybackTime } from '../utils/watchProgress.js';

function speakTextSafe(text) {
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined') {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.rate = 0.86;
      utter.pitch = 1.12;
      window.speechSynthesis.speak(utter);
    }
  } catch (e) {
    // Ignore if SpeechSynthesis unavailable on TV
  }
}

function renderShapeSvg(shape, colorHex) {
  const fill = colorHex || '#38bdf8';
  if (shape === 'circle') {
    return (
      <svg width="210" height="210" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="48" fill={fill} />
      </svg>
    );
  }
  if (shape === 'square') {
    return (
      <svg width="210" height="210" viewBox="0 0 120 120">
        <rect x="16" y="16" width="88" height="88" rx="10" fill={fill} />
      </svg>
    );
  }
  if (shape === 'triangle') {
    return (
      <svg width="210" height="210" viewBox="0 0 120 120">
        <polygon points="60,12 108,104 12,104" fill={fill} />
      </svg>
    );
  }
  if (shape === 'rectangle') {
    return (
      <svg width="250" height="170" viewBox="0 0 160 100">
        <rect x="10" y="14" width="140" height="72" rx="10" fill={fill} />
      </svg>
    );
  }
  if (shape === 'star') {
    return (
      <svg width="210" height="210" viewBox="0 0 120 120">
        <polygon points="60,8 75,42 112,46 84,71 92,108 60,89 28,108 36,71 8,46 45,42" fill={fill} />
      </svg>
    );
  }
  if (shape === 'heart') {
    return (
      <svg width="210" height="210" viewBox="0 0 120 120">
        <path d="M60 104 C22 78 10 54 10 36 C10 20 23 10 37 10 C47 10 55 16 60 24 C65 16 73 10 83 10 C97 10 110 20 110 36 C110 54 98 78 60 104 Z" fill={fill} />
      </svg>
    );
  }
  return (
    <svg width="210" height="210" viewBox="0 0 120 120">
      <polygon points="60,10 106,60 60,110 14,60" fill={fill} />
    </svg>
  );
}

export default function KidsLearningPlayer({
  lesson,
  externalPauseReason,
  onTriggerTestAzan,
  onClose,
}) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [elapsedSec, setElapsedSec] = useState(0);
  const wasPlayingRef = useRef(true);
  const prevPauseRef = useRef(null);

  const slides = (lesson && lesson.slides) || [];
  const currentSlide = slides[slideIndex] || slides[0];
  const secPerSlide = 4;
  const totalSec = slides.length * secPerSlide;

  useEffect(function () {
    setSlideIndex(0);
    setElapsedSec(0);
    setIsPlaying(true);
    return function () {
      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      } catch (e) { /* ignore */ }
    };
  }, [lesson && lesson.id]);

  // Speak active slide word for toddlers
  useEffect(function () {
    if (isPlaying && !externalPauseReason && currentSlide && currentSlide.speak) {
      speakTextSafe(currentSlide.speak);
    }
  }, [slideIndex, isPlaying, externalPauseReason]);

  // Auto-advance lesson timer
  useEffect(function () {
    if (!isPlaying || externalPauseReason) return undefined;
    const interval = setInterval(function () {
      setElapsedSec(function (prev) {
        const next = prev + 1;
        if (next >= totalSec) {
          setSlideIndex(0);
          return 0;
        }
        const nextIdx = Math.floor(next / secPerSlide) % slides.length;
        setSlideIndex(nextIdx);
        return next;
      });
    }, 1000);
    return function () { clearInterval(interval); };
  }, [isPlaying, externalPauseReason, slides.length, totalSec]);

  // Pause & resume on Azan / Kids Lock
  useEffect(function () {
    if (externalPauseReason && !prevPauseRef.current) {
      wasPlayingRef.current = isPlaying;
      setIsPlaying(false);
      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      } catch (e) { /* ignore */ }
    } else if (!externalPauseReason && prevPauseRef.current) {
      if (prevPauseRef.current === 'azan' && wasPlayingRef.current) {
        setIsPlaying(true);
      }
    }
    prevPauseRef.current = externalPauseReason;
  }, [externalPauseReason, isPlaying]);

  useEffect(function () {
    const onKeyDown = function (e) {
      if (externalPauseReason) return;
      const code = e.keyCode || e.which;
      if (code === WEBOS_KEYS.BACK || code === WEBOS_KEYS.ESCAPE || code === WEBOS_KEYS.STOP) {
        e.preventDefault();
        onClose();
      } else if (code === WEBOS_KEYS.MEDIA_PLAY_PAUSE || code === WEBOS_KEYS.SPACE || code === WEBOS_KEYS.PAUSE || code === WEBOS_KEYS.PLAY) {
        e.preventDefault();
        setIsPlaying(function (p) { return !p; });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return function () { window.removeEventListener('keydown', onKeyDown); };
  }, [externalPauseReason, onClose]);

  if (!lesson || !currentSlide) return null;

  const jumpSlide = function (idx) {
    const safeIdx = (idx + slides.length) % slides.length;
    setSlideIndex(safeIdx);
    setElapsedSec(safeIdx * secPerSlide);
  };

  const count = currentSlide.count || 1;
  const visualItems = [];
  for (let i = 0; i < count; i += 1) {
    visualItems.push(i);
  }

  return (
    <div className="fullscreen-overlay" data-modal-scope="kids-player" style={{ backgroundColor: '#05080f', padding: '28px 42px', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, color: lesson.accent || '#38bdf8', fontWeight: 700 }}>
            🧸 Asser &amp; Eyad • {lesson.category}
          </div>
          <h2 style={{ fontSize: 32, margin: '4px 0 0 0' }}>
            {lesson.title} <span style={{ fontSize: 22, color: '#98a2b3', marginLeft: 12 }} dir="rtl">{lesson.arTitle}</span>
          </h2>
        </div>

        <div className="btn-row">
          {onTriggerTestAzan && (
            <button type="button" data-focusable="true" className="tv-btn small" onClick={onTriggerTestAzan}>
              🕌 Test Azan Pause
            </button>
          )}
          <button type="button" data-focusable="true" className="tv-btn small danger" onClick={onClose}>
            ✕ Back to Kids
          </button>
        </div>
      </div>

      {/* Central Toddler-Friendly Visual Stage */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          margin: '18px 0',
          borderRadius: 28,
          backgroundColor: '#0b101b',
          border: '3px solid ' + (currentSlide.colorHex || lesson.accent || '#38bdf8'),
          padding: 36,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 22 }}>
          {currentSlide.shape ? (
            renderShapeSvg(currentSlide.shape, currentSlide.colorHex)
          ) : (
            visualItems.map(function (n) {
              return (
                <span
                  key={n}
                  style={{
                    fontSize: count > 5 ? 74 : 110,
                    margin: '0 12px',
                    lineHeight: 1.15,
                  }}
                >
                  {currentSlide.visual}
                </span>
              );
            })
          )}
        </div>

        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: currentSlide.colorHex || '#f5f7fa',
            marginBottom: 10,
          }}
        >
          {currentSlide.word}
        </div>
        <div style={{ fontSize: 30, color: '#cbd5e1', fontWeight: 600 }}>
          {currentSlide.subtitle}
        </div>
      </div>

      {/* Lesson Controls */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#98a2b3', marginBottom: 6 }}>
          <span>Slide {slideIndex + 1} / {slides.length} ({formatPlaybackTime(elapsedSec)})</span>
          <span>{formatPlaybackTime(totalSec)}</span>
        </div>
        <div className="progress-track" style={{ height: 8, marginBottom: 16 }}>
          <div
            className="progress-fill"
            style={{
              width: Math.min(100, (elapsedSec / Math.max(1, totalSec)) * 100) + '%',
              backgroundColor: lesson.accent || '#38bdf8',
            }}
          />
        </div>

        <div className="btn-row" style={{ justifyContent: 'center' }}>
          <button
            type="button"
            data-focusable="true"
            className="tv-btn"
            onClick={function () { jumpSlide(slideIndex - 1); }}
          >
            ◀ Previous
          </button>
          <button
            type="button"
            data-focusable="true"
            className="tv-btn primary"
            onClick={function () { setIsPlaying(!isPlaying); }}
          >
            {isPlaying ? '⏸ Pause Lesson' : '▶ Play Lesson'}
          </button>
          <button
            type="button"
            data-focusable="true"
            className="tv-btn"
            onClick={function () {
              if (currentSlide && currentSlide.speak) speakTextSafe(currentSlide.speak);
            }}
          >
            🔊 Repeat Voice
          </button>
          <button
            type="button"
            data-focusable="true"
            className="tv-btn"
            onClick={function () { jumpSlide(slideIndex + 1); }}
          >
            Next ▶
          </button>
        </div>
      </div>
    </div>
  );
}
