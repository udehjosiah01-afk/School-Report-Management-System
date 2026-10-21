import { admin } from '@netlify/identity'
import { and, asc, eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { academicTerms, schoolClasses, scoreEntries, staffAssignments, studentEnrollments, studentSubjects, students, subjects } from '../data/schema'
import { requireStaff } from './auth'
import { getDb } from './database'
import { isUuid } from '../data/score-validation'

function requiredText(value: unknown, label: string, maxLength = 120) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.trim().length > maxLength) {
    throw new Error(`${label} is required and must be ${maxLength} characters or fewer.`)
  }
  return value.trim()
}

function requiredId(value: unknown, label: string) {
  if (!isUuid(value)) {
    throw new Error(`${label} is invalid.`)
  }
  return value
}

function validateName(value: unknown) {
  return { name: requiredText((value as Record<string, unknown>)?.name, 'Name') }
}

function validateTerm(value: unknown) {
  const input = value as Record<string, unknown> | null
  const name = requiredText(input?.name, 'Term')
  if (!['First Term', 'Second Term', 'Third Term'].includes(name)) {
    throw new Error('Select First Term, Second Term, or Third Term.')
  }
  return {
    name,
    academicYear: requiredText(input?.academicYear, 'Academic year', 20),
  }
}

function validateStudent(value: unknown) {
  const input = value as Record<string, unknown> | null
  const rawSubjectIds = input?.subjectIds
  if (
    !Array.isArray(rawSubjectIds) ||
    rawSubjectIds.length === 0 ||
    rawSubjectIds.length > 50
  ) {
    throw new Error('Select one or more registered subjects for this student.')
  }
  const subjectIds = rawSubjectIds.map(subjectId => requiredId(subjectId, 'Subject'))
  if (new Set(subjectIds).size !== subjectIds.length) {
    throw new Error('A subject can only be selected once.')
  }
  return {
    admissionNumber: requiredText(input?.admissionNumber, 'Admission number', 40),
    firstName: requiredText(input?.firstName, 'First name', 80),
    lastName: requiredText(input?.lastName, 'Last name', 80),
    classId: requiredId(input?.classId, 'Class'),
    academicYear: requiredText(input?.academicYear, 'Academic year', 20),
    subjectIds,
  }
}

function validateScoreSheet(value: unknown) {
  const input = value as Record<string, unknown> | null
  return {
    classId: requiredId(input?.classId, 'Class'),
    subjectId: requiredId(input?.subjectId, 'Subject'),
    termId: requiredId(input?.termId, 'Term'),
  }
}

function validateAssignment(value: unknown) {
  const input = value as Record<string, unknown> | null
  return {
    identityUserId: requiredText(input?.identityUserId, 'Staff account ID', 120),
    classId: requiredId(input?.classId, 'Class'),
    subjectId: requiredId(input?.subjectId, 'Subject'),
  }
}

export const getSchoolSetup = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await requireStaff()
  const db = getDb()
  const isAdmin = user.roles?.includes('admin') ?? false
  const classRows = isAdmin
    ? await db.select().from(schoolClasses).orderBy(asc(schoolClasses.name))
    : await db.selectDistinct({
        id: schoolClasses.id,
        name: schoolClasses.name,
        createdAt: schoolClasses.createdAt,
      })
        .from(schoolClasses)
        .innerJoin(staffAssignments, eq(staffAssignments.classId, schoolClasses.id))
        .where(eq(staffAssignments.identityUserId, user.id))
        .orderBy(asc(schoolClasses.name))
  const subjectRows = isAdmin
    ? await db.select().from(subjects).orderBy(asc(subjects.name))
    : await db.selectDistinct({
        id: subjects.id,
        name: subjects.name,
        createdAt: subjects.createdAt,
      })
        .from(subjects)
        .innerJoin(staffAssignments, eq(staffAssignments.subjectId, subjects.id))
        .where(eq(staffAssignments.identityUserId, user.id))
        .orderBy(asc(subjects.name))
  const termRows = await db
    .select()
    .from(academicTerms)
    .orderBy(asc(academicTerms.academicYear), asc(academicTerms.name))
  const enrollmentQuery = db.select({
      id: studentEnrollments.id,
      studentId: students.id,
      admissionNumber: students.admissionNumber,
      firstName: students.firstName,
      lastName: students.lastName,
      classId: schoolClasses.id,
      className: schoolClasses.name,
      academicYear: studentEnrollments.academicYear,
    })
      .from(studentEnrollments)
      .innerJoin(students, eq(students.id, studentEnrollments.studentId))
      .innerJoin(schoolClasses, eq(schoolClasses.id, studentEnrollments.classId))
  const enrollmentRows = isAdmin
    ? await enrollmentQuery.orderBy(asc(studentEnrollments.academicYear), asc(schoolClasses.name), asc(students.lastName))
    : await enrollmentQuery
        .innerJoin(staffAssignments, eq(staffAssignments.classId, studentEnrollments.classId))
        .where(eq(staffAssignments.identityUserId, user.id))
        .orderBy(asc(studentEnrollments.academicYear), asc(schoolClasses.name), asc(students.lastName))
  return { classes: classRows, subjects: subjectRows, terms: termRows, enrollments: enrollmentRows }
})

export const createSchoolClass = createServerFn({ method: 'POST' })
  .validator(validateName)
  .handler(async ({ data }) => {
    await requireStaff('admin')
    const [result] = await getDb().insert(schoolClasses).values(data).returning()
    if (!result) throw new Error('The class could not be created.')
    return result
  })

export const createSubject = createServerFn({ method: 'POST' })
  .validator(validateName)
  .handler(async ({ data }) => {
    await requireStaff('admin')
    const [result] = await getDb().insert(subjects).values(data).returning()
    if (!result) throw new Error('The subject could not be created.')
    return result
  })

export const createAcademicTerm = createServerFn({ method: 'POST' })
  .validator(validateTerm)
  .handler(async ({ data }) => {
    await requireStaff('admin')
    const [result] = await getDb().insert(academicTerms).values(data).returning()
    if (!result) throw new Error('The term could not be created.')
    return result
  })

export const createStudent = createServerFn({ method: 'POST' })
  .validator(validateStudent)
  .handler(async ({ data }) => {
    await requireStaff('admin')
    const db = getDb()
    return db.transaction(async tx => {
      const [student] = await tx
        .insert(students)
        .values({
          admissionNumber: data.admissionNumber,
          firstName: data.firstName,
          lastName: data.lastName,
        })
        .returning()
      if (!student) throw new Error('The student record could not be created.')

      const [enrollment] = await tx
        .insert(studentEnrollments)
        .values({
          studentId: student.id,
          classId: data.classId,
          academicYear: data.academicYear,
        })
        .returning()
      if (!enrollment) throw new Error('The student enrollment could not be created.')

      await tx.insert(studentSubjects).values(data.subjectIds.map(subjectId => ({
        enrollmentId: enrollment.id,
        subjectId,
      })))
      return enrollment
    })
  })

export const getIdentityStaff = createServerFn({ method: 'GET' }).handler(async () => {
  await requireStaff('admin')
  const users = await admin.listUsers({ perPage: 100 })
  return users
    .filter(user => user.roles?.some(role => role === 'admin' || role === 'teacher'))
    .map(user => ({ id: user.id, email: user.email ?? '', roles: user.roles ?? [] }))
})

export const assignTeacher = createServerFn({ method: 'POST' })
  .validator(validateAssignment)
  .handler(async ({ data }) => {
    await requireStaff('admin')
    const user = await admin.getUser(data.identityUserId)
    if (!user.roles?.includes('teacher')) {
      throw new Error('Only a Netlify Identity account with the teacher role can receive a teaching assignment.')
    }
    const [assignment] = await getDb()
      .insert(staffAssignments)
      .values(data)
      .onConflictDoNothing({
        target: [
          staffAssignments.identityUserId,
          staffAssignments.classId,
          staffAssignments.subjectId,
        ],
      })
      .returning()
    return assignment ?? null
  })

export const getScoreSheet = createServerFn({ method: 'GET' })
  .validator(validateScoreSheet)
  .handler(async ({ data }) => {
    const user = await requireStaff()
    const db = getDb()
    const [term] = await db
      .select({
        academicYear: academicTerms.academicYear,
        isPublished: academicTerms.isPublished,
      })
      .from(academicTerms)
      .where(eq(academicTerms.id, data.termId))
      .limit(1)
    if (!term) throw new Error('The selected term does not exist.')
    if (term.isPublished) throw new Error('Scores in this term have been published and are locked.')

    if (!user.roles?.includes('admin')) {
      const [assignment] = await db
        .select({ id: staffAssignments.id })
        .from(staffAssignments)
        .where(and(
          eq(staffAssignments.identityUserId, user.id),
          eq(staffAssignments.classId, data.classId),
          eq(staffAssignments.subjectId, data.subjectId),
        ))
        .limit(1)
      if (!assignment) throw new Error('You are not assigned to this class and subject.')
    }

    return db
      .select({
        enrollmentId: studentEnrollments.id,
        studentId: students.id,
        admissionNumber: students.admissionNumber,
        firstName: students.firstName,
        lastName: students.lastName,
        testScore: scoreEntries.testScore,
        examScore: scoreEntries.examScore,
      })
      .from(studentSubjects)
      .innerJoin(studentEnrollments, eq(studentEnrollments.id, studentSubjects.enrollmentId))
      .innerJoin(students, eq(students.id, studentEnrollments.studentId))
      .leftJoin(scoreEntries, and(
        eq(scoreEntries.enrollmentId, studentEnrollments.id),
        eq(scoreEntries.subjectId, studentSubjects.subjectId),
        eq(scoreEntries.termId, data.termId),
      ))
      .where(and(
        eq(studentSubjects.subjectId, data.subjectId),
        eq(studentEnrollments.classId, data.classId),
        eq(studentEnrollments.academicYear, term.academicYear),
      ))
      .orderBy(asc(students.lastName), asc(students.firstName))
  })
