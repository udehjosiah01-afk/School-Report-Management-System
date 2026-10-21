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

export const schoolClasses = pgTable('school_classes', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const students = pgTable('students', {
  id: uuid('id').defaultRandom().primaryKey(),
  admissionNumber: text('admission_number').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const studentEnrollments = pgTable('student_enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => students.id),
  classId: uuid('class_id').notNull().references(() => schoolClasses.id),
  academicYear: text('academic_year').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('student_enrollments_student_year_unique').on(table.studentId, table.academicYear),
])

export const subjects = pgTable('subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const studentSubjects = pgTable('student_subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  enrollmentId: uuid('enrollment_id').notNull().references(() => studentEnrollments.id),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('student_subjects_enrollment_subject_unique').on(table.enrollmentId, table.subjectId),
])

export const academicTerms = pgTable('academic_terms', {
  id: uuid('id').defaultRandom().primaryKey(),
  academicYear: text('academic_year').notNull(),
  name: text('name').notNull(),
  isPublished: boolean('is_published').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('academic_terms_year_name_unique').on(table.academicYear, table.name),
  check('academic_terms_name_check', sql`${table.name} in ('First Term', 'Second Term', 'Third Term')`),
])

export const staffAssignments = pgTable('staff_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  identityUserId: text('identity_user_id').notNull(),
  classId: uuid('class_id').notNull().references(() => schoolClasses.id),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('staff_assignments_user_class_subject_unique').on(
    table.identityUserId,
    table.classId,
    table.subjectId,
  ),
])

export const scoreEntries = pgTable('score_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  enrollmentId: uuid('enrollment_id').notNull().references(() => studentEnrollments.id),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id),
  termId: uuid('term_id').notNull().references(() => academicTerms.id),
  testScore: integer('test_score'),
  examScore: integer('exam_score'),
  enteredBy: text('entered_by').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('score_entries_enrollment_subject_term_unique').on(
    table.enrollmentId,
    table.subjectId,
    table.termId,
  ),
  check('score_entries_test_score_check', sql`${table.testScore} is null or ${table.testScore} between 0 and 40`),
  check('score_entries_exam_score_check', sql`${table.examScore} is null or ${table.examScore} between 0 and 60`),
])

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  identityUserId: text('identity_user_id').notNull(),
  action: text('action').notNull(),
  entityId: uuid('entity_id').notNull(),
  details: jsonb('details').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
