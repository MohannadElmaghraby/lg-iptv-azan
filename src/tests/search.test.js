import { describe, it, expect } from 'vitest';
import { normalizeSearchText, prepareSearchIndex, searchCatalog } from '../utils/search.js';

describe('Arabic & English Search Normalization & Ranking', () => {
  it('strips Arabic tashkeel and normalizes أ/إ/آ -> ا, ة -> ه, ى -> ي', () => {
    expect(normalizeSearchText('أَحْمَدُ')).toBe('احمد');
    expect(normalizeSearchText('إبراهيم')).toBe('ابراهيم');
    expect(normalizeSearchText('آدم')).toBe('ادم');
    expect(normalizeSearchText('المدينة المنورة')).toBe('المدينه المنوره');
    expect(normalizeSearchText('موسى وعيسى')).toBe('موسي وعيسي');
    expect(normalizeSearchText('Café Crème')).toBe('cafe creme');
  });

  it('searches across Live TV, Movies, and Series simultaneously with ranking and category filters', () => {
    const catalog = [
      { id: '1', type: 'live', title: 'قناة القرآن الكريم', group: 'إسلامية' },
      { id: '2', type: 'movies', title: 'أحمد وأحمد', group: 'أفلام عربية' },
      { id: '3', type: 'series', title: 'موسى', group: 'مسلسلات رمضان' },
      { id: '4', type: 'live', title: 'Al Jazeera Arabic', group: 'News' },
      { id: '5', type: 'movies', title: 'Aladdin', group: 'Kids' },
    ];
    const index = prepareSearchIndex(catalog);

    // Search without hamza or taa marbuta or alif maqsura
    const res1 = searchCatalog(index, 'القران');
    expect(res1.counts.all).toBe(1);
    expect(res1.results[0].id).toBe('1');

    const res2 = searchCatalog(index, 'موسي');
    expect(res2.counts.series).toBe(1);
    expect(res2.results[0].id).toBe('3');

    const res3 = searchCatalog(index, 'احمد');
    expect(res3.counts.movies).toBe(1);
    expect(res3.results[0].id).toBe('2');

    // English multi-category search with category filter
    const resEn = searchCatalog(index, 'al', { category: 'movies' });
    expect(resEn.counts.live).toBe(1);
    expect(resEn.counts.movies).toBe(1);
    expect(resEn.results.length).toBe(1);
    expect(resEn.results[0].id).toBe('5');
  });
});
