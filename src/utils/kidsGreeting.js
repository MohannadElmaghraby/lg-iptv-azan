/**
 * Playful bilingual Salam & Hi greeting for Asser & Eyad (آسر وإياد)
 * Combines a cheerful Web Audio xylophone chime with SpeechSynthesis (Arabic + English).
 */

export function playCheerfulKidsChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended' && ctx.resume) {
      ctx.resume().catch(function () {});
    }
    const notes = [
      { freq: 523.25, start: 0.02, dur: 0.16 }, // C5
      { freq: 659.25, start: 0.14, dur: 0.16 }, // E5
      { freq: 783.99, start: 0.26, dur: 0.18 }, // G5
      { freq: 1046.5, start: 0.4, dur: 0.34 },  // C6
    ];
    const now = ctx.currentTime;
    for (let i = 0; i < notes.length; i += 1) {
      const n = notes[i];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.start);
      gain.gain.setValueAtTime(0.0001, now + n.start);
      gain.gain.linearRampToValueAtTime(0.14, now + n.start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.04);
    }
    setTimeout(function () {
      if (ctx && ctx.close) ctx.close().catch(function () {});
    }, 1200);
  } catch (e) {
    // Ignore if AudioContext is blocked or unavailable
  }
}

export function speakAsserAndEyadGreeting() {
  playCheerfulKidsChime();

  try {
    if (typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const voices = synth.getVoices ? synth.getVoices() : [];
    let arVoice = null;
    let enVoice = null;
    for (let i = 0; i < voices.length; i += 1) {
      const v = voices[i];
      if (!arVoice && v.lang && v.lang.toLowerCase().indexOf('ar') === 0) {
        arVoice = v;
      }
      if (!enVoice && v.lang && v.lang.toLowerCase().indexOf('en') === 0) {
        enVoice = v;
      }
    }

    const arUtter = new SpeechSynthesisUtterance('السلام عليكم يا آسر ويا إياد!');
    arUtter.lang = 'ar-EG';
    arUtter.rate = 0.92;
    arUtter.pitch = 1.15;
    if (arVoice) arUtter.voice = arVoice;

    const enUtter = new SpeechSynthesisUtterance('Hi Asser! Hi Eyad! Ready to have fun?');
    enUtter.lang = 'en-US';
    enUtter.rate = 0.95;
    enUtter.pitch = 1.18;
    if (enVoice) enUtter.voice = enVoice;

    // Speak Arabic Salam if an Arabic voice is present (or always queue it cleanly)
    if (arVoice) {
      synth.speak(arUtter);
      synth.speak(enUtter);
    } else {
      const mixed = new SpeechSynthesisUtterance('Assalamu Alaikum! Hi Asser! Hi Eyad!');
      mixed.lang = 'en-US';
      mixed.rate = 0.94;
      mixed.pitch = 1.18;
      if (enVoice) mixed.voice = enVoice;
      synth.speak(mixed);
    }
  } catch (e) {
    // Ignore on TVs without SpeechSynthesis
  }
}
