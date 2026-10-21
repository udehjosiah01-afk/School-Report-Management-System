export type DraftScoreInput = {
  enrollmentId: string
  subjectId: string
  termId: string
  testScore: number | null
  examScore: number | null
}

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && idPattern.test(value)
}

function isScore(value: unknown, maximum: number): value is number | null {
  return value === null ||
    (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= maximum)
}

export function validateDraftScoreInput(value: unknown): DraftScoreInput {
  if (!value || typeof value !== 'object') {
    throw new Error('A score entry is required.')
  }

  const input = value as Record<string, unknown>
  const { enrollmentId, subjectId, termId, testScore, examScore } = input
  if (
    !isUuid(enrollmentId) ||
    !isUuid(subjectId) ||
    !isUuid(termId) ||
    !isScore(testScore, 40) ||
    !isScore(examScore, 60)
  ) {
    throw new Error('Score entry is invalid. Test scores must be 0–40 and examination scores 0–60.')
  }

  return { enrollmentId, subjectId, termId, testScore, examScore }
}
