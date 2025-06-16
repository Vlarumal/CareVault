import { EntryVersionService } from '../services/entryVersionService';
import { Entry, HealthCheckRating, NewEntryWithoutId } from '../types';
import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import { createPool } from '../../db/connection';
import { DatabaseError } from '../utils/errors';

// Mock data
const mockEntry: NewEntryWithoutId = {
  description: 'Annual checkup',
  date: '2025-06-16T12:00:00Z', // ISO string format
  specialist: 'Dr. Smith',
  diagnosisCodes: ['Z00.00'],
  type: 'HealthCheck',
  healthCheckRating: HealthCheckRating.Healthy,
};

describe('EntryVersionService date handling', () => {
  beforeAll(async () => {
    // Initialize database pool
    await createPool();
  });

  afterAll(async () => {
    // Clean up any test data
  });

  describe('normalizeEntryDate', () => {
    it('should trim ISO date strings to YYYY-MM-DD format', () => {
      const entry = { ...mockEntry, date: '2025-06-16T12:00:00Z' };
      const normalized = EntryVersionService['normalizeEntryDate'](entry);
      expect(normalized.date).toBe('2025-06-16');
    });

    it('should leave YYYY-MM-DD dates unchanged', () => {
      const entry = { ...mockEntry, date: '2025-06-16' };
      const normalized = EntryVersionService['normalizeEntryDate'](entry);
      expect(normalized.date).toBe('2025-06-16');
    });

    it('should convert Date objects to YYYY-MM-DD strings', () => {
      const date = new Date('2025-06-16T12:00:00Z');
      const entry = { ...mockEntry, date };
      const normalized = EntryVersionService['normalizeEntryDate'](entry);
      expect(normalized.date).toBe('2025-06-16');
    });

    it('should handle nested date objects in discharge information', () => {
      const entry = {
        ...mockEntry,
        type: 'Hospital',
        discharge: {
          date: new Date('2025-06-16T12:00:00Z'),
          criteria: 'Recovered',
        },
      } as NewEntryWithoutId;
      const normalized = EntryVersionService['normalizeEntryDate'](entry);
      expect(normalized.discharge.date).toBe('2025-06-16');
    });

    it('should handle nested date objects in sickLeave information', () => {
      const entry = {
        ...mockEntry,
        type: 'OccupationalHealthcare',
        employerName: 'Acme Corp',
        sickLeave: {
          startDate: new Date('2025-06-01T12:00:00Z'),
          endDate: '2025-06-15T12:00:00Z',
        },
      } as NewEntryWithoutId;
      const normalized = EntryVersionService['normalizeEntryDate'](entry);
      expect(normalized.sickLeave?.startDate).toBe('2025-06-01');
      expect(normalized.sickLeave?.endDate).toBe('2025-06-15');
    });
  });

  describe('validateAndCleanEntry', () => {
    it('should validate entries with ISO date strings', async () => {
      const entry = { ...mockEntry, date: '2025-06-16T12:00:00Z' };
      const validated = EntryVersionService['validateAndCleanEntry'](entry);
      expect(validated.date).toBe('2025-06-16');
    });

    it('should validate entries with Date objects', async () => {
      const entry = { ...mockEntry, date: new Date('2025-06-16T12:00:00Z') };
      const validated = EntryVersionService['validateAndCleanEntry'](entry);
      expect(validated.date).toBe('2025-06-16');
    });

    it('should validate entries with mixed date formats', async () => {
      const entry = {
        ...mockEntry,
        date: '2025-06-16T12:00:00Z',
        type: 'Hospital',
        discharge: {
          date: new Date('2025-06-17T12:00:00Z'),
          criteria: 'Recovered',
        },
      } as NewEntryWithoutId;
      const validated = EntryVersionService['validateAndCleanEntry'](entry);
      expect(validated.date).toBe('2025-06-16');
      expect((validated as any).discharge.date).toBe('2025-06-17');
    });

    it('should throw error for invalid dates', async () => {
      const entry = { ...mockEntry, date: 'invalid-date' };
      expect(() => EntryVersionService['validateAndCleanEntry'](entry)).toThrow();
    });
  });

  describe('createVersion', () => {
    it('should handle entries with ISO date strings', async () => {
      // Mock database operations
      vi.spyOn(EntryVersionService, 'getFullEntryData').mockResolvedValueOnce(mockEntry as Entry);
      
      const version = await EntryVersionService.createVersion('entry-id', 'user-id', 'Test reason');
      expect(version.entry_data.date).toBe('2025-06-16');
    });

    it('should handle entries with Date objects', async () => {
      const entryWithDateObj = {
        ...mockEntry,
        date: new Date('2025-06-16T12:00:00Z')
      };
      
      // Mock database operations
      vi.spyOn(EntryVersionService, 'getFullEntryData').mockResolvedValueOnce(entryWithDateObj as Entry);
      
      const version = await EntryVersionService.createVersion('entry-id', 'user-id', 'Test reason');
      expect(version.entry_data.date).toBe('2025-06-16');
    });
  });
});