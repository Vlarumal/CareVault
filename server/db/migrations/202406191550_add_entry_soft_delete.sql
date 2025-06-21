ALTER TABLE entries
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

CREATE TABLE IF NOT EXISTS entry_deletion_audit (
    entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    deleted_by UUID NOT NULL REFERENCES users(id),
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason TEXT,
    PRIMARY KEY (entry_id, deleted_at)
);

CREATE INDEX IF NOT EXISTS idx_entries_is_deleted ON entries(is_deleted);