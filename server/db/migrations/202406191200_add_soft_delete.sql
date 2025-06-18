ALTER TABLE patients
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID,
ADD CONSTRAINT fk_patients_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id);

CREATE TABLE IF NOT EXISTS patient_deletion_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    deleted_by UUID NOT NULL REFERENCES users(id),
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_patients_is_deleted ON patients(is_deleted);