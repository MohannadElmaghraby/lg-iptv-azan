/**
 * Real human voice Arabic & English greeting for Asser & Eyad (آسر وإياد)
 * Uses bundled offline MP3s (works reliably on LG webOS 4.0 / Chromium 53)
 * with graceful Web Speech fallback.
 */

let currentAudio = null;
let stoppedFlag = false;

export function stopKidsVoice() {
  stoppedFlag = true;
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (e) {
      // ignore
    }
    currentAudio = null;
  }
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch (e) {
    // ignore
  }
}

function playAudioSequence(urls, fallbackSpeakText) {
  stopKidsVoice();
  stoppedFlag = false;
  let index = 0;

  const fallbackSpeech = function () {
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined') {
        const utter = new SpeechSynthesisUtterance(fallbackSpeakText || 'Assalamu Alaikum! Hi Asser! Hi Eyad!');
        utter.lang = 'en-US';
        utter.rate = 0.92;
        window.speechSynthesis.speak(utter);
      }
    } catch (e) {
      // ignore
    }
  };

  const playNext = function () {
    if (stoppedFlag || index >= urls.length) {
      currentAudio = null;
      return;
    }
    const src = urls[index];
    index += 1;
    try {
      const audio = new Audio(src);
      audio.volume = 1.0;
      currentAudio = audio;
      audio.addEventListener('ended', playNext);
      audio.addEventListener('error', function () {
        if (index === 1) fallbackSpeech();
        else playNext();
      });
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () {
          if (index === 1) fallbackSpeech();
        });
      }
    } catch (e) {
      fallbackSpeech();
    }
  };

  playNext();
}

export function speakAsserAndEyadGreeting() {
  playAudioSequence(
    ['./audio/kids/salam_ar.mp3', './audio/kids/salam_en.mp3'],
    'Assalamu Alaikum! Hi Asser! Hi Eyad!'
  );
}

export function playKidsLessonSlideAudio(slide) {
  if (!slide) return;
  if (slide.audio) {
    playAudioSequence([slide.audio], slide.speak || slide.word);
  } else {
    playAudioSequence([], slide.speak || slide.word);
  }
}
