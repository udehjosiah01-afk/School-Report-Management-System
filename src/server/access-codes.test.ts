import assert from 'node:assert/strict'
import test from 'node:test'
import {
  failedAccessCodeState,
  generateAccessCode,
  hashAccessCode,
  isAccessCodeLocked,
  validateAccessCode,
  verifyAccessCode,
} from './access-codes.ts'

test('access codes are four digits and verify against salted hashes', () => {
  const code = generateAccessCode()
  assert.match(code, /^\d{4}$/)
  const { codeHash, codeSalt } = hashAccessCode(code)
  assert.notEqual(codeHash, code)
  assert.notEqual(codeSalt, code)
  assert.equal(verifyAccessCode(code, codeHash, codeSalt), true)
  assert.equal(verifyAccessCode('0000', codeHash, codeSalt), code === '0000')
})

test('access code input rejects malformed PINs', () => {
  for (const code of ['123', '12345', '12a4', 1234, ' 1234']) {
    assert.throws(() => validateAccessCode(code), /four-digit/)
  }
  assert.equal(validateAccessCode('0042'), '0042')
})

test('failed attempts lock access for fifteen minutes after five failures', () => {
  const now = new Date('2026-10-27T14:00:00.000Z')
  assert.deepEqual(failedAccessCodeState(3, now), { failedAttempts: 4, lockedUntil: null })
  const lock = failedAccessCodeState(4, now)
  assert.equal(lock.failedAttempts, 5)
  assert.equal(lock.lockedUntil?.toISOString(), '2026-10-27T14:15:00.000Z')
  assert.equal(isAccessCodeLocked(lock.lockedUntil, now), true)
  assert.equal(isAccessCodeLocked(lock.lockedUntil, new Date('2026-10-27T14:15:00.000Z')), false)
})
