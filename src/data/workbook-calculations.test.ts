import assert from 'node:assert/strict'
import test from 'node:test'
import { classes, initialScores, names, subjects, terms } from './fixtures.ts'
import { validateDraftScoreInput } from './score-validation.ts'
import {
  calculateCompetitionRanks,
  calculateOverallAverage,
  calculateOverallGrade,
  calculateSubjectTotal,
  calculateSubjectGrade,
  calculateSubjectRemark,
  calculateThirdTermAverage,
  EXAM_MAX,
  isAssessmentScoreValid,
  OVERALL_SUBJECT_DIVISOR,
  ordinal,
  TEST_MAX,
} from './workbook-calculations.ts'

test('illustrative fixtures contain the workbook subjects and valid 40/60 scores', () => {
  assert.equal(classes.length, 3)
  assert.equal(names.length, 16)
  assert.equal(subjects.length, 13)
  assert.equal(terms.length, 3)

  for (const [testScore, examScore] of Object.values(initialScores())) {
    assert.equal(isAssessmentScoreValid(testScore, TEST_MAX), true)
    assert.equal(isAssessmentScoreValid(examScore, EXAM_MAX), true)
  }
})

test('test and examination totals add scores and treat blank scores as zero', () => {
  assert.equal(TEST_MAX, 40)
  assert.equal(EXAM_MAX, 60)
  assert.equal(calculateSubjectTotal(40, 60), 100)
  assert.equal(calculateSubjectTotal(null, 60), 60)
  assert.equal(calculateSubjectTotal(null, null), 0)
  assert.equal(isAssessmentScoreValid(0, TEST_MAX), true)
  assert.equal(isAssessmentScoreValid(TEST_MAX, TEST_MAX), true)
  assert.equal(isAssessmentScoreValid(TEST_MAX + 1, TEST_MAX), false)
  assert.equal(isAssessmentScoreValid(-1, EXAM_MAX), false)
  assert.equal(isAssessmentScoreValid(Number.NaN, EXAM_MAX), false)
})

test('draft score validation accepts nullable scores within the workbook limits', () => {
  const valid = {
    enrollmentId: '123e4567-e89b-42d3-a456-426614174000',
    subjectId: '123e4567-e89b-42d3-a456-426614174001',
    termId: '123e4567-e89b-42d3-a456-426614174002',
    testScore: null,
    examScore: 60,
  }

  assert.deepEqual(validateDraftScoreInput(valid), valid)
  assert.throws(
    () => validateDraftScoreInput({ ...valid, testScore: 41 }),
    /Test scores must be 0–40/,
  )
  assert.throws(
    () => validateDraftScoreInput({ ...valid, examScore: 60.5 }),
    /examination scores 0–60/,
  )
  assert.throws(
    () => validateDraftScoreInput({ ...valid, termId: 'invalid-id' }),
    /Score entry is invalid/,
  )
})

test('overall averages use the workbook divisor of ten', () => {
  assert.equal(OVERALL_SUBJECT_DIVISOR, 10)
  assert.equal(calculateOverallAverage(Array(13).fill(80)), 104)
})

test('first and second term subject grades follow workbook cutoffs', () => {
  const cases = [
    [80, 'A'],
    [79, 'B+'],
    [70, 'B+'],
    [69, 'B'],
    [60, 'B'],
    [59, 'C'],
    [50, 'C'],
    [49, 'D'],
    [45, 'D'],
    [44, 'E'],
    [40, 'E'],
    [39, 'F'],
  ] as const

  for (const [score, expected] of cases) {
    assert.equal(calculateSubjectGrade('First Term', score), expected)
    assert.equal(calculateSubjectGrade('Second Term', score), expected)
  }
})

test('first and second term remarks preserve their workbook subject-specific thresholds', () => {
  assert.equal(calculateSubjectRemark('First Term', 'Mathematics', 75), 'VERY GOOD')
  assert.equal(calculateSubjectRemark('First Term', 'Mathematics', 59), 'AVERAGE')
  assert.equal(calculateSubjectRemark('First Term', 'English Language', 75), 'DISTINCTION')
  assert.equal(calculateSubjectRemark('First Term', 'English Language', 74), 'VERY GOOD')
  assert.equal(calculateSubjectRemark('Second Term', 'Mathematics', 45), 'WEAK')
  assert.equal(calculateSubjectRemark('Second Term', 'Biology', 45), 'FAIR')
})

test('third term subject results use the separate descriptive threshold scale', () => {
  const cases = [
    [75, 'DISTINCTION'],
    [70, 'VERY GOOD'],
    [65, 'GOOD'],
    [60, 'GOOD'],
    [55, 'AVERAGE'],
    [50, 'PASS'],
    [45, 'FAIR'],
    [40, 'POOR'],
    [39, 'FAIL'],
  ] as const

  for (const [score, expected] of cases) {
    assert.equal(calculateSubjectGrade('Third Term', score), expected)
  }
  assert.equal(calculateSubjectRemark('Third Term', 'Mathematics', 100), null)
})

test('third term subject averages round to one decimal place', () => {
  assert.equal(calculateThirdTermAverage(80, 81, 80), 80.3)
  assert.equal(calculateThirdTermAverage(80, 81, 81), 80.7)
})

test('overall grades use the workbook aggregate scale', () => {
  assert.equal(calculateOverallGrade(75), 'A')
  assert.equal(calculateOverallGrade(70), 'B')
  assert.equal(calculateOverallGrade(65), 'B+')
  assert.equal(calculateOverallGrade(60), 'C')
  assert.equal(calculateOverallGrade(55), 'C+')
  assert.equal(calculateOverallGrade(50), 'D')
  assert.equal(calculateOverallGrade(45), 'E')
  assert.equal(calculateOverallGrade(40), 'F')
  assert.equal(calculateOverallGrade(39), 'F')
})

test('rankings use competition ranking and omit non-positive results', () => {
  assert.deepEqual(calculateCompetitionRanks([90, 90, 80, 0, -1]), [1, 1, 3, null, null])
  assert.equal(ordinal(11), '11th')
  assert.equal(ordinal(23), '23rd')
})
