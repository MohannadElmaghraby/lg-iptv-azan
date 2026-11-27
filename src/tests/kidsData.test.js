import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { KIDS_LEARNING_LESSONS } from '../data/kidsLessons.js';
import { KIDS_GAMES } from '../data/kidsGames.js';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

describe('Kids Lessons, Step Counting & Games Asset Integrity', () => {
  it('ensures every lesson slide audio MP3 and counting 1-20 MP3 exists on disk', () => {
    expect(KIDS_LEARNING_LESSONS.length).toBeGreaterThanOrEqual(9);
    for (const lesson of KIDS_LEARNING_LESSONS) {
      expect(lesson.slides.length).toBeGreaterThan(0);
      for (const slide of lesson.slides) {
        if (slide.audio) {
          const p = path.join(PUBLIC_DIR, slide.audio.replace(/^\.\//, ''));
          expect(fs.existsSync(p), 'Missing lesson audio: ' + p).toBe(true);
          expect(fs.statSync(p).size).toBeGreaterThan(500);
        }
      }
    }

    for (let n = 1; n <= 20; n += 1) {
      const cntPath = path.join(PUBLIC_DIR, 'audio', 'kids', `cnt_${n}.mp3`);
      expect(fs.existsSync(cntPath), 'Missing counting MP3: ' + cntPath).toBe(true);
    }

    const azanPath = path.join(PUBLIC_DIR, 'audio', 'azan.mp3');
    expect(fs.existsSync(azanPath), 'Missing bundled azan.mp3').toBe(true);
    expect(fs.statSync(azanPath).size, 'azan.mp3 too small (expected real recording)').toBeGreaterThan(1000000);
  });

  it('ensures every preschool game round has 3 choices, 1 correct answer, and valid audio', () => {
    expect(KIDS_GAMES.length).toBe(4);
    for (const game of KIDS_GAMES) {
      for (const round of game.rounds) {
        expect(round.choices.length).toBe(3);
        const correctCount = round.choices.filter((c) => c.correct).length;
        expect(correctCount).toBe(1);
        const p = path.join(PUBLIC_DIR, round.audio.replace(/^\.\//, ''));
        expect(fs.existsSync(p), 'Missing game round audio: ' + p).toBe(true);
      }
    }

    for (const f of ['game_good_job.mp3', 'game_try_again.mp3', 'salam_ar.mp3', 'salam_en.mp3']) {
      const p = path.join(PUBLIC_DIR, 'audio', 'kids', f);
      expect(fs.existsSync(p), 'Missing clip: ' + p).toBe(true);
    }
  });
});
