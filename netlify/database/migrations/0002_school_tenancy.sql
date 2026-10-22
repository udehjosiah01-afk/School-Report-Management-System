CREATE TABLE schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  contact_email text NOT NULL,
  motto text NOT NULL DEFAULT '',
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE school_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  identity_user_id text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('admin', 'teacher')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_memberships_school_identity_unique UNIQUE (school_id, identity_user_id)
);

INSERT INTO schools (name, address, phone, contact_email)
SELECT 'Migrated school workspace', 'Not provided', 'Not provided', 'migration@invalid.local'
WHERE EXISTS (SELECT 1 FROM school_classes)
   OR EXISTS (SELECT 1 FROM students)
   OR EXISTS (SELECT 1 FROM student_enrollments)
   OR EXISTS (SELECT 1 FROM subjects)
   OR EXISTS (SELECT 1 FROM student_subjects)
   OR EXISTS (SELECT 1 FROM academic_terms)
   OR EXISTS (SELECT 1 FROM staff_assignments)
   OR EXISTS (SELECT 1 FROM score_entries)
   OR EXISTS (SELECT 1 FROM audit_events)
   OR EXISTS (SELECT 1 FROM system_settings);

ALTER TABLE school_classes ADD COLUMN school_id uuid REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE students ADD COLUMN school_id uuid REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE student_enrollments ADD COLUMN school_id uuid REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE subjects ADD COLUMN school_id uuid REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE student_subjects ADD COLUMN school_id uuid REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE academic_terms ADD COLUMN school_id uuid REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE staff_assignments ADD COLUMN school_id uuid REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE score_entries ADD COLUMN school_id uuid REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE audit_events ADD COLUMN school_id uuid REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE system_settings ADD COLUMN school_id uuid REFERENCES schools(id) ON DELETE CASCADE;

UPDATE school_classes SET school_id = (SELECT id FROM schools WHERE name = 'Migrated school workspace');
UPDATE students SET school_id = (SELECT id FROM schools WHERE name = 'Migrated school workspace');
UPDATE student_enrollments SET school_id = (SELECT id FROM schools WHERE name = 'Migrated school workspace');
UPDATE subjects SET school_id = (SELECT id FROM schools WHERE name = 'Migrated school workspace');
UPDATE student_subjects SET school_id = (SELECT id FROM schools WHERE name = 'Migrated school workspace');
UPDATE academic_terms SET school_id = (SELECT id FROM schools WHERE name = 'Migrated school workspace');
UPDATE staff_assignments SET school_id = (SELECT id FROM schools WHERE name = 'Migrated school workspace');
UPDATE score_entries SET school_id = (SELECT id FROM schools WHERE name = 'Migrated school workspace');
UPDATE audit_events SET school_id = (SELECT id FROM schools WHERE name = 'Migrated school workspace');
UPDATE system_settings SET school_id = (SELECT id FROM schools WHERE name = 'Migrated school workspace');

INSERT INTO school_memberships (school_id, identity_user_id, role)
SELECT
  (SELECT id FROM schools WHERE name = 'Migrated school workspace'),
  legacy_users.identity_user_id,
  'teacher'
FROM (
  SELECT identity_user_id FROM staff_assignments
  UNION
  SELECT entered_by FROM score_entries
  UNION
  SELECT identity_user_id FROM audit_events
  UNION
  SELECT updated_by FROM system_settings
) AS legacy_users
WHERE legacy_users.identity_user_id <> ''
  AND EXISTS (SELECT 1 FROM schools WHERE name = 'Migrated school workspace');

CREATE TABLE class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT class_subjects_school_class_subject_unique UNIQUE (school_id, class_id, subject_id),
  CONSTRAINT class_subjects_id_school_unique UNIQUE (id, school_id),
  CONSTRAINT class_subjects_class_school_fk
    FOREIGN KEY (class_id, school_id) REFERENCES school_classes(id, school_id) ON DELETE CASCADE,
  CONSTRAINT class_subjects_subject_school_fk
    FOREIGN KEY (subject_id, school_id) REFERENCES subjects(id, school_id) ON DELETE CASCADE
);

INSERT INTO class_subjects (school_id, class_id, subject_id)
SELECT DISTINCT
  enrollment.school_id,
  enrollment.class_id,
  student_subject.subject_id
FROM student_subjects AS student_subject
JOIN student_enrollments AS enrollment ON enrollment.id = student_subject.enrollment_id
UNION
SELECT DISTINCT school_id, class_id, subject_id
FROM staff_assignments;

ALTER TABLE school_classes ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE students ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE student_enrollments ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE subjects ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE student_subjects ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE academic_terms ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE staff_assignments ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE score_entries ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE audit_events ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE system_settings ALTER COLUMN school_id SET NOT NULL;

ALTER TABLE school_classes DROP CONSTRAINT school_classes_name_key;
ALTER TABLE school_classes
  ADD CONSTRAINT school_classes_school_name_unique UNIQUE (school_id, name),
  ADD CONSTRAINT school_classes_id_school_unique UNIQUE (id, school_id);

ALTER TABLE students DROP CONSTRAINT students_admission_number_key;
ALTER TABLE students
  ADD CONSTRAINT students_school_admission_unique UNIQUE (school_id, admission_number),
  ADD CONSTRAINT students_id_school_unique UNIQUE (id, school_id);

ALTER TABLE student_enrollments
  DROP CONSTRAINT student_enrollments_student_id_fkey,
  DROP CONSTRAINT student_enrollments_class_id_fkey,
  DROP CONSTRAINT student_enrollments_student_year_unique;
ALTER TABLE student_enrollments
  ADD CONSTRAINT student_enrollments_school_student_year_unique UNIQUE (school_id, student_id, academic_year),
  ADD CONSTRAINT student_enrollments_id_school_unique UNIQUE (id, school_id),
  ADD CONSTRAINT student_enrollments_student_school_fk
    FOREIGN KEY (student_id, school_id) REFERENCES students(id, school_id) ON DELETE CASCADE,
  ADD CONSTRAINT student_enrollments_class_school_fk
    FOREIGN KEY (class_id, school_id) REFERENCES school_classes(id, school_id);

ALTER TABLE subjects DROP CONSTRAINT subjects_name_key;
ALTER TABLE subjects
  ADD CONSTRAINT subjects_school_name_unique UNIQUE (school_id, name),
  ADD CONSTRAINT subjects_id_school_unique UNIQUE (id, school_id);

ALTER TABLE student_subjects
  DROP CONSTRAINT student_subjects_enrollment_id_fkey,
  DROP CONSTRAINT student_subjects_subject_id_fkey,
  DROP CONSTRAINT student_subjects_enrollment_subject_unique;
ALTER TABLE student_subjects
  ADD CONSTRAINT student_subjects_school_enrollment_subject_unique
    UNIQUE (school_id, enrollment_id, subject_id),
  ADD CONSTRAINT student_subjects_enrollment_school_fk
    FOREIGN KEY (enrollment_id, school_id) REFERENCES student_enrollments(id, school_id) ON DELETE CASCADE,
  ADD CONSTRAINT student_subjects_subject_school_fk
    FOREIGN KEY (subject_id, school_id) REFERENCES subjects(id, school_id);

ALTER TABLE academic_terms DROP CONSTRAINT academic_terms_year_name_unique;
ALTER TABLE academic_terms
  ADD CONSTRAINT academic_terms_school_year_name_unique UNIQUE (school_id, academic_year, name),
  ADD CONSTRAINT academic_terms_id_school_unique UNIQUE (id, school_id);

ALTER TABLE staff_assignments
  DROP CONSTRAINT staff_assignments_class_id_fkey,
  DROP CONSTRAINT staff_assignments_subject_id_fkey,
  DROP CONSTRAINT staff_assignments_user_class_subject_unique;
ALTER TABLE staff_assignments
  ADD CONSTRAINT staff_assignments_school_user_class_subject_unique
    UNIQUE (school_id, identity_user_id, class_id, subject_id),
  ADD CONSTRAINT staff_assignments_membership_fk
    FOREIGN KEY (identity_user_id, school_id)
    REFERENCES school_memberships(identity_user_id, school_id) ON DELETE CASCADE,
  ADD CONSTRAINT staff_assignments_class_school_fk
    FOREIGN KEY (class_id, school_id) REFERENCES school_classes(id, school_id) ON DELETE CASCADE,
  ADD CONSTRAINT staff_assignments_subject_school_fk
    FOREIGN KEY (subject_id, school_id) REFERENCES subjects(id, school_id) ON DELETE CASCADE;

ALTER TABLE score_entries
  DROP CONSTRAINT score_entries_enrollment_id_fkey,
  DROP CONSTRAINT score_entries_subject_id_fkey,
  DROP CONSTRAINT score_entries_term_id_fkey,
  DROP CONSTRAINT score_entries_enrollment_subject_term_unique;
ALTER TABLE score_entries
  ADD CONSTRAINT score_entries_school_enrollment_subject_term_unique
    UNIQUE (school_id, enrollment_id, subject_id, term_id),
  ADD CONSTRAINT score_entries_membership_fk
    FOREIGN KEY (entered_by, school_id) REFERENCES school_memberships(identity_user_id, school_id),
  ADD CONSTRAINT score_entries_enrollment_school_fk
    FOREIGN KEY (enrollment_id, school_id) REFERENCES student_enrollments(id, school_id) ON DELETE CASCADE,
  ADD CONSTRAINT score_entries_subject_school_fk
    FOREIGN KEY (subject_id, school_id) REFERENCES subjects(id, school_id),
  ADD CONSTRAINT score_entries_term_school_fk
    FOREIGN KEY (term_id, school_id) REFERENCES academic_terms(id, school_id) ON DELETE CASCADE;

ALTER TABLE audit_events
  ADD CONSTRAINT audit_events_membership_fk
    FOREIGN KEY (identity_user_id, school_id) REFERENCES school_memberships(identity_user_id, school_id);

ALTER TABLE system_settings DROP CONSTRAINT system_settings_pkey;
ALTER TABLE system_settings
  ADD CONSTRAINT system_settings_school_key_unique UNIQUE (school_id, key),
  ADD CONSTRAINT system_settings_membership_fk
    FOREIGN KEY (updated_by, school_id) REFERENCES school_memberships(identity_user_id, school_id);

CREATE INDEX student_enrollments_school_class_year_idx
  ON student_enrollments (school_id, class_id, academic_year);
CREATE INDEX score_entries_school_term_subject_idx
  ON score_entries (school_id, term_id, subject_id);
CREATE INDEX audit_events_school_entity_created_idx
  ON audit_events (school_id, entity_id, created_at);
