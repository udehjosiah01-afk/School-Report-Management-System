export const students = pgTable('students', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  admissionNumber: text('admission_number').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  passportPhotoDataUrl: text('passport_photo_data_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('students_school_admission_unique').on(table.schoolId, table.admissionNumber),
])

export const teacherSubjectAccessCodes = pgTable('teacher_subject_access_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  identityUserId: text('identity_user_id').notNull(),
  classId: uuid('class_id').notNull().references(() => schoolClasses.id),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id),
  codeHash: text('code_hash').notNull(),
  codeSalt: text('code_salt').notNull(),
  failedAttempts: integer('failed_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('teacher_subject_access_codes_assignment_unique').on(
    table.schoolId,
    table.identityUserId,
    table.classId,
    table.subjectId,
  ),
  check('teacher_subject_access_codes_failed_attempts_check', sql`${table.failedAttempts} between 0 and 5`),
])

export const parentStudentAccessCodes = pgTable('parent_student_access_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  studentId: uuid('student_id').notNull().references(() => students.id),
  codeHash: text('code_hash').notNull(),
  codeSalt: text('code_salt').notNull(),
  failedAttempts: integer('failed_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('parent_student_access_codes_student_unique').on(table.schoolId, table.studentId),
  check('parent_student_access_codes_failed_attempts_check', sql`${table.failedAttempts} between 0 and 5`),
])

export const studentEnrollments = pgTable('student_enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  studentId: uuid('student_id').notNull().references(() => students.id),
  classId: uuid('class_id').notNull().references(() => schoolClasses.id),
  academicYear: text('academic_year').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('student_enrollments_school_student_year_unique').on(
    table.schoolId,
    table.studentId,
    table.academicYear,
  ),
])
