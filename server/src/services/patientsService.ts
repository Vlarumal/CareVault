import pool from '../../db/connection';
import { v1 as uuid, validate as isUUID } from 'uuid';
import {
  type BaseEntry,
  type Entry,
  type NewEntryWithoutId,
  type NonSensitivePatientEntry,
  type PatientEntry,
  type PaginatedResponse,
  NewPatientEntryWithoutEntries,
  HealthCheckRating,
  Gender,
  EntryVersion,
} from '../types';
import {
  HealthCheckEntry,
  HospitalEntry,
  OccupationalHealthcareEntry,
} from '../types';
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
  ConcurrencyError,
} from '../utils/errors';
import { EntryVersionService } from './entryVersionService';
import logger from '../utils/logger';
import { sanitizeObject } from '../utils/sanitize';
import { QueryResult } from 'pg';
import { normalizeEntryDate } from '../utils/dateFormatter';
import {
  buildWhereClause,
  buildOrderByClause,
} from '../utils/queryBuilder';
import { AnyEntry } from 'shared/src/types/medicalTypes';

class TransactionError extends DatabaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, details);
    this.name = 'TransactionError';
  }
}

const SAFE_STRING_REGEX = /^[^;'"\\]*$/;

const validateSafeString = (
  value: string,
  fieldName: string
): void => {
  if (!SAFE_STRING_REGEX.test(value)) {
    throw new ValidationError(
      `${fieldName} contains invalid characters`,
      {
        error: 'ValidationError',
        details: {
          field: fieldName,
          value: value,
          constraints: ['no_special_chars'],
        },
      }
    );
  }

  if (/<[a-z][\s\S]*>/i.test(value)) {
    throw new ValidationError(`${fieldName} contains HTML tags`, {
      error: 'ValidationError',
      details: {
        field: fieldName,
        value: value,
        constraints: ['no_html_tags'],
      },
    });
  }

  const sqlPatterns = [
    /\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC)\b/i,
    /\b(UNION\s+ALL|UNION\s+SELECT)\b/i,
    /\bOR\s*'?\d+'?\s*=\s*'?\d\b/i,
    /(--|\/\*|\*\/|;)/,
    /\b(WAITFOR\s+DELAY)\b/i,
    /\b(SLEEP\(\d+\))\b/i,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(value)) {
      throw new ValidationError(
        `${fieldName} contains potentially dangerous content`,
        {
          error: 'ValidationError',
          details: {
            field: fieldName,
            value: value,
            constraints: ['no_sql_injection'],
          },
        }
      );
    }
  }
};

const mapToHealthCheckEntry = (row: any): HealthCheckEntry => {
  return {
    id: row.id,
    description: row.description,
    date: normalizeEntryDate(row.date),
    specialist: row.specialist,
    type: 'HealthCheck',
    healthCheckRating: row.health_check_rating as HealthCheckRating,
    diagnosisCodes: row.diagnosis_codes || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapToHospitalEntry = (row: any): HospitalEntry => {
  return {
    id: row.id,
    description: row.description,
    date: normalizeEntryDate(row.date),
    specialist: row.specialist,
    type: 'Hospital',
    discharge: {
      date: normalizeEntryDate(row.discharge_date),
      criteria: row.discharge_criteria as string,
    },
    diagnosisCodes: row.diagnosis_codes || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapToOccupationalHealthcareEntry = (
  row: any
): OccupationalHealthcareEntry => {
  return {
    id: row.id,
    description: row.description,
    date: normalizeEntryDate(row.date),
    specialist: row.specialist,
    type: 'OccupationalHealthcare',
    employerName: row.employer_name as string,
    sickLeave:
      row.sick_leave_start_date && row.sick_leave_end_date
        ? {
            startDate: normalizeEntryDate(row.sick_leave_start_date),
            endDate: normalizeEntryDate(row.sick_leave_end_date),
          }
        : undefined,
    diagnosisCodes: row.diagnosis_codes || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

// Get all patient entries (for internal use)
const getPatientEntries = async (): Promise<PatientEntry[]> => {
  try {
    const result = (await pool.query(
      'SELECT * FROM patients'
    )) as QueryResult<PatientEntry>;
    return result.rows;
  } catch (error) {
    throw new DatabaseError('Failed to fetch patient entries', {
      originalError: error,
      context: { function: 'getPatientEntries' },
    });
  }
};

// Get non-sensitive patient entries (for public API)
const getNonSensitiveEntries = async (): Promise<
  NonSensitivePatientEntry[]
> => {
  try {
    const result = (await pool.query(`
      SELECT patients.*, patient_health_ratings.health_rating
      FROM patients
      LEFT JOIN patient_health_ratings ON patients.id = patient_health_ratings.patient_id
      WHERE patients.is_deleted = false
    `)) as QueryResult<{
      id: string;
      name: string;
      date_of_birth: string;
      gender: string;
      occupation: string;
      created_at: string;
      updated_at: string;
      health_rating: number | null;
    }>;

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      dateOfBirth: row.date_of_birth,
      gender: row.gender as Gender,
      occupation: row.occupation,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      healthRating:
        row.health_rating === -1 ? null : row.health_rating,
    }));
  } catch (error) {
    throw new DatabaseError(
      'Failed to fetch non-sensitive patient entries',
      {
        originalError: error,
        context: { function: 'getNonSensitiveEntries' },
      }
    );
  }
};

// Get all non-sensitive patient entries (non-paginated)
const getAllNonSensitiveEntries = async (): Promise<
  NonSensitivePatientEntry[]
> => {
  return getNonSensitiveEntries();
};

const getPaginatedNonSensitiveEntries = async (
  page: number = 1,
  pageSize: number = 10,
  filterModel: any = null,
  sortModel: any = null
): Promise<PaginatedResponse<NonSensitivePatientEntry[]>> => {
  if (page < 1 || pageSize < 1) {
    throw new ValidationError(
      'Page and pageSize must be positive integers',
      { invalidFields: ['page', 'pageSize'] }
    );
  }

  try {
    let filter: Record<string, any> = {};
    if (filterModel) {
      const filters = filterModel.items || [];

      const searchFilters = filters.filter((f: any) =>
        ['name', 'gender', 'occupation'].includes(f.field)
      );

      if (searchFilters.length > 3) {
        const errorDetails = {
          invalidFields: searchFilters.map(
            (f: { field: string }) => f.field
          ),
          filterCount: searchFilters.length,
          maxAllowed: 3,
        };
        logger.error('Filter validation failed', errorDetails);
        throw new ValidationError(
          'Maximum of 3 search parameters allowed (name, gender, occupation)',
          errorDetails
        );
      }

      searchFilters.forEach((filterItem: any) => {
        const field = filterItem.field as keyof typeof filter;
        filter[field] = filterItem.value;
      });
    }

    let sortArray: Array<{ field: string; direction: string }> = [];
    if (sortModel && Array.isArray(sortModel)) {
      sortArray = sortModel.map((s) => ({
        field: s.field || 'name',
        direction: s.sort || 'asc',
      }));
    }

    const paginationParams = [
      Number(pageSize),
      Number((page - 1) * pageSize),
    ];

    const { whereClause, params } = buildWhereClause(
      filter,
      undefined,
      true
    );
    const { orderByClause, params: orderParams } = buildOrderByClause(
      sortArray,
      params
    );

    // Main query with pagination
    const query = `
      SELECT patients.*, COALESCE(patient_health_ratings.health_rating, -1) AS health_rating
      FROM patients
      LEFT JOIN patient_health_ratings ON patients.id = patient_health_ratings.patient_id
      ${whereClause}
      ${orderByClause}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    // Combine parameters after validation
    const finalParams = [...(orderParams || []), ...paginationParams];
    logger.debug('Final query parameters', {
      filterParams: orderParams?.length || 0,
      paginationParams: paginationParams.length,
      totalParams: finalParams.length,
    });

    const result = (await pool.query(
      query,
      finalParams
    )) as QueryResult<{
      id: string;
      name: string;
      date_of_birth: string;
      gender: Gender;
      occupation: string;
      health_rating: number | null;
    }>;

    const countQuery = `
      SELECT COUNT(*)
      FROM patients
      LEFT JOIN patient_health_ratings ON patients.id = patient_health_ratings.patient_id
      ${whereClause}
    `;

    const totalResult = (await pool.query(
      countQuery,
      params
    )) as QueryResult<{ count: string }>;
    const totalItems = parseInt(totalResult.rows[0].count, 10);

    const entries = result.rows.map(
      (row: {
        id: string;
        name: string;
        date_of_birth: string;
        gender: Gender;
        occupation: string;
        health_rating: number | null;
      }) => ({
        id: row.id,
        name: row.name,
        dateOfBirth: normalizeEntryDate(row.date_of_birth),
        gender: row.gender,
        occupation: row.occupation,
        healthRating:
          row.health_rating === -1 ? null : row.health_rating,
      })
    );

    return {
      data: entries as NonSensitivePatientEntry[],
      metadata: {
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
        currentPage: page,
        itemsPerPage: pageSize,
      },
    };
  } catch (error) {
    throw new DatabaseError(
      'Failed to fetch paginated non-sensitive patient entries',
      {
        originalError: error,
        context: {
          function: 'getPaginatedNonSensitiveEntries',
          page,
          pageSize,
        },
      }
    );
  }
};

const getAllPatientsWithEntries = async (): Promise<
  PatientEntry[]
> => {
  try {
    const patients = await getPatientEntries();
    const patientsWithEntries = await Promise.all(
      patients.map(async (patient) => {
        const entries = await getEntriesByPatientId(patient.id);
        return {
          ...patient,
          entries,
        };
      })
    );
    return patientsWithEntries;
  } catch (error) {
    throw new DatabaseError('Failed to fetch patients with entries', {
      originalError: error,
      context: { function: 'getAllPatientsWithEntries' },
    });
  }
};

const getPaginatedPatientsWithEntries = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<PatientEntry[]>> => {
  if (page < 1 || pageSize < 1) {
    throw new ValidationError(
      'Page and pageSize must be positive integers',
      { invalidFields: ['page', 'pageSize'] }
    );
  }

  try {
    const offset = (page - 1) * pageSize;
    const result = await pool.query(
      `
      SELECT id, name, date_of_birth, gender, occupation, ssn
      FROM patients
      WHERE patients.is_deleted = false
      LIMIT $1 OFFSET $2
    `,
      [pageSize, offset]
    );

    const totalResult = (await pool.query(
      'SELECT COUNT(*) FROM patients WHERE patients.is_deleted = false'
    )) as QueryResult<{ count: string }>;
    const totalItems = parseInt(totalResult.rows[0].count, 10);

    const patients = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      dateOfBirth: normalizeEntryDate(row.date_of_birth),
      gender: row.gender,
      occupation: row.occupation,
      ssn: row.ssn,
      entries: [],
    })) as PatientEntry[];

    const patientsWithEntries = await Promise.all(
      patients.map(async (patient) => {
        const entries = await getEntriesByPatientId(patient.id);
        return {
          ...patient,
          entries,
        };
      })
    );

    return {
      data: patientsWithEntries,
      metadata: {
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
        currentPage: page,
        itemsPerPage: pageSize,
      },
    };
  } catch (error) {
    throw new DatabaseError(
      'Failed to fetch paginated patients with entries',
      {
        originalError: error,
        context: {
          function: 'getPaginatedPatientsWithEntries',
          page,
          pageSize,
        },
      }
    );
  }
};

const getPatientById = async (id: string): Promise<PatientEntry> => {
  if (!isUUID(id)) {
    logger.warn(`Invalid patient ID format: ${id}`);
    throw new ValidationError('Invalid patient ID format', { id });
  }

  try {
    const result = (await pool.query(
      'SELECT * FROM patients WHERE id = $1',
      [id]
    )) as QueryResult<PatientEntry>;
    const rowCount = result.rowCount ?? 0;

    if (rowCount === 0) {
      logger.warn(`Patient not found: ${id}`);
      throw new NotFoundError('Patient', id);
    }
    const patient = result.rows[0];

    const entries = await getEntriesByPatientId(id);

    return {
      ...patient,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      dateOfBirth: patient.dateOfBirth,
      entries: entries,
    } as PatientEntry;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error(
      `Error fetching patient ${id}: ${
        error instanceof Error ? error.message : error
      }`
    );
    throw new DatabaseError('Failed to find patient by ID', {
      originalError: error,
      context: { function: 'getPatientById', id },
    });
  }
};

const createPatient = async (
  entry: NewPatientEntryWithoutEntries
): Promise<PatientEntry> => {
  const sanitizedEntry = sanitizeObject(entry);

  validateSafeString(sanitizedEntry.name, 'name');
  validateSafeString(sanitizedEntry.occupation, 'occupation');
  if (sanitizedEntry.ssn) {
    validateSafeString(sanitizedEntry.ssn, 'ssn');
  }

  const requiredFields: Array<keyof NewPatientEntryWithoutEntries> = [
    'name',
    'occupation',
    'gender',
  ];
  const missingFields = requiredFields.filter(
    (field) => !sanitizedEntry[field]
  );

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`,
      {
        error: 'MissingFields',
        details: {
          missingFields,
          constraints: ['required'],
        },
      }
    );
  }

  if (!Object.values(Gender).includes(sanitizedEntry.gender)) {
    throw new ValidationError(
      `Invalid gender: ${sanitizedEntry.gender}`,
      {
        error: 'InvalidGender',
        details: {
          field: 'gender',
          value: sanitizedEntry.gender,
          constraints: Object.values(Gender),
        },
      }
    );
  }

  if (sanitizedEntry.dateOfBirth) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sanitizedEntry.dateOfBirth)) {
      throw new ValidationError(
        'Invalid date format. Use YYYY-MM-DD',
        {
          error: 'InvalidDateFormat',
          details: {
            field: 'dateOfBirth',
            value: sanitizedEntry.dateOfBirth,
            constraints: ['format: YYYY-MM-DD'],
          },
        }
      );
    }

    const date = new Date(sanitizedEntry.dateOfBirth);
    const currentYear = new Date().getFullYear();

    if (isNaN(date.getTime())) {
      throw new ValidationError('Invalid date value', {
        error: 'ValidationError',
        details: {
          field: 'dateOfBirth',
          value: sanitizedEntry.dateOfBirth,
          constraints: ['valid_date'],
        },
      });
    }

    // Semantic checks
    if (date > new Date()) {
      throw new ValidationError('Date cannot be in the future', {
        error: 'ValidationError',
        details: {
          field: 'dateOfBirth',
          value: sanitizedEntry.dateOfBirth,
          constraints: ['past_date'],
        },
      });
    }

    if (
      date.getFullYear() < 1900 ||
      date.getFullYear() > currentYear
    ) {
      throw new ValidationError(
        `Year must be between 1900 and ${currentYear}`,
        {
          error: 'ValidationError',
          details: {
            field: 'dateOfBirth',
            value: sanitizedEntry.dateOfBirth,
            constraints: [`year_range:1900-${currentYear}`],
          },
        }
      );
    }

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const lastDayOfMonth = new Date(year, month, 0).getDate();

    if (day > lastDayOfMonth) {
      throw new ValidationError(
        `Invalid date: ${month} has only ${lastDayOfMonth} days`,
        {
          error: 'ValidationError',
          details: {
            field: 'dateOfBirth',
            value: sanitizedEntry.dateOfBirth,
            constraints: ['valid_calendar_date'],
          },
        }
      );
    }
  }

  if (sanitizedEntry.ssn) {
    const existing = await pool.query(
      'SELECT id FROM patients WHERE ssn = $1',
      [sanitizedEntry.ssn]
    );
    if (existing.rows.length > 0) {
      throw new ValidationError(
        'Social security number already exists in system',
        {
          error: 'DuplicateSSN',
          userMessage:
            'This social security number is already registered',
          details: {
            field: 'ssn',
            value: sanitizedEntry.ssn,
            constraints: ['unique'],
          },
        }
      );
    }
  }

  const id: string = uuid();
  let resultPatient: PatientEntry | null = null;
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = (await client.query(
        `
        INSERT INTO patients (id, name, occupation, gender, ssn, date_of_birth)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
        [
          id,
          sanitizedEntry.name,
          sanitizedEntry.occupation,
          sanitizedEntry.gender,
          sanitizedEntry.ssn,
          normalizeEntryDate(sanitizedEntry.dateOfBirth),
        ]
      )) as QueryResult<PatientEntry>;

      await client.query('COMMIT');
      const patient = result.rows[0];
      resultPatient = {
        ...patient,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
        dateOfBirth: patient.dateOfBirth,
        entries: [],
      } as PatientEntry;
      break;
    } catch (error: any) {
      await client.query('ROLLBACK');

      // Classify transaction failures
      if (error.code === '40001' || error.code === '40P01') {
        // Serialization failure or deadlock
        if (retries < maxRetries) {
          retries++;
          const delay = Math.pow(2, retries) * 100;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        } else {
          throw new TransactionError(
            'Transaction failed after maximum retries',
            {
              originalError: error,
              context: {
                function: 'createPatient',
                entry: sanitizedEntry,
                retries,
              },
            }
          );
        }
      } else if (error.code === '23505') {
        throw new ValidationError(
          'Social security number conflict during transaction',
          {
            error: 'DuplicateSSN',
            details: {
              field: 'ssn',
              value: sanitizedEntry.ssn,
              constraints: ['unique'],
              context: 'transaction',
            },
          }
        );
      } else {
        throw new DatabaseError('Failed to add patient', {
          originalError: error,
          context: {
            function: 'createPatient',
            entry: sanitizedEntry,
          },
        });
      }
    } finally {
      client.release();
    }
  }

  if (!resultPatient) {
    throw new DatabaseError('Failed to add patient after retries', {
      context: { function: 'createPatient', entry: sanitizedEntry },
    });
  }

  return resultPatient;
};

const editPatient = async (
  id: string,
  updateData: Partial<NewPatientEntryWithoutEntries>
): Promise<PatientEntry> => {
  const sanitizedUpdate = sanitizeObject(updateData);

  if (sanitizedUpdate.dateOfBirth) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sanitizedUpdate.dateOfBirth)) {
      throw new ValidationError(
        'Invalid date format. Use YYYY-MM-DD',
        {
          error: 'ValidationError',
          details: {
            field: 'dateOfBirth',
            value: sanitizedUpdate.dateOfBirth,
            constraints: ['format'],
          },
        }
      );
    }
  }

  try {
    const existingResult = await pool.query(
      'SELECT * FROM patients WHERE id = $1',
      [id]
    );
    if (existingResult.rowCount === 0) {
      throw new NotFoundError('Patient', id);
    }
    const existingPatient = existingResult.rows[0] as any;

    const updatedFields = {
      name: sanitizedUpdate.name ?? existingPatient.name,
      occupation:
        sanitizedUpdate.occupation ?? existingPatient.occupation,
      gender: sanitizedUpdate.gender ?? existingPatient.gender,
      ssn: sanitizedUpdate.ssn ?? existingPatient.ssn,
      date_of_birth:
        sanitizedUpdate.dateOfBirth ?? existingPatient.date_of_birth,
      updated_at: new Date().toISOString(),
    };

    const result = await pool.query(
      `
      UPDATE patients
      SET
        name = $1,
        occupation = $2,
        gender = $3,
        ssn = $4,
        date_of_birth = $5,
        updated_at = $6
      WHERE id = $7
      RETURNING *
    `,
      [
        updatedFields.name,
        updatedFields.occupation,
        updatedFields.gender,
        updatedFields.ssn,
        updatedFields.date_of_birth,
        updatedFields.updated_at,
        id,
      ]
    );

    const row = result.rows[0];
    const entries = await getEntriesByPatientId(id);

    return {
      id: row.id,
      name: row.name,
      dateOfBirth: normalizeEntryDate(row.date_of_birth),
      gender: row.gender,
      occupation: row.occupation,
      ssn: row.ssn,
      entries: entries,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } as PatientEntry;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to edit patient', {
      originalError: error,
      context: {
        function: 'editPatient',
        id,
        updateData: sanitizedUpdate,
      },
    });
  }
};

const deletePatient = async (
  id: string,
  deletedBy: string,
  reason?: string
): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateQuery = `
      UPDATE patients
      SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = $2
      WHERE id = $1 AND is_deleted = FALSE
      RETURNING *;
    `;
    const updateResult = await client.query(updateQuery, [
      id,
      deletedBy,
    ]);

    if (updateResult.rowCount === 0) {
      const existsQuery = `SELECT id FROM patients WHERE id = $1`;
      const existsResult = await client.query(existsQuery, [id]);

      if (existsResult.rowCount === 0) {
        throw new NotFoundError('Patient', id);
      }
      // Patient exists but is already deleted - idempotent case
      await client.query('COMMIT');
      return;
    }

    const auditQuery = `
      INSERT INTO patient_deletion_audit (patient_id, deleted_by, reason)
      VALUES ($1, $2, $3)
    `;
    await client.query(auditQuery, [id, deletedBy, reason || null]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof NotFoundError) {
      if (error?.name === 'NotFoundError') {
        throw error;
      }
    }
    throw new DatabaseError('Failed to soft delete patient', {
      originalError:
        error instanceof Error ? error : new Error(String(error)),
      context: { function: 'deletePatient', id },
    });
  } finally {
    client.release();
  }
};

const restorePatient = async (id: string): Promise<PatientEntry> => {
  try {
    const result = await pool.query(
      `UPDATE patients
       SET is_deleted = false, deleted_at = NULL
       WHERE id = $1 AND is_deleted = true
       RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Soft-deleted patient', id);
    }

    return result.rows[0] as PatientEntry;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to restore patient', {
      originalError: error,
      context: { function: 'restorePatient', id },
    });
  }
};

const validateEntry = (entry: NewEntryWithoutId): void => {
  const sanitizedEntry = sanitizeObject(entry);

  validateSafeString(sanitizedEntry.description, 'description');
  validateSafeString(sanitizedEntry.specialist, 'specialist');

  if (
    sanitizedEntry.type === 'Hospital' &&
    sanitizedEntry.discharge
  ) {
    validateSafeString(
      sanitizedEntry.discharge.criteria,
      'discharge.criteria'
    );
  }

  if (sanitizedEntry.type === 'OccupationalHealthcare') {
    validateSafeString(sanitizedEntry.employerName, 'employerName');
  }

  const baseFields: Array<keyof BaseEntry> = [
    'description',
    'date',
    'specialist',
  ];
  const missingBaseFields = baseFields.filter(
    (field) => !sanitizedEntry[field as keyof NewEntryWithoutId]
  );

  if (missingBaseFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingBaseFields.join(', ')}`,
      {
        error: 'MissingFields',
        details: {
          missingFields: missingBaseFields,
          constraints: ['required'],
        },
      }
    );
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(sanitizedEntry.date)) {
    throw new ValidationError('Invalid date format: YYYY-MM-DD', {
      error: 'InvalidDateFormat',
      details: {
        field: 'date',
        value: sanitizedEntry.date,
        constraints: ['format'],
      },
    });
  }

  if (sanitizedEntry.diagnosisCodes) {
    const invalidCodes = sanitizedEntry.diagnosisCodes.filter(
      (code) => !/^[A-Z0-9]{3,}(?:\.[0-9]+)?$/.test(code)
    );
    if (invalidCodes.length > 0) {
      throw new ValidationError(
        `Invalid diagnosis code format: ${invalidCodes.join(
          ', '
        )}. Must be at least 3 alphanumeric characters.`,
        {
          error: 'InvalidDiagnosisCode',
          details: {
            invalidCodes,
            constraints: ['format'],
          },
        }
      );
    }
  }

  if (
    !['Hospital', 'OccupationalHealthcare', 'HealthCheck'].includes(
      sanitizedEntry.type
    )
  ) {
    throw new ValidationError(
      `Invalid entry type: ${sanitizedEntry.type}`,
      {
        error: 'InvalidEntryType',
        details: {
          field: 'type',
          value: sanitizedEntry.type,
          constraints: ['enum'],
        },
      }
    );
  }

  if (sanitizedEntry.type === 'HealthCheck') {
    if (sanitizedEntry.healthCheckRating === undefined) {
      throw new ValidationError(
        'Missing healthCheckRating for HealthCheck entry',
        {
          error: 'MissingHealthCheckRating',
          details: {
            field: 'healthCheckRating',
            constraints: ['required'],
          },
        }
      );
    }
    if (
      sanitizedEntry.healthCheckRating < HealthCheckRating.Healthy ||
      sanitizedEntry.healthCheckRating >
        HealthCheckRating.CriticalRisk
    ) {
      throw new ValidationError(
        'Invalid healthCheckRating: must be 0-3',
        {
          error: 'InvalidHealthCheckRating',
          details: {
            field: 'healthCheckRating',
            value: sanitizedEntry.healthCheckRating,
            constraints: ['range:0-3'],
          },
        }
      );
    }
  }

  if (
    sanitizedEntry.type === 'Hospital' &&
    (!sanitizedEntry.discharge ||
      !sanitizedEntry.discharge.date ||
      !sanitizedEntry.discharge.criteria)
  ) {
    throw new ValidationError(
      'Missing required fields for Hospital entry: discharge.date and discharge.criteria',
      {
        error: 'MissingDischargeFields',
        details: {
          missingFields: ['discharge.date', 'discharge.criteria'],
          constraints: ['required'],
        },
      }
    );
  }

  if (
    sanitizedEntry.type === 'OccupationalHealthcare' &&
    !sanitizedEntry.employerName
  ) {
    throw new ValidationError(
      'Missing required field for OccupationalHealthcare entry: employerName',
      {
        error: 'MissingEmployerName',
        details: {
          field: 'employerName',
          constraints: ['required'],
        },
      }
    );
  }
};

const addEntry = async (
  patient: PatientEntry,
  entry: NewEntryWithoutId
): Promise<Entry> => {
  validateEntry(entry);

  try {
    const patientResult = await pool.query(
      'SELECT id FROM patients WHERE id = $1',
      [patient.id]
    );
    if (patientResult.rowCount === 0) {
      throw new NotFoundError('Patient', patient.id);
    }

    const id: string = uuid();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      (await client.query(
        `
        INSERT INTO entries (id, patient_id, description, date, specialist, type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
        [
          id,
          patient.id,
          entry.description,
          entry.date,
          entry.specialist,
          entry.type,
        ]
      )) as QueryResult<Entry>;

      if (entry.diagnosisCodes) {
        for (const code of entry.diagnosisCodes) {
          await client.query(
            'INSERT INTO entry_diagnoses (entry_id, diagnosis_code) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, code]
          );
        }
      }

      if (entry.type === 'HealthCheck') {
        await client.query(
          'INSERT INTO healthcheck_entries (entry_id, health_check_rating) VALUES ($1, $2)',
          [id, entry.healthCheckRating]
        );
      } else if (entry.type === 'Hospital') {
        await client.query(
          'INSERT INTO hospital_entries (entry_id, discharge_date, discharge_criteria) VALUES ($1, $2, $3)',
          [id, entry.discharge.date, entry.discharge.criteria]
        );
      } else if (entry.type === 'OccupationalHealthcare') {
        await client.query(
          'INSERT INTO occupational_healthcare_entries (entry_id, employer_name, sick_leave_start_date, sick_leave_end_date) VALUES ($1, $2, $3, $4)',
          [
            id,
            entry.employerName,
            entry.sickLeave?.startDate,
            entry.sickLeave?.endDate,
          ]
        );
      }

      await client.query('COMMIT');
      try {
        const viewExists = (
          await pool.query<{ exists: boolean }>(
            `SELECT EXISTS(
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relkind = 'm'
            AND n.nspname = 'public'
            AND c.relname = 'patient_health_ratings'
          )`
          )
        ).rows[0].exists;
        if (viewExists) {
          await pool.query(
            'REFRESH MATERIALIZED VIEW patient_health_ratings'
          );
        } else {
          logger.warn(
            'Materialized view patient_health_ratings does not exist'
          );
        }
      } catch (error) {
        logger.error('Failed to refresh materialized view:', error);
      }

      const createdEntry = {
        id,
        ...entry,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Entry;

      await EntryVersionService.createVersion(
        id,
        'system',
        'Entry created',
        createdEntry,
        'CREATE'
      );

      switch (entry.type) {
        case 'HealthCheck':
          return {
            ...createdEntry,
            healthCheckRating: entry.healthCheckRating,
            diagnosisCodes: entry.diagnosisCodes || [],
          } as HealthCheckEntry;
        case 'Hospital':
          return {
            ...createdEntry,
            discharge: entry.discharge,
            diagnosisCodes: entry.diagnosisCodes || [],
          } as HospitalEntry;
        case 'OccupationalHealthcare':
          return {
            ...createdEntry,
            employerName: entry.employerName,
            sickLeave: entry.sickLeave,
            diagnosisCodes: entry.diagnosisCodes || [],
          } as OccupationalHealthcareEntry;
        default:
          return createdEntry;
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error instanceof ValidationError
    ) {
      throw error;
    }
    throw new DatabaseError('Failed to add entry', {
      originalError: error,
      context: { function: 'addEntry', patientId: patient.id, entry },
    });
  }
};

const updateEntry = async (
  patientId: string,
  entryId: string,
  updateData: NewEntryWithoutId & {
    changeReason?: string;
    lastUpdated?: string;
  },
  editorId: string = 'system'
): Promise<AnyEntry> => {
  const {
    changeReason = 'Entry updated',
    lastUpdated,
    ...entryData
  } = updateData;

  validateEntry(entryData);

  logger.info(
    `Updating entry ${entryId} for patient ${patientId} by editor ${editorId}`
  );

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await EntryVersionService.createVersion(
      entryId,
      editorId,
      changeReason || 'Entry updated'
    );

    const currentEntryResult = await client.query(
      `SELECT * FROM entries WHERE id = $1 AND patient_id = $2`,
      [entryId, patientId]
    );

    if (currentEntryResult.rowCount === 0) {
      throw new NotFoundError('Entry', entryId);
    }

    const existingEntry = currentEntryResult.rows[0];

    if (existingEntry.type !== entryData.type) {
      throw new ValidationError(
        'Cannot change entry type during update',
        { invalidOperation: 'typeChange' }
      );
    }

    await client.query(
      `UPDATE entries
       SET
         description = $1,
         date = $2,
         specialist = $3,
         updated_at = NOW()
       WHERE id = $4`,
      [
        entryData.description,
        entryData.date,
        entryData.specialist,
        entryId,
      ]
    );

    await client.query(
      'DELETE FROM entry_diagnoses WHERE entry_id = $1',
      [entryId]
    );

    if (entryData.diagnosisCodes) {
      for (const code of entryData.diagnosisCodes) {
        await client.query(
          'INSERT INTO entry_diagnoses (entry_id, diagnosis_code) VALUES ($1, $2)',
          [entryId, code]
        );
      }
    }

    if (entryData.type === 'HealthCheck') {
      await client.query(
        `UPDATE healthcheck_entries
         SET health_check_rating = $1
         WHERE entry_id = $2`,
        [entryData.healthCheckRating, entryId]
      );
    } else if (entryData.type === 'Hospital') {
      await client.query(
        `UPDATE hospital_entries
         SET
           discharge_date = $1,
           discharge_criteria = $2
         WHERE entry_id = $3`,
        [
          entryData.discharge.date,
          entryData.discharge.criteria,
          entryId,
        ]
      );
    } else if (entryData.type === 'OccupationalHealthcare') {
      await client.query(
        `UPDATE occupational_healthcare_entries
         SET
           employer_name = $1,
           sick_leave_start_date = $2,
           sick_leave_end_date = $3
         WHERE entry_id = $4`,
        [
          entryData.employerName,
          entryData.sickLeave?.startDate,
          entryData.sickLeave?.endDate,
          entryId,
        ]
      );
    }

    await client.query('COMMIT');
    await pool.query(
      'REFRESH MATERIALIZED VIEW patient_health_ratings'
    );

    return await getEntryById(entryId);
  } catch (error) {
    await client.query('ROLLBACK');
    if (
      error instanceof NotFoundError ||
      error instanceof ValidationError
    ) {
      throw error;
    }
    throw new DatabaseError(
      `Failed to update entry: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      {
        originalError: error,
        context: {
          function: 'updateEntry',
          patientId,
          entryId,
          updateData,
        },
      }
    );
  } finally {
    client.release();
  }
};

const getEntriesByPatientId = async (
  patientId: string
): Promise<Entry[]> => {
  try {
    const healthCheckQuery = `
      SELECT
        e.id, e.description, e.date, e.specialist, e.type,
        he.health_check_rating,
        ARRAY_AGG(d.code) AS diagnosis_codes
      FROM entries e
      LEFT JOIN healthcheck_entries he ON e.id = he.entry_id
      LEFT JOIN entry_diagnoses ed ON e.id = ed.entry_id
      LEFT JOIN diagnoses d ON ed.diagnosis_code = d.code
      WHERE e.patient_id = $1 AND e.type = 'HealthCheck'
      GROUP BY e.id, he.health_check_rating
    `;

    const hospitalQuery = `
      SELECT
        e.id, e.description, e.date, e.specialist, e.type,
        h.discharge_date, h.discharge_criteria,
        ARRAY_AGG(d.code) AS diagnosis_codes
      FROM entries e
      LEFT JOIN hospital_entries h ON e.id = h.entry_id
      LEFT JOIN entry_diagnoses ed ON e.id = ed.entry_id
      LEFT JOIN diagnoses d ON ed.diagnosis_code = d.code
      WHERE e.patient_id = $1 AND e.type = 'Hospital'
      GROUP BY e.id, h.discharge_date, h.discharge_criteria
    `;

    const occupationalQuery = `
      SELECT
        e.id, e.description, e.date, e.specialist, e.type,
        oh.employer_name, oh.sick_leave_start_date, oh.sick_leave_end_date,
        ARRAY_AGG(d.code) AS diagnosis_codes
      FROM entries e
      LEFT JOIN occupational_healthcare_entries oh ON e.id = oh.entry_id
      LEFT JOIN entry_diagnoses ed ON e.id = ed.entry_id
      LEFT JOIN diagnoses d ON ed.diagnosis_code = d.code
      WHERE e.patient_id = $1 AND e.type = 'OccupationalHealthcare'
      GROUP BY e.id, oh.employer_name, oh.sick_leave_start_date, oh.sick_leave_end_date
    `;

    const [healthCheckResult, hospitalResult, occupationalResult] =
      await Promise.all([
        pool.query(healthCheckQuery, [patientId]),
        pool.query(hospitalQuery, [patientId]),
        pool.query(occupationalQuery, [patientId]),
      ]);

    const allRows = [
      ...healthCheckResult.rows,
      ...hospitalResult.rows,
      ...occupationalResult.rows,
    ];

    return allRows
      .map((row) => {
        switch (row.type) {
          case 'HealthCheck':
            return mapToHealthCheckEntry(row);
          case 'Hospital':
            return mapToHospitalEntry(row);
          case 'OccupationalHealthcare':
            return mapToOccupationalHealthcareEntry(row);
          default:
            throw new Error(`Unknown entry type: ${row.type}`);
        }
      })
      .map((entry) => ({
        ...entry,
        createdAt: entry.createdAt || new Date().toISOString(),
        updatedAt: entry.updatedAt || new Date().toISOString(),
      }));
  } catch (error) {
    throw new DatabaseError('Failed to fetch entries by patient ID', {
      originalError: error,
      context: { function: 'getEntriesByPatientId', patientId },
    });
  }
};

const deleteEntry = async (
  patientId: string,
  entryId: string
): Promise<void> => {
  logger.info(`Deleting entry ${entryId} for patient ${patientId}`);

  const entry = await getEntryById(entryId);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await EntryVersionService.createVersion(
      entryId,
      'system', // or pass actual editorId if available
      'Entry deleted',
      entry,
      'DELETE'
    );

    const patientCheck = await client.query(
      'SELECT id FROM patients WHERE id = $1',
      [patientId]
    );

    if (patientCheck.rowCount === 0) {
      logger.warn(`Patient not found: ${patientId}`);
      throw new NotFoundError('Patient', patientId);
    }

    const entryCheck = await client.query(
      'SELECT id FROM entries WHERE id = $1 AND patient_id = $2',
      [entryId, patientId]
    );

    if (entryCheck.rowCount === 0) {
      logger.warn(
        `Entry not found: ${entryId} for patient ${patientId}`
      );
      throw new NotFoundError('Entry', entryId);
    }

    await client.query(
      'DELETE FROM healthcheck_entries WHERE entry_id = $1',
      [entryId]
    );
    await client.query(
      'DELETE FROM hospital_entries WHERE entry_id = $1',
      [entryId]
    );
    await client.query(
      'DELETE FROM occupational_healthcare_entries WHERE entry_id = $1',
      [entryId]
    );

    await client.query(
      'DELETE FROM entry_diagnoses WHERE entry_id = $1',
      [entryId]
    );

    const result = await client.query(
      'DELETE FROM entries WHERE id = $1 AND patient_id = $2',
      [entryId, patientId]
    );

    if (result.rowCount === 0) {
      logger.error(
        `Failed to delete entry ${entryId} for patient ${patientId}`
      );
      throw new NotFoundError('Entry', entryId);
    }

    await client.query('COMMIT');
    await pool.query(
      'REFRESH MATERIALIZED VIEW patient_health_ratings'
    );
    logger.info(
      `Successfully deleted entry ${entryId} for patient ${patientId}`
    );
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError(
      `Failed to delete entry: ${
        error instanceof Error ? error.message : 'Unknown error'
      }. Check foreign key constraints, database connection, and ensure the entry exists.`,
      {
        originalError: error,
        context: {
          function: 'deleteEntry',
          patientId,
          entryId,
        },
      }
    );
  } finally {
    client.release();
  }
};

const getPatientsSortedByHealthRating = async (): Promise<
  PatientEntry[]
> => {
  try {
    const result = (await pool.query(`
      SELECT patients.*, COALESCE(patient_health_ratings.health_rating, -1) AS health_rating
      FROM patients
      LEFT JOIN patient_health_ratings ON patients.id = patient_health_ratings.patient_id
      WHERE patients.is_deleted = false
      ORDER BY health_rating DESC NULLS LAST
    `)) as QueryResult<{
      id: string;
      name: string;
      date_of_birth: string;
      gender: string;
      occupation: string;
      health_rating: number | null;
    }>;

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      dateOfBirth: normalizeEntryDate(row.date_of_birth),
      gender: row.gender as Gender,
      occupation: row.occupation,
      ssn: '',
      entries: [],
      healthRating:
        row.health_rating === -1 ? null : row.health_rating,
    }));
  } catch (error) {
    throw new DatabaseError(
      'Failed to fetch patients sorted by health rating',
      {
        originalError: error,
        context: { function: 'getPatientsSortedByHealthRating' },
      }
    );
  }
};

const getFilteredAndPaginatedPatients = async (
  page: number = 1,
  pageSize: number = 10,
  filters: Record<string, any> = {},
  sortModel: { field: string; direction: string } | null = null,
  searchText?: string
): Promise<PaginatedResponse<NonSensitivePatientEntry[]>> => {
  if (page < 1 || pageSize < 1) {
    throw new ValidationError(
      'Page and pageSize must be positive integers',
      { invalidFields: ['page', 'pageSize'] }
    );
  }

  try {
    const { whereClause, params: filterParams } = buildWhereClause(
      Object.fromEntries(
        Object.entries(filters).filter(([key]) =>
          ['name', 'occupation', 'gender'].includes(key)
        )
      ),
      searchText,
      true
    );

    const explicitFilterCount = Object.keys(filters).length;
    const totalFilters = explicitFilterCount + (searchText ? 1 : 0);

    if (totalFilters > 3) {
      const errorDetails = {
        invalidFields: Object.keys(filters),
        filterCount: totalFilters,
        maxAllowed: 3,
      };
      logger.error('Filter validation failed', errorDetails);
      throw new ValidationError(
        'Maximum of 3 search parameters allowed (name, gender, occupation)',
        {
          error: 'ValidationError',
          details: {
            ...errorDetails,
            constraints: ['max_search_params:3'],
          },
        }
      );
    }

    let orderByClause = 'ORDER BY name ASC';
    if (sortModel) {
      const validFields = [
        'name',
        'gender',
        'occupation',
        'health_rating',
      ];
      if (validFields.includes(sortModel.field)) {
        orderByClause = `ORDER BY ${
          sortModel.field
        } ${sortModel.direction.toUpperCase()}`;
        if (sortModel.field === 'health_rating') {
          orderByClause += ' NULLS LAST';
        }
      }
    }

    // Main query with fixed parameter indexing
    const query = `
      SELECT patients.*, COALESCE(patient_health_ratings.health_rating, -1) AS health_rating
      FROM patients
      LEFT JOIN patient_health_ratings ON patients.id = patient_health_ratings.patient_id
      ${whereClause}
      ${orderByClause}
      LIMIT $${filterParams.length + 1}::integer
      OFFSET $${filterParams.length + 2}::integer
    `;

    const finalParams = [
      ...filterParams,
      pageSize,
      (page - 1) * pageSize,
    ];

    const result = (await pool.query(
      query,
      finalParams
    )) as QueryResult<{
      id: string;
      name: string;
      date_of_birth: string;
      gender: Gender;
      occupation: string;
      health_rating: number | null;
    }>;

    const countQuery = `
      SELECT COUNT(*)
      FROM patients
      LEFT JOIN patient_health_ratings ON patients.id = patient_health_ratings.patient_id
      ${whereClause}
    `;

    const totalResult = (await pool.query(
      countQuery,
      filterParams
    )) as QueryResult<{ count: string }>;
    const totalItems = parseInt(totalResult.rows[0].count, 10);

    const entries = result.rows.map(
      (row: {
        id: string;
        name: string;
        date_of_birth: string;
        gender: Gender;
        occupation: string;
        health_rating: number | null;
      }) => ({
        id: row.id,
        name: row.name,
        dateOfBirth: normalizeEntryDate(row.date_of_birth),
        gender: row.gender,
        occupation: row.occupation,
        healthRating:
          row.health_rating === -1 ? null : row.health_rating,
      })
    );

    return {
      data: entries as NonSensitivePatientEntry[],
      metadata: {
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
        currentPage: page,
        itemsPerPage: pageSize,
      },
    };
  } catch (error) {
    throw new DatabaseError(
      'Failed to fetch filtered and paginated patients',
      {
        originalError: error,
        context: {
          function: 'getFilteredAndPaginatedPatients',
          page,
          pageSize,
          filters,
          sortModel,
          searchText,
        },
      }
    );
  }
};

const getEntryById = async (entryId: string): Promise<AnyEntry> => {
  try {
    const entryResult = await pool.query(
      `SELECT * FROM entries WHERE id = $1`,
      [entryId]
    );

    if (entryResult.rowCount === 0) {
      throw new NotFoundError('Entry', entryId);
    }

    const entry = entryResult.rows[0];
    let fullEntry: AnyEntry;

    if (entry.type === 'HealthCheck') {
      const healthCheckResult = await pool.query(
        `SELECT * FROM healthcheck_entries WHERE entry_id = $1`,
        [entryId]
      );
      fullEntry = {
        ...entry,
        healthCheckRating:
          healthCheckResult.rows[0]?.health_check_rating,
      } as HealthCheckEntry;
    } else if (entry.type === 'Hospital') {
      const hospitalResult = await pool.query(
        `SELECT * FROM hospital_entries WHERE entry_id = $1`,
        [entryId]
      );
      fullEntry = {
        ...entry,
        discharge: {
          date: hospitalResult.rows[0]?.discharge_date,
          criteria: hospitalResult.rows[0]?.discharge_criteria,
        },
      } as HospitalEntry;
    } else {
      const occupationalResult = await pool.query(
        `SELECT * FROM occupational_healthcare_entries WHERE entry_id = $1`,
        [entryId]
      );
      fullEntry = {
        ...entry,
        employerName: occupationalResult.rows[0]?.employer_name,
        sickLeave:
          occupationalResult.rows[0]?.sick_leave_start_date &&
          occupationalResult.rows[0]?.sick_leave_end_date
            ? {
                startDate:
                  occupationalResult.rows[0]?.sick_leave_start_date,
                endDate:
                  occupationalResult.rows[0]?.sick_leave_end_date,
              }
            : undefined,
      } as OccupationalHealthcareEntry;
    }

    const codesResult = await pool.query(
      `SELECT diagnosis_code FROM entry_diagnoses WHERE entry_id = $1`,
      [entryId]
    );
    fullEntry.diagnosisCodes = codesResult.rows.map(
      (row) => row.diagnosis_code
    );

    return fullEntry;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to fetch entry by ID', {
      originalError: error,
      context: { function: 'getEntryById', entryId },
    });
  }
};

const getEntryVersions = async (
  entryId: string
): Promise<EntryVersion[]> => {
  try {
    const result = await pool.query(
      `SELECT * FROM entry_versions WHERE entry_id = $1 ORDER BY created_at DESC`,
      [entryId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      entryId: row.entry_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      editorId: row.editor_id,
      changeReason: row.change_reason,
      entryData: row.entry_data,
    }));
  } catch (error) {
    throw new DatabaseError('Failed to fetch entry versions', {
      originalError: error,
      context: { function: 'getEntryVersions', entryId },
    });
  }
};

const restoreEntryVersion = async (
  versionId: string,
  editorId: string,
  lastUpdated?: string
): Promise<AnyEntry> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const versionResult = await client.query(
      `SELECT * FROM entry_versions WHERE id = $1`,
      [versionId]
    );

    if (lastUpdated) {
      const entryId = versionResult.rows[0]?.entry_id;
      if (entryId) {
        const isStale = await EntryVersionService.checkConcurrency(
          entryId,
          lastUpdated
        );
        if (isStale) {
          throw new ConcurrencyError(
            'Entry has been modified since last retrieval',
            {
              error: 'ConcurrencyConflict',
              details: { entryId, lastUpdated },
            }
          );
        }
      }
    }

    if (versionResult.rowCount === 0) {
      throw new NotFoundError('Entry version', versionId);
    }

    const version = versionResult.rows[0];
    const entryId = version.entry_id;

    const currentEntryResult = await client.query(
      `SELECT * FROM entries WHERE id = $1`,
      [entryId]
    );

    if (currentEntryResult.rowCount === 0) {
      throw new NotFoundError('Entry', entryId);
    }

    const currentEntry = currentEntryResult.rows[0];

    await EntryVersionService.createVersion(
      entryId,
      editorId,
      'Version restored from snapshot'
    );

    await client.query(
      `UPDATE entries SET
        description = $1,
        date = $2,
        specialist = $3,
        updated_at = $4
      WHERE id = $5`,
      [
        version.entry_data.description,
        version.entry_data.date,
        version.entry_data.specialist,
        new Date().toISOString(),
        entryId,
      ]
    );

    if (version.entry_data.type === 'HealthCheck') {
      await client.query(
        `UPDATE healthcheck_entries SET
          health_check_rating = $1
        WHERE entry_id = $2`,
        [version.entry_data.healthCheckRating, entryId]
      );
    } else if (version.entry_data.type === 'Hospital') {
      await client.query(
        `UPDATE hospital_entries SET
          discharge_date = $1,
          discharge_criteria = $2
        WHERE entry_id = $3`,
        [
          version.entry_data.discharge.date,
          version.entry_data.discharge.criteria,
          entryId,
        ]
      );
    } else if (version.entry_data.type === 'OccupationalHealthcare') {
      await client.query(
        `UPDATE occupational_healthcare_entries SET
          employer_name = $1,
          sick_leave_start_date = $2,
          sick_leave_end_date = $3
        WHERE entry_id = $4`,
        [
          version.entry_data.employerName,
          version.entry_data.sickLeave?.startDate,
          version.entry_data.sickLeave?.endDate,
          entryId,
        ]
      );
    }

    await client.query(
      'DELETE FROM entry_diagnoses WHERE entry_id = $1',
      [entryId]
    );

    if (version.entry_data.diagnosisCodes?.length > 0) {
      for (const code of version.entry_data.diagnosisCodes) {
        await client.query(
          'INSERT INTO entry_diagnoses (entry_id, diagnosis_code) VALUES ($1, $2)',
          [entryId, code]
        );
      }
    }

    await client.query('COMMIT');
    await pool.query(
      'REFRESH MATERIALIZED VIEW patient_health_ratings'
    );

    return {
      ...version.entry_data,
      id: entryId,
      createdAt: currentEntry.created_at,
      updatedAt: new Date().toISOString(),
      diagnosisCodes: version.entry_data.diagnosisCodes || [],
    } as AnyEntry;
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to restore entry version', {
      originalError: error,
      context: {
        function: 'restoreEntryVersion',
        versionId,
        editorId,
      },
    });
  } finally {
    client.release();
  }
};

const getEntryVersion = async (
  versionId: string
): Promise<EntryVersion> => {
  try {
    const result = await pool.query(
      `SELECT * FROM entry_versions WHERE id = $1`,
      [versionId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Entry version', versionId);
    }

    const row = result.rows[0];
    return {
      id: row.id,
      entryId: row.entry_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      editorId: row.editor_id,
      changeReason: row.change_reason,
      entryData: row.entry_data,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to fetch entry version', {
      originalError: error,
      context: { function: 'getEntryVersion', versionId },
    });
  }
};

export const patientService = {
  getPatientEntries,
  getNonSensitiveEntries,
  getAllNonSensitiveEntries,
  getPaginatedNonSensitiveEntries,
  getAllPatientsWithEntries,
  getPaginatedPatientsWithEntries,
  addEntry,
  getPatientById,
  getEntriesByPatientId,
  createPatient,
  editPatient,
  deletePatient,
  restorePatient,
  updateEntry,
  deleteEntry,
  getPatientsSortedByHealthRating,
  getFilteredAndPaginatedPatients,
  getEntryVersions,
  getEntryVersion,
  restoreEntryVersion,
  getEntryById,
};
