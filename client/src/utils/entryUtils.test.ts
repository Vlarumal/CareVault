import { prepareEntryData } from './entryUtils';
import type { NewEntryFormValues } from '../types';
import { describe, test, expect } from 'vitest';

describe('prepareEntryData', () => {
  const baseValues: NewEntryFormValues = {
    type: 'HealthCheck',
    description: 'Annual checkup',
    date: '2023-10-10',
    specialist: 'Dr. Smith',
    healthCheckRating: 0,
  };

  test('filters out invalid diagnosis codes', () => {
    const values = {
      ...baseValues,
      diagnosisCodes: ['M54.5', '', 'Invalid!Code', 'E11.9', '   ', null, undefined] as any
    };

    const result = prepareEntryData(values);
    expect(result.diagnosisCodes).toEqual(['M54.5', 'E11.9']);
  });

  test('converts empty array to empty array', () => {
    const values = {
      ...baseValues,
      diagnosisCodes: []
    };

    const result = prepareEntryData(values);
    expect(result.diagnosisCodes).toEqual([]);
  });

  test('handles undefined diagnosisCodes by converting to empty array', () => {
    const values = {
      ...baseValues,
      diagnosisCodes: undefined
    };

    const result = prepareEntryData(values);
    expect(result.diagnosisCodes).toEqual([]);
  });

  test('handles null diagnosisCodes by converting to empty array', () => {
    const values = {
      ...baseValues,
      diagnosisCodes: null as any
    };

    const result = prepareEntryData(values);
    expect(result.diagnosisCodes).toEqual([]);
  });

  test('allows valid diagnosis codes with dots and hyphens', () => {
    const values = {
      ...baseValues,
      diagnosisCodes: ['A12.34', 'BCD-56', 'Z00.00']
    };

    const result = prepareEntryData(values);
    expect(result.diagnosisCodes).toEqual(['A12.34', 'BCD-56', 'Z00.00']);
  });

  test('preserves valid codes when some are invalid', () => {
    const values = {
      ...baseValues,
      diagnosisCodes: ['G44.2', 'Invalid@Code', 'J45.909']
    };

    const result = prepareEntryData(values);
    expect(result.diagnosisCodes).toEqual(['G44.2', 'J45.909']);
  });

  test('handles omitted diagnosisCodes by converting to empty array', () => {
    const values = { ...baseValues };
    delete values.diagnosisCodes;

    const result = prepareEntryData(values);
    expect(result.diagnosisCodes).toEqual([]);
  });

  test('filters out non-string values', () => {
    const values = {
      ...baseValues,
      diagnosisCodes: [123, 'A1', null, {key: 'value'}, true, 'B2'] as any
    };

    const result = prepareEntryData(values);
    expect(result.diagnosisCodes).toEqual(['A1', 'B2']);
  });
});