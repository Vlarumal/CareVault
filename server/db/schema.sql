CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    occupation TEXT NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('female', 'male', 'other')),
    ssn VARCHAR(20),
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);

CREATE TABLE diagnoses (
  code VARCHAR(10) PRIMARY KEY,
  name TEXT NOT NULL,
  latin TEXT,
  unique_code BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE entries (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    specialist TEXT NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('HealthCheck', 'Hospital', 'OccupationalHealthcare')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE entry_diagnoses (
    entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
    diagnosis_code VARCHAR(10) REFERENCES diagnoses(code),
    PRIMARY KEY (entry_id, diagnosis_code)
);

CREATE INDEX idx_diagnosis_code ON entry_diagnoses(diagnosis_code);

CREATE TABLE healthcheck_entries (
    entry_id UUID PRIMARY KEY REFERENCES entries(id) ON DELETE CASCADE,
    health_check_rating INTEGER NOT NULL CHECK (health_check_rating BETWEEN 0 AND 3),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hospital_entries (
    entry_id UUID PRIMARY KEY REFERENCES entries(id) ON DELETE CASCADE,
    discharge_date DATE NOT NULL,
    discharge_criteria TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE occupational_healthcare_entries (
    entry_id UUID PRIMARY KEY REFERENCES entries(id) ON DELETE CASCADE,
    employer_name TEXT NOT NULL,
    sick_leave_start_date DATE,
    sick_leave_end_date DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);