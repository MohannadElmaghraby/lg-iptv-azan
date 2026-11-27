import React, { useState, useEffect, useRef } from 'react';
import { WEBOS_KEYS } from '../utils/spatialNav.js';
import { formatPlaybackTime } from '../utils/watchProgress.js';
import { playKidsLessonSlideAudio, stopKidsVoice } from '../utils/kidsGreeting.js';

function renderShapeSvg(shape, colorHex) {
  const fill = colorHex || '#38bdf8';
  if (shape === 'circle') {
    return (
      <svg width="230" height="230" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="48" fill={fill} />
      </svg>
    );
  }
  if (shape === 'square') {
    return (
      <svg width="230" height="230" viewBox="0 0 120 120">
        <rect x="16" y="16" width="88" height="88" rx="14" fill={fill} />
      </svg>
    );
  }
  if (shape === 'triangle') {
    return (
      <svg width="230" height="230" viewBox="0 0 120 120">
        <polygon points="60,12 108,104 12,104" fill={fill} />
      </svg>
    );
  }
  if (shape === 'rectangle') {
    return (
      <svg width="270" height="180" viewBox="0 0 160 100">
        <rect x="10" y="14" width="140" height="72" rx="12" fill={fill} />
      </svg>
    );
  }
  if (shape === 'star') {
    return (
      <svg width="230" height="230" viewBox="0 0 120 120">
        <polygon points="60,8 75,42 112,46 84,71 92,108 60,89 28,108 36,71 8,46 45,42" fill={fill} />
      </svg>
    );
  }
  if (shape === 'heart') {
    return (
      <svg width="230" height="230" viewBox="0 0 120 120">
        <path d="M60 104 C22 78 10 54 10 36 C10 20 23 10 37 10 C47 10 55 16 60 24 C65 16 73 10 83 10 C97 10 110 20 110 36 C110 54 98 78 60 104 Z" fill={fill} />
      </svg>
    );
  }
  return (
    <svg width="230" height="230" viewBox="0 0 120 120">
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
  const [revealedCount, setRevealedCount] = useState(1);
  const wasPlayingRef = useRef(true);
  const prevPauseRef = useRef(null);

  const slides = (lesson && lesson.slides) || [];
  const currentSlide = slides[slideIndex] || slides[0];
  const secPerSlide = 5;
  const totalSec = slides.length * secPerSlide;

  useEffect(function () {
    setSlideIndex(0);
    setElapsedSec(0);
    setIsPlaying(true);
    return function () {
      stopKidsVoice();
    };
  }, [lesson && lesson.id]);

  // Play real human MP3 narration on slide change
  useEffect(function () {
    if (isPlaying && !externalPauseReason && currentSlide) {
      playKidsLessonSlideAudio(currentSlide);
    }
  }, [slideIndex, isPlaying, externalPauseReason]);

  // Animated one-by-one counting pop-in!
  useEffect(function () {
    if (!currentSlide) return undefined;
    const target = currentSlide.count || 1;
    if (target <= 1) {
      setRevealedCount(1);
      return undefined;
    }
    setRevealedCount(1);
    const stepMs = Math.max(120, Math.min(340, Math.floor(2400 / target)));
    let cur = 1;
    const timer = setInterval(function () {
      cur += 1;
      if (cur >= target) {
        setRevealedCount(target);
        clearInterval(timer);
      } else {
        setRevealedCount(cur);
      }
    }, stepMs);
    return function () { clearInterval(timer); };
  }, [slideIndex, lesson && lesson.id]);

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
      stopKidsVoice();
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
  const shownCount = Math.min(count, revealedCount);
  const visualItems = [];
  for (let i = 0; i < shownCount; i += 1) {
    visualItems.push(i);
  }
  const accent = currentSlide.colorHex || lesson.accent || '#38bdf8';

  return (
    <div
      className="fullscreen-overlay"
      data-modal-scope="kids-player"
      style={{ backgroundColor: '#05080f', padding: '26px 42px', justifyContent: 'space-between' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, color: accent, fontWeight: 800 }}>
            🧸 Asser &amp; Eyad • {lesson.category}
          </div>
          <h2 style={{ fontSize: 32, margin: '4px 0 0 0' }}>
            {lesson.title}{' '}
            <span style={{ fontSize: 22, color: '#98a2b3', marginLeft: 12 }} dir="rtl">
              {lesson.arTitle}
            </span>
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

      {/* Animated Cartoon Learning Stage */}
      <div
        key={lesson.id + '_' + slideIndex}
        className="kids-stage-card"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          margin: '16px 0',
          borderRadius: 28,
          background: 'radial-gradient(circle at center, rgba(20, 32, 54, 0.95) 0%, rgba(8, 12, 22, 0.99) 75%)',
          border: '3px solid ' + accent,
          padding: '28px 36px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {currentSlide.bigBadge && (
          <div
            className="kids-big-badge"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderColor: accent,
              color: accent,
            }}
            dir="auto"
          >
            {currentSlide.bigBadge}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            maxWidth: 1280,
            marginBottom: 18,
          }}
        >
          {currentSlide.shape ? (
            <div className="kids-pop-item">{renderShapeSvg(currentSlide.shape, currentSlide.colorHex)}</div>
          ) : (
            visualItems.map(function (n) {
              const isMany = count > 10;
              const isMed = count > 5;
              return (
                <div
                  key={n}
                  className="kids-pop-item"
                  style={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    margin: isMany ? '6px 10px' : '8px 14px',
                  }}
                >
                  <span
                    style={{
                      fontSize: isMany ? 64 : isMed ? 82 : 112,
                      lineHeight: 1.1,
                    }}
                  >
                    {currentSlide.visual}
                  </span>
                  {count > 1 && (
                    <span
                      style={{
                        marginTop: 4,
                        padding: '2px 10px',
                        borderRadius: 999,
                        fontSize: 16,
                        fontWeight: 800,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: accent,
                      }}
                    >
                      {n + 1}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            color: accent,
            marginBottom: 8,
          }}
          dir="auto"
        >
          {currentSlide.word}
        </div>
        <div style={{ fontSize: 30, color: '#e2e8f0', fontWeight: 700 }} dir="auto">
          {currentSlide.subtitle}
        </div>
      </div>

      {/* Lesson Controls */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#98a2b3', marginBottom: 6 }}>
          <span>
            Slide {slideIndex + 1} / {slides.length} ({formatPlaybackTime(elapsedSec)})
          </span>
          <span>{formatPlaybackTime(totalSec)}</span>
        </div>
        <div className="progress-track" style={{ height: 8, marginBottom: 14 }}>
          <div
            className="progress-fill"
            style={{
              width: Math.min(100, (elapsedSec / Math.max(1, totalSec)) * 100) + '%',
              backgroundColor: accent,
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
              if (currentSlide) playKidsLessonSlideAudio(currentSlide);
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
