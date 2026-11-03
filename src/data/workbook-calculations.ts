export type ResultTerm = 'First Term' | 'Second Term' | 'Third Term'

export type TermAssessment = {
  testScore: number | null
  examScore: number | null
}

export type WorkbookSubjectScores = {
  subjectId: string
  name: string
  terms: Partial<Record<ResultTerm, TermAssessment>>
}

export type WorkbookStudentScores = {
  studentId: string
  subjects: WorkbookSubjectScores[]
}

export type CalculatedReportSubject = {
  subjectId: string
  name: string
  testScore: number | null
  examScore: number | null
  total: number | null
  firstTermTotal: number | null
  secondTermTotal: number | null
  average: number | null
  grade: string | null
  remark: string | null
  classAverage: number | null
  position: number | null
}

export type CalculatedReportStudent = {
  studentId: string
  subjects: CalculatedReportSubject[]
  totalMarksObtained: number | null
  totalMarksObtainable: number
  average: number | null
  grade: string | null
  position: number | null
}

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
  if (subjectTotals.length === 0) {
    throw new Error('At least one selected subject is required to calculate an average.')
  }

  return subjectTotals.reduce((sum, total) => sum + total, 0) / subjectTotals.length
}

export function calculateThirdTermAverage(
  firstTermTotal: number | null,
  secondTermTotal: number | null,
  thirdTermTotal: number | null,
): number | null {
  const totals = [firstTermTotal, secondTermTotal, thirdTermTotal]
    .filter((total): total is number => total !== null)
  if (totals.length === 0) return null
  return Math.round((totals.reduce((sum, total) => sum + total, 0) / totals.length) * 10) / 10
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

function scoreTotal(assessment: TermAssessment | undefined) {
  if (!assessment || (assessment.testScore === null && assessment.examScore === null)) return null
  return calculateSubjectTotal(assessment.testScore, assessment.examScore)
}

function roundedMean(values: readonly number[]) {
  if (values.length === 0) return null
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100
}

function subjectAverageForTerm(subject: WorkbookSubjectScores, term: ResultTerm) {
  if (term !== 'Third Term') return scoreTotal(subject.terms[term])
  return calculateThirdTermAverage(
    scoreTotal(subject.terms['First Term']),
    scoreTotal(subject.terms['Second Term']),
    scoreTotal(subject.terms['Third Term']),
  )
}

export function calculateWorkbookReportResults(term: ResultTerm, students: readonly WorkbookStudentScores[]) {
  const studentAverages = students.map(student => {
    const values = student.subjects
      .map(subject => subjectAverageForTerm(subject, term))
      .filter((value): value is number => value !== null)
    return values.length ? calculateOverallAverage(values) : null
  })
  const studentPositions = calculateCompetitionRanks(studentAverages.map(value => value ?? 0))

  const results: CalculatedReportStudent[] = students.map((student, studentIndex) => {
    const subjects = student.subjects.map(subject => {
      const currentAssessment = subject.terms[term]
      const total = scoreTotal(currentAssessment)
      const average = subjectAverageForTerm(subject, term)
      const peerValues = students
        .map(peer => {
          const peerSubject = peer.subjects.find(item => item.subjectId === subject.subjectId)
          return peerSubject ? subjectAverageForTerm(peerSubject, term) : null
        })
      const position = calculateCompetitionRanks(peerValues.map(value => value ?? 0))[studentIndex] ?? null
      const classAverage = roundedMean(peerValues.filter((value): value is number => value !== null))

      return {
        subjectId: subject.subjectId,
        name: subject.name,
        testScore: currentAssessment?.testScore ?? null,
        examScore: currentAssessment?.examScore ?? null,
        total,
        firstTermTotal: scoreTotal(subject.terms['First Term']),
        secondTermTotal: scoreTotal(subject.terms['Second Term']),
        average,
        grade: average === null ? null : calculateSubjectGrade(term, average),
        remark: average === null ? null : calculateSubjectRemark(term, subject.name, average),
        classAverage,
        position,
      }
    })
    const values = subjects
      .map(subject => subject.average)
      .filter((value): value is number => value !== null)
    const average = values.length ? calculateOverallAverage(values) : null

    return {
      studentId: student.studentId,
      subjects,
      totalMarksObtained: values.length ? values.reduce((sum, value) => sum + value, 0) : null,
      totalMarksObtainable: subjects.length * 100,
      average,
      grade: average === null ? null : calculateOverallGrade(average),
      position: studentPositions[studentIndex] ?? null,
    }
  })

  return results
}

export function calculateCompetitionRanks(values: readonly number[]) {
  return values.map(value =>
    value <= 0 ? null : 1 + values.filter(other => other > value).length,
  )
}

export function ordinal(n: number) {
  return `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th'}`
}
