INSERT INTO students_master (student_id, first_name, last_name, date_of_birth, citizen_id, passport_no, status)
VALUES
  ('65010001', 'Nattapong', 'Srisuk', '2003-01-15', '1103700000011', NULL, 'active'),
  ('65010002', 'Patchara', 'Kongkaew', '2002-11-03', '1103700000029', NULL, 'active'),
  ('65010003', 'Siriporn', 'Maliwan', '2003-07-22', NULL, 'AB1234567', 'active'),
  ('65010004', 'Thanawat', 'Boonmee', '2002-05-09', '1103700000045', NULL, 'active'),
  ('65010005', 'Kanyarat', 'Chaiyasit', '2003-12-30', NULL, 'CD7654321', 'active')
ON CONFLICT (student_id)
DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  date_of_birth = EXCLUDED.date_of_birth,
  citizen_id = EXCLUDED.citizen_id,
  passport_no = EXCLUDED.passport_no,
  status = EXCLUDED.status;