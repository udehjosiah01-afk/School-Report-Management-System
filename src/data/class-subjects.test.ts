import assert from 'node:assert/strict'
import test from 'node:test'
import { getConfiguredSubjectsForClass } from './class-subjects.ts'

const catalogue = [
  { id: 'math', name: 'Mathematics' },
  { id: 'english', name: 'English' },
  { id: 'turkish', name: 'Türkçe' },
]
const classSubjects = [
  { classId: 'jss1', subjectId: 'math' },
  { classId: 'jss1', subjectId: 'english' },
  { classId: 'ss1', subjectId: 'turkish' },
]

test('configured subjects are scoped to one class and follow the catalogue order', () => {
  assert.deepEqual(getConfiguredSubjectsForClass(catalogue, classSubjects, 'jss1'), [
    { id: 'math', name: 'Mathematics' },
    { id: 'english', name: 'English' },
  ])
  assert.deepEqual(getConfiguredSubjectsForClass(catalogue, classSubjects, 'ss1'), [
    { id: 'turkish', name: 'Türkçe' },
  ])
  assert.deepEqual(getConfiguredSubjectsForClass(catalogue, classSubjects, 'unconfigured'), [])
})
