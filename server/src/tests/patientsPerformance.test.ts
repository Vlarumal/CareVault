import { patientService } from '../services/patientsService';
import pool from '../../db/connection';
import { clearDatabase, seedDatabase } from './testUtils';
import { QueryResult } from 'pg';
import { buildWhereClause, buildOrderByClause } from '../utils/queryBuilder';
import { filterSchema, sortSchema } from '../schemas/filterSort.schema';
import { getLatestHealthRating } from '../../../client/src/services/healthRatingService';
import {
  Patient,
  NonSensitivePatientEntry,
  NewPatientEntryWithoutEntries,
  PaginatedResponse,
  Gender,
} from '../types';
import Benchmark from 'benchmark';
import { Performance } from 'perf_hooks';

jest.mock('../../db/connection');
jest.mock('../utils/queryBuilder');
jest.mock('../../../client/src/services/healthRatingService');

describe('PatientService Performance', () => {
  beforeAll(async () => {
    await clearDatabase();
    await seedDatabase();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNonSensitiveEntries performance', () => {
    it('should handle large datasets efficiently', async () => {
      // Create a large dataset
      const largeDataset: NonSensitivePatientEntry[] = Array.from({ length: 10000 }, (_, i) => ({
        id: i.toString(),
        name: `Patient ${i}`,
        dateOfBirth: '1980-01-01',
        gender: i % 2 === 0 ? Gender.Male : Gender.Female,
        occupation: 'Developer',
        healthRating: Math.floor(Math.random() * 100),
      }));

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: largeDataset,
      } as unknown as QueryResult);

      // Measure performance
      const suite = new Benchmark.Suite();
      suite
        .add('getNonSensitiveEntries', () => {
          patientService.getNonSensitiveEntries();
        })
        .on('complete', function (this: any) {
          console.log(`Fastest is ${this.filter('fastest').map('name')}`);
        })
        .run();

      // Wait for the benchmark to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await patientService.getNonSensitiveEntries();
      expect(result).toHaveLength(10000);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    });

    it('should handle large datasets with filtering efficiently', async () => {
      // Create a large dataset
      const largeDataset: NonSensitivePatientEntry[] = Array.from({ length: 10000 }, (_, i) => ({
        id: i.toString(),
        name: `Patient ${i}`,
        dateOfBirth: '1980-01-01',
        gender: i % 2 === 0 ? Gender.Male : Gender.Female,
        occupation: 'Developer',
        healthRating: Math.floor(Math.random() * 100),
      }));

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: largeDataset.filter(p => p.gender === Gender.Male).slice(0, 100),
      } as unknown as QueryResult);

      // Measure performance
      const suite = new Benchmark.Suite();
      suite
        .add('getNonSensitiveEntries with filtering', () => {
          patientService.getFilteredAndPaginatedPatients(1, 100, { gender: 'male' });
        })
        .on('complete', function (this: any) {
          console.log(`Fastest is ${this.filter('fastest').map('name')}`);
        })
        .run();

      // Wait for the benchmark to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await patientService.getFilteredAndPaginatedPatients(1, 100, { gender: 'male' });

      expect(result).toHaveLength(100);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    });

    it('should handle large datasets with sorting efficiently', async () => {
      // Create a large dataset
      const largeDataset: NonSensitivePatientEntry[] = Array.from({ length: 10000 }, (_, i) => ({
        id: i.toString(),
        name: `Patient ${i}`,
        dateOfBirth: '1980-01-01',
        gender: i % 2 === 0 ? Gender.Male : Gender.Female,
        occupation: 'Developer',
        healthRating: Math.floor(Math.random() * 100),
      }));

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: largeDataset.sort((a, b) => (b.healthRating as number) - (a.healthRating as number)),
      } as unknown as QueryResult);

      // Measure performance
      const suite = new Benchmark.Suite();
      suite
        .add('getNonSensitiveEntries with sorting', () => {
          patientService.getFilteredAndPaginatedPatients(1, 10000, {}, { field: 'health_rating', direction: 'DESC' });
        })
        .on('complete', function (this: any) {
          console.log(`Fastest is ${this.filter('fastest').map('name')}`);
        })
        .run();

      // Wait for the benchmark to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await patientService.getFilteredAndPaginatedPatients(1, 10000, {}, { field: 'health_rating', direction: 'DESC' });

      expect(result.data).toHaveLength(10000);
      expect((result.data[0].healthRating as number)).toBeGreaterThanOrEqual((result.data[9999].healthRating as number));
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    });

    it('should handle large datasets with pagination efficiently', async () => {
      // Create a large dataset
      const largeDataset: NonSensitivePatientEntry[] = Array.from({ length: 10000 }, (_, i) => ({
        id: i.toString(),
        name: `Patient ${i}`,
        dateOfBirth: '1980-01-01',
        gender: i % 2 === 0 ? Gender.Male : Gender.Female,
        occupation: 'Developer',
        healthRating: Math.floor(Math.random() * 100),
      }));

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: largeDataset.slice(100, 200),
      } as unknown as QueryResult);

      // Measure performance
      const suite = new Benchmark.Suite();
      suite
        .add('getNonSensitiveEntries with pagination', () => {
          patientService.getFilteredAndPaginatedPatients(2, 100);
        })
        .on('complete', function (this: any) {
          console.log(`Fastest is ${this.filter('fastest').map('name')}`);
        })
        .run();

      // Wait for the benchmark to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await patientService.getFilteredAndPaginatedPatients(2, 100);

      expect(result).toHaveLength(100);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    });

    it('should handle large datasets with complex queries efficiently', async () => {
      // Create a large dataset
      const largeDataset: NonSensitivePatientEntry[] = Array.from({ length: 10000 }, (_, i) => ({
        id: i.toString(),
        name: `Patient ${i}`,
        dateOfBirth: '1980-01-01',
        gender: i % 2 === 0 ? Gender.Male : Gender.Female,
        occupation: 'Developer',
        healthRating: Math.floor(Math.random() * 100),
      }));

      const filteredDataset = largeDataset.filter(p => p.gender === Gender.Male && (p.healthRating as number) >= 80).sort((a, b) => b.name.localeCompare(a.name)).slice(100, 150);

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: filteredDataset,
      } as unknown as QueryResult);

      // Measure performance
      const suite = new Benchmark.Suite();
      suite
        .add('getNonSensitiveEntries with complex query', () => {
          patientService.getFilteredAndPaginatedPatients(3, 50, { gender: 'male', minHealthRating: 80 }, { field: 'name', direction: 'DESC' });
        })
        .on('complete', function (this: any) {
          console.log(`Fastest is ${this.filter('fastest').map('name')}`);
        })
        .run();

      // Wait for the benchmark to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await patientService.getFilteredAndPaginatedPatients(3, 50, { gender: 'male', minHealthRating: 80 }, { field: 'name', direction: 'DESC' });

      expect(result).toHaveLength(50);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    });

    it('should handle large datasets with memory efficiency', async () => {
      // Create a large dataset
      const largeDataset: NonSensitivePatientEntry[] = Array.from({ length: 10000 }, (_, i) => ({
        id: i.toString(),
        name: `Patient ${i}`,
        dateOfBirth: '1980-01-01',
        gender: i % 2 === 0 ? Gender.Male : Gender.Female,
        occupation: 'Developer',
        healthRating: Math.floor(Math.random() * 100),
      }));

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: largeDataset,
      } as unknown as QueryResult);

      // Measure memory usage
      const memoryUsageBefore = process.memoryUsage();

      const result = await patientService.getNonSensitiveEntries();

      const memoryUsageAfter = process.memoryUsage();

      console.log(`Memory usage before: ${memoryUsageBefore.heapUsed / 1024 / 1024} MB`);
      console.log(`Memory usage after: ${memoryUsageAfter.heapUsed / 1024 / 1024} MB`);

      expect(result).toHaveLength(10000);
      expect(memoryUsageAfter.heapUsed).toBeLessThanOrEqual(memoryUsageBefore.heapUsed * 1.5);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    });

    it('should handle large datasets with CPU efficiency', async () => {
      // Create a large dataset
      const largeDataset: NonSensitivePatientEntry[] = Array.from({ length: 10000 }, (_, i) => ({
        id: i.toString(),
        name: `Patient ${i}`,
        dateOfBirth: '1980-01-01',
        gender: i % 2 === 0 ? Gender.Male : Gender.Female,
        occupation: 'Developer',
        healthRating: Math.floor(Math.random() * 100),
      }));

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: largeDataset,
      } as unknown as QueryResult);

      // Measure CPU usage
      const cpuUsageBefore = process.cpuUsage();

      const result = await patientService.getNonSensitiveEntries();

      const cpuUsageAfter = process.cpuUsage();

      console.log(`CPU usage before: ${cpuUsageBefore.user / 1000} s`);
      console.log(`CPU usage after: ${cpuUsageAfter.user / 1000} s`);

      expect(result).toHaveLength(10000);
      expect(cpuUsageAfter.user).toBeLessThanOrEqual(cpuUsageBefore.user + 1000); // Less than 1 second of CPU time
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    });
  });

  describe('createPatient performance', () => {
    it('should handle high-frequency insertions efficiently', async () => {
      // Create multiple patients
      const patients: NewPatientEntryWithoutEntries[] = Array.from({ length: 1000 }, (_, i) => ({
        name: `Patient ${i}`,
        dateOfBirth: '1980-01-01',
        gender: i % 2 === 0 ? Gender.Male : Gender.Female,
        occupation: 'Developer',
      }));

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: patients.map((patient, index) => ({
          id: index.toString(),
          ...patient,
        })),
      } as unknown as QueryResult);

      // Measure performance
      const suite = new Benchmark.Suite();
      suite
        .add('createPatient', () => {
          patients.forEach(patient => patientService.createPatient(patient));
        })
        .on('complete', function (this: any) {
          console.log(`Fastest is ${this.filter('fastest').map('name')}`);
        })
        .run();

      // Wait for the benchmark to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await Promise.all(patients.map(patient => patientService.createPatient(patient)));
      expect(result).toHaveLength(1000);
      expect(pool.query).toHaveBeenCalledTimes(1000);
    });
  });

  describe('editPatient performance', () => {
    it('should handle high-frequency updates efficiently', async () => {
      // Create multiple patients
      const patients: NewPatientEntryWithoutEntries[] = Array.from({ length: 1000 }, (_, i) => ({
        name: `Patient ${i}`,
        dateOfBirth: '1980-01-01',
        gender: i % 2 === 0 ? Gender.Male : Gender.Female,
        occupation: 'Developer',
      }));

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: patients.map((patient, index) => ({
          id: index.toString(),
          ...patient,
        })),
      } as unknown as QueryResult);

      // Measure performance
      const suite = new Benchmark.Suite();
      suite
        .add('editPatient', () => {
          patients.forEach((patient, index) => {
            patientService.editPatient(index.toString(), patient);
          });
        })
        .on('complete', function (this: any) {
          console.log(`Fastest is ${this.filter('fastest').map('name')}`);
        })
        .run();

      // Wait for the benchmark to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await Promise.all(patients.map((patient, index) => patientService.editPatient(index.toString(), patient)));
      expect(result).toHaveLength(1000);
      expect(pool.query).toHaveBeenCalledTimes(1000);
    });
  });

  describe('deletePatient performance', () => {
    it('should handle high-frequency deletions efficiently', async () => {
      // Create multiple patients
      const patientIds = Array.from({ length: 1000 }, (_, i) => i.toString());

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: patientIds.map(id => ({ id })),
      } as unknown as QueryResult);

      // Measure performance
      const suite = new Benchmark.Suite();
      suite
        .add('deletePatient', () => {
          patientIds.forEach(id => patientService.deletePatient(id));
        })
        .on('complete', function (this: any) {
          console.log(`Fastest is ${this.filter('fastest').map('name')}`);
        })
        .run();

      // Wait for the benchmark to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await Promise.all(patientIds.map(id => patientService.deletePatient(id)));
      expect(result).toHaveLength(1000);
      expect(pool.query).toHaveBeenCalledTimes(1000);
    });
  });
});
