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
} from '../utils/errors';
import logger from '../utils/logger';
import { sanitizeObject } from '../utils/sanitize';
import { QueryResult } from 'pg';
import formatToISODate from '../utils/dateFormatter';

const mapToHealthCheckEntry = (row: any): HealthCheckEntry => {
  return {
    id: row.id,
    description: row.description,
    date: formatToISODate(row.date),
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
    date: formatToISODate(row.date),
    specialist: row.specialist,
    type: 'Hospital',
    discharge: {
      date: formatToISODate(row.discharge_date),
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
    date: formatToISODate(row.date),
    specialist: row.specialist,
    type: 'OccupationalHealthcare',
    employerName: row.employer_name as string,
    sickLeave:
      row.sick_leave_start_date && row.sick_leave_end_date
        ? {
            startDate: formatToISODate(row.sick_leave_start_date),
            endDate: formatToISODate(row.sick_leave_end_date),
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
    throw new DatabaseError('Failed to fetch patient entries', error);
  }
};

// Get non-sensitive patient entries (for public API)
const getNonSensitiveEntries = async (): Promise<
  NonSensitivePatientEntry[]
> => {
  try {
    const result = (await pool.query(`
      SELECT id, name, date_of_birth, gender, occupation, created_at, updated_at
      FROM patients
    `)) as QueryResult<{
      id: string;
      name: string;
      date_of_birth: string;
      gender: string;
      occupation: string;
      created_at: string;
      updated_at: string;
    }>;

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      dateOfBirth: row.date_of_birth,
      gender: row.gender as Gender,
      occupation: row.occupation,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    throw new DatabaseError(
      'Failed to fetch non-sensitive patient entries',
      error
    );
  }
};

// Get all non-sensitive patient entries (non-paginated)
const getAllNonSensitiveEntries = async (): Promise<
  NonSensitivePatientEntry[]
> => {
  return getNonSensitiveEntries();
};

// Get paginated non-sensitive patient entries
const getPaginatedNonSensitiveEntries = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<NonSensitivePatientEntry[]>> => {
  if (page < 1 || pageSize < 1) {
    throw new ValidationError(
      'Page and pageSize must be positive integers',
      { invalidFields: ['page', 'pageSize'] }
    );
  }

  try {
    const offset = (page - 1) * pageSize;
    const result = (await pool.query(
      `
      SELECT id, name, date_of_birth, gender, occupation
      FROM patients
      LIMIT $1 OFFSET $2
    `,
      [pageSize, offset]
    )) as QueryResult<{
      id: string;
      name: string;
      date_of_birth: string;
      gender: string;
      occupation: string;
    }>;

    const totalResult = (await pool.query(
      'SELECT COUNT(*) FROM patients'
    )) as QueryResult<{ count: string }>;
    const totalItems = parseInt(totalResult.rows[0].count, 10);

    const entries = result.rows.map(
      (row: {
        id: string;
        name: string;
        date_of_birth: string;
        gender: string;
        occupation: string;
      }) => ({
        id: row.id,
        name: row.name,
        dateOfBirth: row.date_of_birth,
        gender: row.gender,
        occupation: row.occupation,
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
      error
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
    throw new DatabaseError('Failed to find patient by ID', error);
  }
};

const createPatient = async (
  entry: NewPatientEntryWithoutEntries
): Promise<PatientEntry> => {
  const sanitizedEntry = sanitizeObject(entry);

  // Validate required fields
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
      { missingFields }
    );
  }

  if (sanitizedEntry.dateOfBirth) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(sanitizedEntry.dateOfBirth)) {
      throw new ValidationError('Invalid date format: YYYY-MM-DD', {
        invalidField: 'dateOfBirth',
      });
    }
  }

  try {
    const id: string = uuid();
    const result = (await pool.query(
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
        formatToISODate(sanitizedEntry.dateOfBirth),
      ]
    )) as QueryResult<PatientEntry>;

    const patient = result.rows[0];
    return {
      ...patient,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      dateOfBirth: patient.dateOfBirth,
      entries: [],
    } as PatientEntry;
  } catch (error) {
    throw new DatabaseError('Failed to add patient', error);
  }
};

const editPatient = async (
  id: string,
  updateData: Partial<NewPatientEntryWithoutEntries>
): Promise<PatientEntry> => {
  const sanitizedUpdate = sanitizeObject(updateData);

  if (sanitizedUpdate.dateOfBirth) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(sanitizedUpdate.dateOfBirth)) {
      throw new ValidationError('Invalid date format: YYYY-MM-DD', {
        invalidField: 'dateOfBirth',
      });
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

    // Merge updates while preserving existing dateOfBirth if not provided
    const updatedFields = {
      name: sanitizedUpdate.name ?? existingPatient.name,
      occupation:
        sanitizedUpdate.occupation ?? existingPatient.occupation,
      gender: sanitizedUpdate.gender ?? existingPatient.gender,
      ssn: sanitizedUpdate.ssn ?? existingPatient.ssn,
      // Use snake_case for database field
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
      dateOfBirth: formatToISODate(row.date_of_birth),
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
    throw new DatabaseError('Failed to edit patient', error);
  }
};

const deletePatient = async (id: string): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM entries WHERE patient_id = $1', [
      id,
    ]);

    const result = await client.query(
      'DELETE FROM patients WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Patient', id);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to delete patient', error);
  } finally {
    client.release();
  }
};

const validateEntry = (entry: NewEntryWithoutId): void => {
  const sanitizedEntry = sanitizeObject(entry);

  // Validate required fields
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
      { missingBaseFields }
    );
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(sanitizedEntry.date)) {
    throw new ValidationError('Invalid date format: YYYY-MM-DD', {
      invalidField: 'date',
    });
  }

  if (sanitizedEntry.diagnosisCodes) {
    const invalidCodes = sanitizedEntry.diagnosisCodes.filter(
      (code) => !/^[A-Z0-9]{3,}$/.test(code)
    );
    if (invalidCodes.length > 0) {
      throw new ValidationError(
        `Invalid diagnosis code format: ${invalidCodes.join(
          ', '
        )}. Must be at least 3 alphanumeric characters.`,
        { invalidCodes }
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
      { invalidType: sanitizedEntry.type }
    );
  }

  if (sanitizedEntry.type === 'HealthCheck') {
    if (sanitizedEntry.healthCheckRating === undefined) {
      throw new ValidationError(
        'Missing healthCheckRating for HealthCheck entry',
        { missingField: 'healthCheckRating' }
      );
    }
    if (
      sanitizedEntry.healthCheckRating < HealthCheckRating.Healthy ||
      sanitizedEntry.healthCheckRating >
        HealthCheckRating.CriticalRisk
    ) {
      throw new ValidationError(
        'Invalid healthCheckRating: must be 0-3',
        { invalidField: 'healthCheckRating' }
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
      { missingFields: ['discharge.date', 'discharge.criteria'] }
    );
  }

  if (
    sanitizedEntry.type === 'OccupationalHealthcare' &&
    !sanitizedEntry.employerName
  ) {
    throw new ValidationError(
      'Missing required field for OccupationalHealthcare entry: employerName',
      { missingField: 'employerName' }
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

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert base entry
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

      // Insert entry-diagnosis relationships
      if (entry.diagnosisCodes) {
        for (const code of entry.diagnosisCodes) {
          await client.query(
            'INSERT INTO entry_diagnoses (entry_id, diagnosis_code) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, code]
          );
        }
      }

      // Insert type-specific data
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

      const createdEntry = {
        id,
        ...entry,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Entry;

      // Map to the appropriate type based on entry type
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
    throw new DatabaseError('Failed to add entry', error);
  }
};

const updateEntry = async (
  patientId: string,
  entryId: string,
  updateData: NewEntryWithoutId
): Promise<Entry> => {
  // Validate entry synchronously
  validateEntry(updateData);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const patientResult = await client.query(
      'SELECT id FROM patients WHERE id = $1',
      [patientId]
    );
    if (patientResult.rowCount === 0) {
      throw new NotFoundError('Patient', patientId);
    }

    const entryResult = await client.query(
      'SELECT * FROM entries WHERE id = $1',
      [entryId]
    );
    if (entryResult.rowCount === 0) {
      throw new NotFoundError('Entry', entryId);
    }

    const existingEntry = entryResult.rows[0];

    if (existingEntry.type !== updateData.type) {
      throw new ValidationError(
        'Cannot change entry type during update',
        { invalidOperation: 'typeChange' }
      );
    }

    if (
      updateData.diagnosisCodes &&
      updateData.diagnosisCodes.length > 0
    ) {
      const codeCheck = await client.query(
        'SELECT code FROM diagnoses WHERE code = ANY($1)',
        [updateData.diagnosisCodes]
      );
      const existingCodes = codeCheck.rows.map((row) => row.code);
      const missingCodes = updateData.diagnosisCodes.filter(
        (code) => !existingCodes.includes(code)
      );

      if (missingCodes.length > 0) {
        throw new ValidationError(
          `Invalid diagnosis codes: ${missingCodes.join(
            ', '
          )}. These codes don't exist in the database.`,
          { invalidCodes: missingCodes }
        );
      }
    }

    // Update base entry
    await client.query(
      `
      UPDATE entries
      SET
        description = $1,
        date = $2,
        specialist = $3,
        updated_at = NOW()
      WHERE id = $4
    `,
      [
        updateData.description,
        updateData.date,
        updateData.specialist,
        entryId,
      ]
    );

    // Update diagnosis codes
    await client.query(
      'DELETE FROM entry_diagnoses WHERE entry_id = $1',
      [entryId]
    );
    if (updateData.diagnosisCodes) {
      for (const code of updateData.diagnosisCodes) {
        await client.query(
          'INSERT INTO entry_diagnoses (entry_id, diagnosis_code) VALUES ($1, $2)',
          [entryId, code]
        );
      }
    }

    // Update type-specific data
    if (updateData.type === 'HealthCheck') {
      await client.query(
        `
        UPDATE healthcheck_entries
        SET health_check_rating = $1
        WHERE entry_id = $2
      `,
        [updateData.healthCheckRating, entryId]
      );
    } else if (updateData.type === 'Hospital') {
      await client.query(
        `
        UPDATE hospital_entries
        SET
          discharge_date = $1,
          discharge_criteria = $2
        WHERE entry_id = $3
      `,
        [
          updateData.discharge.date,
          updateData.discharge.criteria,
          entryId,
        ]
      );
    } else if (updateData.type === 'OccupationalHealthcare') {
      await client.query(
        `
        UPDATE occupational_healthcare_entries
        SET
          employer_name = $1,
          sick_leave_start_date = $2,
          sick_leave_end_date = $3
        WHERE entry_id = $4
      `,
        [
          updateData.employerName,
          updateData.sickLeave?.startDate,
          updateData.sickLeave?.endDate,
          entryId,
        ]
      );
    }

    await client.query('COMMIT');

    const updatedEntry = {
      ...updateData,
      id: entryId,
      createdAt: existingEntry.created_at,
      updatedAt: new Date().toISOString(),
    } as Entry;

    return updatedEntry;
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
      }. Check database constraints, connection, and ensure all referenced data exists.`,
      error
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

    // Execute all queries in parallel
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
    throw new DatabaseError(
      'Failed to fetch entries by patient ID',
      error
    );
  }
};

const deleteEntry = async (
  patientId: string,
  entryId: string
): Promise<void> => {
  logger.info(`Deleting entry ${entryId} for patient ${patientId}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

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
      error
    );
  } finally {
    client.release();
  }
};

export const patientService = {
  getPatientEntries,
  getNonSensitiveEntries,
  getAllNonSensitiveEntries,
  getPaginatedNonSensitiveEntries,
  addEntry,
  getPatientById,
  getEntriesByPatientId,
  createPatient,
  editPatient,
  deletePatient,
  updateEntry,
  deleteEntry,
};
