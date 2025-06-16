import pool from './connection';
import { v1 as uuid } from 'uuid';
import patientsData from '../data/patients-full';
import diagnosesData from '../data/diagnoses';
import { readFile, readdir, stat } from 'fs/promises';
import path from 'path';
import logger from '../src/utils/logger';
import format from 'pg-format';

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

    if (diagnosesData.length > 0) {
      const values = diagnosesData.map(d => [
        d.code,
        d.name,
        d.latin || null,
        true
      ]);
      
      try {
        await client.query(
          format(
            `INSERT INTO diagnoses (code, name, latin, unique_code) VALUES %L ON CONFLICT (code) DO NOTHING`,
            values
          )
        );
        logger.info(`Inserted ${diagnosesData.length} diagnoses`, {
          table: 'diagnoses',
          count: diagnosesData.length
        });
      } catch (error) {
        logger.error('Failed to insert diagnoses', {
          error,
          values: values.slice(0, 5),
          count: values.length
        });
        throw error;
      }
    }

    const patientValues = patientsData.map(p => {
      const id = p.id || uuid();
      let dateOfBirth = null;
      if (p.dateOfBirth) {
        try {
          dateOfBirth = new Date(p.dateOfBirth).toISOString();
        } catch (error) {
          logger.warn('Invalid date format for patient', {
            patientId: id,
            dateOfBirth: p.dateOfBirth
          });
        }
      }
      
      return [
        id,
        p.name,
        p.occupation,
        p.gender,
        p.ssn || null,
        dateOfBirth
      ];
    });
    
    try {
      await client.query(
        format(
          `INSERT INTO patients (id, name, occupation, gender, ssn, date_of_birth)
           VALUES %L ON CONFLICT (id) DO NOTHING`,
          patientValues
        )
      );
      logger.info(`Inserted ${patientsData.length} patients`, {
        table: 'patients',
        count: patientsData.length
      });
    } catch (error) {
      logger.error('Failed to insert patients', {
        error,
        samplePatient: patientValues[0],
        count: patientValues.length
      });
      throw error;
    }

    const entryValues: any[][] = [];
    const entryDiagnosisValues: any[][] = [];
    const healthCheckValues: any[][] = [];
    const hospitalValues: any[][] = [];
    const occupationalValues: any[][] = [];

    for (const patient of patientsData) {
      if (!patient.entries) continue;
      
      for (const entry of patient.entries) {
        try {
          const entryId = entry.id || uuid();
          const patientId = patient.id || uuid();
          
          let entryDate;
          try {
            entryDate = new Date(entry.date).toISOString();
          } catch (error) {
            logger.warn('Invalid entry date format', {
              entryId,
              patientId,
              date: entry.date
            });
            throw new Error(`Invalid date format for entry ${entryId}`);
          }

          entryValues.push([
            entryId,
            patientId,
            entry.description,
            entryDate,
            entry.specialist,
            entry.type
          ]);

          if (entry.diagnosisCodes) {
            entry.diagnosisCodes.forEach(code => {
              entryDiagnosisValues.push([entryId, code]);
            });
          }

          if (entry.type === 'HealthCheck') {
            healthCheckValues.push([entryId, entry.healthCheckRating]);
          } else if (entry.type === 'Hospital') {
            let dischargeDate;
            try {
              dischargeDate = new Date(entry.discharge.date).toISOString();
            } catch (error) {
              logger.warn('Invalid discharge date format', {
                entryId,
                date: entry.discharge.date
              });
              throw error;
            }
            hospitalValues.push([
              entryId,
              dischargeDate,
              entry.discharge.criteria
            ]);
          } else if (entry.type === 'OccupationalHealthcare') {
            let sickLeaveStart = null;
            let sickLeaveEnd = null;
            
            if (entry.sickLeave) {
              try {
                sickLeaveStart = new Date(entry.sickLeave.startDate).toISOString();
                sickLeaveEnd = new Date(entry.sickLeave.endDate).toISOString();
              } catch (error) {
                logger.warn('Invalid sick leave date format', {
                  entryId,
                  dates: entry.sickLeave
                });
              }
            }
            
            occupationalValues.push([
              entryId,
              entry.employerName,
              sickLeaveStart,
              sickLeaveEnd
            ]);
          }
        } catch (error) {
          logger.error(`Failed to process entry for patient ${patient.id}:`, {
            error: error instanceof Error ? error.message : String(error),
            patientId: patient.id,
            entryId: entry.id,
            stack: error instanceof Error ? error.stack : undefined
          });
          throw error;
        }
      }
    }

    if (entryValues.length > 0) {
      try {
        await client.query(
          format(
            `INSERT INTO entries (id, patient_id, description, date, specialist, type)
             VALUES %L ON CONFLICT (id) DO NOTHING`,
            entryValues
          )
        );
        logger.info(`Inserted ${entryValues.length} entries`, {
          table: 'entries',
          count: entryValues.length
        });
      } catch (error) {
        logger.error('Failed to insert entries', {
          error,
          sampleEntry: entryValues[0],
          count: entryValues.length
        });
        throw error;
      }
    }

    if (entryDiagnosisValues.length > 0) {
      try {
        await client.query(
          format(
            `INSERT INTO entry_diagnoses (entry_id, diagnosis_code)
             VALUES %L ON CONFLICT DO NOTHING`,
            entryDiagnosisValues
          )
        );
        logger.info(`Inserted ${entryDiagnosisValues.length} entry-diagnosis relationships`, {
          table: 'entry_diagnoses',
          count: entryDiagnosisValues.length
        });
      } catch (error) {
        logger.error('Failed to insert entry-diagnosis relationships', {
          error,
          sampleRelationship: entryDiagnosisValues[0],
          count: entryDiagnosisValues.length
        });
        throw error;
      }
    }

    if (healthCheckValues.length > 0) {
      try {
        await client.query(
          format(
            `INSERT INTO healthcheck_entries (entry_id, health_check_rating)
             VALUES %L ON CONFLICT (entry_id) DO NOTHING`,
            healthCheckValues
          )
        );
        logger.info(`Inserted ${healthCheckValues.length} health check entries`, {
          table: 'healthcheck_entries',
          count: healthCheckValues.length
        });
      } catch (error) {
        logger.error('Failed to insert health check entries', {
          error,
          sampleEntry: healthCheckValues[0],
          count: healthCheckValues.length
        });
        throw error;
      }
    }

    if (hospitalValues.length > 0) {
      try {
        await client.query(
          format(
            `INSERT INTO hospital_entries (entry_id, discharge_date, discharge_criteria)
             VALUES %L ON CONFLICT (entry_id) DO NOTHING`,
            hospitalValues
          )
        );
        logger.info(`Inserted ${hospitalValues.length} hospital entries`, {
          table: 'hospital_entries',
          count: hospitalValues.length
        });
      } catch (error) {
        logger.error('Failed to insert hospital entries', {
          error,
          sampleEntry: hospitalValues[0],
          count: hospitalValues.length
        });
        throw error;
      }
    }

    if (occupationalValues.length > 0) {
      try {
        await client.query(
          format(
            `INSERT INTO occupational_healthcare_entries
             (entry_id, employer_name, sick_leave_start_date, sick_leave_end_date)
             VALUES %L ON CONFLICT (entry_id) DO NOTHING`,
            occupationalValues
          )
        );
        logger.info(`Inserted ${occupationalValues.length} occupational healthcare entries`, {
          table: 'occupational_healthcare_entries',
          count: occupationalValues.length
        });
      } catch (error) {
        logger.error('Failed to insert occupational healthcare entries', {
          error,
          sampleEntry: occupationalValues[0],
          count: occupationalValues.length
        });
        throw error;
      }
    }

    // await runAdditionalMigrations();
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }

  await runAdditionalMigrations();
}

async function runAdditionalMigrations() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const migrationsDir = path.join(__dirname, 'migrations');
    
    try {
      await stat(migrationsDir);
    } catch (error) {
      logger.info('No migrations directory found, skipping additional migrations');
      return;
    }

    const migrationFiles = (
      await readdir(migrationsDir)
    )
      .filter((file) => file.endsWith('.sql'))
      .sort();

    // Run each migration in order
    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      let migrationSql = '';
      
      try {
        migrationSql = await readFile(migrationPath, 'utf8');
      } catch (readError) {
        logger.error(`Failed to read migration file ${file}:`, {
          error: readError,
          migrationFile: file
        });
        throw new Error(`Failed to read migration file ${file}: ${readError instanceof Error ? readError.message : String(readError)}`);
      }

      try {
        await client.query(migrationSql);
        logger.info(`Executed migration: ${file}`);
      } catch (queryError) {
        logger.error(`Failed to execute migration ${file}:`, {
          error: queryError,
          migrationFile: file,
          sql: migrationSql
        });
        throw new Error(`Migration failed for file ${file}: ${queryError instanceof Error ? queryError.message : String(queryError)}`);
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Additional migrations transaction failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

export { migrate };
