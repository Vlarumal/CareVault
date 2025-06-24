import { calculateVersionDiff } from './diffUtils';
import { HealthCheckEntry, Entry } from '../types/medicalTypes';

describe('calculateVersionDiff', () => {
  it('should handle when oldObj is null and newObj is an object', () => {
    const oldVersion = null as unknown as Entry;
    const newVersion: HealthCheckEntry = {
      id: '1',
      description: 'New entry',
      date: '2025-01-01',
      specialist: 'Dr. Smith',
      diagnosisCodes: [],
      type: 'HealthCheck',
      healthCheckRating: 0,
    };

    const diff = calculateVersionDiff(oldVersion, newVersion);
    expect(diff).toEqual({
      '': {
        oldValue: null,
        newValue: newVersion,
      },
    });
  });

  it('should handle when oldObj is an object and newObj is null', () => {
    const oldVersion: HealthCheckEntry = {
      id: '1',
      description: 'Old entry',
      date: '2025-01-01',
      specialist: 'Dr. Smith',
      diagnosisCodes: [],
      type: 'HealthCheck',
      healthCheckRating: 0,
    };
    const newVersion = null as unknown as Entry;

    const diff = calculateVersionDiff(oldVersion, newVersion);
    expect(diff).toEqual({
      '': {
        oldValue: oldVersion,
        newValue: null,
      },
    });
  });

  it('should handle when oldObj is undefined and newObj is an object', () => {
    const oldVersion = undefined as unknown as Entry;
    const newVersion: HealthCheckEntry = {
      id: '1',
      description: 'New entry',
      date: '2025-01-01',
      specialist: 'Dr. Smith',
      diagnosisCodes: [],
      type: 'HealthCheck',
      healthCheckRating: 0,
    };

    const diff = calculateVersionDiff(oldVersion, newVersion);
    expect(diff).toEqual({
      '': {
        oldValue: undefined,
        newValue: newVersion,
      },
    });
  });

  it('should handle when oldObj is an object and newObj is undefined', () => {
    const oldVersion: HealthCheckEntry = {
      id: '1',
      description: 'Old entry',
      date: '2025-01-01',
      specialist: 'Dr. Smith',
      diagnosisCodes: [],
      type: 'HealthCheck',
      healthCheckRating: 0,
    };
    const newVersion = undefined as unknown as Entry;

    const diff = calculateVersionDiff(oldVersion, newVersion);
    expect(diff).toEqual({
      '': {
        oldValue: oldVersion,
        newValue: undefined,
      },
    });
  });

  it('should handle nested objects with null/undefined', () => {
    const oldVersion: any = {
      id: '1',
      description: 'Old entry',
      date: '2025-01-01',
      specialist: 'Dr. Smith',
      diagnosisCodes: ['A1'],
      type: 'HealthCheck',
      healthCheckRating: 0,
      nested: {
        prop1: 'value1',
        prop2: null,
        prop3: undefined,
      },
    };
    const newVersion: any = {
      id: '1',
      description: 'New entry',
      date: '2025-01-01',
      specialist: 'Dr. Smith',
      diagnosisCodes: ['A1', 'A2'],
      type: 'HealthCheck',
      healthCheckRating: 1,
      nested: {
        prop1: 'value1',
        prop2: 'not null',
        prop3: 'defined',
      },
    };

    const diff = calculateVersionDiff(oldVersion, newVersion);
    expect(diff).toEqual({
      'description': {
        oldValue: 'Old entry',
        newValue: 'New entry',
      },
      'diagnosisCodes': {
        oldValue: ['A1'],
        newValue: ['A1', 'A2'],
      },
      'healthCheckRating': {
        oldValue: 0,
        newValue: 1,
      },
      'nested.prop2': {
        oldValue: null,
        newValue: 'not null',
      },
      'nested.prop3': {
        oldValue: undefined,
        newValue: 'defined',
      },
    });
  });
});