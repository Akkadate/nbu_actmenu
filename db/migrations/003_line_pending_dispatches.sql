CREATE TABLE IF NOT EXISTS line_pending_dispatches (
  id BIGSERIAL PRIMARY KEY,
  line_user_id VARCHAR(100) NOT NULL,
  student_id VARCHAR(20) NOT NULL REFERENCES students_master(student_id),
  activity_key VARCHAR(50) NOT NULL REFERENCES activities(activity_key),
  richmenu_id VARCHAR(100) NOT NULL,
  flex_payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  queued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (line_user_id, activity_key)
);

CREATE INDEX IF NOT EXISTS idx_line_pending_dispatches_user_status
  ON line_pending_dispatches(line_user_id, status);

CREATE INDEX IF NOT EXISTS idx_line_pending_dispatches_status_queued
  ON line_pending_dispatches(status, queued_at);
