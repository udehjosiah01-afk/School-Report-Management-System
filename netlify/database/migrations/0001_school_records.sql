CREATE TABLE school_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE student_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id),
  class_id uuid NOT NULL REFERENCES school_classes(id),
  academic_year text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_enrollments_student_year_unique UNIQUE (student_id, academic_year)
);

CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE student_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES student_enrollments(id),
  subject_id uuid NOT NULL REFERENCES subjects(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_subjects_enrollment_subject_unique UNIQUE (enrollment_id, subject_id)
);

CREATE TABLE academic_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year text NOT NULL,
  name text NOT NULL CHECK (name IN ('First Term', 'Second Term', 'Third Term')),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academic_terms_year_name_unique UNIQUE (academic_year, name)
);

CREATE TABLE staff_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_user_id text NOT NULL,
  class_id uuid NOT NULL REFERENCES school_classes(id),
  subject_id uuid NOT NULL REFERENCES subjects(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_assignments_user_class_subject_unique
    UNIQUE (identity_user_id, class_id, subject_id)
);

CREATE TABLE score_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES student_enrollments(id),
  subject_id uuid NOT NULL REFERENCES subjects(id),
  term_id uuid NOT NULL REFERENCES academic_terms(id),
  test_score integer CHECK (test_score IS NULL OR test_score BETWEEN 0 AND 40),
  exam_score integer CHECK (exam_score IS NULL OR exam_score BETWEEN 0 AND 60),
  entered_by text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT score_entries_enrollment_subject_term_unique
    UNIQUE (enrollment_id, subject_id, term_id)
);

CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_user_id text NOT NULL,
  action text NOT NULL,
  entity_id uuid NOT NULL,
  details jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX student_enrollments_class_year_idx
  ON student_enrollments (class_id, academic_year);
CREATE INDEX score_entries_term_subject_idx
  ON score_entries (term_id, subject_id);
CREATE INDEX audit_events_entity_created_idx
  ON audit_events (entity_id, created_at);
