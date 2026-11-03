import { createServerFn } from '@tanstack/react-start'
import { validateDraftScoreInput } from '../data/score-validation'

export const saveDraftScore = createServerFn({ method: 'POST' })
  .validator(validateDraftScoreInput)
  .handler(async ({ data }) => {
    const [
      { and, eq },
      { academicTerms, auditEvents, scoreEntries, staffAssignments, studentEnrollments, studentSubjects, teacherSubjectAccessCodes },
      { requireStaff },
      { getDb },
      accessCodes,
    ] = await Promise.all([
      import('drizzle-orm'),
      import('../data/schema'),
      import('./auth.server'),
      import('./database'),
      import('./access-codes'),
    ])
    const user = await requireStaff()
    const db = getDb()

    const [scope] = await db
      .select({ classId: studentEnrollments.classId })
      .from(studentSubjects)
      .innerJoin(studentEnrollments, eq(studentEnrollments.id, studentSubjects.enrollmentId))
      .innerJoin(academicTerms, and(
        eq(academicTerms.id, data.termId),
        eq(academicTerms.academicYear, studentEnrollments.academicYear),
      ))
      .where(and(
        eq(studentSubjects.schoolId, user.schoolId),
        eq(studentEnrollments.schoolId, user.schoolId),
        eq(academicTerms.schoolId, user.schoolId),
        eq(studentEnrollments.id, data.enrollmentId),
        eq(studentSubjects.subjectId, data.subjectId),
        eq(academicTerms.isPublished, false),
      ))
      .limit(1)

    if (!scope) {
      throw new Error('This enrollment and term do not match, or the term is already published.')
    }

    if (user.role !== 'admin') {
      const [assignment] = await db
        .select({ id: staffAssignments.id })
        .from(staffAssignments)
        .where(and(
          eq(staffAssignments.identityUserId, user.id),
          eq(staffAssignments.schoolId, user.schoolId),
          eq(staffAssignments.classId, scope.classId),
          eq(staffAssignments.subjectId, data.subjectId),
        ))
        .limit(1)

      if (!assignment) {
        throw new Error('You are not assigned to enter scores for this class and subject.')
      }
      const [codeRecord] = await db.select({
        id: teacherSubjectAccessCodes.id,
        codeHash: teacherSubjectAccessCodes.codeHash,
        codeSalt: teacherSubjectAccessCodes.codeSalt,
        failedAttempts: teacherSubjectAccessCodes.failedAttempts,
        lockedUntil: teacherSubjectAccessCodes.lockedUntil,
      }).from(teacherSubjectAccessCodes).where(and(
        eq(teacherSubjectAccessCodes.schoolId, user.schoolId),
        eq(teacherSubjectAccessCodes.identityUserId, user.id),
        eq(teacherSubjectAccessCodes.classId, scope.classId),
        eq(teacherSubjectAccessCodes.subjectId, data.subjectId),
      )).limit(1)
      if (!data.teacherAccessCode || !codeRecord) {
        throw new Error('Enter the four-digit access code for this class and subject.')
      }
      if (accessCodes.isAccessCodeLocked(codeRecord.lockedUntil)) {
        throw new Error('This subject access code is temporarily locked. Ask the administrator to reset it.')
      }
      if (!accessCodes.verifyAccessCode(data.teacherAccessCode, codeRecord.codeHash, codeRecord.codeSalt)) {
        const state = accessCodes.failedAccessCodeState(codeRecord.failedAttempts)
        await db.update(teacherSubjectAccessCodes).set({
          ...state,
          updatedAt: new Date(),
        }).where(eq(teacherSubjectAccessCodes.id, codeRecord.id))
        throw new Error('The subject access code is incorrect.')
      }
      await db.update(teacherSubjectAccessCodes).set({
        failedAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      }).where(eq(teacherSubjectAccessCodes.id, codeRecord.id))
    }

    return db.transaction(async tx => {
      const [entry] = await tx
        .insert(scoreEntries)
        .values({
          schoolId: user.schoolId,
          enrollmentId: data.enrollmentId,
          subjectId: data.subjectId,
          termId: data.termId,
          testScore: data.testScore,
          examScore: data.examScore,
          enteredBy: user.id,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [
            scoreEntries.schoolId,
            scoreEntries.enrollmentId,
            scoreEntries.subjectId,
            scoreEntries.termId,
          ],
          set: {
            testScore: data.testScore,
            examScore: data.examScore,
            enteredBy: user.id,
            updatedAt: new Date(),
          },
        })
        .returning({
          id: scoreEntries.id,
          testScore: scoreEntries.testScore,
          examScore: scoreEntries.examScore,
          updatedAt: scoreEntries.updatedAt,
        })

      if (!entry) {
        throw new Error('The draft score could not be saved.')
      }

      await tx.insert(auditEvents).values({
        schoolId: user.schoolId,
        identityUserId: user.id,
        action: 'score.draft.saved',
        entityId: entry.id,
        details: {
          enrollmentId: data.enrollmentId,
          subjectId: data.subjectId,
          termId: data.termId,
          testScore: data.testScore,
          examScore: data.examScore,
        },
      })

      return entry
    })
  })
