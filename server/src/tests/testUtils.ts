import pool from '../../db/connection';
import { Patient, NewEntryWithoutId, Gender } from '../types';
import { v1 as uuid } from 'uuid';

export async function clearDatabase() {
  const client = await pool.connect();
  try {
    await client.query(
      'TRUNCATE TABLE patients, entries RESTART IDENTITY CASCADE'
    );
  } finally {
    client.release();
  }
}

export async function seedDatabase(count?: number) {
  await clearDatabase();

  if (count && count > 0) {
    // Generate large dataset using bulk insert
    const patients = [];
    for (let i = 0; i < count; i++) {
      const gender = i % 2 === 0 ? Gender.Male : Gender.Female;
      patients.push({
        id: uuid(),
        name: `Patient ${i}`,
        dateOfBirth: `19${Math.floor(Math.random() * 50) + 50}-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
        gender,
        occupation: `Occupation ${i}`,
        ssn: `123-45-${1000 + i}`
      });
    }

    // Build the bulk insert query
    const placeholders = [];
    const values = [];
    let paramIndex = 1;
    for (const patient of patients) {
      placeholders.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5})`);
      values.push(patient.id, patient.name, patient.dateOfBirth, patient.gender, patient.occupation, patient.ssn);
      paramIndex += 6;
    }

    const queryText = `
      INSERT INTO patients (id, name, date_of_birth, gender, occupation, ssn)
      VALUES ${placeholders.join(', ')}
    `;

    await pool.query(queryText, values);
  } else {
    // Use fixed UUIDs for consistent test data
    const patient1Id = 'd2773336-f723-11e9-8f0b-362b9e155667';
    const patient2Id = 'd2773598-f723-11e9-8f0b-362b9e155667';

    await pool.query(
      `
      INSERT INTO patients (id, name, date_of_birth, gender, occupation)
      VALUES
        ($1, 'John Doe', '1980-01-01', 'male', 'Engineer'),
        ($2, 'Jane Smith', '1990-05-15', 'female', 'Doctor')
    `,
      [patient1Id, patient2Id]
    );

    await createTestEntry(patient1Id, {
      description: 'Annual physical exam',
      date: '2023-05-15',
      specialist: 'Dr. Smith',
      type: 'HealthCheck',
      healthCheckRating: 0,
    });

    await createTestEntry(patient1Id, {
      description: 'Emergency appendectomy',
      date: '2023-06-01',
      specialist: 'Dr. Johnson',
      type: 'Hospital',
      discharge: {
        date: '2023-06-03',
        criteria: 'Recovering well',
      },
    });

    await createTestEntry(patient1Id, {
      description: 'Work-related back injury',
      date: '2023-04-20',
      specialist: 'Dr. Williams',
      type: 'OccupationalHealthcare',
      employerName: 'Acme Corp',
      sickLeave: {
        startDate: '2023-04-20',
        endDate: '2023-04-27',
      },
    });

    await createTestEntry(patient2Id, {
      description: 'Annual checkup',
      date: '2023-05-20',
      specialist: 'Dr. Brown',
      type: 'HealthCheck',
      healthCheckRating: 1,
    });
  }
}

export async function createTestPatient(patient: Patient) {
  const patientId = uuid();
  const result = await pool.query(
    `
    INSERT INTO patients (id, name, occupation, gender, ssn, date_of_birth)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `,
    [
      patientId,
      patient.name,
      patient.occupation,
      patient.gender,
      patient.ssn || null,
      patient.dateOfBirth,
    ]
  );
  return result.rows[0];
}

export async function createTestEntry(
  patientId: string,
  entry: NewEntryWithoutId
) {
  const entryId = uuid();
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;

  // Insert base entry
  await pool.query(
    `
    INSERT INTO entries (id, patient_id, description, date, specialist, type, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `,
    [
      entryId,
      patientId,
      entry.description,
      entry.date,
      entry.specialist,
      entry.type,
      createdAt,
      updatedAt,
    ]
  );

  // Insert type-specific data
  if (entry.type === 'HealthCheck') {
    await pool.query(
      `
      INSERT INTO healthcheck_entries (entry_id, health_check_rating)
      VALUES ($1, $2)
    `,
      [entryId, entry.healthCheckRating]
    );
  } else if (entry.type === 'Hospital') {
    await pool.query(
      `
      INSERT INTO hospital_entries (entry_id, discharge_date, discharge_criteria)
      VALUES ($1, $2, $3)
    `,
      [entryId, entry.discharge.date, entry.discharge.criteria]
    );
  } else if (entry.type === 'OccupationalHealthcare') {
    await pool.query(
      `
      INSERT INTO occupational_healthcare_entries (entry_id, employer_name, sick_leave_start_date, sick_leave_end_date)
      VALUES ($1, $2, $3, $4)
    `,
      [
        entryId,
        entry.employerName,
        entry.sickLeave?.startDate || null,
        entry.sickLeave?.endDate || null,
      ]
    );
  } else {
    // This should never happen but provides type safety
    const _exhaustiveCheck: never = entry;
    throw new Error(
      `Unsupported entry type: ${(_exhaustiveCheck as any).type}`
    );
  }

  return {
    id: entryId,
    ...entry,
    createdAt,
    updatedAt,
  };
}

export async function createTestPatientWithEntries(
  patient: Omit<Patient, 'id'>,
  entries: NewEntryWithoutId[]
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const patientId = uuid();

    await client.query(
      `
      INSERT INTO patients (id, name, occupation, gender, ssn, date_of_birth)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        patientId,
        patient.name,
        patient.occupation,
        patient.gender,
        patient.ssn || null,
        patient.dateOfBirth,
      ]
    );

    const createdEntries = [];
    for (const entry of entries) {
      const entryId = uuid();

      await client.query(
        `
        INSERT INTO entries (id, patient_id, description, date, specialist, type)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          entryId,
          patientId,
          entry.description,
          entry.date,
          entry.specialist,
          entry.type,
        ]
      );

      // Insert type-specific data
      if (entry.type === 'HealthCheck') {
        await client.query(
          `
          INSERT INTO healthcheck_entries (entry_id, health_check_rating)
          VALUES ($1, $2)
        `,
          [entryId, entry.healthCheckRating]
        );
      } else if (entry.type === 'Hospital') {
        await client.query(
          `
          INSERT INTO hospital_entries (entry_id, discharge_date, discharge_criteria)
          VALUES ($1, $2, $3)
        `,
          [entryId, entry.discharge.date, entry.discharge.criteria]
        );
      } else if (entry.type === 'OccupationalHealthcare') {
        await client.query(
          `
          INSERT INTO occupational_healthcare_entries (entry_id, employer_name, sick_leave_start_date, sick_leave_end_date)
          VALUES ($1, $2, $3, $4)
        `,
          [
            entryId,
            entry.employerName,
            entry.sickLeave?.startDate || null,
            entry.sickLeave?.endDate || null,
          ]
        );
      }

      createdEntries.push({ ...entry, id: entryId });
    }

    await client.query('COMMIT');

    return {
      ...patient,
      id: patientId,
      entries: createdEntries,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
