import { describe, it, expect } from 'vitest';
import { getHighlightSegments } from './highlight';

describe('getHighlightSegments', () => {
  describe('edge cases', () => {
    it('should return unmatched text when query is empty', () => {
      expect(getHighlightSegments('Amsterdam', '')).toEqual([{ text: 'Amsterdam', match: false }]);
    });

    it('should return unmatched text when text is empty', () => {
      expect(getHighlightSegments('', 'query')).toEqual([{ text: '', match: false }]);
    });
  });

  describe('merged consecutive matches', () => {
    it('should merge consecutive matched characters into single segment', () => {
      // Full match - all characters should be in one segment
      const result = getHighlightSegments('Amsterdam', 'amsterdam');
      expect(result).toEqual([{ text: 'Amsterdam', match: true }]);
    });

    it('should merge matched prefix', () => {
      // Partial match at start
      const result = getHighlightSegments('Amsterdam', 'amster');
      expect(result).toEqual([
        { text: 'Amster', match: true },
        { text: 'dam', match: false },
      ]);
    });

    it('should handle match in middle of text', () => {
      // "Klo" matches inside "Klokgebouw, Eindhoven"
      const result = getHighlightSegments('Klokgebouw, Eindhoven', 'klo');
      expect(result).toEqual([
        { text: 'Klo', match: true },
        { text: 'kgebouw, Eindhoven', match: false },
      ]);
    });
  });

  describe('fuzzy matching with gaps', () => {
    it('should handle non-consecutive matches', () => {
      // "ae" matches "A" and then "e" in "Amsterdam"
      const result = getHighlightSegments('Amsterdam', 'ae');
      expect(result).toEqual([
        { text: 'A', match: true },
        { text: 'mst', match: false },
        { text: 'e', match: true },
        { text: 'rdam', match: false },
      ]);
    });

    it('should merge consecutive matches between gaps', () => {
      // "amdam" should match "Am" then skip to "dam"
      const result = getHighlightSegments('Amsterdam', 'amdam');
      expect(result).toEqual([
        { text: 'Am', match: true },
        { text: 'ster', match: false },
        { text: 'dam', match: true },
      ]);
    });
  });

  describe('case insensitivity', () => {
    it('should match regardless of case', () => {
      const result = getHighlightSegments('AMSTERDAM', 'amsterdam');
      expect(result).toEqual([{ text: 'AMSTERDAM', match: true }]);
    });

    it('should preserve original case in output', () => {
      const result = getHighlightSegments('AmStErDaM', 'amsterdam');
      expect(result).toEqual([{ text: 'AmStErDaM', match: true }]);
    });
  });

  describe('no match scenarios', () => {
    it('should return all unmatched when query cannot be found', () => {
      const result = getHighlightSegments('Amsterdam', 'xyz');
      expect(result).toEqual([{ text: 'Amsterdam', match: false }]);
    });

    it('should return all unmatched for partial query that cannot complete', () => {
      // "az" - "a" matches but "z" cannot be found after it
      const result = getHighlightSegments('Amsterdam', 'az');
      expect(result).toEqual([{ text: 'Amsterdam', match: false }]);
    });
  });

  describe('real-world address scenarios', () => {
    it('should highlight reordered address label correctly', () => {
      // User typed: "Am Hopfengarten, Ahnatal, 4"
      // Reordered label: "Am Hopfengarten, Ahnatal, 4, 34292"
      const result = getHighlightSegments(
        'Am Hopfengarten, Ahnatal, 4, 34292',
        'Am Hopfengarten, Ahnatal, 4',
      );
      expect(result).toEqual([
        { text: 'Am Hopfengarten, Ahnatal, 4', match: true },
        { text: ', 34292', match: false },
      ]);
    });

    it('should highlight Dutch address', () => {
      const result = getHighlightSegments(
        'Klokgebouw, Eindhoven, 50, 5617AB',
        'Klokgebouw, Eindhoven, 50',
      );
      expect(result).toEqual([
        { text: 'Klokgebouw, Eindhoven, 50', match: true },
        { text: ', 5617AB', match: false },
      ]);
    });

    it('should handle partial street name', () => {
      const result = getHighlightSegments('Klokgebouw, 50, 5617AB, Eindhoven', 'Klok');
      expect(result).toEqual([
        { text: 'Klok', match: true },
        { text: 'gebouw, 50, 5617AB, Eindhoven', match: false },
      ]);
    });
  });
});
