import { describe, it, expect } from 'vitest';
import { formatLabelByInputOrder } from './label-formatter';
import { AddressValue } from './types';

describe('formatLabelByInputOrder', () => {
  const germanAddress: AddressValue = {
    street: 'Am Hopfengarten',
    street_number: 4,
    postcode: '34292',
    city: 'Ahnatal',
  };

  const dutchAddress: AddressValue = {
    street: 'Klokgebouw',
    street_number: 50,
    postcode: '5617AB',
    city: 'Eindhoven',
  };

  const addressWithAddition: AddressValue = {
    street: 'Damstraat',
    street_number: 1,
    addition: 'A',
    postcode: '1012LP',
    city: 'Amsterdam',
  };

  describe('user typed city before street number', () => {
    it('should put city before postcode for German address', () => {
      // User typed: "Am Hopfengarten, Ahnatal, 4"
      // Default API label: "Am Hopfengarten, 4, 34292, Ahnatal"
      // Expected: "Am Hopfengarten, Ahnatal, 4, 34292"
      const result = formatLabelByInputOrder('Am Hopfengarten, Ahnatal, 4', germanAddress);
      expect(result).toBe('Am Hopfengarten, Ahnatal, 4, 34292');
    });

    it('should handle Dutch address with city first', () => {
      // User typed: "Klokgebouw, Eindhoven, 50"
      const result = formatLabelByInputOrder('Klokgebouw, Eindhoven, 50', dutchAddress);
      expect(result).toBe('Klokgebouw, Eindhoven, 50, 5617AB');
    });
  });

  describe('user typed in default order (street, number, city)', () => {
    it('should maintain standard order when user types that way', () => {
      // User typed: "Am Hopfengarten, 4"
      const result = formatLabelByInputOrder('Am Hopfengarten, 4', germanAddress);
      // Street and number are detected, rest follows in default order
      expect(result).toBe('Am Hopfengarten, 4, 34292, Ahnatal');
    });
  });

  describe('user typed city first', () => {
    it('should put city first when user starts with city', () => {
      // User typed: "Eindhoven, Klok"
      const result = formatLabelByInputOrder('Eindhoven, Klok', dutchAddress);
      // Only city is detected (Klok is prefix, not exact match)
      expect(result).toBe('Eindhoven, Klokgebouw, 50, 5617AB');
    });

    it('should put city first with full street name', () => {
      // User typed: "Eindhoven, Klokgebouw"
      const result = formatLabelByInputOrder('Eindhoven, Klokgebouw', dutchAddress);
      expect(result).toBe('Eindhoven, Klokgebouw, 50, 5617AB');
    });
  });

  describe('user typed street number first', () => {
    it('should put street number first when user starts with number', () => {
      // User typed: "50, Klokgebouw"
      const result = formatLabelByInputOrder('50, Klokgebouw', dutchAddress);
      expect(result).toBe('50, Klokgebouw, 5617AB, Eindhoven');
    });
  });

  describe('user typed postcode', () => {
    it('should put postcode in user position', () => {
      // User typed: "5617AB"
      const result = formatLabelByInputOrder('5617AB', dutchAddress);
      expect(result).toBe('5617AB, Klokgebouw, 50, Eindhoven');
    });

    it('should handle postcode with street', () => {
      // User typed: "5617AB, Klokgebouw"
      const result = formatLabelByInputOrder('5617AB, Klokgebouw', dutchAddress);
      expect(result).toBe('5617AB, Klokgebouw, 50, Eindhoven');
    });
  });

  describe('address with addition', () => {
    it('should include addition in correct position', () => {
      // User typed: "Damstraat 1 A"
      const result = formatLabelByInputOrder('Damstraat 1 A', addressWithAddition);
      expect(result).toBe('Damstraat, 1, A, 1012LP, Amsterdam');
    });

    it('should handle addition typed after city', () => {
      // User typed: "Damstraat, Amsterdam, 1, A"
      const result = formatLabelByInputOrder('Damstraat, Amsterdam, 1, A', addressWithAddition);
      expect(result).toBe('Damstraat, Amsterdam, 1, A, 1012LP');
    });
  });

  describe('edge cases', () => {
    it('should handle empty query', () => {
      const result = formatLabelByInputOrder('', germanAddress);
      expect(result).toBe('');
    });

    it('should handle empty value', () => {
      const result = formatLabelByInputOrder('test', {} as AddressValue);
      expect(result).toBe('');
    });

    it('should be case insensitive', () => {
      // User typed lowercase
      const result = formatLabelByInputOrder('am hopfengarten, ahnatal', germanAddress);
      expect(result).toBe('Am Hopfengarten, Ahnatal, 4, 34292');
    });

    it('should handle partial matches gracefully', () => {
      // User typed something that partially matches
      // "Hopfen" doesn't match "Am Hopfengarten" exactly
      const result = formatLabelByInputOrder('Hopfen', germanAddress);
      // No exact matches, so default order
      expect(result).toBe('Am Hopfengarten, 4, 34292, Ahnatal');
    });
  });
});
