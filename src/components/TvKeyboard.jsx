import React, { useState } from 'react';

const EN_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', '-'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', '.', '&', '/'],
];

const AR_ROWS = [
  ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٠'],
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
  ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
  ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ', 'ذ'],
];

export default function TvKeyboard({ value, onChange }) {
  const [lang, setLang] = useState('en');
  const rows = lang === 'ar' ? AR_ROWS : EN_ROWS;

  const appendChar = function (ch) {
    onChange((value || '') + ch);
  };

  const handleBackspace = function () {
    if (!value) return;
    onChange(value.slice(0, -1));
  };

  const handleClear = function () {
    onChange('');
  };

  return (
    <div className="tv-keyboard" aria-label="On-Screen TV Keyboard">
      {rows.map(function (row, rIdx) {
        return (
          <div className="kb-row" key={lang + '_' + rIdx}>
            {row.map(function (ch) {
              return (
                <button
                  key={ch}
                  type="button"
                  data-focusable="true"
                  className="kb-key"
                  dir="auto"
                  onClick={function () { appendChar(ch); }}
                >
                  {ch}
                </button>
              );
            })}
          </div>
        );
      })}

      <div className="kb-row" style={{ marginTop: 10 }}>
        <button
          type="button"
          data-focusable="true"
          className="kb-key lang"
          onClick={function () { setLang(lang === 'en' ? 'ar' : 'en'); }}
        >
          {lang === 'en' ? '🌐 العربية' : '🌐 English'}
        </button>
        <button
          type="button"
          data-focusable="true"
          className="kb-key wide"
          style={{ minWidth: 220 }}
          onClick={function () { appendChar(' '); }}
        >
          Space
        </button>
        <button
          type="button"
          data-focusable="true"
          className="kb-key wide"
          onClick={handleBackspace}
        >
          ⌫ Backspace
        </button>
        <button
          type="button"
          data-focusable="true"
          className="kb-key wide"
          onClick={handleClear}
        >
          ✕ Clear
        </button>
      </div>
    </div>
  );
}
