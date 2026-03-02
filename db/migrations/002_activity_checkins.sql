CREATE TABLE IF NOT EXISTS activity_checkins (
  id BIGSERIAL PRIMARY KEY,
  activity_key VARCHAR(50) NOT NULL REFERENCES activities(activity_key),
  line_user_id VARCHAR(100) NOT NULL,
  student_id VARCHAR(20) NOT NULL REFERENCES students_master(student_id),
  checked_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (activity_key, line_user_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_checkins_activity_key
  ON activity_checkins(activity_key);

CREATE INDEX IF NOT EXISTS idx_activity_checkins_checked_in_at
  ON activity_checkins(checked_in_at);