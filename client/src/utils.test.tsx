import { describe, it, expect } from 'vitest';
import {
  isDateValid,
  validateHealthRating,
  validateRequired,
  validateDateRange,
  isSSNValid
} from './utils';

describe('Validation Utilities', () => {
  describe('isDateValid', () => {
    it('validates correct date formats', () => {
      expect(isDateValid('2023-01-15')).toBe(true);
      expect(isDateValid('1999-12-31')).toBe(true);
      expect(isDateValid('2024-02-29')).toBe(true); // Leap year
    });

    it('rejects invalid date formats', () => {
      expect(isDateValid('2023/01/15')).toBe(false);
      expect(isDateValid('15-01-2023')).toBe(false);
      expect(isDateValid('2023-13-01')).toBe(false); // Invalid month
      expect(isDateValid('2023-00-01')).toBe(false);
      expect(isDateValid('2023-01-32')).toBe(false); // Invalid day
      expect(isDateValid('not-a-date')).toBe(false);
    });

    it('handles edge cases', () => {
      expect(isDateValid('0000-00-00')).toBe(false);
      expect(isDateValid('2023-02-29')).toBe(false); // Non-leap year
    });
  });

  describe('validateHealthRating', () => {
    it('validates correct ratings', () => {
      expect(validateHealthRating(0)).toBe('');
      expect(validateHealthRating(1)).toBe('');
      expect(validateHealthRating(2)).toBe('');
      expect(validateHealthRating(3)).toBe('');
    });

    it('returns error for invalid ratings', () => {
      expect(validateHealthRating(-1)).toBe('Health rating must be an integer between 0 and 3');
      expect(validateHealthRating(4)).toBe('Health rating must be an integer between 0 and 3');
      expect(validateHealthRating(2.5)).toBe('Health rating must be an integer between 0 and 3');
    });
  });

  describe('validateRequired', () => {
    it('validates non-empty strings', () => {
      expect(validateRequired('Valid', 'Field')).toBe('');
      expect(validateRequired('  trimmed  ', 'Field')).toBe('');
    });

    it('returns error for empty/whitespace strings', () => {
      expect(validateRequired('', 'Name')).toBe('Name is required');
      expect(validateRequired('   ', 'Email')).toBe('Email is required');
    });
  });

  describe('validateDateRange', () => {
    it('validates correct date ranges', () => {
      expect(validateDateRange('2023-01-01', '2023-01-10')).toBe('');
      expect(validateDateRange('2023-01-01', '2023-01-01')).toBe(''); // Same date
    });

    it('returns error for invalid ranges', () => {
      expect(validateDateRange('2023-01-10', '2023-01-01')).toBe(
        'End date must be after start date'
      );
    });

    it('handles empty dates', () => {
      expect(validateDateRange('', '2023-01-01')).toBe('');
      expect(validateDateRange('2023-01-01', '')).toBe('');
      expect(validateDateRange('', '')).toBe('');
    });
  });

  describe('isSSNValid', () => {
    it('validates correct SSN formats', () => {
      expect(isSSNValid('123-45-6789')).toBe(true);
      expect(isSSNValid('001-01-0001')).toBe(true);
    });

    it('rejects invalid SSN formats', () => {
      expect(isSSNValid('123456789')).toBe(false);
      expect(isSSNValid('123-45-678')).toBe(false);
      expect(isSSNValid('123-456-789')).toBe(false);
      expect(isSSNValid('12-45-6789')).toBe(false);
      expect(isSSNValid('abc-de-fghi')).toBe(false);
    });
  });
});
