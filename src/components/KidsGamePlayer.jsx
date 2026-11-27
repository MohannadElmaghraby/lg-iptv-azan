import React, { useState, useEffect, useRef } from 'react';
import { WEBOS_KEYS } from '../utils/spatialNav.js';
import { stopKidsVoice } from '../utils/kidsGreeting.js';

const PLAYERS = [
  { id: 'asser', label: '🦁 Asser (آسر)' },
  { id: 'eyad', label: '🚀 Eyad (إياد)' },
  { id: 'both', label: '👬 Asser & Eyad' },
];

const PRAISE_CLIPS = [
  './audio/kids/game_yay_1.mp3',
  './audio/kids/game_yay_2.mp3',
  './audio/kids/game_yay_ar.mp3',
];

export default function KidsGamePlayer({
  game,
  externalPauseReason,
  onTriggerTestAzan,
  onClose,
}) {
  const [playerId, setPlayerId] = useState('both');
  const [roundIdx, setRoundIdx] = useState(0);
  const [stars, setStars] = useState(0);
  const [feedback, setFeedback] = useState(null); // null | { ok: true/false, text: string }
  const [lockedInput, setLockedInput] = useState(false);
  const audioRef = useRef(null);
  const nextTimerRef = useRef(null);

  const rounds = (game && game.rounds) || [];
  const round = rounds[roundIdx] || rounds[0];

  const stopGameAudio = function () {
    stopKidsVoice();
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) { /* ignore */ }
      audioRef.current = null;
    }
  };

  const playClip = function (src, onEnded) {
    stopGameAudio();
    if (!src) {
      if (onEnded) onEnded();
      return;
    }
    try {
      const a = new Audio(src);
      a.volume = 1.0;
      audioRef.current = a;
      if (onEnded) a.addEventListener('ended', onEnded);
      a.addEventListener('error', function () {
        if (onEnded) onEnded();
      });
      const p = a.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () { /* ignore */ });
      }
    } catch (e) {
      if (onEnded) onEnded();
    }
  };

  // Play question audio on round change
  useEffect(function () {
    setFeedback(null);
    setLockedInput(false);
    if (!externalPauseReason && round && round.audio) {
      playClip(round.audio);
    }
    return function () {
      stopGameAudio();
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
    };
  }, [game && game.id, roundIdx]);

  // Pause audio immediately if Azan or Kids Timer locks
  useEffect(function () {
    if (externalPauseReason) {
      stopGameAudio();
    }
  }, [externalPauseReason]);

  useEffect(function () {
    const onKeyDown = function (e) {
      if (externalPauseReason) return;
      const code = e.keyCode || e.which;
      if (code === WEBOS_KEYS.BACK || code === WEBOS_KEYS.ESCAPE || code === WEBOS_KEYS.STOP) {
        e.preventDefault();
        stopGameAudio();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return function () { window.removeEventListener('keydown', onKeyDown); };
  }, [externalPauseReason, onClose]);

  if (!game || !round) return null;

  const handleChoiceClick = function (choice) {
    if (lockedInput || externalPauseReason) return;

    if (choice.correct) {
      setLockedInput(true);
      const nextStars = stars + 1;
      setStars(nextStars);
      const isFiveMilestone = nextStars > 0 && nextStars % 5 === 0;
      setFeedback({
        ok: true,
        text: isFiveMilestone
          ? '🏆 Woohoo! ' + nextStars + ' Golden Stars! Superstars!'
          : '🌟 Great Job! ' + choice.label + '!',
      });

      const praiseClip = isFiveMilestone
        ? './audio/kids/game_win5.mp3'
        : round.praiseAudio || PRAISE_CLIPS[roundIdx % PRAISE_CLIPS.length];

      playClip(praiseClip);

      nextTimerRef.current = setTimeout(function () {
        setRoundIdx(function (idx) { return (idx + 1) % rounds.length; });
      }, 2400);
    } else {
      setFeedback({
        ok: false,
        text: '💛 Good try! Count or listen again together!',
      });
      playClip('./audio/kids/game_oops.mp3');
    }
  };

  const count = round.count || 1;
  const visualItems = [];
  for (let i = 0; i < count; i += 1) {
    visualItems.push(i);
  }

  const accent = game.accent || '#38bdf8';

  return (
    <div
      className="fullscreen-overlay"
      data-modal-scope="kids-game"
      style={{ backgroundColor: '#05080f', padding: '24px 42px', justifyContent: 'space-between' }}
    >
      {/* Top Bar: Game Title, Player Switcher, Stars Counter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, color: accent, fontWeight: 800 }}>
            🎮 {game.badge} • Round {roundIdx + 1} / {rounds.length}
          </div>
          <h2 style={{ fontSize: 30, margin: '4px 0 0 0' }}>
            {game.title}{' '}
            <span style={{ fontSize: 22, color: '#98a2b3', marginLeft: 10 }} dir="rtl">
              {game.arTitle}
            </span>
          </h2>
        </div>

        <div className="btn-row" style={{ alignItems: 'center' }}>
          {PLAYERS.map(function (pl) {
            return (
              <button
                key={pl.id}
                type="button"
                data-focusable="true"
                className={'chip' + (playerId === pl.id ? ' active' : '')}
                style={{ marginBottom: 0 }}
                onClick={function () { setPlayerId(pl.id); }}
              >
                {pl.label}
              </button>
            );
          })}

          <div
            style={{
              padding: '9px 18px',
              marginRight: 10,
              borderRadius: 999,
              backgroundColor: 'rgba(212, 175, 55, 0.16)',
              border: '2px solid #f0c94d',
              fontSize: 20,
              fontWeight: 900,
              color: '#f7dc7a',
            }}
          >
            ⭐ {stars} Stars
          </div>

          {onTriggerTestAzan && (
            <button type="button" data-focusable="true" className="tv-btn small" style={{ marginBottom: 0 }} onClick={onTriggerTestAzan}>
              🕌 Test Azan
            </button>
          )}
          <button
            type="button"
            data-focusable="true"
            className="tv-btn small danger"
            style={{ marginBottom: 0 }}
            onClick={function () { stopGameAudio(); onClose(); }}
          >
            ✕ Exit Game
          </button>
        </div>
      </div>

      {/* Central Question Stage */}
      <div
        key={game.id + '_' + roundIdx}
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
          border: '3px solid ' + (feedback ? (feedback.ok ? '#10b981' : '#f59e0b') : accent),
          padding: '24px 36px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
          {visualItems.map(function (n) {
            return (
              <span
                key={n}
                className="kids-pop-item"
                style={{
                  fontSize: count > 5 ? 82 : 108,
                  margin: '0 12px',
                  lineHeight: 1.15,
                }}
              >
                {round.visual}
              </span>
            );
          })}
        </div>

        <div style={{ fontSize: 38, fontWeight: 800, color: '#f5f7fa', marginBottom: 6 }}>
          {round.prompt}
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#f0c94d', marginBottom: 16 }} dir="rtl">
          {round.arPrompt}
        </div>

        <div className="btn-row" style={{ justifyContent: 'center', marginBottom: feedback ? 12 : 0 }}>
          <button
            type="button"
            data-focusable="true"
            className="tv-btn small"
            onClick={function () { if (round.audio) playClip(round.audio); }}
          >
            🔊 Hear Question Again
          </button>
        </div>

        {feedback && (
          <div
            className="kids-pop-item"
            style={{
              padding: '12px 28px',
              borderRadius: 999,
              fontSize: 26,
              fontWeight: 800,
              backgroundColor: feedback.ok ? 'rgba(16, 185, 129, 0.22)' : 'rgba(245, 158, 11, 0.2)',
              border: '2px solid ' + (feedback.ok ? '#10b981' : '#f59e0b'),
              color: feedback.ok ? '#6ee7b7' : '#fde68a',
            }}
          >
            {feedback.text}
          </div>
        )}
      </div>

      {/* 3 Big Juicy Toddler Choice Tiles */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch' }}>
        {round.choices.map(function (ch) {
          return (
            <button
              key={ch.id}
              type="button"
              data-focusable="true"
              className="kids-choice-btn"
              onClick={function () { handleChoiceClick(ch); }}
            >
              {ch.icon && <div style={{ fontSize: 54, marginBottom: 6 }}>{ch.icon}</div>}
              <div style={{ fontSize: ch.icon ? 34 : 58, fontWeight: 900, color: '#f5f7fa' }} dir="auto">
                {ch.label}
              </div>
              {ch.sub && (
                <div style={{ fontSize: 20, color: '#98a2b3', fontWeight: 700, marginTop: 4 }} dir="auto">
                  {ch.sub}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
