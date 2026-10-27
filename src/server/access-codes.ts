import { pbkdf2Sync, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'

const hashIterations = 120_000
const lockoutThreshold = 5
const lockoutDurationMs = 15 * 60 * 1000

export function generateAccessCode() {
  return randomInt(0, 10_000).toString().padStart(4, '0')
}

export function hashAccessCode(code: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(code, salt, hashIterations, 32, 'sha256').toString('hex')
  return { codeHash: hash, codeSalt: salt }
}

export function verifyAccessCode(code: string, hash: string, salt: string) {
  if (!/^\d{4}$/.test(code) || !/^[0-9a-f]{64}$/i.test(hash) || !/^[0-9a-f]{32}$/i.test(salt)) {
    return false
  }
  const candidate = pbkdf2Sync(code, salt, hashIterations, 32, 'sha256')
  return timingSafeEqual(candidate, Buffer.from(hash, 'hex'))
}

export function failedAccessCodeState(previousAttempts: number, now = new Date()) {
  const failedAttempts = Math.min(lockoutThreshold, previousAttempts + 1)
  return {
    failedAttempts,
    lockedUntil: failedAttempts >= lockoutThreshold
      ? new Date(now.getTime() + lockoutDurationMs)
      : null,
  }
}

export function isAccessCodeLocked(lockedUntil: Date | null, now = new Date()) {
  return lockedUntil !== null && lockedUntil.getTime() > now.getTime()
}

export function validateAccessCode(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}$/.test(value)) {
    throw new Error('Enter a valid four-digit access code.')
  }
  return value
}
