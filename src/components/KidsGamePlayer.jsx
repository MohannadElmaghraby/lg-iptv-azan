import React, { useState, useEffect, useRef } from 'react';
import { WEBOS_KEYS } from '../utils/spatialNav.js';
import { stopKidsVoice } from '../utils/kidsGreeting.js';
import KidsIllustration from './KidsIllustration.jsx';
import AppIcon from './AppIcon.jsx';

const PLAYERS = [
  { id: 'asser', label: 'Asser (آسر)' },
  { id: 'eyad', label: 'Eyad (إياد)' },
  { id: 'both', label: 'Asser & Eyad' },
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
  const [feedback, setFeedback] = useState(null);
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

  useEffect(function () {
    if (externalPauseReason) {
      stopGameAudio();
      if (nextTimerRef.current) {
        clearTimeout(nextTimerRef.current);
        nextTimerRef.current = null;
        setLockedInput(false);
      }
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
      setFeedback({
        ok: true,
        text: '★ Good Job!',
      });
      playClip('./audio/kids/game_good_job.mp3');

      nextTimerRef.current = setTimeout(function () {
        setRoundIdx(function (idx) { return (idx + 1) % rounds.length; });
      }, 1700);
    } else {
      setFeedback({
        ok: false,
        text: 'Try Again!',
      });
      playClip('./audio/kids/game_try_again.mp3');
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
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, color: accent, fontWeight: 800 }}>
            {game.badge} • Round {roundIdx + 1} / {rounds.length}
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
            ★ {stars} Stars
          </div>

          {onTriggerTestAzan && (
            <button type="button" data-focusable="true" className="tv-btn small" style={{ marginBottom: 0 }} onClick={onTriggerTestAzan}>
              Test Azan
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
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginBottom: 18 }}>
          {visualItems.map(function (n) {
            const sz = count > 6 ? 88 : count > 3 ? 102 : 118;
            return (
              <div key={n} className="kids-pop-item" style={{ margin: '6px 12px' }}>
                {round.svg ? (
                  <KidsIllustration kind={round.svg} size={sz} />
                ) : (
                  <span style={{ fontSize: Math.round(sz * 0.8), lineHeight: 1.1 }}>{round.visual}</span>
                )}
              </div>
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
            className="tv-btn primary"
            style={{ marginBottom: 0 }}
            onClick={function () { if (round.audio) playClip(round.audio); }}
          >
            <AppIcon name="speaker" size={20} style={{ marginRight: 8 }} />
            Hear Question
          </button>
        </div>

        {feedback && (
          <div
            className="kids-pop-item"
            style={{
              padding: '12px 28px',
              borderRadius: 999,
              fontSize: 28,
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

      {/* 3 Big Visual Voice-First Choice Tiles */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch' }}>
        {round.choices.map(function (ch) {
          return (
            <button
              key={ch.id}
              type="button"
              data-focusable="true"
              className="kids-choice-btn"
              aria-label={ch.id}
              onClick={function () { handleChoiceClick(ch); }}
            >
              {ch.colorHex ? (
                <div
                  style={{
                    width: 112,
                    height: 112,
                    borderRadius: '50%',
                    backgroundColor: ch.colorHex,
                    border: '4px solid rgba(255, 255, 255, 0.78)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                  }}
                />
              ) : game.hideChoiceText && ch.svg ? (
                <KidsIllustration kind={ch.svg} size={114} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {ch.svg ? (
                    <div style={{ marginBottom: 6 }}><KidsIllustration kind={ch.svg} size={64} /></div>
                  ) : (
                    ch.icon && <div style={{ fontSize: 54, marginBottom: 6 }}>{ch.icon}</div>
                  )}
                  <div style={{ fontSize: (ch.icon || ch.svg) ? 34 : 68, fontWeight: 900, color: '#f5f7fa' }} dir="auto">
                    {ch.label}
                  </div>
                  {ch.sub && (
                    <div style={{ fontSize: 20, color: '#98a2b3', fontWeight: 700, marginTop: 4 }} dir="auto">
                      {ch.sub}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
