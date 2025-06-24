import _ from 'lodash';
import crypto from 'crypto';
import pool from '../../db/connection';
import { v1 as uuid } from 'uuid';
import { Entry, EntryVersion, NewEntryWithoutId } from '../types';
import { DatabaseError, NotFoundError } from '../utils/errors';
import { calculateVersionDiff } from '../../../shared/src/utils/diffUtils';
import { normalizeEntryDate } from '../utils';
import {
  HealthCheckEntry,
  HospitalEntry,
  OccupationalHealthcareEntry,
  VersionDiff,
} from '../../../shared/src/types/medicalTypes';
import { EntrySchema } from '../schemas/entry.schema';
import { PoolClient } from 'pg';

export class EntryVersionService {
  private static validateEntryData(data: any): boolean {
    try {
      const jsonString = JSON.stringify(data);
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  }

  private static async getFullEntryData(
    entryId: string
  ): Promise<Entry> {
    try {
      const entryResult = await pool.query(
        `SELECT * FROM entries WHERE id = $1`,
        [entryId]
      );

      if (entryResult.rowCount === 0) {
        throw new Error('Entry not found');
      }

      const entry = entryResult.rows[0];
      let fullEntry: Entry;

      switch (entry.type) {
        case 'HealthCheck':
          const healthCheckResult = await pool.query(
            `SELECT * FROM healthcheck_entries WHERE entry_id = $1`,
            [entryId]
          );
          fullEntry = {
            ...entry,
            healthCheckRating:
              healthCheckResult.rows[0].health_check_rating,
          };
          break;
        case 'Hospital':
          const hospitalResult = await pool.query(
            `SELECT * FROM hospital_entries WHERE entry_id = $1`,
            [entryId]
          );
          fullEntry = {
            ...entry,
            discharge: {
              date: hospitalResult.rows[0].discharge_date,
              criteria: hospitalResult.rows[0].discharge_criteria,
            },
          };
          break;
        case 'OccupationalHealthcare':
          const occupationalResult = await pool.query(
            `SELECT * FROM occupational_healthcare_entries WHERE entry_id = $1`,
            [entryId]
          );
          fullEntry = {
            ...entry,
            employerName: occupationalResult.rows[0].employer_name,
            sickLeave: occupationalResult.rows[0]
              .sick_leave_start_date
              ? {
                  startDate:
                    occupationalResult.rows[0].sick_leave_start_date,
                  endDate:
                    occupationalResult.rows[0].sick_leave_end_date,
                }
              : undefined,
          };
          break;
        default:
          throw new Error(`Unknown entry type: ${entry.type}`);
      }

      const codesResult = await pool.query(
        `SELECT diagnosis_code FROM entry_diagnoses WHERE entry_id = $1`,
        [entryId]
      );
      fullEntry.diagnosisCodes = codesResult.rows
        .map(row => row.diagnosis_code)
        .filter(code => code !== null && code !== undefined);

      return fullEntry;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in getFullEntryData:`, error);
      throw new DatabaseError(
        'Failed to fetch full entry data',
        error
      );
    }
  }

  private static validateAndCleanEntry(entry: NewEntryWithoutId): Entry {
    const cleanedEntry = normalizeEntryDate(_.cloneDeep(entry));
    const result = EntrySchema.safeParse(cleanedEntry);
    
    if (!result.success) {
      throw new Error(`Validation failed: ${result.error.message}`);
    }
    const validated = result.data;

    const cleanValue = (value: any): any => {
      if (value === null || value === undefined) return undefined;
      if (Array.isArray(value)) {
        return value
          .map(cleanValue)
          .filter(v => v !== undefined && v !== null);
      }
      if (typeof value === 'string') return value.trim();
      if (typeof value === 'object') {
        return Object.fromEntries(
          Object.entries(value)
            .map(([k, v]) => [k, cleanValue(v)])
            .filter(([_, v]) => v !== undefined)
        );
      }
      return value;
    };

    const cleaned = cleanValue(validated);

    if (cleaned.diagnosisCodes && Array.isArray(cleaned.diagnosisCodes)) {
      cleaned.diagnosisCodes = cleaned.diagnosisCodes.filter(
        (code: string | null | undefined): code is string =>
          code !== null && code !== undefined
      );
    }

    const withDates = Object.fromEntries(
      Object.entries(cleaned).map(([key, value]) => {
        if (value instanceof Date) {
          return [key, value.toISOString()];
        }
        return [key, value];
      })
    );

    switch (validated.type) {
      case 'HealthCheck':
        if ('healthCheckRating' in validated) {
          return {
            ...withDates,
            type: 'HealthCheck',
            healthCheckRating: validated.healthCheckRating,
          } as HealthCheckEntry;
        }
        break;
      case 'Hospital':
        if ('discharge' in validated) {
          return {
            ...withDates,
            type: 'Hospital',
            discharge: validated.discharge,
          } as HospitalEntry;
        }
        break;
      case 'OccupationalHealthcare':
        if ('employerName' in validated) {
          return {
            ...withDates,
            type: 'OccupationalHealthcare',
            employerName: validated.employerName,
            sickLeave: validated.sickLeave,
          } as OccupationalHealthcareEntry;
        }
        break;
      default:
        throw new Error(
          `Invalid entry type or missing required fields: ${
            (validated as Entry).type
          }`
        );
    }
    return validated;
  }

  static async createVersion(
    entryId: string,
    editorId: string,
    changeReason: string = 'Entry updated',
    entryData?: Entry,
    operationType: string = 'UPDATE',
    client?: PoolClient
  ): Promise<EntryVersion> {
    if (changeReason.trim().length < 10) {
      throw new Error('INVALID_CHANGE_REASON: Change reason must be at least 10 characters');
    }

    if (entryData && !this.validateEntryData(entryData)) {
      throw new Error('Invalid JSON in entryData');
    }

    const useClient = client || await pool.connect();
    try {
      if (!client) await useClient.query('BEGIN');

      const cleanedEntry = entryData
        ? this.validateAndCleanEntry(entryData)
        : await this.getFullEntryData(entryId).then(
            this.validateAndCleanEntry
          );
      const versionId = uuid();

      const dataChecksum = crypto.createHash('md5')
        .update(JSON.stringify(cleanedEntry))
        .digest('hex');

      const result = await useClient.query(
        `INSERT INTO entry_versions (
          id, entry_id, created_at, updated_at,
          editor_id, change_reason, entry_data,
          operation_type, data_checksum
        ) VALUES ($1, $2, NOW(), NOW(), $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          versionId,
          entryId,
          editorId,
          changeReason,
          JSON.stringify(cleanedEntry),
          operationType,
          dataChecksum
        ]
      );

      if (!client) await useClient.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      if (!client) await useClient.query('ROLLBACK');
      console.error(`[${new Date().toISOString()}] Error in createVersion:`, error);
      console.error('Parameters:', {
        entryId,
        editorId,
        changeReason,
        entryData: entryData ? JSON.stringify(entryData) : 'undefined'
      });
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
      throw new DatabaseError(
        'Failed to create entry version',
        error
      );
    } finally {
      if (!client) useClient.release();
    }
  }

  static async getVersionById(
    entryId: string,
    versionId: string
  ): Promise<EntryVersion> {
    try {
      const result = await pool.query(
        `SELECT
           id,
           entry_id as "entryId",
           created_at as "createdAt",
           updated_at as "updatedAt",
           editor_id as "editorId",
           change_reason as "changeReason",
           entry_data as "entryData"
         FROM entry_versions
         WHERE entry_id = $1 AND id = $2`,
        [entryId, versionId]
      );
      if (result.rowCount === 0) {
        throw new Error('Version not found');
      }
      return result.rows[0];
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in getVersionById:`, error);
      throw new DatabaseError('Failed to get version', error);
    }
  }

  private static async getCurrentStateAsVersion(entryId: string): Promise<EntryVersion> {
    const entry = await this.getFullEntryData(entryId);
    return {
      id: 'current',
      entryId: entryId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      editorId: 'system',
      changeReason: 'Current state',
      entryData: entry
    };
  }

  static async getVersionDiff(
    entryId: string,
    versionId1: string,
    versionId2: string
  ): Promise<VersionDiff> {
    try {
      const getVersionOrCurrent = async (versionId: string): Promise<EntryVersion> => {
        if (versionId === 'current') {
          return this.getCurrentStateAsVersion(entryId);
        }
        return this.getVersionById(entryId, versionId);
      };

      const version1 = await getVersionOrCurrent(versionId1);
      const version2 = await getVersionOrCurrent(versionId2);
      return calculateVersionDiff(
        version1.entryData,
        version2.entryData
      );
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in getVersionDiff:`, error);
      throw new DatabaseError('Failed to get version diff', error);
    }
  }

  static async checkConcurrency(
    entryId: string,
    lastUpdated: string,
    client?: PoolClient
  ): Promise<boolean> {
    const useClient = client || pool;
    try {
      const result = await useClient.query(
        `SELECT updated_at FROM entries WHERE id = $1`,
        [entryId]
      );

      if (result.rowCount === 0) {
        throw new Error('Entry not found');
      }

      const dbTimestamp = result.rows[0].updated_at;
      const clientTimestamp = new Date(lastUpdated);
      
      console.log(`[CONCURRENCY DEBUG] Entry: ${entryId}, ` +
        `DB UTC: ${dbTimestamp.toISOString()}, ` +
        `Client: ${clientTimestamp.toISOString()}, ` +
        `Client Local: ${clientTimestamp.toString()}, ` +
        `Offset: ${clientTimestamp.getTimezoneOffset()}min`);
      
      return dbTimestamp > new Date(clientTimestamp);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in checkConcurrency:`, error);
      throw new DatabaseError('Failed to check concurrency', error);
    }
  }

  static async getVersionsByEntryId(
    entryId: string
  ): Promise<EntryVersion[]> {
    try {
      const result = await pool.query(
        `SELECT
               id,
               entry_id as "entryId",
               created_at as "createdAt",
               updated_at as "updatedAt",
               editor_id as "editorId",
               change_reason as "changeReason",
               entry_data as "entryData"
             FROM entry_versions
             WHERE entry_id = $1
             ORDER BY updated_at DESC`,
        [entryId]
      );
      return result.rows;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in getVersionsByEntryId:`, error);
      throw new DatabaseError('Failed to get entry versions', error);
    }
  }

  static async getLatestVersion(
    entryId: string,
    client?: PoolClient
  ): Promise<EntryVersion> {
    const useClient = client || pool;
    try {
      const result = await useClient.query(
        `SELECT
               id,
               entry_id as "entryId",
               created_at as "createdAt",
               updated_at as "updatedAt",
               editor_id as "editorId",
               change_reason as "changeReason",
               entry_data as "entryData"
             FROM entry_versions
             WHERE entry_id = $1
             ORDER BY updated_at DESC
             LIMIT 1`,
        [entryId]
      );

      if (result.rowCount === 0) {
        throw new NotFoundError('Entry versions', entryId);
      }
      return result.rows[0];
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in getLatestVersion:`, error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to get latest version', error);
    }
  }

  static async restoreVersion(
    entryId: string,
    versionId: string,
    editorId: string,
    changeReason: string
  ): Promise<Entry> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const version = await this.getVersionById(entryId, versionId);
      if (!version.entryData) {
        throw new Error('Version data missing');
      }

      const cleanedEntry = this.validateAndCleanEntry(
        version.entryData
      );


      const result = await client.query(
        `UPDATE entries SET
              description = $1,
              date = $2,
              specialist = $3,
              updated_at = $4
             WHERE id = $5
             RETURNING *`,
        [
          cleanedEntry.description,
          cleanedEntry.date,
          cleanedEntry.specialist,
          new Date().toISOString(),
          entryId,
        ]
      );

      await client.query(
        `DELETE FROM entry_diagnoses WHERE entry_id = $1`,
        [entryId]
      );
      
      if (cleanedEntry.diagnosisCodes && cleanedEntry.diagnosisCodes.length > 0) {
        const insertValues = cleanedEntry.diagnosisCodes
          .map((_, i) => `($1, $${i + 2})`)
          .join(',');

        await client.query(
          `INSERT INTO entry_diagnoses (entry_id, diagnosis_code)
           VALUES ${insertValues}`,
          [entryId, ...cleanedEntry.diagnosisCodes]
        );
      }

      await this.createVersion(
        entryId,
        editorId,
        changeReason,
        cleanedEntry,
        'UPDATE',
        client
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in restoreVersion:`, error);
      console.error('Parameters:', { entryId, versionId, editorId, changeReason });
      await client.query('ROLLBACK');
      throw new DatabaseError('Failed to restore version', error);
    } finally {
      client.release();
    }
  }
}
