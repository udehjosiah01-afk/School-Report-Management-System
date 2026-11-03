import {
  boolean,
  check,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const schools = pgTable('schools', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  contactEmail: text('contact_email').notNull(),
  motto: text('motto').notNull().default(''),
  logoUrl: text('logo_url'),
  mainColor: text('main_color').notNull().default('#c62828'),
  accentColor: text('accent_color').notNull().default('#38bdf8'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const schoolMemberships = pgTable('school_memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  identityUserId: text('identity_user_id').notNull().unique(),
  role: text('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  check('school_memberships_role_check', sql`${table.role} in ('admin', 'teacher')`),
  unique('school_memberships_school_identity_unique').on(table.schoolId, table.identityUserId),
])

export const schoolClasses = pgTable('school_classes', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('school_classes_school_name_unique').on(table.schoolId, table.name),
])

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

export const subjects = pgTable('subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('subjects_school_name_unique').on(table.schoolId, table.name),
])

export const classSubjects = pgTable('class_subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  classId: uuid('class_id').notNull().references(() => schoolClasses.id),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('class_subjects_school_class_subject_unique').on(table.schoolId, table.classId, table.subjectId),
])

export const studentSubjects = pgTable('student_subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  enrollmentId: uuid('enrollment_id').notNull().references(() => studentEnrollments.id),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('student_subjects_school_enrollment_subject_unique').on(
    table.schoolId,
    table.enrollmentId,
    table.subjectId,
  ),
])

export const academicTerms = pgTable('academic_terms', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  academicYear: text('academic_year').notNull(),
  name: text('name').notNull(),
  isPublished: boolean('is_published').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('academic_terms_school_year_name_unique').on(table.schoolId, table.academicYear, table.name),
  check('academic_terms_name_check', sql`${table.name} in ('First Term', 'Second Term', 'Third Term')`),
])

export const staffAssignments = pgTable('staff_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  identityUserId: text('identity_user_id').notNull(),
  classId: uuid('class_id').notNull().references(() => schoolClasses.id),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('staff_assignments_school_user_class_subject_unique').on(
    table.schoolId,
    table.identityUserId,
    table.classId,
    table.subjectId,
  ),
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

export const scoreEntries = pgTable('score_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  enrollmentId: uuid('enrollment_id').notNull().references(() => studentEnrollments.id),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id),
  termId: uuid('term_id').notNull().references(() => academicTerms.id),
  testScore: integer('test_score'),
  examScore: integer('exam_score'),
  enteredBy: text('entered_by').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('score_entries_school_enrollment_subject_term_unique').on(
    table.schoolId,
    table.enrollmentId,
    table.subjectId,
    table.termId,
  ),
  check('score_entries_test_score_check', sql`${table.testScore} is null or ${table.testScore} between 0 and 40`),
  check('score_entries_exam_score_check', sql`${table.examScore} is null or ${table.examScore} between 0 and 60`),
])

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  identityUserId: text('identity_user_id').notNull(),
  action: text('action').notNull(),
  entityId: uuid('entity_id').notNull(),
  details: jsonb('details').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const systemSettings = pgTable('system_settings', {
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  key: text('key').notNull(),
  value: jsonb('value').notNull(),
  updatedBy: text('updated_by').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('system_settings_school_key_unique').on(table.schoolId, table.key),
])
