import type { DraftScoreInput } from './score-validation'

export type ScoreSheetSaveRow = Pick<DraftScoreInput, 'enrollmentId' | 'testScore' | 'examScore'> & {
  firstName: string
  lastName: string
}

export type ScoreSheetSaveFailure = {
  studentName: string
  message: string
}

export type ScoreSheetSaveSummary = {
  savedCount: number
  totalCount: number
  failures: ScoreSheetSaveFailure[]
  refreshError?: string
}

type ScoreSheetSaverOptions = {
  rows: ScoreSheetSaveRow[]
  selection: Pick<DraftScoreInput, 'subjectId' | 'termId'>
  save: (input: DraftScoreInput) => Promise<unknown>
  onStart: (total: number) => void
  onProgress: (completed: number, total: number) => void
  refresh: () => Promise<string | undefined>
}

export function createScoreSheetSaver() {
  let isSaving = false

  return {
    get isSaving() {
      return isSaving
    },

    save(options: ScoreSheetSaverOptions): Promise<ScoreSheetSaveSummary> | null {
      if (isSaving || options.rows.length === 0) return null

      isSaving = true
      options.onStart(options.rows.length)

      return (async () => {
        const failures: ScoreSheetSaveFailure[] = []
        let savedCount = 0

        for (const row of options.rows) {
          try {
            await options.save({
              enrollmentId: row.enrollmentId,
              subjectId: options.selection.subjectId,
              termId: options.selection.termId,
              testScore: row.testScore,
              examScore: row.examScore,
            })
            savedCount += 1
          } catch (reason) {
            failures.push({
              studentName: `${row.firstName} ${row.lastName}`,
              message: reason instanceof Error ? reason.message : 'The score could not be saved.',
            })
          }

          options.onProgress(savedCount + failures.length, options.rows.length)
        }

        let refreshError: string | undefined
        if (savedCount > 0) {
          try {
            refreshError = await options.refresh()
          } catch (reason) {
            refreshError = reason instanceof Error
              ? reason.message
              : 'The updated score sheet could not be refreshed.'
          }
        }

        return {
          savedCount,
          totalCount: options.rows.length,
          failures,
          refreshError,
        }
      })().finally(() => {
        isSaving = false
      })
    },
  }
}
