import pool from './connection';
import { v1 as uuid } from 'uuid';
import patientsData from '../data/patients-full';
import diagnosesData from '../data/diagnoses';

// Using centralized connection pool from connection.ts

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS diagnoses (
        code VARCHAR(10) PRIMARY KEY,
        name TEXT NOT NULL,
        latin TEXT,
        unique_code BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        occupation TEXT NOT NULL,
        gender VARCHAR(10) NOT NULL CHECK (gender IN ('female', 'male', 'other')),
        ssn VARCHAR(20),
        date_of_birth DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS entries (
        id UUID PRIMARY KEY,
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        date DATE NOT NULL,
        specialist TEXT NOT NULL,
        type VARCHAR(30) NOT NULL CHECK (type IN ('HealthCheck', 'Hospital', 'OccupationalHealthcare')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS entry_diagnoses (
        entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
        diagnosis_code VARCHAR(10) REFERENCES diagnoses(code),
        PRIMARY KEY (entry_id, diagnosis_code)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS healthcheck_entries (
        entry_id UUID PRIMARY KEY REFERENCES entries(id) ON DELETE CASCADE,
        health_check_rating INTEGER NOT NULL CHECK (health_check_rating BETWEEN 0 AND 3)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hospital_entries (
        entry_id UUID PRIMARY KEY REFERENCES entries(id) ON DELETE CASCADE,
        discharge_date DATE NOT NULL,
        discharge_criteria TEXT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS occupational_healthcare_entries (
        entry_id UUID PRIMARY KEY REFERENCES entries(id) ON DELETE CASCADE,
        employer_name TEXT NOT NULL,
        sick_leave_start_date DATE,
        sick_leave_end_date DATE
      );
    `);

    for (const diagnosis of diagnosesData) {
      await client.query(
        'INSERT INTO diagnoses (code, name, latin, unique_code) VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO NOTHING',
        [diagnosis.code, diagnosis.name, diagnosis.latin, true]
      );
    }

    // Migrate patients and entries
    for (const patient of patientsData) {
      // Insert patient (ignore duplicates)
      const patientId = patient.id || uuid();
      await client.query(
        'INSERT INTO patients (id, name, occupation, gender, ssn, date_of_birth) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
        [
          patientId,
          patient.name,
          patient.occupation,
          patient.gender,
          patient.ssn,
          patient.dateOfBirth,
        ]
      );

      if (patient.entries) {
        for (const entry of patient.entries) {
          // Insert base entry (ignore duplicates)
          const entryId = entry.id || uuid();
          await client.query(
            'INSERT INTO entries (id, patient_id, description, date, specialist, type) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
            [
              entryId,
              patientId,
              entry.description,
              entry.date,
              entry.specialist,
              entry.type,
            ]
          );

          // Insert entry-diagnosis relationships
          if (entry.diagnosisCodes) {
            for (const code of entry.diagnosisCodes) {
              await client.query(
                'INSERT INTO entry_diagnoses (entry_id, diagnosis_code) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [entryId, code]
              );
            }
          }

          // Insert type-specific data
          if (entry.type === 'HealthCheck') {
            await client.query(
              'INSERT INTO healthcheck_entries (entry_id, health_check_rating) VALUES ($1, $2) ON CONFLICT (entry_id) DO NOTHING',
              [entryId, entry.healthCheckRating]
            );
          } else if (entry.type === 'Hospital') {
            await client.query(
              'INSERT INTO hospital_entries (entry_id, discharge_date, discharge_criteria) VALUES ($1, $2, $3) ON CONFLICT (entry_id) DO NOTHING',
              [
                entryId,
                entry.discharge.date,
                entry.discharge.criteria,
              ]
            );
          } else if (entry.type === 'OccupationalHealthcare') {
            await client.query(
              'INSERT INTO occupational_healthcare_entries (entry_id, employer_name, sick_leave_start_date, sick_leave_end_date) VALUES ($1, $2, $3, $4) ON CONFLICT (entry_id) DO NOTHING',
              [
                entryId,
                entry.employerName,
                entry.sickLeave?.startDate,
                entry.sickLeave?.endDate,
              ]
            );
          }
        }
      }
    
    await client.query('COMMIT');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export { migrate };