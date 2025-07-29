-- 15_pending_registrations.sql
-- Table for pending user registrations (admin approval required)

CREATE TABLE IF NOT EXISTS pending_registrations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'alumni')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied')) DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  review_comment TEXT
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_pending_registrations_user_id ON pending_registrations(user_id); 