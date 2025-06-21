import { normalizeDiagnosisCodes } from './normalize';

describe('normalizeDiagnosisCodes', () => {
  it('returns empty array for null input', () => {
    expect(normalizeDiagnosisCodes(null)).toEqual([]);
  });

  it('returns empty array for undefined input', () => {
    expect(normalizeDiagnosisCodes(undefined)).toEqual([]);
  });

  it('returns empty array for non-array input', () => {
    expect(normalizeDiagnosisCodes('not an array')).toEqual([]);
    expect(normalizeDiagnosisCodes(123)).toEqual([]);
    expect(normalizeDiagnosisCodes({})).toEqual([]);
  });

  it('filters out null and undefined values', () => {
    const input = ['A1', null, 'B2', undefined, 'C3'];
    expect(normalizeDiagnosisCodes(input)).toEqual(['A1', 'B2', 'C3']);
  });

  it('handles mixed types correctly', () => {
    const input = [123, 'A1', null, {key: 'value'}, true];
    expect(normalizeDiagnosisCodes(input)).toEqual([123, 'A1', {key: 'value'}, true]);
  });

  it('preserves valid arrays', () => {
    const input = ['A1', 'B2', 'C3'];
    expect(normalizeDiagnosisCodes(input)).toEqual(['A1', 'B2', 'C3']);
  });

  it('handles empty arrays', () => {
    expect(normalizeDiagnosisCodes([])).toEqual([]);
  });
});