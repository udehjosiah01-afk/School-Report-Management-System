import assert from 'node:assert/strict'
import test from 'node:test'
import { classes, subjects, subjectsByClass, terms } from './fixtures.ts'
import { validateDraftScoreInput } from './score-validation.ts'
import {
  calculateCompetitionRanks,
  calculateOverallAverage,
  calculateOverallGrade,
  calculateWorkbookReportResults,
  calculateSubjectTotal,
  calculateSubjectGrade,
  calculateSubjectRemark,
  calculateThirdTermAverage,
  EXAM_MAX,
  isAssessmentScoreValid,
  ordinal,
  TEST_MAX,
} from './workbook-calculations.ts'

test('school curriculum fixtures and workbook calculation subjects stay distinct', () => {
  assert.deepEqual(classes, ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'])
  assert.equal(subjects.length, 13)
  assert.equal(terms.length, 3)
  assert.equal(subjectsByClass['JSS 1'].length, 14)
  assert.equal(subjectsByClass['JSS 2'].length, 14)
  assert.equal(subjectsByClass['JSS 3'].length, 17)
  assert.equal(subjectsByClass['SS 1'].length, 18)
  assert.equal(subjectsByClass['SS 2'].length, 18)
  assert.equal(subjectsByClass['SS 3'].length, 18)
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

test('overall averages use the number of selected subjects as the divisor', () => {
  assert.equal(calculateOverallAverage(Array(10).fill(80)), 80)
  assert.equal(calculateOverallAverage(Array(11).fill(80)), 80)
  assert.equal(calculateOverallAverage([80, 90, 100]), 90)
  assert.throws(() => calculateOverallAverage([]), /At least one selected subject/)
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
  assert.equal(calculateThirdTermAverage(null, 81, 80), 80.5)
  assert.equal(calculateThirdTermAverage(null, null, null), null)
})

test('workbook report calculations use selected subjects, class positions, and term rules', () => {
  const firstTerm = calculateWorkbookReportResults('First Term', [
    {
      studentId: 'student-a',
      subjects: [
        { subjectId: 'math', name: 'Mathematics', terms: { 'First Term': { testScore: 35, examScore: 50 } } },
        { subjectId: 'english', name: 'English Language', terms: { 'First Term': { testScore: 30, examScore: 50 } } },
      ],
    },
    {
      studentId: 'student-b',
      subjects: [
        { subjectId: 'math', name: 'Mathematics', terms: { 'First Term': { testScore: 20, examScore: 40 } } },
        { subjectId: 'english', name: 'English Language', terms: { 'First Term': { testScore: 20, examScore: 40 } } },
      ],
    },
  ])
  assert.equal(firstTerm[0].subjects[0].grade, 'A')
  assert.equal(firstTerm[0].subjects[0].remark, 'DISTINCTION')
  assert.equal(firstTerm[0].subjects[0].classAverage, 72.5)
  assert.equal(firstTerm[0].subjects[0].position, 1)
  assert.equal(firstTerm[1].subjects[0].position, 2)
  assert.equal(firstTerm[0].totalMarksObtained, 165)
  assert.equal(firstTerm[0].totalMarksObtainable, 200)
  assert.equal(firstTerm[0].average, 82.5)
  assert.equal(firstTerm[0].position, 1)

  const thirdTerm = calculateWorkbookReportResults('Third Term', [
    {
      studentId: 'student-a',
      subjects: [{
        subjectId: 'math',
        name: 'Mathematics',
        terms: {
          'First Term': { testScore: 35, examScore: 45 },
          'Second Term': { testScore: 36, examScore: 45 },
          'Third Term': { testScore: 37, examScore: 45 },
        },
      }],
    },
  ])
  assert.equal(thirdTerm[0].subjects[0].firstTermTotal, 80)
  assert.equal(thirdTerm[0].subjects[0].secondTermTotal, 81)
  assert.equal(thirdTerm[0].subjects[0].average, 81)
  assert.equal(thirdTerm[0].subjects[0].grade, 'DISTINCTION')
  assert.equal(thirdTerm[0].totalMarksObtained, 81)
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
