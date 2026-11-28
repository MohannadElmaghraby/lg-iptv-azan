import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { formatPlaybackTime } from '../utils/watchProgress.js';
import { WEBOS_KEYS } from '../utils/spatialNav.js';
import { fetchXtreamShortEpg } from '../utils/xtreamClient.js';
import AppIcon from './AppIcon.jsx';

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
  const keyHoldTimeoutRef = useRef(null);
  const keyHoldIntervalRef = useRef(null);
  const keyHoldDirRef = useRef(0);
  const keyHoldStepsRef = useRef(0);
  const osdNavModeRef = useRef(false);
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

  const hideOsd = useCallback(function () {
    if (osdTimerRef.current) {
      clearTimeout(osdTimerRef.current);
      osdTimerRef.current = null;
    }
    osdNavModeRef.current = false;
    setOpenDrawer(null);
    setOsdVisible(false);
    try {
      const osdEl = document.querySelector('.player-osd');
      if (osdEl && document.activeElement && osdEl.contains(document.activeElement)) {
        document.activeElement.blur();
      }
    } catch (e) { /* ignore */ }
  }, []);

  const showOsd = useCallback(function (enterNavMode) {
    setOsdVisible(true);
    if (enterNavMode === true) {
      osdNavModeRef.current = true;
    }
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(function () {
      osdNavModeRef.current = false;
      setOsdVisible(false);
      setOpenDrawer(null);
    }, 5000);
    if (enterNavMode === true) {
      setTimeout(function () {
        const osdEl = document.querySelector('.player-osd');
        if (osdEl && (!document.activeElement || !osdEl.contains(document.activeElement))) {
          if (playPauseBtnRef.current) {
            try { playPauseBtnRef.current.focus(); } catch (e) { /* ignore */ }
          }
        }
      }, 20);
    }
  }, []);

  const stopKeyHoldSeek = useCallback(function () {
    if (keyHoldTimeoutRef.current) {
      clearTimeout(keyHoldTimeoutRef.current);
      keyHoldTimeoutRef.current = null;
    }
    if (keyHoldIntervalRef.current) {
      clearInterval(keyHoldIntervalRef.current);
      keyHoldIntervalRef.current = null;
    }
    keyHoldDirRef.current = 0;
    keyHoldStepsRef.current = 0;
  }, []);

  const stopHoldSeek = useCallback(function () {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    holdStepCountRef.current = 0;
    stopKeyHoldSeek();
  }, [stopKeyHoldSeek]);

  useEffect(function () {
    osdNavModeRef.current = false;
    showOsd(false);
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

  // Player media keys + Back hides OSD first + OK pauses/plays + Left/Right +/-10s & continuous long-press seek
  useEffect(function () {
    const startArrowKeySeek = function (dir) {
      stopKeyHoldSeek();
      keyHoldDirRef.current = dir;
      keyHoldStepsRef.current = 1;
      seekBy(dir * 10);
      keyHoldTimeoutRef.current = setTimeout(function () {
        keyHoldIntervalRef.current = setInterval(function () {
          keyHoldStepsRef.current += 1;
          const step = keyHoldStepsRef.current >= 7 ? 60 : keyHoldStepsRef.current >= 3 ? 30 : 10;
          seekBy(dir * step);
        }, 240);
      }, 360);
    };

    const onKeyDown = function (e) {
      if (externalPauseReason) return;
      const code = e.keyCode || e.which;

      // 1. BACK / ESC: close drawer -> hide OSD details first -> exit video on next press
      if (code === WEBOS_KEYS.BACK || code === WEBOS_KEYS.ESCAPE) {
        e.preventDefault();
        e.stopPropagation();
        stopKeyHoldSeek();
        if (openDrawer) {
          setOpenDrawer(null);
        } else if (osdVisible) {
          hideOsd();
        } else {
          onClose();
        }
        return;
      }

      if (code === WEBOS_KEYS.STOP) {
        e.preventDefault();
        e.stopPropagation();
        stopKeyHoldSeek();
        onClose();
        return;
      }

      // 2. Dedicated media keys
      if (code === WEBOS_KEYS.PLAY) {
        e.preventDefault();
        e.stopPropagation();
        if (videoRef.current) videoRef.current.play().catch(function () {});
        showHudToast('▶ Playing');
        showOsd(false);
        return;
      }
      if (code === WEBOS_KEYS.PAUSE) {
        e.preventDefault();
        e.stopPropagation();
        if (videoRef.current) videoRef.current.pause();
        showHudToast('⏸ Paused');
        showOsd(false);
        return;
      }
      if (code === WEBOS_KEYS.MEDIA_PLAY_PAUSE || code === WEBOS_KEYS.SPACE) {
        e.preventDefault();
        e.stopPropagation();
        togglePlayPause();
        return;
      }

      // 3. Middle OK / Enter button: pause/play video directly unless user navigated to another OSD button
      if (code === WEBOS_KEYS.OK) {
        const osdEl = document.querySelector('.player-osd');
        const active = document.activeElement;
        const onOtherOsdButton =
          osdVisible &&
          osdNavModeRef.current &&
          osdEl &&
          active &&
          active.tagName === 'BUTTON' &&
          osdEl.contains(active) &&
          active !== playPauseBtnRef.current;

        if (!onOtherOsdButton) {
          e.preventDefault();
          e.stopPropagation();
          togglePlayPause();
          return;
        }
        showOsd(true);
        return;
      }

      // 4. Rewind / Fast-Forward dedicated keys (always seek + long press keeps moving)
      if (code === WEBOS_KEYS.REWIND || code === WEBOS_KEYS.FAST_FORWARD) {
        e.preventDefault();
        e.stopPropagation();
        const dir = code === WEBOS_KEYS.FAST_FORWARD ? 1 : -1;
        if (e.repeat && keyHoldDirRef.current === dir) return;
        startArrowKeySeek(dir);
        return;
      }

      // 5. Left / Right arrows: -10s / +10s & continuous long-press seek unless navigating OSD buttons
      if (code === WEBOS_KEYS.LEFT || code === WEBOS_KEYS.RIGHT) {
        const inButtonNav = osdVisible && osdNavModeRef.current;
        if (!inButtonNav && item && item.type !== 'live') {
          e.preventDefault();
          e.stopPropagation();
          const dir = code === WEBOS_KEYS.RIGHT ? 1 : -1;
          if (e.repeat && keyHoldDirRef.current === dir) return;
          startArrowKeySeek(dir);
          return;
        }
        showOsd(true);
        return;
      }

      // 6. Channel Up / Down
      if (code === WEBOS_KEYS.CH_UP || code === WEBOS_KEYS.PAGE_UP) {
        e.preventDefault();
        e.stopPropagation();
        zapChannel(-1);
        return;
      }
      if (code === WEBOS_KEYS.CH_DOWN || code === WEBOS_KEYS.PAGE_DOWN) {
        e.preventDefault();
        e.stopPropagation();
        zapChannel(1);
        return;
      }

      // 7. Up / Down arrows: zap on Live TV when OSD hidden, or enter OSD button navigation mode
      if (code === WEBOS_KEYS.UP || code === WEBOS_KEYS.DOWN) {
        if (!osdVisible && item && item.type === 'live') {
          e.preventDefault();
          e.stopPropagation();
          zapChannel(code === WEBOS_KEYS.UP ? -1 : 1);
          return;
        }
        if (!osdVisible || !osdNavModeRef.current) {
          e.preventDefault();
          e.stopPropagation();
          showOsd(true);
          return;
        }
        showOsd(true);
        return;
      }

      showOsd(false);
    };

    const onKeyUp = function (e) {
      const code = e.keyCode || e.which;
      if (
        code === WEBOS_KEYS.LEFT ||
        code === WEBOS_KEYS.RIGHT ||
        code === WEBOS_KEYS.REWIND ||
        code === WEBOS_KEYS.FAST_FORWARD
      ) {
        stopKeyHoldSeek();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('blur', stopKeyHoldSeek);
    return function () {
      stopKeyHoldSeek();
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('blur', stopKeyHoldSeek);
    };
  }, [
    externalPauseReason,
    osdVisible,
    openDrawer,
    item,
    showOsd,
    hideOsd,
    showHudToast,
    togglePlayPause,
    seekBy,
    stopKeyHoldSeek,
    zapChannel,
    onClose,
  ]);

  const handleSeekBarClick = function (e) {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video || !isFinite(video.duration) || video.duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const next = ratio * video.duration;
    video.currentTime = next;
    setCurrentTime(next);
    showHudToast('Seek: ' + formatPlaybackTime(next));
    showOsd(false);
  };

  const handleStageClick = function (e) {
    let el = e && e.target;
    while (el && el !== e.currentTarget) {
      const tag = el.tagName ? el.tagName.toUpperCase() : '';
      const cls = typeof el.className === 'string' ? el.className : '';
      if (
        tag === 'BUTTON' ||
        cls.indexOf('smarters-seek-bar') !== -1 ||
        cls.indexOf('player-progress-bar') !== -1 ||
        cls.indexOf('player-drawer') !== -1
      ) {
        return;
      }
      el = el.parentNode;
    }
    togglePlayPause();
  };

  const aspectMode = ASPECT_MODES[aspectIdx];
  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      className="fullscreen-overlay"
      onMouseMove={function () { showOsd(false); }}
      onClick={handleStageClick}
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
            backgroundColor: 'rgba(5, 8, 16, 0.88)',
            border: '2px solid rgba(34, 211, 238, 0.6)',
            fontSize: 20,
            fontWeight: 700,
            color: '#38bdf8',
            zIndex: 14,
            pointerEvents: 'none',
          }}
        >
          <AppIcon name="timer" size={20} color="#38bdf8" style={{ marginRight: 8 }} />
          Buffering Stream...
        </div>
      )}

      {/* Center Action / Seek / Aspect Toast HUD */}
      {hudToast && (
        <div
          style={{
            position: 'absolute',
            top: '16%',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 28px',
            borderRadius: 999,
            backgroundColor: 'rgba(5, 8, 16, 0.92)',
            border: '2px solid #22d3ee',
            fontSize: 24,
            fontWeight: 800,
            color: '#f8fafc',
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

      {/* IPTV Smarters Pro Auto-Hiding TV Player OSD */}
      {osdVisible && (
        <div className="player-osd smarters-player-osd">
          {/* Top Gradient Bar: Back + Title on Left | Aspect Ratio, CC, Audio, Quality, Star on Right */}
          <div className="smarters-player-top" onClick={function (e) { e.stopPropagation(); }}>
            <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1, marginRight: 20 }}>
              <button
                type="button"
                data-focusable="true"
                className="smarters-icon-btn"
                style={{ marginRight: 16 }}
                onClick={function (e) { e.stopPropagation(); onClose(); }}
                title="Exit Video"
                aria-label="Exit Video"
              >
                ←
              </button>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 900,
                      backgroundColor: item.type === 'live' ? '#ef4444' : '#0ea5e9',
                      color: '#ffffff',
                      marginRight: 12,
                      flexShrink: 0,
                    }}
                  >
                    {item.type === 'live' ? '● LIVE' : item.type === 'movies' ? 'MOVIE' : 'SERIES'}
                  </span>
                  <h2
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      margin: 0,
                      color: '#ffffff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    dir="auto"
                  >
                    {item.title}
                  </h2>
                </div>
                <div style={{ fontSize: 15, color: '#cbd5e1' }} dir="auto">
                  {item.group || 'Stream'} • {usingNativeFallback ? 'Native Player' : 'HLS Fast Cache'}
                  {epgList.length > 0 ? ' • Now: ' + epgList[0].title : ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <button
                type="button"
                data-focusable="true"
                className={'smarters-osd-pill' + (aspectIdx !== 0 ? ' active' : '')}
                onClick={cycleAspectRatio}
              >
                Aspect: {aspectMode.label}
              </button>

              <button
                type="button"
                data-focusable="true"
                className={'smarters-osd-pill' + (selectedSubtitle !== -1 ? ' active' : '')}
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
                className="smarters-osd-pill"
                onClick={function () { setOpenDrawer(openDrawer === 'audio' ? null : 'audio'); }}
              >
                Audio ({audioTracks.length || 1})
              </button>

              {qualities.length > 0 && (
                <button
                  type="button"
                  data-focusable="true"
                  className="smarters-osd-pill"
                  onClick={function () { setOpenDrawer(openDrawer === 'quality' ? null : 'quality'); }}
                >
                  {selectedQuality === -1 ? 'Auto HD' : (qualities[selectedQuality] ? qualities[selectedQuality].label : 'Auto')}
                </button>
              )}

              <button
                type="button"
                data-focusable="true"
                className={'smarters-osd-pill' + (isFavorite ? ' active' : '')}
                onClick={function () { onToggleFavorite(item); }}
              >
                {isFavorite ? '★' : '☆'}
              </button>

              {onTriggerTestAzan && (
                <button
                  type="button"
                  data-focusable="true"
                  className="smarters-osd-pill"
                  onClick={function () { onTriggerTestAzan(); }}
                  title="Test Azan Auto-Pause"
                >
                  <AppIcon name="azan" size={16} color="#f0c94d" />
                </button>
              )}
            </div>
          </div>

          {/* Track Selection Drawers */}
          {openDrawer && (
            <div
              className="panel player-drawer"
              style={{
                alignSelf: 'flex-end',
                marginRight: 38,
                width: 430,
                backgroundColor: 'rgba(8, 13, 24, 0.96)',
                border: '2px solid rgba(34, 211, 238, 0.45)',
                pointerEvents: 'auto',
              }}
              onClick={function (e) { e.stopPropagation(); }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8', marginBottom: 12 }}>
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

          {/* Center Floating Smarters Pro Circular Transport Controls (-10s | Play/Pause | +10s) */}
          <div className="smarters-player-center">
            <div className="smarters-transport-group" onClick={function (e) { e.stopPropagation(); }}>
              {item.type === 'live' && liveChannels && liveChannels.length > 1 ? (
                <button
                  type="button"
                  data-focusable="true"
                  className="smarters-transport-btn"
                  onClick={function () { zapChannel(-1); }}
                >
                  ◀ Prev CH
                </button>
              ) : (
                <button
                  type="button"
                  data-focusable="true"
                  className="smarters-transport-btn"
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
                  <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 6, verticalAlign: 'middle' }} aria-hidden="true">
                    <polygon points="11,5 2,12 11,19" fill="currentColor" />
                    <polygon points="22,5 13,12 22,19" fill="currentColor" />
                  </svg>
                  -10s
                </button>
              )}

              <button
                ref={playPauseBtnRef}
                type="button"
                data-focusable="true"
                className="smarters-transport-btn play-main"
                onClick={togglePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="5" y="4" width="5" height="16" rx="1.5" fill="#ffffff" />
                    <rect x="14" y="4" width="5" height="16" rx="1.5" fill="#ffffff" />
                  </svg>
                ) : (
                  <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
                    <polygon points="6,4 20,12 6,20" fill="#ffffff" />
                  </svg>
                )}
              </button>

              {item.type === 'live' && liveChannels && liveChannels.length > 1 ? (
                <button
                  type="button"
                  data-focusable="true"
                  className="smarters-transport-btn"
                  onClick={function () { zapChannel(1); }}
                >
                  Next CH ▶
                </button>
              ) : (
                <button
                  type="button"
                  data-focusable="true"
                  className="smarters-transport-btn"
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
                  +10s
                  <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginLeft: 6, verticalAlign: 'middle' }} aria-hidden="true">
                    <polygon points="2,5 11,12 2,19" fill="currentColor" />
                    <polygon points="13,5 22,12 13,19" fill="currentColor" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Slim Smarters Pro Cyan Seek Bar & Quick Actions */}
          <div className="smarters-player-bottom" onClick={function (e) { e.stopPropagation(); }}>
            {item.type !== 'live' ? (
              <div className="smarters-seek-row">
                <span className="smarters-time-text">{formatPlaybackTime(currentTime)}</span>
                <div className="smarters-seek-bar" onClick={handleSeekBarClick}>
                  <div className="smarters-seek-fill" style={{ width: progressPct + '%' }}>
                    <div className="smarters-seek-thumb" />
                  </div>
                </div>
                <span className="smarters-time-text" style={{ textAlign: 'right' }}>
                  {duration > 0 ? formatPlaybackTime(duration) : '--:--'}
                </span>
              </div>
            ) : (
              <div className="smarters-seek-row">
                <span style={{ fontSize: 16, fontWeight: 800, color: '#ef4444', marginRight: 16 }}>
                  ● LIVE STREAM
                </span>
                <span style={{ fontSize: 16, color: '#cbd5e1' }} dir="auto">
                  {epgList.length > 0
                    ? 'Now: ' + epgList[0].title + (epgList[1] ? '   |   Next: ' + epgList[1].title : '')
                    : 'Use CH ▲/▼ or Up/Down arrows to switch channels'}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, color: '#94a3b8' }}>
                OK: Pause/Play • ◀ / ▶: ±10s (Hold: Fast) • ▲/▼: Controls • Back: Hide / Exit
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                {item.type !== 'live' && currentTime > 5 && (
                  <button
                    type="button"
                    data-focusable="true"
                    className="smarters-osd-pill"
                    onClick={handleStartOver}
                  >
                    ↺ Start Over
                  </button>
                )}
                <button
                  type="button"
                  data-focusable="true"
                  className="smarters-osd-pill danger"
                  onClick={onClose}
                >
                  ✕ Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
