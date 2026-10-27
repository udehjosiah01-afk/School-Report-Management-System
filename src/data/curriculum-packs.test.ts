import assert from 'node:assert/strict'
import test from 'node:test'
import { getCurriculumPack, curriculumPacks } from './curriculum-packs.ts'

test('curriculum packs provide editable suggestions and unique subject names', () => {
  assert.deepEqual(Object.keys(curriculumPacks), ['nigeria', 'british', 'turkish'])

  for (const pack of Object.values(curriculumPacks)) {
    assert.ok(pack.subjects.length > 0)
    assert.equal(new Set(pack.subjects).size, pack.subjects.length)
  }

  assert.ok(getCurriculumPack('british')?.subjects.some(subject => subject === 'Global Perspectives'))
  assert.ok(getCurriculumPack('turkish')?.subjects.some(subject => subject === 'Türk Dili ve Edebiyatı'))
  assert.equal(getCurriculumPack('unknown'), null)
})

test('Nigerian pack includes all current class defaults and British/Turkish packs remain separate', () => {
  const nigeria = getCurriculumPack('nigeria')
  const british = getCurriculumPack('british')
  const turkish = getCurriculumPack('turkish')

  assert.ok(nigeria?.subjects.some(subject => subject === 'Basic Technology'))
  assert.ok(nigeria?.subjects.some(subject => subject === 'Mathematics'))
  assert.ok(british?.subjects.some(subject => subject === 'English Literature'))
  assert.ok(turkish?.subjects.some(subject => subject === 'Fen Bilimleri'))
  assert.notEqual(british, turkish)
})
