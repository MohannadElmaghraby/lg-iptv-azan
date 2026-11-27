import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WEBOS_KEYS } from '../utils/spatialNav.js';
import { stopKidsVoice } from '../utils/kidsGreeting.js';
import KidsIllustration, { mapVisualToKind } from './KidsIllustration.jsx';

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
  // activeCountIdx: 0..count-1 while counting one-by-one; count means finished counting all items
  const [activeCountIdx, setActiveCountIdx] = useState(0);

  const wasPlayingRef = useRef(true);
  const prevPauseRef = useRef(null);
  const audioRef = useRef(null);
  const stepTimerRef = useRef(null);

  const slides = (lesson && lesson.slides) || [];
  const currentSlide = slides[slideIndex] || slides[0];
  const isStepCounting = Boolean(lesson && lesson.stepCount && currentSlide && (currentSlide.count || 1) >= 2);

  const stopAllAudioAndTimers = useCallback(function () {
    stopKidsVoice();
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) { /* ignore */ }
      audioRef.current = null;
    }
  }, []);

  const playSoundFile = useCallback(function (src, onDone, fallbackMs) {
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) { /* ignore */ }
      audioRef.current = null;
    }

    let called = false;
    const finish = function () {
      if (called) return;
      called = true;
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
        stepTimerRef.current = null;
      }
      if (onDone) onDone();
    };

    if (!src) {
      stepTimerRef.current = setTimeout(finish, fallbackMs || 900);
      return;
    }

    // Safety timeout in case audio events don't fire
    stepTimerRef.current = setTimeout(finish, fallbackMs || 4500);

    try {
      const a = new Audio(src);
      a.volume = 1.0;
      audioRef.current = a;
      a.addEventListener('ended', function () {
        setTimeout(finish, 180);
      });
      a.addEventListener('error', function () {
        setTimeout(finish, 750);
      });
      const p = a.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () {
          setTimeout(finish, 750);
        });
      }
    } catch (e) {
      setTimeout(finish, 750);
    }
  }, []);

  // Reset when lesson changes
  useEffect(function () {
    setSlideIndex(0);
    setActiveCountIdx(0);
    setIsPlaying(true);
    return function () {
      stopAllAudioAndTimers();
    };
  }, [lesson && lesson.id, stopAllAudioAndTimers]);

  // Reset active count index when slide changes
  useEffect(function () {
    setActiveCountIdx(0);
  }, [slideIndex]);

  // Step-by-step synced counting & slide progression
  useEffect(function () {
    if (!currentSlide || !isPlaying || externalPauseReason) {
      stopAllAudioAndTimers();
      return undefined;
    }

    let cancelled = false;
    const count = currentSlide.count || 1;

    if (isStepCounting && count >= 2) {
      const runStep = function (idx) {
        if (cancelled) return;
        if (idx < count) {
          setActiveCountIdx(idx);
          const numAudio = idx + 1 <= 20 ? './audio/kids/cnt_' + (idx + 1) + '.mp3' : null;
          playSoundFile(
            numAudio,
            function () {
              if (!cancelled) runStep(idx + 1);
            },
            1400
          );
        } else {
          // Highlight all items & speak final summary phrase ("Three! Three happy ducks!")
          setActiveCountIdx(count);
          playSoundFile(
            currentSlide.audio,
            function () {
              if (!cancelled) {
                stepTimerRef.current = setTimeout(function () {
                  if (!cancelled) {
                    setSlideIndex(function (s) { return (s + 1) % slides.length; });
                  }
                }, 1300);
              }
            },
            4500
          );
        }
      };

      runStep(0);
    } else {
      // Non-counting slide or count === 1: play slide voice and advance calmly
      setActiveCountIdx(0);
      playSoundFile(
        currentSlide.audio,
        function () {
          if (!cancelled) {
            stepTimerRef.current = setTimeout(function () {
              if (!cancelled) {
                setSlideIndex(function (s) { return (s + 1) % slides.length; });
              }
            }, 1800);
          }
        },
        4500
      );
    }

    return function () {
      cancelled = true;
      stopAllAudioAndTimers();
    };
  }, [slideIndex, isPlaying, externalPauseReason, currentSlide, isStepCounting, slides.length, playSoundFile, stopAllAudioAndTimers]);

  // Pause & resume on Azan / Kids Lock
  useEffect(function () {
    if (externalPauseReason && !prevPauseRef.current) {
      wasPlayingRef.current = isPlaying;
      setIsPlaying(false);
      stopAllAudioAndTimers();
    } else if (!externalPauseReason && prevPauseRef.current) {
      if (prevPauseRef.current === 'azan' && wasPlayingRef.current) {
        setIsPlaying(true);
      }
    }
    prevPauseRef.current = externalPauseReason;
  }, [externalPauseReason, isPlaying, stopAllAudioAndTimers]);

  useEffect(function () {
    const onKeyDown = function (e) {
      if (externalPauseReason) return;
      const code = e.keyCode || e.which;
      if (code === WEBOS_KEYS.BACK || code === WEBOS_KEYS.ESCAPE || code === WEBOS_KEYS.STOP) {
        e.preventDefault();
        stopAllAudioAndTimers();
        onClose();
      } else if (code === WEBOS_KEYS.MEDIA_PLAY_PAUSE || code === WEBOS_KEYS.SPACE || code === WEBOS_KEYS.PAUSE || code === WEBOS_KEYS.PLAY) {
        e.preventDefault();
        setIsPlaying(function (p) { return !p; });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return function () { window.removeEventListener('keydown', onKeyDown); };
  }, [externalPauseReason, onClose, stopAllAudioAndTimers]);

  if (!lesson || !currentSlide) return null;

  const jumpSlide = function (idx) {
    stopAllAudioAndTimers();
    const safeIdx = (idx + slides.length) % slides.length;
    setActiveCountIdx(0);
    setSlideIndex(safeIdx);
  };

  const handleCountAgain = function () {
    stopAllAudioAndTimers();
    setActiveCountIdx(0);
    setIsPlaying(false);
    setTimeout(function () {
      setIsPlaying(true);
    }, 30);
  };

  const handleTapTile = function (idx) {
    if (externalPauseReason) return;
    setIsPlaying(false);
    setActiveCountIdx(idx);
    const numAudio = idx + 1 <= 20 ? './audio/kids/cnt_' + (idx + 1) + '.mp3' : currentSlide.audio;
    playSoundFile(numAudio, null, 2000);
  };

  const count = currentSlide.count || 1;
  const visualItems = [];
  for (let i = 0; i < count; i += 1) {
    visualItems.push(i);
  }
  const accent = currentSlide.colorHex || lesson.accent || '#38bdf8';

  const spotlightText = isStepCounting
    ? activeCountIdx < count
      ? String(activeCountIdx + 1)
      : (currentSlide.bigBadge || String(count))
    : currentSlide.bigBadge;

  return (
    <div
      className="fullscreen-overlay"
      data-modal-scope="kids-player"
      style={{ backgroundColor: '#05080f', padding: '24px 42px', justifyContent: 'space-between' }}
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
          <button
            type="button"
            data-focusable="true"
            className="tv-btn small danger"
            onClick={function () { stopAllAudioAndTimers(); onClose(); }}
          >
            ✕ Back to Kids
          </button>
        </div>
      </div>

      {/* Animated Synced Counting Stage */}
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
          padding: '24px 36px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {spotlightText && (
          <div
            key={spotlightText}
            className="kids-big-badge"
            style={{
              backgroundColor: 'rgba(240, 201, 77, 0.14)',
              borderColor: '#f0c94d',
              color: '#f7dc7a',
              fontSize: 48,
              minWidth: 110,
            }}
            dir="auto"
          >
            {spotlightText}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            maxWidth: 1380,
            marginBottom: 16,
          }}
        >
          {currentSlide.shape ? (
            <div className="kids-pop-item">{renderShapeSvg(currentSlide.shape, currentSlide.colorHex)}</div>
          ) : (
            visualItems.map(function (n) {
              const isMany = count > 10;
              const isMed = count > 5;
              const imgSize = isMany ? 62 : isMed ? 82 : 108;

              let tileClass = 'kids-count-tile';
              if (isStepCounting) {
                if (n === activeCountIdx) tileClass += ' active';
                else if (n < activeCountIdx) tileClass += ' counted';
                else tileClass += ' waiting';
              } else {
                tileClass += ' counted';
              }

              return (
                <button
                  key={n}
                  type="button"
                  data-focusable="true"
                  className={tileClass}
                  onClick={function () { handleTapTile(n); }}
                  aria-label={'Count item ' + (n + 1)}
                >
                  <KidsIllustration
                    kind={mapVisualToKind(currentSlide.visual)}
                    size={imgSize}
                  />
                  {count > 1 && (
                    <span className="kids-count-num">
                      {n + 1}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div
          style={{
            fontSize: 54,
            fontWeight: 800,
            color: accent,
            marginBottom: 6,
          }}
          dir="auto"
        >
          {currentSlide.word}
        </div>
        <div style={{ fontSize: 28, color: '#e2e8f0', fontWeight: 700 }} dir="auto">
          {currentSlide.subtitle}
        </div>
      </div>

      {/* Lesson Controls */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#98a2b3', marginBottom: 6 }}>
          <span>Slide {slideIndex + 1} / {slides.length} {isStepCounting ? '• Tap any picture to hear its number!' : ''}</span>
          <span>{Math.round(((slideIndex + 1) / Math.max(1, slides.length)) * 100)}%</span>
        </div>
        <div className="progress-track" style={{ height: 8, marginBottom: 14 }}>
          <div
            className="progress-fill"
            style={{
              width: Math.min(100, ((slideIndex + 1) / Math.max(1, slides.length)) * 100) + '%',
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
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            type="button"
            data-focusable="true"
            className="tv-btn emerald"
            onClick={handleCountAgain}
          >
            🔊 Count Again
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
