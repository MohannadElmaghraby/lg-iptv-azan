import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { NAV_ITEMS } from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import EntryHubView from './components/EntryHubView.jsx';
import CategoryView from './components/CategoryView.jsx';
import SearchView from './components/SearchView.jsx';
import FavoritesView from './components/FavoritesView.jsx';
import KidsTimerView from './components/KidsTimerView.jsx';
import PrayerAzanView from './components/PrayerAzanView.jsx';
import SettingsView from './components/SettingsView.jsx';
import VideoPlayer from './components/VideoPlayer.jsx';
import KidsLearningPlayer from './components/KidsLearningPlayer.jsx';
import KidsGamePlayer from './components/KidsGamePlayer.jsx';
import AzanOverlay from './components/AzanOverlay.jsx';
import KidsLockOverlay from './components/KidsLockOverlay.jsx';
import { ResumePromptModal, SeriesModal } from './components/SeriesModal.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';

import { readStorage, writeStorage, removeStorage } from './utils/storage.js';
import { parseM3U } from './utils/m3uParser.js';
import { fetchXtreamCatalog } from './utils/xtreamClient.js';
import { loadCachedCatalog, saveCachedCatalog, clearCachedCatalog } from './utils/catalogCache.js';
import { loadFavorites, toggleFavoriteItem } from './utils/favorites.js';
import {
  loadWatchProgress,
  upsertWatchProgress,
  findWatchProgressForItem,
  isResumableProgress,
  removeWatchProgressById,
  clearAllWatchProgress,
} from './utils/watchProgress.js';
import {
  loadAzanSettings,
  saveAzanSettings,
  getNextPrayerInfo,
  playAzanAudio,
} from './utils/azan.js';
import {
  WEBOS_KEYS,
  isTextEntryElement,
  moveSpatialFocus,
  focusElement,
  getFocusableElements,
} from './utils/spatialNav.js';
import { KIDS_LEARNING_LESSONS } from './data/kidsLessons.js';

const SOURCE_CONFIG_KEY = 'source_config_v1';
const CONVERT_TS_KEY = 'convert_ts_m3u8_v1';
const PARENT_PIN_KEY = 'kids_parent_pin_v1';
const LOCAL_M3U_CACHE_KEY = 'local_m3u_cache_v1';

const EMPTY_CATALOG = {
  items: [],
  live: [],
  movies: [],
  series: [],
  groups: { live: [], movies: [], series: [] },
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [catalog, setCatalog] = useState(EMPTY_CATALOG);
  const [sourceConfig, setSourceConfig] = useState(function () {
    return readStorage(SOURCE_CONFIG_KEY, null);
  });
  const [convertTsToM3u8, setConvertTsToM3u8] = useState(function () {
    return readStorage(CONVERT_TS_KEY, true);
  });
  const [loadingSource, setLoadingSource] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [sourceStatus, setSourceStatus] = useState(null);

  const [favorites, setFavorites] = useState(loadFavorites);
  const [watchProgress, setWatchProgress] = useState(loadWatchProgress);

  // Playback & Modals
  const [playingItem, setPlayingItem] = useState(null);
  const [playingStartSec, setPlayingStartSec] = useState(0);
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [resumePromptEntry, setResumePromptEntry] = useState(null);
  const [seriesModalItem, setSeriesModalItem] = useState(null);

  // Azan State
  const [azanSettings, setAzanSettings] = useState(loadAzanSettings);
  const [now, setNow] = useState(function () { return new Date(); });
  const [activeAzanPrayer, setActiveAzanPrayer] = useState(null);
  const azanAudioHandleRef = useRef(null);
  const firedPrayersRef = useRef({});

  // Kids Watch Timer & Lock State
  const [parentPin, setParentPin] = useState(function () {
    return readStorage(PARENT_PIN_KEY, '0000');
  });
  const [kidsTimer, setKidsTimer] = useState({ active: false, remainingSeconds: 0 });
  const [kidsLocked, setKidsLocked] = useState(false);

  const convertTsRef = useRef(convertTsToM3u8);
  convertTsRef.current = convertTsToM3u8;

  const applyM3uText = useCallback(function (text, label, persistConfig) {
    const parsed = parseM3U(text, { convertTs: convertTsRef.current });
    setCatalog(parsed);
    saveCachedCatalog(parsed);
    if (persistConfig) {
      writeStorage(SOURCE_CONFIG_KEY, persistConfig);
      setSourceConfig(persistConfig);
    }
    setSourceStatus({
      error: false,
      message:
        'Loaded ' +
        parsed.items.length.toLocaleString() +
        ' items (' +
        parsed.live.length.toLocaleString() +
        ' Live, ' +
        parsed.movies.length.toLocaleString() +
        ' Movies, ' +
        parsed.series.length.toLocaleString() +
        ' Series) from ' +
        label,
    });
  }, []);

  const handleLoadM3uUrl = useCallback(async function (url) {
    setLoadingSource(true);
    setLoadingMessage('Downloading M3U playlist from your server...');
    setSourceStatus(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status + ' fetching playlist');
      const text = await res.text();
      setLoadingMessage('Organizing Live TV, Movies & Series...');
      applyM3uText(text, url, { mode: 'm3u_url', m3uUrl: url, label: 'M3U URL' });
    } catch (err) {
      setSourceStatus({
        error: true,
        message: 'Failed to load M3U URL: ' + (err.message || 'Network/CORS error'),
      });
    } finally {
      setLoadingSource(false);
      setLoadingMessage('');
    }
  }, [applyM3uText]);

  const handleLoadM3uFileText = useCallback(function (text, fileName) {
    writeStorage(LOCAL_M3U_CACHE_KEY, text);
    applyM3uText(text, fileName || 'Local M3U File', {
      mode: 'm3u_file',
      fileName: fileName || 'playlist.m3u',
      label: fileName || 'Local M3U',
    });
  }, [applyM3uText]);

  const handleLoadXtream = useCallback(async function (creds) {
    setLoadingSource(true);
    setLoadingMessage('Downloading Live TV, Movies & Series...');
    setSourceStatus(null);
    try {
      const data = await fetchXtreamCatalog(creds, { convertTs: convertTsRef.current });
      const nextCat = {
        items: data.items,
        live: data.live,
        movies: data.movies,
        series: data.series,
        groups: data.groups,
      };
      setCatalog(nextCat);
      saveCachedCatalog(nextCat);
      const cfg = {
        mode: 'xtream',
        xtream: creds,
        label: 'Xtream Codes (' + creds.username + ')',
      };
      writeStorage(SOURCE_CONFIG_KEY, cfg);
      setSourceConfig(cfg);
      setSourceStatus({
        error: false,
        message:
          'Connected Xtream Codes: ' +
          data.live.length.toLocaleString() +
          ' Live, ' +
          data.movies.length.toLocaleString() +
          ' Movies, ' +
          data.series.length.toLocaleString() +
          ' Series.',
      });
    } catch (err) {
      setSourceStatus({
        error: true,
        message: 'Xtream Codes connection failed: ' + (err.message || 'Unknown error'),
      });
    } finally {
      setLoadingSource(false);
      setLoadingMessage('');
    }
  }, []);

  // Instant startup: load IndexedDB cached catalog (<100ms); only re-fetch in background if cache is missing or > 12h old
  useEffect(function () {
    let mounted = true;
    const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
    const saved = readStorage(SOURCE_CONFIG_KEY, null);

    loadCachedCatalog().then(function (cached) {
      if (!mounted) return;
      const hasCachedItems = Boolean(cached && Array.isArray(cached.items) && cached.items.length > 0);
      if (hasCachedItems) {
        setCatalog(cached);
      }

      const isCacheFresh = Boolean(
        hasCachedItems &&
        cached.cachedAt &&
        (Date.now() - cached.cachedAt) < CACHE_TTL_MS
      );

      if (isCacheFresh || !saved) return;

      if (saved.mode === 'm3u_url' && saved.m3uUrl) {
        handleLoadM3uUrl(saved.m3uUrl);
      } else if (saved.mode === 'm3u_file') {
        const cachedText = readStorage(LOCAL_M3U_CACHE_KEY, '');
        if (cachedText) {
          applyM3uText(cachedText, saved.fileName || 'Saved M3U File', null);
        }
      } else if (saved.mode === 'xtream' && saved.xtream) {
        handleLoadXtream(saved.xtream);
      }
    });

    return function () { mounted = false; };
  }, [handleLoadM3uUrl, handleLoadXtream, applyM3uText]);

  const handleToggleConvertTs = function (nextVal) {
    setConvertTsToM3u8(nextVal);
    convertTsRef.current = nextVal;
    writeStorage(CONVERT_TS_KEY, nextVal);
    if (sourceConfig && sourceConfig.mode === 'm3u_url' && sourceConfig.m3uUrl) {
      handleLoadM3uUrl(sourceConfig.m3uUrl);
    } else if (sourceConfig && sourceConfig.mode === 'xtream' && sourceConfig.xtream) {
      handleLoadXtream(sourceConfig.xtream);
    } else if (sourceConfig && sourceConfig.mode === 'm3u_file') {
      const cachedText = readStorage(LOCAL_M3U_CACHE_KEY, '');
      if (cachedText) applyM3uText(cachedText, sourceConfig.fileName, null);
    }
  };

  const handleClearCatalog = function () {
    removeStorage(SOURCE_CONFIG_KEY);
    removeStorage(LOCAL_M3U_CACHE_KEY);
    clearCachedCatalog();
    setSourceConfig(null);
    setCatalog(EMPTY_CATALOG);
    setSourceStatus({ error: false, message: 'Saved IPTV source cleared.' });
  };

  // Azan triggers & dismiss
  const dismissAzan = useCallback(function () {
    if (azanAudioHandleRef.current) {
      azanAudioHandleRef.current.stop();
      azanAudioHandleRef.current = null;
    }
    setActiveAzanPrayer(null);
  }, []);

  const triggerAzan = useCallback(function (prayer) {
    const targetPrayer = prayer || {
      key: 'dhuhr',
      en: 'Dhuhr',
      ar: 'الظهر',
      time: new Date(),
    };
    if (azanAudioHandleRef.current) {
      azanAudioHandleRef.current.stop();
    }
    setActiveAzanPrayer(targetPrayer);
    azanAudioHandleRef.current = playAzanAudio(azanSettings.customAudioUrl, function () {
      azanAudioHandleRef.current = null;
      setActiveAzanPrayer(null);
    });
  }, [azanSettings.customAudioUrl]);

  const handleTestAzanWithVideo = function () {
    if (catalog.live && catalog.live.length > 0) {
      setPlayingStartSec(0);
      setPlayingItem(catalog.live[0]);
    } else {
      setActiveLesson(KIDS_LEARNING_LESSONS[0]);
    }
    setTimeout(function () {
      const info = getNextPrayerInfo(new Date(), azanSettings);
      triggerAzan(info.prayer);
    }, 1500);
  };

  // 1-second global clock for Next Prayer countdown, Azan arrival & Kids Watch Timer
  useEffect(function () {
    const interval = setInterval(function () {
      const current = new Date();
      setNow(current);

      const info = getNextPrayerInfo(current, azanSettings);
      const dayStamp = current.getFullYear() + '-' + current.getMonth() + '-' + current.getDate();
      for (let i = 0; i < info.schedule.length; i += 1) {
        const p = info.schedule[i];
        if (!p.enabled) continue;
        const diff = current.getTime() - p.time.getTime();
        const fireKey = dayStamp + '_' + p.key;
        if (diff >= 0 && diff < 2500 && !firedPrayersRef.current[fireKey]) {
          firedPrayersRef.current[fireKey] = true;
          triggerAzan(p);
          break;
        }
      }

      setKidsTimer(function (prev) {
        if (!prev.active) return prev;
        if (prev.remainingSeconds <= 1) {
          setKidsLocked(true);
          return { active: false, remainingSeconds: 0 };
        }
        return { active: true, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return function () { clearInterval(interval); };
  }, [azanSettings, triggerAzan]);

  const nextPrayerInfo = useMemo(function () {
    return getNextPrayerInfo(now, azanSettings);
  }, [now, azanSettings]);

  const handleToggleFavorite = function (item) {
    setFavorites(function (prev) {
      return toggleFavoriteItem(prev, item);
    });
  };

  const handleSaveProgress = useCallback(function (payload) {
    setWatchProgress(function (prev) {
      return upsertWatchProgress(prev, payload);
    });
  }, []);

  const handleRemoveContinueItem = function (id) {
    setWatchProgress(function (prev) {
      return removeWatchProgressById(prev, id);
    });
  };

  const handleClearAllContinue = function () {
    setWatchProgress(clearAllWatchProgress());
  };

  const startPlayback = function (item, startSec) {
    setPlayingStartSec(startSec || 0);
    setPlayingItem(item);
  };

  const handleSelectItem = function (item) {
    if (!item) return;
    if (item.isSeriesContainer) {
      setSeriesModalItem(item);
      return;
    }
    if (item.type !== 'live') {
      const saved = findWatchProgressForItem(watchProgress, item);
      if (saved && isResumableProgress(saved)) {
        setResumePromptEntry(Object.assign({}, saved, {
          url: item.url || saved.url,
          title: item.title || saved.title,
          logo: item.logo || saved.logo,
          group: item.group || saved.group,
        }));
        return;
      }
    }
    startPlayback(item, 0);
  };

  const handleResumeCardSelect = function (entry) {
    if (entry.isKidsLesson && entry.lessonId) {
      const found = KIDS_LEARNING_LESSONS.find(function (l) { return l.id === entry.lessonId; });
      if (found) {
        setActiveLesson(found);
        return;
      }
    }
    setResumePromptEntry(entry);
  };

  // Global LG webOS 4.0 D-pad Spatial Navigation & Back key handler
  useEffect(function () {
    const getScopeRoot = function () {
      const selectors = [
        '[data-modal-scope="azan-overlay"]',
        '[data-modal-scope="kids-lock"]',
        '[data-modal-scope="resume-modal"]',
        '[data-modal-scope="series-modal"]',
        '[data-modal-scope="player"]',
        '[data-modal-scope="kids-player"]',
        '[data-modal-scope="kids-game"]',
      ];
      for (let i = 0; i < selectors.length; i += 1) {
        const el = document.querySelector(selectors[i]);
        if (el) return el;
      }
      return document;
    };

    const onKeyDown = function (e) {
      const code = e.keyCode || e.which;

      if (activeAzanPrayer) {
        if (code === WEBOS_KEYS.OK || code === WEBOS_KEYS.BACK || code === WEBOS_KEYS.ESCAPE) {
          e.preventDefault();
          dismissAzan();
          return;
        }
      }

      if (code === WEBOS_KEYS.BACK || code === WEBOS_KEYS.ESCAPE) {
        if (kidsLocked) {
          e.preventDefault();
          return;
        }
        if (resumePromptEntry) {
          e.preventDefault();
          setResumePromptEntry(null);
          return;
        }
        if (seriesModalItem) {
          e.preventDefault();
          setSeriesModalItem(null);
          return;
        }
        if (!playingItem && !activeLesson && !activeGame && activeTab !== 'home') {
          e.preventDefault();
          setActiveTab('home');
          return;
        }
      }

      const inInput = isTextEntryElement(document.activeElement);
      const scope = getScopeRoot();

      if (code === WEBOS_KEYS.LEFT) {
        if (inInput && document.activeElement.selectionStart > 0) return;
        e.preventDefault();
        moveSpatialFocus('left', scope);
      } else if (code === WEBOS_KEYS.RIGHT) {
        if (inInput && document.activeElement.selectionStart < (document.activeElement.value || '').length) return;
        e.preventDefault();
        moveSpatialFocus('right', scope);
      } else if (code === WEBOS_KEYS.UP) {
        if (playingItem && scope.getAttribute && scope.getAttribute('data-modal-scope') === 'player') {
          if (!document.querySelector('.player-osd')) return;
        }
        e.preventDefault();
        moveSpatialFocus('up', scope);
      } else if (code === WEBOS_KEYS.DOWN) {
        if (playingItem && scope.getAttribute && scope.getAttribute('data-modal-scope') === 'player') {
          if (!document.querySelector('.player-osd')) return;
        }
        e.preventDefault();
        moveSpatialFocus('down', scope);
      } else if (code === WEBOS_KEYS.OK) {
        const active = document.activeElement;
        if (active && active.getAttribute && active.getAttribute('data-focusable') === 'true' && !inInput) {
          if (active.tagName !== 'BUTTON' && active.tagName !== 'A') {
            e.preventDefault();
            active.click();
          }
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return function () { window.removeEventListener('keydown', onKeyDown); };
  }, [activeAzanPrayer, kidsLocked, resumePromptEntry, seriesModalItem, playingItem, activeLesson, activeGame, activeTab, dismissAzan]);

  useEffect(function () {
    const scope =
      document.querySelector('[data-modal-scope="azan-overlay"]') ||
      document.querySelector('[data-modal-scope="kids-lock"]') ||
      document.querySelector('[data-modal-scope="resume-modal"]') ||
      document.querySelector('[data-modal-scope="series-modal"]');
    if (scope) {
      const list = getFocusableElements(scope);
      if (list.length > 0) focusElement(list[0]);
    }
  }, [activeAzanPrayer, kidsLocked, resumePromptEntry, seriesModalItem]);

  const externalPauseReason = activeAzanPrayer
    ? 'azan'
    : kidsLocked
      ? 'kids_lock'
      : null;

  const activeNavObj = NAV_ITEMS.find(function (n) { return n.id === activeTab; });
  const pageTitle = activeTab === 'home' ? 'Asyad TV v1.4.1' : (activeNavObj ? activeNavObj.label : 'Asyad TV');

  const sourceLabel = sourceConfig
    ? (sourceConfig.label || 'Playlist Active') + ' (' + catalog.items.length.toLocaleString() + ')'
    : 'No Playlist Loaded';

  const isCategoryWorkspace = activeTab === 'live' || activeTab === 'movies' || activeTab === 'series';

  return (
    <div className="tv-shell" style={{ flexDirection: 'column' }}>
      {!isCategoryWorkspace && (
        <TopBar
          title={pageTitle}
          sourceLabel={sourceLabel}
          isSourceLoaded={catalog.items.length > 0}
          nextPrayerInfo={nextPrayerInfo}
          kidsTimer={kidsTimer}
          now={now}
          showBackButton={activeTab !== 'home'}
          onBackHome={function () { setActiveTab('home'); }}
          onOpenAzan={function () { setActiveTab('azan'); }}
          onOpenKids={function () { setActiveTab('kids'); }}
        />
      )}

      {isCategoryWorkspace ? (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <CategoryView
            categoryType={activeTab}
            title={activeTab === 'live' ? 'Live TV' : activeTab === 'movies' ? 'Movies' : 'Series'}
            items={catalog[activeTab] || []}
            groups={(catalog.groups && catalog.groups[activeTab]) || []}
            favorites={favorites}
            continueWatching={watchProgress}
            nextPrayerInfo={nextPrayerInfo}
            kidsTimer={kidsTimer}
            loadingSource={loadingSource}
            loadingMessage={loadingMessage}
            onSelectItem={handleSelectItem}
            onResumeItem={handleResumeCardSelect}
            onRemoveContinueItem={handleRemoveContinueItem}
            onToggleFavorite={handleToggleFavorite}
            onBackHome={function () { setActiveTab('home'); }}
            onOpenAzan={function () { setActiveTab('azan'); }}
            onOpenKids={function () { setActiveTab('kids'); }}
          />
        </div>
      ) : (
        <main className="tv-main">
          <div className="tv-content">
            {activeTab === 'home' && (
              <EntryHubView
                catalog={catalog}
                continueWatching={watchProgress}
                favorites={favorites}
                nextPrayerInfo={nextPrayerInfo}
                kidsTimer={kidsTimer}
                onNavigate={setActiveTab}
                onResumeItem={handleResumeCardSelect}
                onRemoveContinueItem={handleRemoveContinueItem}
                onClearAllContinue={handleClearAllContinue}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {activeTab === 'search' && (
              <SearchView
                allItems={catalog.items}
                favorites={favorites}
                onSelectItem={handleSelectItem}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {activeTab === 'favorites' && (
              <FavoritesView
                favorites={favorites}
                onSelectItem={handleSelectItem}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {activeTab === 'kids' && (
              <KidsTimerView
                kidsTimer={kidsTimer}
                parentPin={parentPin}
                onStartTimer={function (sec) {
                  setKidsLocked(false);
                  setKidsTimer({ active: true, remainingSeconds: sec });
                }}
                onStopTimer={function () {
                  setKidsTimer({ active: false, remainingSeconds: 0 });
                }}
                onChangePin={function (pin) {
                  setParentPin(pin);
                  writeStorage(PARENT_PIN_KEY, pin);
                }}
                onStartLesson={function (lesson) {
                  setActiveLesson(lesson);
                }}
                onStartGame={function (game) {
                  setActiveGame(game);
                }}
                onLoadKidsM3u={function (url) {
                  handleLoadM3uUrl(url).then(function () {
                    setActiveTab('live');
                  });
                }}
                loadingM3u={loadingSource}
              />
            )}

            {activeTab === 'azan' && (
              <PrayerAzanView
                settings={azanSettings}
                nextPrayerInfo={nextPrayerInfo}
                onUpdateSettings={function (next) {
                  saveAzanSettings(next);
                  setAzanSettings(next);
                }}
                onTestAzan={triggerAzan}
                onTestAzanWithVideo={handleTestAzanWithVideo}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                sourceConfig={sourceConfig}
                convertTsToM3u8={convertTsToM3u8}
                loadingSource={loadingSource}
                sourceStatus={sourceStatus}
                onToggleConvertTs={handleToggleConvertTs}
                onLoadM3uUrl={handleLoadM3uUrl}
                onLoadM3uFileText={handleLoadM3uFileText}
                onLoadXtream={handleLoadXtream}
                onClearCatalog={handleClearCatalog}
              />
            )}
          </div>
        </main>
      )}

      {/* Fullscreen Video Player */}
      {playingItem && (
        <VideoPlayer
          item={playingItem}
          startSeconds={playingStartSec}
          liveChannels={catalog.live}
          xtreamCreds={sourceConfig && sourceConfig.xtream}
          isFavorite={favorites.some(function (f) { return f.id === playingItem.id; })}
          externalPauseReason={externalPauseReason}
          onToggleFavorite={handleToggleFavorite}
          onSaveProgress={handleSaveProgress}
          onSwitchChannel={function (ch) {
            setPlayingStartSec(0);
            setPlayingItem(ch);
          }}
          onTriggerTestAzan={function () {
            triggerAzan(nextPrayerInfo && nextPrayerInfo.prayer);
          }}
          onClose={function () { setPlayingItem(null); }}
        />
      )}

      {/* Fullscreen Offline Kids Learning Player */}
      {activeLesson && (
        <KidsLearningPlayer
          lesson={activeLesson}
          externalPauseReason={externalPauseReason}
          onTriggerTestAzan={function () {
            triggerAzan(nextPrayerInfo && nextPrayerInfo.prayer);
          }}
          onClose={function () { setActiveLesson(null); }}
        />
      )}

      {/* Fullscreen Preschool Interactive Game */}
      {activeGame && (
        <KidsGamePlayer
          game={activeGame}
          externalPauseReason={externalPauseReason}
          onTriggerTestAzan={function () {
            triggerAzan(nextPrayerInfo && nextPrayerInfo.prayer);
          }}
          onClose={function () { setActiveGame(null); }}
        />
      )}

      {/* Continue Watching Resume / Start Over Prompt */}
      <ResumePromptModal
        entry={resumePromptEntry}
        onResume={function (entry) {
          setResumePromptEntry(null);
          startPlayback(entry, entry.currentTime || 0);
        }}
        onStartOver={function (entry) {
          setResumePromptEntry(null);
          startPlayback(entry, 0);
        }}
        onClose={function () { setResumePromptEntry(null); }}
      />

      {/* Xtream Series Episode Selector */}
      <SeriesModal
        seriesItem={seriesModalItem}
        xtreamCreds={sourceConfig && sourceConfig.xtream}
        watchProgress={watchProgress}
        onPlayEpisode={function (ep) {
          setSeriesModalItem(null);
          handleSelectItem(ep);
        }}
        onResumeEpisode={function (ep, startSec) {
          setSeriesModalItem(null);
          startPlayback(ep, startSec || 0);
        }}
        onClose={function () { setSeriesModalItem(null); }}
      />

      {/* IPTV Smarters Pro Cold-Load Content Spinner Overlay */}
      {loadingSource && catalog.items.length === 0 && !isCategoryWorkspace && (
        <div className="smarters-loading-overlay" role="status" aria-live="polite">
          <div className="smarters-loading-card">
            <LoadingSpinner
              size={68}
              label="Loading Asyad TV Content..."
              sublabel={loadingMessage || 'Downloading Live TV, Movies & Series from your server'}
            />
          </div>
        </div>
      )}

      {/* Kids Timer Screen Lock Overlay */}
      {kidsLocked && (
        <KidsLockOverlay
          parentPin={parentPin}
          onUnlock={function () { setKidsLocked(false); }}
        />
      )}

      {/* Fullscreen Arabic Azan Overlay */}
      <AzanOverlay
        activePrayer={activeAzanPrayer}
        wasVideoPaused={Boolean(playingItem || activeLesson || activeGame)}
        onDismiss={dismissAzan}
      />
    </div>
  );
}
