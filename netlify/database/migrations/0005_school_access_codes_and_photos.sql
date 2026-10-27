ALTER TABLE students
  ADD COLUMN passport_photo_data_url text;

CREATE TABLE teacher_subject_access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id),
  identity_user_id text NOT NULL,
  class_id uuid NOT NULL REFERENCES school_classes(id),
  subject_id uuid NOT NULL REFERENCES subjects(id),
  code_hash text NOT NULL,
  code_salt text NOT NULL,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teacher_subject_access_codes_assignment_unique
    UNIQUE (school_id, identity_user_id, class_id, subject_id),
  CONSTRAINT teacher_subject_access_codes_failed_attempts_check
    CHECK (failed_attempts BETWEEN 0 AND 5)
);

CREATE TABLE parent_student_access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id),
  student_id uuid NOT NULL REFERENCES students(id),
  code_hash text NOT NULL,
  code_salt text NOT NULL,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT parent_student_access_codes_student_unique
    UNIQUE (school_id, student_id),
  CONSTRAINT parent_student_access_codes_failed_attempts_check
    CHECK (failed_attempts BETWEEN 0 AND 5)
);
