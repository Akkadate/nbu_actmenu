CREATE TABLE IF NOT EXISTS students_master (
  student_id VARCHAR(20) PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE NOT NULL,
  citizen_id VARCHAR(20),
  passport_no VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS line_student_links (
  id SERIAL PRIMARY KEY,
  line_user_id VARCHAR(100) UNIQUE NOT NULL,
  student_id VARCHAR(20) REFERENCES students_master(student_id),
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
  activity_key VARCHAR(50) PRIMARY KEY,
  activity_name VARCHAR(255) NOT NULL,
  richmenu_id VARCHAR(100) NOT NULL,
  flex_payload JSONB NOT NULL,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_line_student_links_line_user_id
  ON line_student_links(line_user_id);

CREATE INDEX IF NOT EXISTS idx_activities_is_active
  ON activities(is_active);
