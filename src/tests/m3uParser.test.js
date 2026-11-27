import { describe, it, expect } from 'vitest';
import { parseM3U, convertOutputTsToM3u8 } from '../utils/m3uParser.js';

describe('M3U / M3U_Plus Parser', () => {
  it('converts output=ts to output=m3u8 when enabled and preserves when disabled', () => {
    const raw = 'http://example.com/get.php?username=u1&password=p1&type=m3u_plus&output=ts';
    expect(convertOutputTsToM3u8(raw, true)).toBe(
      'http://example.com/get.php?username=u1&password=p1&type=m3u_plus&output=m3u8'
    );
    expect(convertOutputTsToM3u8(raw, false)).toBe(raw);

    const xtLive = 'http://example.com:8080/live/user/pass/12345.ts';
    expect(convertOutputTsToM3u8(xtLive, true)).toBe(
      'http://example.com:8080/live/user/pass/12345.m3u8'
    );
  });

  it('parses Live TV, Movies, and Series from M3U_Plus attributes', () => {
    const sample = [
      '#EXTM3U',
      '#EXTINF:-1 tvg-id="mbc1" tvg-name="MBC 1 HD" tvg-logo="http://img/mbc1.png" group-title="Arabic Live",MBC 1 HD',
      'http://tv.example.com/live/u/p/101.ts',
      '#EXTINF:-1 tvg-logo="http://img/movie.png" group-title="VOD Movies",The Lion King 2019',
      'http://tv.example.com/movie/u/p/202.mp4',
      '#EXTINF:-1 group-title="Arabic Drama",مسلسل الاختيار S01E01',
      'http://tv.example.com/series/u/p/303.mp4',
    ].join('\n');

    const res = parseM3U(sample, { convertTs: true });
    expect(res.items.length).toBe(3);
    expect(res.live.length).toBe(1);
    expect(res.movies.length).toBe(1);
    expect(res.series.length).toBe(1);

    expect(res.live[0].title).toBe('MBC 1 HD');
    expect(res.live[0].url).toBe('http://tv.example.com/live/u/p/101.m3u8');
    expect(res.live[0].group).toBe('Arabic Live');
    expect(res.movies[0].type).toBe('movies');
    expect(res.series[0].type).toBe('series');
  });

  it('parses 12,000+ entries cleanly and quickly', () => {
    const lines = ['#EXTM3U'];
    for (let i = 0; i < 12000; i += 1) {
      lines.push('#EXTINF:-1 group-title="Group ' + (i % 40) + '",Channel ' + i);
      lines.push('http://host.example/live/u/p/' + i + '.ts');
    }
    const start = Date.now();
    const res = parseM3U(lines.join('\n'), { convertTs: true });
    const elapsed = Date.now() - start;
    expect(res.items.length).toBe(12000);
    expect(res.live.length).toBe(12000);
    expect(elapsed).toBeLessThan(2000);
  });
});
