import React, { useState, useEffect } from 'react';
import { KIDS_LEARNING_LESSONS, KIDS_PLAYLIST_PRESETS } from '../data/kidsLessons.js';
import { KIDS_GAMES } from '../data/kidsGames.js';
import { formatPlaybackTime } from '../utils/watchProgress.js';
import { speakAsserAndEyadGreeting } from '../utils/kidsGreeting.js';
import { readStorage, writeStorage } from '../utils/storage.js';
import KidsIllustration, { mapVisualToKind } from './KidsIllustration.jsx';
import AppIcon from './AppIcon.jsx';

const AUTO_GREET_KEY = 'kids_auto_greet_v1';

const TIMER_PRESETS = [
  { label: '15 Min', seconds: 15 * 60 },
  { label: '30 Min', seconds: 30 * 60 },
  { label: '45 Min', seconds: 45 * 60 },
  { label: '60 Min', seconds: 60 * 60 },
  { label: '10s Test', seconds: 10 },
];

export default function KidsTimerView({
  kidsTimer,
  parentPin,
  onStartTimer,
  onStopTimer,
  onChangePin,
  onStartLesson,
  onStartGame,
  onLoadKidsM3u,
  loadingM3u,
}) {
  const [newPin, setNewPin] = useState(parentPin || '0000');
  const [pinMsg, setPinMsg] = useState('');
  const [autoGreet, setAutoGreet] = useState(function () {
    return readStorage(AUTO_GREET_KEY, true);
  });
  const [greetPulseKey, setGreetPulseKey] = useState(1);

  useEffect(function () {
    if (autoGreet) {
      speakAsserAndEyadGreeting();
    }
  }, []);

  const handleReplayGreeting = function () {
    setGreetPulseKey(function (k) { return k + 1; });
    speakAsserAndEyadGreeting();
  };

  const handleToggleAutoGreet = function () {
    const next = !autoGreet;
    setAutoGreet(next);
    writeStorage(AUTO_GREET_KEY, next);
  };

  const handleSavePin = function () {
    const cleaned = (newPin || '').replace(/\D/g, '').slice(0, 4);
    if (cleaned.length !== 4) {
      setPinMsg('PIN must be exactly 4 digits.');
      return;
    }
    onChangePin(cleaned);
    setNewPin(cleaned);
    setPinMsg('Parent PIN updated.');
    setTimeout(function () { setPinMsg(''); }, 2500);
  };

  return (
    <div>
      {/* Fun Welcome & Salam Greeting Banner for Asser & Eyad */}
      <div className="panel kids-greet-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span key={greetPulseKey} className="kids-greet-emoji" aria-hidden="true">
              <AppIcon name="wave" size={62} />
            </span>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#f0c94d', marginBottom: 4 }} dir="rtl">
                السلام عليكم يا آسر ويا إياد!
              </div>
              <h3 style={{ fontSize: 24, margin: '0 0 6px 0', color: '#38bdf8' }}>
                Hi Asser! Hi Eyad! Ready for fun &amp; learning?
              </h3>
              <div>
                <span className="kids-name-badge">
                  <KidsIllustration kind="lion" size={22} />
                  <span style={{ marginLeft: 6 }}>Hi Asser •</span>
                  <span dir="rtl" style={{ marginLeft: 4 }}>آسر</span>
                </span>
                <span className="kids-name-badge sky">
                  <KidsIllustration kind="rocket" size={22} />
                  <span style={{ marginLeft: 6 }}>Hi Eyad •</span>
                  <span dir="rtl" style={{ marginLeft: 4 }}>إياد</span>
                </span>
              </div>
            </div>
          </div>

          <div className="btn-row" style={{ alignItems: 'center' }}>
            <button
              type="button"
              data-focusable="true"
              className="tv-btn primary"
              onClick={handleReplayGreeting}
            >
              <AppIcon name="speaker" size={18} style={{ marginRight: 8 }} />
              Say Salam &amp; Hi!
            </button>
            <button
              type="button"
              data-focusable="true"
              className={'tv-btn small' + (autoGreet ? ' emerald' : '')}
              onClick={handleToggleAutoGreet}
            >
              <AppIcon name={autoGreet ? 'bell' : 'bellOff'} size={16} style={{ marginRight: 6 }} />
              {autoGreet ? 'Auto-Greet: ON' : 'Auto-Greet: OFF'}
            </button>
            {kidsTimer.active && (
              <div
                style={{
                  padding: '10px 20px',
                  marginBottom: 10,
                  borderRadius: 14,
                  backgroundColor: 'rgba(56, 189, 248, 0.14)',
                  border: '2px solid #38bdf8',
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#bae6fd',
                }}
              >
                <AppIcon name="timer" size={20} color="#bae6fd" style={{ marginRight: 8 }} />
                {formatPlaybackTime(kidsTimer.remainingSeconds)} left
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Screen-Time Limit & Parent PIN */}
      <div className="panel">
        <div className="section-header" style={{ marginBottom: 14 }}>
          <div>
            <h3 className="section-title">Watch Timer &amp; Parent PIN</h3>
            <div className="section-subtitle">
              When the timer reaches 00:00, any playing video pauses automatically until the Parent PIN (default 0000) is entered.
            </div>
          </div>
          {kidsTimer.active && (
            <button type="button" data-focusable="true" className="tv-btn small danger" onClick={onStopTimer}>
              Stop Timer
            </button>
          )}
        </div>

        <div className="btn-row" style={{ marginBottom: 18 }}>
          {TIMER_PRESETS.map(function (p) {
            return (
              <button
                key={p.label}
                type="button"
                data-focusable="true"
                className={'tv-btn' + (p.seconds === 10 ? '' : ' primary')}
                onClick={function () { onStartTimer(p.seconds); }}
              >
                <AppIcon name="timer" size={18} style={{ marginRight: 8 }} />
                Start {p.label}
              </button>
            );
          })}
        </div>

        <div className="form-row" style={{ alignItems: 'flex-end', marginBottom: 0 }}>
          <div className="form-field" style={{ maxWidth: 260, marginBottom: 0 }}>
            <label className="form-label">4-Digit Parent PIN</label>
            <input
              type="password"
              maxLength={4}
              data-focusable="true"
              className="tv-input"
              value={newPin}
              onChange={function (e) { setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4)); }}
            />
          </div>
          <button type="button" data-focusable="true" className="tv-btn" style={{ marginBottom: 0 }} onClick={handleSavePin}>
            Save Parent PIN
          </button>
          {pinMsg && (
            <span style={{ marginLeft: 14, color: '#6ee7b7', fontSize: 15, fontWeight: 700 }}>{pinMsg}</span>
          )}
        </div>
      </div>

      {/* Interactive Preschool Games for Asser & Eyad */}
      <div className="section-header">
        <div>
          <h3 className="section-title">
            <AppIcon name="game" size={26} style={{ marginRight: 10 }} />
            Interactive Preschool Games — Asser &amp; Eyad
          </h3>
          <div className="section-subtitle">
            Point with your LG Magic Remote or press Left/Right + OK to count numbers, match animals, and learn &ldquo;What Do We Say?&rdquo;
          </div>
        </div>
      </div>

      <div className="cards-grid" style={{ marginBottom: 24 }}>
        {KIDS_GAMES.map(function (g) {
          return (
            <div className="media-card-wrap" key={g.id} style={{ width: 360 }}>
              <button
                type="button"
                data-focusable="true"
                className="media-card"
                onClick={function () { if (onStartGame) onStartGame(g); }}
              >
                <div
                  className="media-thumb"
                  style={{
                    height: 126,
                    backgroundColor: '#090e18',
                    borderBottom: '2px solid ' + g.accent,
                  }}
                >
                  {g.svgIcon ? (
                    <KidsIllustration kind={g.svgIcon} size={76} />
                  ) : (
                    <AppIcon name="game" size={64} color={g.accent} />
                  )}
                  <span className="media-type-badge" style={{ color: g.accent, borderColor: g.accent }}>
                    {g.badge}
                  </span>
                </div>
                <div className="media-card-body">
                  <div className="media-title">{g.title}</div>
                  <div className="media-group" dir="rtl" style={{ color: '#f0c94d', marginBottom: 4 }}>
                    {g.arTitle}
                  </div>
                  <div className="media-group">{g.rounds.length} interactive rounds • Tap to play</div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Built-in Ages 3-4 English Learning Videos */}
      <div className="section-header">
        <div>
          <h3 className="section-title">
            <AppIcon name="learn" size={26} style={{ marginRight: 10 }} />
            Ages 3–4 English Learning (Built-In Offline)
          </h3>
          <div className="section-subtitle">
            Interactive animated lessons with voice narration for Asser &amp; Eyad — works 100% offline on LG webOS 4.0
          </div>
        </div>
      </div>

      <div className="cards-grid" style={{ marginBottom: 24 }}>
        {KIDS_LEARNING_LESSONS.map(function (lesson) {
          const thumbVisual = lesson.slides[0] && (lesson.slides[0].visual || '🔷');
          return (
            <div className="media-card-wrap" key={lesson.id} style={{ width: 280 }}>
              <button
                type="button"
                data-focusable="true"
                className="media-card"
                onClick={function () { onStartLesson(lesson); }}
              >
                <div
                  className="media-thumb"
                  style={{
                    height: 136,
                    backgroundColor: '#090e18',
                    borderBottom: '2px solid ' + lesson.accent,
                  }}
                >
                  <KidsIllustration kind={mapVisualToKind(thumbVisual)} size={78} />
                  <span className="media-type-badge" style={{ color: lesson.accent, borderColor: lesson.accent }}>
                    AGES 3–4
                  </span>
                </div>
                <div className="media-card-body">
                  <div className="media-title">{lesson.title}</div>
                  <div className="media-group" dir="rtl" style={{ color: '#cbd5e1', marginBottom: 4 }}>
                    {lesson.arTitle}
                  </div>
                  <div className="media-group">{lesson.slides.length} interactive cards</div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* One-Click Free Public Kids & Education M3U Loaders */}
      <div className="panel">
        <h3 className="section-title" style={{ marginBottom: 8 }}>Free Public Kids &amp; Education Channels (iptv-org)</h3>
        <div className="section-subtitle" style={{ marginBottom: 16 }}>
          One-click loader for open-access public IPTV streams — loads directly into your Live TV catalog.
        </div>
        <div className="btn-row">
          {KIDS_PLAYLIST_PRESETS.map(function (preset) {
            return (
              <button
                key={preset.id}
                type="button"
                data-focusable="true"
                className="tv-btn emerald"
                disabled={loadingM3u}
                onClick={function () { onLoadKidsM3u(preset.url, preset.title); }}
              >
                {loadingM3u ? 'Loading...' : '▶ Load ' + preset.title}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
