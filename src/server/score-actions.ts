import { and, eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { validateDraftScoreInput } from '../data/score-validation'
import { academicTerms, auditEvents, scoreEntries, staffAssignments, studentEnrollments, studentSubjects } from '../data/schema'
import { requireStaff } from './auth'
import { getDb } from './database'

export const saveDraftScore = createServerFn({ method: 'POST' })
  .validator(validateDraftScoreInput)
  .handler(async ({ data }) => {
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
        eq(studentEnrollments.id, data.enrollmentId),
        eq(studentSubjects.subjectId, data.subjectId),
        eq(academicTerms.isPublished, false),
      ))
      .limit(1)

    if (!scope) {
      throw new Error('This enrollment and term do not match, or the term is already published.')
    }

    if (!user.roles?.includes('admin')) {
      const [assignment] = await db
        .select({ id: staffAssignments.id })
        .from(staffAssignments)
        .where(and(
          eq(staffAssignments.identityUserId, user.id),
          eq(staffAssignments.classId, scope.classId),
          eq(staffAssignments.subjectId, data.subjectId),
        ))
        .limit(1)

      if (!assignment) {
        throw new Error('You are not assigned to enter scores for this class and subject.')
      }
    }

    return db.transaction(async tx => {
      const [entry] = await tx
        .insert(scoreEntries)
        .values({
          ...data,
          enteredBy: user.id,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [scoreEntries.enrollmentId, scoreEntries.subjectId, scoreEntries.termId],
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
