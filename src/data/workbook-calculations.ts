export type ResultTerm = 'First Term' | 'Second Term' | 'Third Term'

const firstAndSecondTermGrades = [
  [79, 'A'],
  [69, 'B+'],
  [59, 'B'],
  [49, 'C'],
  [44, 'D'],
  [39, 'E'],
  [Number.NEGATIVE_INFINITY, 'F'],
] as const

const firstAndSecondTermOverallGrades = [
  [74, 'A'],
  [69, 'B'],
  [64, 'B+'],
  [59, 'C'],
  [54, 'C+'],
  [49, 'D'],
  [44, 'E'],
  [Number.NEGATIVE_INFINITY, 'F'],
] as const

const firstAndSecondTermMathRemarks = [
  [79, 'DISTINCTION'],
  [69, 'VERY GOOD'],
  [59, 'GOOD'],
  [49, 'AVERAGE'],
  [44, 'WEAK'],
  [39, 'VERY WEAK'],
  [Number.NEGATIVE_INFINITY, 'FAIL'],
] as const

const firstAndSecondTermSubjectRemarks = [
  [74, 'DISTINCTION'],
  [69, 'VERY GOOD'],
  [64, 'GOOD'],
  [59, 'GOOD'],
  [54, 'AVERAGE'],
  [49, 'PASS'],
  [44, 'FAIR'],
  [39, 'POOR'],
  [Number.NEGATIVE_INFINITY, 'FAIL'],
] as const

const thirdTermSubjectGrades = [
  [74, 'DISTINCTION'],
  [69, 'VERY GOOD'],
  [64, 'GOOD'],
  [59, 'GOOD'],
  [54, 'AVERAGE'],
  [49, 'PASS'],
  [44, 'FAIR'],
  [39, 'POOR'],
  [Number.NEGATIVE_INFINITY, 'FAIL'],
] as const

export const TEST_MAX = 40
export const EXAM_MAX = 60
export const OVERALL_SUBJECT_DIVISOR = 10

export function isResultTerm(value: string): value is ResultTerm {
  return value === 'First Term' || value === 'Second Term' || value === 'Third Term'
}

export function calculateSubjectTotal(test: number | null, exam: number | null) {
  return (test ?? 0) + (exam ?? 0)
}

export function isAssessmentScoreValid(score: number, maximum: number) {
  return Number.isFinite(score) && score >= 0 && score <= maximum
}

export function calculateOverallAverage(subjectTotals: readonly number[]) {
  return subjectTotals.reduce((sum, total) => sum + total, 0) / OVERALL_SUBJECT_DIVISOR
}

export function calculateThirdTermAverage(
  firstTermTotal: number,
  secondTermTotal: number,
  thirdTermTotal: number,
) {
  return Math.round(((firstTermTotal + secondTermTotal + thirdTermTotal) / 3) * 10) / 10
}

function atThreshold<T extends string>(
  score: number,
  thresholds: readonly (readonly [number, T])[],
): T {
  return thresholds.find(([threshold]) => score > threshold)![1]
}

export function calculateSubjectGrade(term: ResultTerm, total: number) {
  return term === 'Third Term'
    ? atThreshold(total, thirdTermSubjectGrades)
    : atThreshold(total, firstAndSecondTermGrades)
}

export function calculateSubjectRemark(term: ResultTerm, subject: string, total: number) {
  if (term === 'Third Term') return null

  return subject === 'Mathematics'
    ? atThreshold(total, firstAndSecondTermMathRemarks)
    : atThreshold(total, firstAndSecondTermSubjectRemarks)
}

export function calculateOverallGrade(average: number) {
  return atThreshold(average, firstAndSecondTermOverallGrades)
}

export function calculateCompetitionRanks(values: readonly number[]) {
  return values.map(value =>
    value <= 0 ? null : 1 + values.filter(other => other > value).length,
  )
}

export function ordinal(n: number) {
  return `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th'}`
}
