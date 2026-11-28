import React, { useEffect, useRef, useState } from 'react';

/**
 * LG webOS 4.0 OLED Keep-Awake Layer
 *
 * On LG OLED TVs running webOS 4.0, the Fireworks screensaver activates after ~2 min
 * unless a fullscreen <video> element is actively playing (audio-only playback does
 * not prevent it). This component renders a tiny 1.8 KB silent, black, looping H.264
 * video at fullscreen (z-index: 0, pointer-events: none) while Kids Games or Lessons
 * are actively running, and immediately pauses/releases the hardware decoder when:
 *  - `active` becomes false (lesson paused, Azan triggered, Kids Lock triggered),
 *  - `idleTimeoutMs` elapses without remote/click input (OLED burn-in protection), or
 *  - the component unmounts (user exits the game or lesson).
 */
export default function WebOSKeepAwake({ active, idleTimeoutMs }) {
  const videoRef = useRef(null);
  const idleTimerRef = useRef(null);
  const [isIdle, setIsIdle] = useState(false);

  // Track user inactivity when an idle timeout is configured (e.g. 5 min for Kids Games)
  useEffect(function () {
    if (!active || !idleTimeoutMs || idleTimeoutMs <= 0) {
      setIsIdle(false);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return undefined;
    }

    const resetIdleTimer = function () {
      setIsIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(function () {
        setIsIdle(true);
      }, idleTimeoutMs);
    };

    resetIdleTimer();
    window.addEventListener('keydown', resetIdleTimer, true);
    window.addEventListener('mousedown', resetIdleTimer, true);
    window.addEventListener('click', resetIdleTimer, true);
    window.addEventListener('touchstart', resetIdleTimer, true);

    return function () {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      window.removeEventListener('keydown', resetIdleTimer, true);
      window.removeEventListener('mousedown', resetIdleTimer, true);
      window.removeEventListener('click', resetIdleTimer, true);
      window.removeEventListener('touchstart', resetIdleTimer, true);
    };
  }, [active, idleTimeoutMs]);

  const shouldPlay = Boolean(active && !isIdle);

  useEffect(function () {
    const video = videoRef.current;
    if (!video) return undefined;

    if (shouldPlay) {
      try {
        video.muted = true;
        const p = video.play();
        if (p && typeof p.catch === 'function') {
          p.catch(function () { /* ignore autoplay restriction in non-TV browsers */ });
        }
      } catch (e) { /* ignore */ }
    } else {
      try {
        video.pause();
      } catch (e) { /* ignore */ }
    }
    return undefined;
  }, [shouldPlay]);

  // Release hardware video decoder cleanly on unmount (critical on LG webOS 4.0)
  useEffect(function () {
    return function () {
      const video = videoRef.current;
      if (!video) return;
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
      } catch (e) { /* ignore */ }
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src="./video/keepawake.mp4"
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
      data-keepawake-active={shouldPlay ? 'true' : 'false'}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'fill',
        opacity: 0.01,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
