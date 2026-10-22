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

CREATE TABLE school_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_classes_school_name_unique UNIQUE (school_id, name),
  CONSTRAINT school_classes_id_school_unique UNIQUE (id, school_id)
);

CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  admission_number text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT students_school_admission_unique UNIQUE (school_id, admission_number),
  CONSTRAINT students_id_school_unique UNIQUE (id, school_id)
);

CREATE TABLE student_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  class_id uuid NOT NULL,
  academic_year text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_enrollments_school_student_year_unique UNIQUE (school_id, student_id, academic_year),
  CONSTRAINT student_enrollments_id_school_unique UNIQUE (id, school_id),
  CONSTRAINT student_enrollments_student_school_fk FOREIGN KEY (student_id, school_id)
    REFERENCES students(id, school_id) ON DELETE CASCADE,
  CONSTRAINT student_enrollments_class_school_fk FOREIGN KEY (class_id, school_id)
    REFERENCES school_classes(id, school_id)
);

CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subjects_school_name_unique UNIQUE (school_id, name),
  CONSTRAINT subjects_id_school_unique UNIQUE (id, school_id)
);

CREATE TABLE class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT class_subjects_school_class_subject_unique UNIQUE (school_id, class_id, subject_id),
  CONSTRAINT class_subjects_class_school_fk FOREIGN KEY (class_id, school_id)
    REFERENCES school_classes(id, school_id) ON DELETE CASCADE,
  CONSTRAINT class_subjects_subject_school_fk FOREIGN KEY (subject_id, school_id)
    REFERENCES subjects(id, school_id) ON DELETE CASCADE
);

CREATE TABLE student_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_subjects_school_enrollment_subject_unique UNIQUE (school_id, enrollment_id, subject_id),
  CONSTRAINT student_subjects_enrollment_school_fk FOREIGN KEY (enrollment_id, school_id)
    REFERENCES student_enrollments(id, school_id) ON DELETE CASCADE,
  CONSTRAINT student_subjects_subject_school_fk FOREIGN KEY (subject_id, school_id)
    REFERENCES subjects(id, school_id)
);

CREATE TABLE academic_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year text NOT NULL,
  name text NOT NULL CHECK (name IN ('First Term', 'Second Term', 'Third Term')),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academic_terms_school_year_name_unique UNIQUE (school_id, academic_year, name),
  CONSTRAINT academic_terms_id_school_unique UNIQUE (id, school_id)
);

CREATE TABLE staff_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  identity_user_id text NOT NULL,
  class_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_assignments_school_user_class_subject_unique
    UNIQUE (school_id, identity_user_id, class_id, subject_id),
  CONSTRAINT staff_assignments_membership_fk FOREIGN KEY (identity_user_id, school_id)
    REFERENCES school_memberships(identity_user_id, school_id) ON DELETE CASCADE,
  CONSTRAINT staff_assignments_class_school_fk FOREIGN KEY (class_id, school_id)
    REFERENCES school_classes(id, school_id) ON DELETE CASCADE,
  CONSTRAINT staff_assignments_subject_school_fk FOREIGN KEY (subject_id, school_id)
    REFERENCES subjects(id, school_id) ON DELETE CASCADE
);

CREATE TABLE score_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  term_id uuid NOT NULL,
  test_score integer CHECK (test_score IS NULL OR test_score BETWEEN 0 AND 40),
  exam_score integer CHECK (exam_score IS NULL OR exam_score BETWEEN 0 AND 60),
  entered_by text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT score_entries_school_enrollment_subject_term_unique
    UNIQUE (school_id, enrollment_id, subject_id, term_id),
  CONSTRAINT score_entries_membership_fk FOREIGN KEY (entered_by, school_id)
    REFERENCES school_memberships(identity_user_id, school_id),
  CONSTRAINT score_entries_enrollment_school_fk FOREIGN KEY (enrollment_id, school_id)
    REFERENCES student_enrollments(id, school_id) ON DELETE CASCADE,
  CONSTRAINT score_entries_subject_school_fk FOREIGN KEY (subject_id, school_id)
    REFERENCES subjects(id, school_id),
  CONSTRAINT score_entries_term_school_fk FOREIGN KEY (term_id, school_id)
    REFERENCES academic_terms(id, school_id) ON DELETE CASCADE
);

CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  identity_user_id text NOT NULL,
  action text NOT NULL,
  entity_id uuid NOT NULL,
  details jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_events_membership_fk FOREIGN KEY (identity_user_id, school_id)
    REFERENCES school_memberships(identity_user_id, school_id)
);

CREATE TABLE system_settings (
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL,
  updated_by text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (school_id, key),
  CONSTRAINT system_settings_membership_fk FOREIGN KEY (updated_by, school_id)
    REFERENCES school_memberships(identity_user_id, school_id)
);

CREATE INDEX student_enrollments_school_class_year_idx
  ON student_enrollments (school_id, class_id, academic_year);
CREATE INDEX score_entries_school_term_subject_idx
  ON score_entries (school_id, term_id, subject_id);
CREATE INDEX audit_events_school_entity_created_idx
  ON audit_events (school_id, entity_id, created_at);
