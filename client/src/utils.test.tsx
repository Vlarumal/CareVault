import { describe, it, expect } from 'vitest';
import {
  isDateValid,
  validateHealthRating,
  validateRequired,
  validateDateRange,
  validateSSN,
  getIcon,
  assertNever
} from './utils';
import { Favorite, Male, Female, Healing, Work, MedicalServices, Transgender } from '@mui/icons-material';
import { Patient, Entry, HealthCheckEntry } from './types';

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

  describe('validateSSN', () => {
    it('returns empty string for valid SSN formats', () => {
      expect(validateSSN('090471-8890')).toBe(''); // format without letter
      expect(validateSSN('050174-432N')).toBe(''); // format with uppercase letter
      expect(validateSSN('300179-777a')).toBe(''); // format with lowercase letter
    });

    it('returns error message for invalid SSN formats', () => {
      expect(validateSSN('123456789')).toBe('Invalid SSN format. Use XXXXXX-XXXX');
      expect(validateSSN('123-45-678')).toBe('Invalid SSN format. Use XXXXXX-XXXX');
      expect(validateSSN('123-456-789')).toBe('Invalid SSN format. Use XXXXXX-XXXX');
      expect(validateSSN('12-45-6789')).toBe('Invalid SSN format. Use XXXXXX-XXXX');
      expect(validateSSN('abc-de-fghi')).toBe('Invalid SSN format. Use XXXXXX-XXXX');
      // Format invalid cases
      expect(validateSSN('090471-889')).toBe('Invalid SSN format. Use XXXXXX-XXXX'); // Too short after dash
      expect(validateSSN('050174-432NN')).toBe('Invalid SSN format. Use XXXXXX-XXXX'); // Too long after dash
      expect(validateSSN('300179-77!A')).toBe('Invalid SSN format. Use XXXXXX-XXXX'); // Invalid character
      expect(validateSSN('090786-122')).toBe('Invalid SSN format. Use XXXXXX-XXXX'); // Missing letter/digit
    });
  });
});

describe('getIcon Utility', () => {
  it('returns correct icon for gender types', () => {
    expect(getIcon('male' as Patient['gender'])).toEqual(<Male />);
    expect(getIcon('female' as Patient['gender'])).toEqual(<Female />);
    expect(getIcon('other' as Patient['gender'])).toEqual(<Transgender />);
  });
  
  it('returns correct icon for entry types', () => {
    expect(getIcon('Hospital' as Entry['type'])).toEqual(<Healing />);
    expect(getIcon('OccupationalHealthcare' as Entry['type'])).toEqual(<Work />);
    expect(getIcon('HealthCheck' as Entry['type'])).toEqual(<MedicalServices />);
  });
  
  it('returns correct icon for health ratings', () => {
    expect(getIcon(0 as HealthCheckEntry['healthCheckRating'])).toEqual(<Favorite color='success' />);
    expect(getIcon(1 as HealthCheckEntry['healthCheckRating'])).toEqual(<Favorite sx={{ color: 'yellow' }} />);
    expect(getIcon(2 as HealthCheckEntry['healthCheckRating'])).toEqual(<Favorite color='warning' />);
    expect(getIcon(3 as HealthCheckEntry['healthCheckRating'])).toEqual(<Favorite color='error' />);
  });
  
  it('returns undefined for unknown types', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getIcon('unknown' as any)).toBeUndefined();
  });
});

describe('assertNever Utility', () => {
  it('throws error with correct message', () => {
    const testValue = { kind: 'invalid' } as never;
    expect(() => assertNever(testValue)).toThrowError(
      'Unhandled discriminated union member: {"kind":"invalid"}'
    );
  });
});
