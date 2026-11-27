import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { formatPlaybackTime } from '../utils/watchProgress.js';
import { WEBOS_KEYS } from '../utils/spatialNav.js';
import { fetchXtreamShortEpg } from '../utils/xtreamClient.js';

const ASPECT_MODES = [
  { id: 'fit', label: 'Fit (Original)', style: { width: '100%', height: '100%', objectFit: 'contain' } },
  { id: '16_9', label: '16:9 Fill', style: { width: '100%', height: '100%', objectFit: 'fill' } },
  { id: '4_3', label: '4:3 Classic', style: { width: '75%', height: '100%', objectFit: 'fill' } },
  { id: 'zoom', label: 'Zoom (Crop)', style: { width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.18)' } },
  { id: 'cinema', label: 'Cinema 21:9', style: { width: '100%', height: '74%', objectFit: 'fill' } },
];

export default function VideoPlayer({
  item,
  startSeconds,
  liveChannels,
  xtreamCreds,
  isFavorite,
  externalPauseReason,
  onToggleFavorite,
  onSaveProgress,
  onSwitchChannel,
  onTriggerTestAzan,
  onClose,
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const osdTimerRef = useRef(null);
  const hudTimerRef = useRef(null);
  const holdIntervalRef = useRef(null);
  const holdStepCountRef = useRef(0);
  const didMouseDownRef = useRef(false);
  const playPauseBtnRef = useRef(null);
  const wasPlayingRef = useRef(false);
  const prevPauseReasonRef = useRef(null);
  const initialSeekDoneRef = useRef(false);

  const [osdVisible, setOsdVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [aspectIdx, setAspectIdx] = useState(0);
  const [hudToast, setHudToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [usingNativeFallback, setUsingNativeFallback] = useState(false);

  // Quality, Audio, Subtitles (CC)
  const [qualities, setQualities] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState(-1);
  const [audioTracks, setAudioTracks] = useState([]);
  const [selectedAudio, setSelectedAudio] = useState(0);
  const [subtitleTracks, setSubtitleTracks] = useState([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState(-1);
  const [activeCueText, setActiveCueText] = useState('');
  const [openDrawer, setOpenDrawer] = useState(null);

  // Xtream EPG
  const [epgList, setEpgList] = useState([]);

  const showHudToast = useCallback(function (text) {
    setHudToast(text);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(function () {
      setHudToast('');
    }, 1800);
  }, []);

  const showOsd = useCallback(function () {
    setOsdVisible(true);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(function () {
      setOsdVisible(false);
      setOpenDrawer(null);
    }, 5000);
    setTimeout(function () {
      const osdEl = document.querySelector('.player-osd');
      if (osdEl && (!document.activeElement || !osdEl.contains(document.activeElement))) {
        if (playPauseBtnRef.current) {
          try { playPauseBtnRef.current.focus(); } catch (e) { /* ignore */ }
        }
      }
    }, 20);
  }, []);

  const stopHoldSeek = useCallback(function () {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    holdStepCountRef.current = 0;
  }, []);

  useEffect(function () {
    showOsd();
    return function () {
      if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
      if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
      stopHoldSeek();
    };
  }, [item && item.id, showOsd, stopHoldSeek]);

  useEffect(function () {
    let active = true;
    setEpgList([]);
    if (item && item.type === 'live' && item.source === 'xtream' && item.streamId && xtreamCreds) {
      fetchXtreamShortEpg(xtreamCreds, item.streamId, 2).then(function (list) {
        if (active) setEpgList(list);
      });
    }
    return function () { active = false; };
  }, [item, xtreamCreds]);

  const refreshTracks = useCallback(function () {
    const video = videoRef.current;
    const hls = hlsRef.current;
    const subs = [];

    if (hls && Array.isArray(hls.subtitleTracks) && hls.subtitleTracks.length > 0) {
      for (let i = 0; i < hls.subtitleTracks.length; i += 1) {
        const t = hls.subtitleTracks[i];
        subs.push({
          source: 'hls',
          index: i,
          label: t.name || t.lang || ('Track ' + (i + 1)),
          lang: t.lang || '',
        });
      }
    } else if (video && video.textTracks) {
      for (let i = 0; i < video.textTracks.length; i += 1) {
        const tt = video.textTracks[i];
        if (tt.kind === 'subtitles' || tt.kind === 'captions' || !tt.kind) {
          subs.push({
            source: 'native',
            index: i,
            label: tt.label || tt.language || ('Subtitle ' + (i + 1)),
            lang: tt.language || '',
          });
        }
      }
    }

    setSubtitleTracks(subs);

    if (hls && Array.isArray(hls.audioTracks) && hls.audioTracks.length > 0) {
      setAudioTracks(
        hls.audioTracks.map(function (a, idx) {
          return {
            index: idx,
            label: a.name || a.lang || ('Audio ' + (idx + 1)),
          };
        })
      );
    } else if (video && video.audioTracks && video.audioTracks.length > 0) {
      const natAudio = [];
      for (let j = 0; j < video.audioTracks.length; j += 1) {
        const at = video.audioTracks[j];
        natAudio.push({
          index: j,
          label: at.label || at.language || ('Audio ' + (j + 1)),
        });
      }
      setAudioTracks(natAudio);
    }
  }, []);

  useEffect(function () {
    const video = videoRef.current;
    const hls = hlsRef.current;
    setActiveCueText('');

    if (hls && Array.isArray(hls.subtitleTracks) && hls.subtitleTracks.length > 0) {
      hls.subtitleTrack = selectedSubtitle;
    }

    if (!video || !video.textTracks) return undefined;

    const cleanupListeners = [];
    for (let i = 0; i < video.textTracks.length; i += 1) {
      const track = video.textTracks[i];
      if (selectedSubtitle === -1) {
        track.mode = 'disabled';
      } else if (i === selectedSubtitle) {
        track.mode = 'hidden';
        const onCueChange = function () {
          try {
            const cues = track.activeCues;
            if (cues && cues.length > 0) {
              const lines = [];
              for (let c = 0; c < cues.length; c += 1) {
                if (cues[c].text) lines.push(cues[c].text.replace(/<[^>]+>/g, ''));
              }
              setActiveCueText(lines.join('\n'));
            } else {
              setActiveCueText('');
            }
          } catch (e) {
            setActiveCueText('');
          }
        };
        track.addEventListener('cuechange', onCueChange);
        cleanupListeners.push(function () {
          track.removeEventListener('cuechange', onCueChange);
        });
      } else {
        track.mode = 'disabled';
      }
    }

    return function () {
      for (let k = 0; k < cleanupListeners.length; k += 1) {
        cleanupListeners[k]();
      }
    };
  }, [selectedSubtitle, subtitleTracks]);

  // Fast HLS + Native Playback with pre-buffering cache tuning
  useEffect(function () {
    const video = videoRef.current;
    if (!video || !item || !item.url) return undefined;

    setErrorMsg('');
    setUsingNativeFallback(false);
    setIsBuffering(true);
    setQualities([]);
    setSelectedQuality(-1);
    setAudioTracks([]);
    setSelectedAudio(0);
    setSubtitleTracks([]);
    setSelectedSubtitle(-1);
    setActiveCueText('');
    setCurrentTime(0);
    setDuration(0);
    initialSeekDoneRef.current = false;

    const url = item.url;
    const isLikelyMp4 = /\.(mp4|mkv|webm|mov|m4v)(\?.*)?$/i.test(url);

    const startNativePlayback = function (fallbackUrl) {
      setUsingNativeFallback(true);
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch (e) { /* ignore */ }
        hlsRef.current = null;
      }
      video.src = fallbackUrl || url;
      video.load();
      video.play().catch(function () {});
    };

    if (!isLikelyMp4 && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: item.type === 'live',
        abrEwmaDefaultEstimate: 5000000,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        backBufferLength: 30,
        fragLoadingTimeOut: 10000,
        manifestLoadingTimeOut: 8000,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, function (_ev, data) {
        if (data && Array.isArray(data.levels)) {
          setQualities(
            data.levels.map(function (lvl, idx) {
              return {
                index: idx,
                label: lvl.height ? lvl.height + 'p' : 'Level ' + (idx + 1),
              };
            })
          );
        }
        refreshTracks();
        video.play().catch(function () {});
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, refreshTracks);
      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, refreshTracks);

      hls.on(Hls.Events.ERROR, function (_ev, data) {
        if (data && data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && item.rawUrl && item.rawUrl !== url) {
            hls.destroy();
            hlsRef.current = null;
            startNativePlayback(item.rawUrl);
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
            hlsRef.current = null;
            startNativePlayback(url);
          }
        }
      });
    } else {
      startNativePlayback(url);
    }

    const onLoadedMeta = function () {
      if (!initialSeekDoneRef.current && startSeconds > 0 && item.type !== 'live') {
        try {
          video.currentTime = startSeconds;
        } catch (e) { /* ignore */ }
        initialSeekDoneRef.current = true;
      }
      setDuration(isFinite(video.duration) ? video.duration : 0);
      refreshTracks();
    };

    const onTimeUpdate = function () {
      setCurrentTime(video.currentTime || 0);
      if (isFinite(video.duration)) setDuration(video.duration);
    };

    const onPlay = function () { setIsPlaying(true); };
    const onPause = function () { setIsPlaying(false); };
    const onWaiting = function () { setIsBuffering(true); };
    const onCanPlay = function () { setIsBuffering(false); };
    const onPlaying = function () { setIsBuffering(false); setIsPlaying(true); };
    const onError = function () {
      setIsBuffering(false);
      if (!hlsRef.current) {
        setErrorMsg('Unable to play this stream on this browser/device. Check the stream URL or CORS.');
      }
    };

    video.addEventListener('loadedmetadata', onLoadedMeta);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('error', onError);
    if (video.textTracks && video.textTracks.addEventListener) {
      video.textTracks.addEventListener('addtrack', refreshTracks);
    }

    return function () {
      if (onSaveProgress && item.type !== 'live') {
        onSaveProgress({
          id: item.id,
          type: item.type,
          title: item.title,
          group: item.group,
          logo: item.logo,
          url: item.url,
          currentTime: video.currentTime || 0,
          duration: isFinite(video.duration) ? video.duration : 0,
          seriesId: item.seriesId,
          seriesTitle: item.seriesTitle,
          season: item.season,
          episode: item.episode,
          source: item.source,
        });
      }
      video.removeEventListener('loadedmetadata', onLoadedMeta);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('error', onError);
      if (video.textTracks && video.textTracks.removeEventListener) {
        video.textTracks.removeEventListener('addtrack', refreshTracks);
      }
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch (e) { /* ignore */ }
        hlsRef.current = null;
      }
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [item, startSeconds, refreshTracks]);

  // Periodic watch progress save
  useEffect(function () {
    if (!item || item.type === 'live' || !onSaveProgress) return undefined;
    const interval = setInterval(function () {
      const video = videoRef.current;
      if (video && !video.paused && video.currentTime >= 5) {
        onSaveProgress({
          id: item.id,
          type: item.type,
          title: item.title,
          group: item.group,
          logo: item.logo,
          url: item.url,
          currentTime: video.currentTime,
          duration: isFinite(video.duration) ? video.duration : 0,
          seriesId: item.seriesId,
          seriesTitle: item.seriesTitle,
          season: item.season,
          episode: item.episode,
          source: item.source,
        });
      }
    }, 4000);
    return function () { clearInterval(interval); };
  }, [item, onSaveProgress]);

  // Auto-pause & auto-resume for Azan and Kids Lock
  useEffect(function () {
    const video = videoRef.current;
    if (!video) return;

    if (externalPauseReason && !prevPauseReasonRef.current) {
      wasPlayingRef.current = !video.paused;
      if (!video.paused) {
        video.pause();
      }
    } else if (!externalPauseReason && prevPauseReasonRef.current) {
      if (prevPauseReasonRef.current === 'azan' && wasPlayingRef.current) {
        video.play().catch(function () {});
      }
      wasPlayingRef.current = false;
    }

    prevPauseReasonRef.current = externalPauseReason;
  }, [externalPauseReason]);

  const togglePlayPause = useCallback(function () {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(function () {});
      showHudToast('▶ Playing');
    } else {
      video.pause();
      showHudToast('⏸ Paused');
    }
    showOsd();
  }, [showOsd, showHudToast]);

  const seekBy = useCallback(function (deltaSeconds) {
    const video = videoRef.current;
    if (!video) return;
    const canSeek = (item && item.type !== 'live') || (video.seekable && video.seekable.length > 0 && isFinite(video.duration));
    if (!canSeek) return;
    const maxDur = isFinite(video.duration) ? video.duration : Infinity;
    const next = Math.max(0, Math.min(maxDur, (video.currentTime || 0) + deltaSeconds));
    video.currentTime = next;
    setCurrentTime(next);
    const sign = deltaSeconds > 0 ? '+' : '';
    showHudToast((deltaSeconds > 0 ? '⏩ ' : '⏪ ') + sign + deltaSeconds + 's  •  ' + formatPlaybackTime(next));
    showOsd();
  }, [item, showOsd, showHudToast]);

  // Long-press / hold accelerating seek (-10s -> -30s -> -60s)
  const startHoldSeek = useCallback(function (direction) {
    stopHoldSeek();
    seekBy(direction * 10);
    holdStepCountRef.current = 1;
    holdIntervalRef.current = setInterval(function () {
      holdStepCountRef.current += 1;
      const step = holdStepCountRef.current >= 7 ? 60 : holdStepCountRef.current >= 3 ? 30 : 10;
      seekBy(direction * step);
    }, 220);
  }, [seekBy, stopHoldSeek]);

  const handleStartOver = function () {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(function () {});
    showHudToast('↺ Started Over');
    showOsd();
  };

  const zapChannel = useCallback(function (dir) {
    if (!item || item.type !== 'live' || !Array.isArray(liveChannels) || liveChannels.length < 2) return;
    let idx = -1;
    for (let i = 0; i < liveChannels.length; i += 1) {
      if (liveChannels[i].id === item.id) {
        idx = i;
        break;
      }
    }
    if (idx === -1) idx = 0;
    const nextIdx = (idx + dir + liveChannels.length) % liveChannels.length;
    onSwitchChannel(liveChannels[nextIdx]);
    showOsd();
  }, [item, liveChannels, onSwitchChannel, showOsd]);

  const cycleAspectRatio = function () {
    const nextIdx = (aspectIdx + 1) % ASPECT_MODES.length;
    setAspectIdx(nextIdx);
    showHudToast('Aspect Ratio: ' + ASPECT_MODES[nextIdx].label);
    showOsd();
  };

  const cycleSubtitles = function () {
    if (subtitleTracks.length === 0) return;
    if (selectedSubtitle >= subtitleTracks.length - 1) {
      setSelectedSubtitle(-1);
      showHudToast('Subtitles: Off');
    } else {
      const nextSub = selectedSubtitle + 1;
      setSelectedSubtitle(nextSub);
      showHudToast('Subtitles: ' + subtitleTracks[nextSub].label);
    }
    showOsd();
  };

  const handleSelectQuality = function (idx) {
    setSelectedQuality(idx);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = idx;
    }
    setOpenDrawer(null);
    showOsd();
  };

  const handleSelectAudio = function (idx) {
    setSelectedAudio(idx);
    if (hlsRef.current && hlsRef.current.audioTracks && hlsRef.current.audioTracks.length > idx) {
      hlsRef.current.audioTrack = idx;
    } else if (videoRef.current && videoRef.current.audioTracks) {
      for (let i = 0; i < videoRef.current.audioTracks.length; i += 1) {
        videoRef.current.audioTracks[i].enabled = i === idx;
      }
    }
    setOpenDrawer(null);
    showOsd();
  };

  // Player media keys + long-press key repeat acceleration
  useEffect(function () {
    let keyRepeatCount = 0;

    const onKeyDown = function (e) {
      if (externalPauseReason) return;
      const code = e.keyCode || e.which;
      showOsd();

      if (code === WEBOS_KEYS.PLAY) {
        e.preventDefault();
        if (videoRef.current) videoRef.current.play().catch(function () {});
        showHudToast('▶ Playing');
      } else if (code === WEBOS_KEYS.PAUSE) {
        e.preventDefault();
        if (videoRef.current) videoRef.current.pause();
        showHudToast('⏸ Paused');
      } else if (code === WEBOS_KEYS.MEDIA_PLAY_PAUSE || code === WEBOS_KEYS.SPACE) {
        e.preventDefault();
        togglePlayPause();
      } else if (code === WEBOS_KEYS.REWIND) {
        e.preventDefault();
        keyRepeatCount = e.repeat ? keyRepeatCount + 1 : 0;
        const step = keyRepeatCount >= 6 ? 60 : keyRepeatCount >= 2 ? 30 : 10;
        seekBy(-step);
      } else if (code === WEBOS_KEYS.FAST_FORWARD) {
        e.preventDefault();
        keyRepeatCount = e.repeat ? keyRepeatCount + 1 : 0;
        const step = keyRepeatCount >= 6 ? 60 : keyRepeatCount >= 2 ? 30 : 10;
        seekBy(step);
      } else if (!osdVisible && code === WEBOS_KEYS.LEFT) {
        e.preventDefault();
        keyRepeatCount = e.repeat ? keyRepeatCount + 1 : 0;
        const step = keyRepeatCount >= 6 ? 60 : keyRepeatCount >= 2 ? 30 : 10;
        seekBy(-step);
      } else if (!osdVisible && code === WEBOS_KEYS.RIGHT) {
        e.preventDefault();
        keyRepeatCount = e.repeat ? keyRepeatCount + 1 : 0;
        const step = keyRepeatCount >= 6 ? 60 : keyRepeatCount >= 2 ? 30 : 10;
        seekBy(step);
      } else if (code === WEBOS_KEYS.STOP || code === WEBOS_KEYS.BACK || code === WEBOS_KEYS.ESCAPE) {
        e.preventDefault();
        if (openDrawer) {
          setOpenDrawer(null);
        } else {
          onClose();
        }
      } else if (code === WEBOS_KEYS.CH_UP || code === WEBOS_KEYS.PAGE_UP) {
        e.preventDefault();
        zapChannel(-1);
      } else if (code === WEBOS_KEYS.CH_DOWN || code === WEBOS_KEYS.PAGE_DOWN) {
        e.preventDefault();
        zapChannel(1);
      } else if (!osdVisible && item && item.type === 'live' && (code === WEBOS_KEYS.UP || code === WEBOS_KEYS.DOWN)) {
        e.preventDefault();
        zapChannel(code === WEBOS_KEYS.UP ? -1 : 1);
      }
    };

    const onKeyUp = function () {
      keyRepeatCount = 0;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return function () {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [externalPauseReason, osdVisible, openDrawer, item, showOsd, showHudToast, togglePlayPause, seekBy, zapChannel, onClose]);

  const aspectMode = ASPECT_MODES[aspectIdx];
  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      className="fullscreen-overlay"
      onMouseMove={showOsd}
      onClick={showOsd}
      data-modal-scope="player"
    >
      {/* Centered Stage Box so 4:3, 16:9, Cinema 21:9, Fit, and Zoom reshape reliably in Chromium 53 */}
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000000',
          overflow: 'hidden',
        }}
      >
        <video
          ref={videoRef}
          className="player-video-el"
          preload="auto"
          style={aspectMode.style}
          playsInline
        />
      </div>

      {/* Buffering Indicator */}
      {isBuffering && !errorMsg && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '14px 28px',
            borderRadius: 999,
            backgroundColor: 'rgba(5, 6, 8, 0.85)',
            border: '2px solid rgba(240, 201, 77, 0.5)',
            fontSize: 20,
            fontWeight: 700,
            color: '#f0c94d',
            zIndex: 14,
            pointerEvents: 'none',
          }}
        >
          ⏳ Buffering Stream...
        </div>
      )}

      {/* Center Action / Seek / Aspect Toast HUD */}
      {hudToast && (
        <div
          style={{
            position: 'absolute',
            top: '18%',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 28px',
            borderRadius: 999,
            backgroundColor: 'rgba(5, 6, 8, 0.9)',
            border: '2px solid #f0c94d',
            fontSize: 24,
            fontWeight: 800,
            color: '#f5f7fa',
            zIndex: 24,
            pointerEvents: 'none',
          }}
        >
          {hudToast}
        </div>
      )}

      {/* High-contrast OLED Subtitles / Captions (CC) Overlay */}
      {selectedSubtitle !== -1 && activeCueText && (
        <div className="player-subtitle-box">
          <div className="player-subtitle-cue" dir="auto">
            {activeCueText}
          </div>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '15%',
            right: '15%',
            padding: 28,
            borderRadius: 16,
            backgroundColor: 'rgba(12, 16, 24, 0.94)',
            border: '2px solid rgba(239, 68, 68, 0.5)',
            textAlign: 'center',
            zIndex: 25,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Stream Error</div>
          <div style={{ fontSize: 16, color: '#fca5a5', marginBottom: 18 }}>{errorMsg}</div>
          <button type="button" data-focusable="true" className="tv-btn primary" onClick={onClose}>
            Back to Browse
          </button>
        </div>
      )}

      {/* Auto-Hiding TV OSD */}
      {osdVisible && (
        <div className="player-osd">
          {/* Top OSD Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 800,
                    backgroundColor: item.type === 'live' ? '#ef4444' : '#d4af37',
                    color: item.type === 'live' ? '#fff' : '#050608',
                    marginRight: 12,
                  }}
                >
                  {item.type === 'live' ? 'LIVE' : item.type === 'movies' ? 'MOVIE' : 'SERIES'}
                </span>
                <h2 style={{ fontSize: 30, margin: 0 }} dir="auto">
                  {item.title}
                </h2>
              </div>
              <div style={{ fontSize: 16, color: '#cbd5e1' }} dir="auto">
                {item.group || 'Stream'} {usingNativeFallback ? '• Native Video Mode' : '• HLS Fast Cache'} • {aspectMode.label}
              </div>
              {epgList.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 15, color: '#f0c94d' }} dir="auto">
                  Now: {epgList[0].title}
                  {epgList[1] ? '  |  Next: ' + epgList[1].title : ''}
                </div>
              )}
            </div>

            <div className="btn-row">
              {onTriggerTestAzan && (
                <button
                  type="button"
                  data-focusable="true"
                  className="tv-btn small"
                  onClick={function (e) { e.stopPropagation(); onTriggerTestAzan(); }}
                >
                  🕌 Test Azan
                </button>
              )}
              <button
                type="button"
                data-focusable="true"
                className="tv-btn small"
                onClick={function (e) { e.stopPropagation(); onToggleFavorite(item); }}
              >
                {isFavorite ? '★ Starred' : '☆ Star'}
              </button>
              <button
                type="button"
                data-focusable="true"
                className="tv-btn small danger"
                onClick={function (e) { e.stopPropagation(); onClose(); }}
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* Track Selection Drawers */}
          {openDrawer && (
            <div
              className="panel"
              style={{
                alignSelf: 'flex-end',
                width: 420,
                backgroundColor: 'rgba(11, 14, 20, 0.96)',
                marginBottom: 14,
              }}
              onClick={function (e) { e.stopPropagation(); }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
                {openDrawer === 'subtitles'
                  ? 'Subtitles / Captions (CC)'
                  : openDrawer === 'quality'
                    ? 'Video Quality'
                    : 'Audio Tracks'}
              </div>

              {openDrawer === 'subtitles' && (
                <div className="btn-row">
                  <button
                    type="button"
                    data-focusable="true"
                    className={'chip' + (selectedSubtitle === -1 ? ' active' : '')}
                    onClick={function () { setSelectedSubtitle(-1); setOpenDrawer(null); }}
                  >
                    Off
                  </button>
                  {subtitleTracks.length === 0 ? (
                    <div style={{ fontSize: 14, color: '#98a2b3', marginTop: 6 }}>
                      No embedded HLS or HTML5 subtitle tracks detected in this stream.
                    </div>
                  ) : (
                    subtitleTracks.map(function (st) {
                      return (
                        <button
                          key={st.index}
                          type="button"
                          data-focusable="true"
                          className={'chip' + (selectedSubtitle === st.index ? ' active' : '')}
                          onClick={function () { setSelectedSubtitle(st.index); setOpenDrawer(null); }}
                        >
                          {st.label}
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {openDrawer === 'quality' && (
                <div className="btn-row">
                  <button
                    type="button"
                    data-focusable="true"
                    className={'chip' + (selectedQuality === -1 ? ' active' : '')}
                    onClick={function () { handleSelectQuality(-1); }}
                  >
                    Auto
                  </button>
                  {qualities.map(function (q) {
                    return (
                      <button
                        key={q.index}
                        type="button"
                        data-focusable="true"
                        className={'chip' + (selectedQuality === q.index ? ' active' : '')}
                        onClick={function () { handleSelectQuality(q.index); }}
                      >
                        {q.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {openDrawer === 'audio' && (
                <div className="btn-row">
                  {audioTracks.length === 0 ? (
                    <div style={{ fontSize: 14, color: '#98a2b3' }}>Default Audio Track</div>
                  ) : (
                    audioTracks.map(function (a) {
                      return (
                        <button
                          key={a.index}
                          type="button"
                          data-focusable="true"
                          className={'chip' + (selectedAudio === a.index ? ' active' : '')}
                          onClick={function () { handleSelectAudio(a.index); }}
                        >
                          {a.label}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bottom OSD Transport & Options */}
          <div onClick={function (e) { e.stopPropagation(); }}>
            {item.type !== 'live' && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#cbd5e1', marginBottom: 6 }}>
                  <span>{formatPlaybackTime(currentTime)} (Hold -10s / +10s to seek faster)</span>
                  <span>{duration > 0 ? formatPlaybackTime(duration) : '--:--'}</span>
                </div>
                <div className="progress-track" style={{ height: 8 }}>
                  <div className="progress-fill" style={{ width: progressPct + '%' }} />
                </div>
              </div>
            )}

            <div className="btn-row" style={{ justifyContent: 'space-between' }}>
              <div className="btn-row">
                {item.type === 'live' && liveChannels && liveChannels.length > 1 && (
                  <button
                    type="button"
                    data-focusable="true"
                    className="tv-btn small"
                    onClick={function () { zapChannel(-1); }}
                  >
                    ▲ CH Prev
                  </button>
                )}

                <button
                  type="button"
                  data-focusable="true"
                  className="tv-btn small"
                  onMouseDown={function () {
                    didMouseDownRef.current = true;
                    startHoldSeek(-1);
                  }}
                  onMouseUp={stopHoldSeek}
                  onMouseLeave={stopHoldSeek}
                  onTouchStart={function () {
                    didMouseDownRef.current = true;
                    startHoldSeek(-1);
                  }}
                  onTouchEnd={stopHoldSeek}
                  onClick={function () {
                    if (didMouseDownRef.current) {
                      didMouseDownRef.current = false;
                      return;
                    }
                    seekBy(-10);
                  }}
                  onKeyDown={function (e) {
                    if ((e.keyCode || e.which) === WEBOS_KEYS.OK) {
                      e.preventDefault();
                      seekBy(e.repeat ? -30 : -10);
                    }
                  }}
                >
                  ⏪ -10s
                </button>

                <button
                  ref={playPauseBtnRef}
                  type="button"
                  data-focusable="true"
                  className="tv-btn primary small"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>

                <button
                  type="button"
                  data-focusable="true"
                  className="tv-btn small"
                  onMouseDown={function () {
                    didMouseDownRef.current = true;
                    startHoldSeek(1);
                  }}
                  onMouseUp={stopHoldSeek}
                  onMouseLeave={stopHoldSeek}
                  onTouchStart={function () {
                    didMouseDownRef.current = true;
                    startHoldSeek(1);
                  }}
                  onTouchEnd={stopHoldSeek}
                  onClick={function () {
                    if (didMouseDownRef.current) {
                      didMouseDownRef.current = false;
                      return;
                    }
                    seekBy(10);
                  }}
                  onKeyDown={function (e) {
                    if ((e.keyCode || e.which) === WEBOS_KEYS.OK) {
                      e.preventDefault();
                      seekBy(e.repeat ? 30 : 10);
                    }
                  }}
                >
                  +10s ⏩
                </button>

                {item.type !== 'live' && currentTime > 5 && (
                  <button
                    type="button"
                    data-focusable="true"
                    className="tv-btn small"
                    onClick={handleStartOver}
                  >
                    ↺ Start Over
                  </button>
                )}

                {item.type === 'live' && liveChannels && liveChannels.length > 1 && (
                  <button
                    type="button"
                    data-focusable="true"
                    className="tv-btn small"
                    onClick={function () { zapChannel(1); }}
                  >
                    ▼ CH Next
                  </button>
                )}
              </div>

              <div className="btn-row">
                <button
                  type="button"
                  data-focusable="true"
                  className="tv-btn small"
                  onClick={cycleAspectRatio}
                >
                  Aspect: {aspectMode.label}
                </button>

                <button
                  type="button"
                  data-focusable="true"
                  className={'tv-btn small' + (selectedSubtitle !== -1 ? ' emerald' : '')}
                  onClick={function () {
                    if (subtitleTracks.length > 0 && openDrawer !== 'subtitles') {
                      setOpenDrawer('subtitles');
                    } else if (subtitleTracks.length > 0) {
                      cycleSubtitles();
                    } else {
                      setOpenDrawer(openDrawer === 'subtitles' ? null : 'subtitles');
                    }
                  }}
                >
                  CC: {selectedSubtitle === -1 ? 'Off' : (subtitleTracks[selectedSubtitle] ? subtitleTracks[selectedSubtitle].label : 'On')}
                </button>

                <button
                  type="button"
                  data-focusable="true"
                  className="tv-btn small"
                  onClick={function () { setOpenDrawer(openDrawer === 'audio' ? null : 'audio'); }}
                >
                  Audio ({audioTracks.length || 1})
                </button>

                {qualities.length > 0 && (
                  <button
                    type="button"
                    data-focusable="true"
                    className="tv-btn small"
                    onClick={function () { setOpenDrawer(openDrawer === 'quality' ? null : 'quality'); }}
                  >
                    Quality: {selectedQuality === -1 ? 'Auto' : (qualities[selectedQuality] ? qualities[selectedQuality].label : 'Auto')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
