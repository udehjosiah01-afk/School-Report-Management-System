import assert from 'node:assert/strict'
import test from 'node:test'
import { createScoreSheetSaver } from './score-sheet-saving.ts'
import type { ScoreSheetSaveRow } from './score-sheet-saving.ts'

const rows: ScoreSheetSaveRow[] = [
  { enrollmentId: 'enrollment-1', firstName: 'Ada', lastName: 'Lovelace', testScore: 35, examScore: 58 },
  { enrollmentId: 'enrollment-2', firstName: 'Grace', lastName: 'Hopper', testScore: null, examScore: 60 },
]
const selection = { subjectId: 'subject-1', termId: 'term-1' }

test('saves every score-sheet row sequentially with the selected subject and term', async () => {
  const saver = createScoreSheetSaver()
  const calls: unknown[] = []
  const progress: Array<[number, number]> = []
  let activeSaves = 0
  let maxActiveSaves = 0
  let refreshCount = 0

  const result = await saver.save({
    rows,
    selection,
    onStart: total => assert.equal(total, rows.length),
    onProgress: (completed, total) => progress.push([completed, total]),
    save: async input => {
      activeSaves += 1
      maxActiveSaves = Math.max(maxActiveSaves, activeSaves)
      calls.push(input)
      await Promise.resolve()
      activeSaves -= 1
    },
    refresh: async () => {
      refreshCount += 1
      return undefined
    },
  })

  assert.deepEqual(calls, [
    { enrollmentId: 'enrollment-1', subjectId: 'subject-1', termId: 'term-1', testScore: 35, examScore: 58 },
    { enrollmentId: 'enrollment-2', subjectId: 'subject-1', termId: 'term-1', testScore: null, examScore: 60 },
  ])
  assert.equal(maxActiveSaves, 1)
  assert.deepEqual(progress, [[1, 2], [2, 2]])
  assert.equal(refreshCount, 1)
  assert.deepEqual(result, { savedCount: 2, totalCount: 2, failures: [], refreshError: undefined })
  assert.equal(saver.isSaving, false)
})

test('continues after row failures and identifies affected students', async () => {
  const saver = createScoreSheetSaver()
  const attempted: string[] = []
  let refreshCount = 0

  const result = await saver.save({
    rows,
    selection,
    onStart: () => {},
    onProgress: () => {},
    save: async input => {
      attempted.push(input.enrollmentId)
      if (input.enrollmentId === 'enrollment-1') throw new Error('Term is locked.')
    },
    refresh: async () => {
      refreshCount += 1
      return undefined
    },
  })

  assert.deepEqual(attempted, ['enrollment-1', 'enrollment-2'])
  assert.equal(refreshCount, 1)
  assert.deepEqual(result, {
    savedCount: 1,
    totalCount: 2,
    failures: [{ studentName: 'Ada Lovelace', message: 'Term is locked.' }],
    refreshError: undefined,
  })
})

test('rejects duplicate overlapping bulk saves and allows a later retry', async () => {
  const saver = createScoreSheetSaver()
  let releaseFirstSave!: () => void
  const firstSaveGate = new Promise<void>(resolve => { releaseFirstSave = resolve })
  let saveCount = 0

  const first = saver.save({
    rows: [rows[0]],
    selection,
    onStart: () => {},
    onProgress: () => {},
    save: async () => {
      saveCount += 1
      await firstSaveGate
    },
    refresh: async () => undefined,
  })

  assert.ok(first)
  assert.equal(saver.isSaving, true)
  assert.equal(saver.save({
    rows: [rows[0]],
    selection,
    onStart: () => assert.fail('A duplicate save must not start.'),
    onProgress: () => {},
    save: async () => {
      saveCount += 1
    },
    refresh: async () => undefined,
  }), null)

  releaseFirstSave()
  await first
  assert.equal(saveCount, 1)
  assert.equal(saver.isSaving, false)

  const retry = saver.save({
    rows: [rows[0]],
    selection,
    onStart: () => {},
    onProgress: () => {},
    save: async () => {
      saveCount += 1
    },
    refresh: async () => undefined,
  })
  assert.ok(retry)
  await retry
  assert.equal(saveCount, 2)
})

test('returns a refresh error without hiding saved rows', async () => {
  const saver = createScoreSheetSaver()
  const result = await saver.save({
    rows: [rows[0]],
    selection,
    onStart: () => {},
    onProgress: () => {},
    save: async () => {},
    refresh: async () => 'Score sheet reload failed.',
  })

  assert.deepEqual(result, {
    savedCount: 1,
    totalCount: 1,
    failures: [],
    refreshError: 'Score sheet reload failed.',
  })
})
