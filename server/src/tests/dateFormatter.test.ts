import formatToISODate from '../utils/dateFormatter';

describe('dateFormatter', () => {
  test('formats Date object to YYYY-MM-DD in UTC', () => {
    const date = new Date('2023-05-15T12:34:56Z');
    expect(formatToISODate(date)).toBe('2023-05-15');
  });

  test('formats ISO string to YYYY-MM-DD in UTC', () => {
    const dateStr = '2023-05-15T12:34:56Z';
    expect(formatToISODate(dateStr)).toBe('2023-05-15');
  });

  test('formats YYYY-MM-DD string to YYYY-MM-DD in UTC', () => {
    const dateStr = '2023-05-15';
    expect(formatToISODate(dateStr)).toBe('2023-05-15');
  });

  test('handles dates with timezone offset', () => {
    const date = new Date('2023-05-15T12:34:56+02:00');
    expect(formatToISODate(date)).toBe('2023-05-15');
  });

  test('throws error for invalid date', () => {
    expect(() => formatToISODate('not-a-date')).toThrow('Invalid date format');
  });
});