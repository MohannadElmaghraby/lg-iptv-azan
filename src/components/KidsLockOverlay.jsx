import React, { useState } from 'react';

export default function KidsLockOverlay({ parentPin, onUnlock }) {
  const [entered, setEntered] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const pressDigit = function (d) {
    if (entered.length >= 4) return;
    const next = entered + d;
    setEntered(next);
    setErrorMsg('');

    if (next.length === 4) {
      if (next === (parentPin || '0000')) {
        setEntered('');
        onUnlock();
      } else {
        setErrorMsg('Incorrect Parent PIN. Try again.');
        setTimeout(function () { setEntered(''); }, 500);
      }
    }
  };

  return (
    <div className="kids-lock-overlay" data-modal-scope="kids-lock">
      <div className="pin-box">
        <div style={{ fontSize: 48, marginBottom: 8 }}>🌙🧸</div>
        <h2 style={{ fontSize: 34, margin: '0 0 8px 0', color: '#38bdf8' }}>
          Time&apos;s Up! • <span dir="rtl">انتهى الوقت</span>
        </h2>
        <div style={{ fontSize: 17, color: '#cbd5e1' }}>
          Asser &amp; Eyad&apos;s screen time has finished. Enter the 4-digit Parent PIN to unlock.
        </div>

        <div className="pin-dots">
          {[0, 1, 2, 3].map(function (idx) {
            return (
              <div className="pin-dot" key={idx}>
                {entered.length > idx ? '●' : ''}
              </div>
            );
          })}
        </div>

        {errorMsg && (
          <div style={{ color: '#fca5a5', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            {errorMsg}
          </div>
        )}

        <div className="pin-keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(function (digit) {
            return (
              <button
                key={digit}
                type="button"
                data-focusable="true"
                className="pin-key"
                onClick={function () { pressDigit(digit); }}
              >
                {digit}
              </button>
            );
          })}
          <button
            type="button"
            data-focusable="true"
            className="pin-key"
            style={{ fontSize: 17 }}
            onClick={function () { setEntered(''); setErrorMsg(''); }}
          >
            Clear
          </button>
          <button
            type="button"
            data-focusable="true"
            className="pin-key"
            onClick={function () { pressDigit('0'); }}
          >
            0
          </button>
          <button
            type="button"
            data-focusable="true"
            className="pin-key"
            style={{ fontSize: 17 }}
            onClick={function () { setEntered(entered.slice(0, -1)); }}
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
