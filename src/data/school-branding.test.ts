import assert from 'node:assert/strict'
import test from 'node:test'
import {
  contrastRatio,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_MAIN_COLOR,
  readableTextColor,
  schoolColorsNeedContrastWarning,
  validateSchoolColor,
  validateSchoolLogoDataUrl,
} from './school-branding.ts'

test('school colors use safe defaults, normalize hex values, and reject invalid input', () => {
  assert.equal(validateSchoolColor(undefined, 'Main colour', DEFAULT_MAIN_COLOR), DEFAULT_MAIN_COLOR)
  assert.equal(validateSchoolColor('#FFFFFF', 'Main colour', DEFAULT_MAIN_COLOR), '#ffffff')
  assert.throws(() => validateSchoolColor('blue', 'Main colour', DEFAULT_MAIN_COLOR), /six-digit hexadecimal/)
  assert.throws(() => validateSchoolColor('#12345', 'Accent colour', DEFAULT_ACCENT_COLOR), /six-digit hexadecimal/)
})

test('school colors choose readable foregrounds and identify insufficient contrast', () => {
  assert.equal(readableTextColor(DEFAULT_MAIN_COLOR), '#ffffff')
  assert.equal(readableTextColor(DEFAULT_ACCENT_COLOR), '#1d2b3d')
  assert.ok(contrastRatio(DEFAULT_MAIN_COLOR, '#ffffff') >= 4.5)
  assert.ok(contrastRatio(DEFAULT_ACCENT_COLOR, '#1d2b3d') >= 4.5)
  assert.equal(schoolColorsNeedContrastWarning(DEFAULT_MAIN_COLOR, DEFAULT_ACCENT_COLOR), false)
  assert.equal(schoolColorsNeedContrastWarning('#777777', '#777777'), true)
})

test('school logo validation accepts optional logos and supported image signatures', () => {
  assert.equal(validateSchoolLogoDataUrl(null), null)
  assert.equal(validateSchoolLogoDataUrl(''), null)

  const png = `data:image/png;base64,${Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString('base64')}`
  const jpeg = `data:image/jpeg;base64,${Buffer.from([255, 216, 255, 0]).toString('base64')}`
  const webp = `data:image/webp;base64,${Buffer.from('RIFF0000WEBP').toString('base64')}`
  assert.equal(validateSchoolLogoDataUrl(png), png)
  assert.equal(validateSchoolLogoDataUrl(jpeg), jpeg)
  assert.equal(validateSchoolLogoDataUrl(webp), webp)
})

test('school logo validation rejects unsupported, malformed, and mismatched image data', () => {
  assert.throws(() => validateSchoolLogoDataUrl('data:image/svg+xml;base64,PHN2Zz4='), /PNG, JPG, or WebP/)
  assert.throws(() => validateSchoolLogoDataUrl('data:image/png;base64,not-base64!'), /PNG, JPG, or WebP/)
  assert.throws(() => validateSchoolLogoDataUrl('data:image/png;base64,VEVTVA=='), /does not match its image type/)
  assert.throws(() => validateSchoolLogoDataUrl(`data:image/png;base64,${Buffer.alloc(512 * 1024 + 1).toString('base64')}`), /512 KB or smaller/)
})
