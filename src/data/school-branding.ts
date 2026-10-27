import type { CSSProperties } from 'react'

const maxLogoBytes = 512 * 1024
const contrastInk = '#1d2b3d'
export const DEFAULT_MAIN_COLOR = '#c62828'
export const DEFAULT_ACCENT_COLOR = '#38bdf8'

export function validateSchoolColor(value: unknown, label: string, fallback: string) {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(`${label} must be a six-digit hexadecimal colour.`)
  }
  return value.toLowerCase()
}

function luminance(color: string) {
  const channels = color.slice(1).match(/.{2}/g)?.map(channel => {
    const value = parseInt(channel, 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  if (!channels || channels.length !== 3) throw new Error('A valid hexadecimal colour is required.')
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

export function contrastRatio(first: string, second: string) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

export function readableTextColor(background: string) {
  return contrastRatio(background, '#ffffff') >= contrastRatio(background, contrastInk)
    ? '#ffffff'
    : contrastInk
}

export function schoolThemeStyle(mainColor = DEFAULT_MAIN_COLOR, accentColor = DEFAULT_ACCENT_COLOR): CSSProperties {
  const mainInk = contrastRatio(mainColor, '#ffffff') >= 4.5 ? mainColor : contrastInk
  const accentInk = contrastRatio(accentColor, '#ffffff') >= 4.5 ? accentColor : contrastInk
  return {
    '--school-primary': mainColor,
    '--school-accent': accentColor,
    '--school-primary-foreground': readableTextColor(mainColor),
    '--school-accent-foreground': readableTextColor(accentColor),
    '--school-primary-ink': mainInk,
    '--school-accent-ink': accentInk,
  } as CSSProperties
}

export function schoolColorsNeedContrastWarning(mainColor: string, accentColor: string) {
  return [mainColor, accentColor].some(color =>
    Math.max(contrastRatio(color, '#ffffff'), contrastRatio(color, contrastInk)) < 4.5,
  )
}

function validateImageDataUrl(value: unknown, label: string): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string' || value.length > 700_000) {
    throw new Error(`The ${label} must be a PNG, JPG, or WebP image no larger than 512 KB.`)
  }
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!match) throw new Error(`The ${label} must be a PNG, JPG, or WebP image no larger than 512 KB.`)
  let bytes: string
  try {
    bytes = atob(match[2])
  } catch {
    throw new Error(`The ${label} file is invalid.`)
  }
  if (bytes.length > maxLogoBytes) throw new Error(`The ${label} must be 512 KB or smaller.`)
  const signature = Array.from(bytes.slice(0, 12), character => character.charCodeAt(0))
  const validImage = match[1] === 'png'
    ? signature.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10'
    : match[1] === 'jpeg'
      ? signature.slice(0, 3).join(',') === '255,216,255'
      : signature.slice(0, 4).join(',') === '82,73,70,70' &&
        signature.slice(8, 12).join(',') === '87,69,66,80'
  if (!validImage) throw new Error(`The ${label} file does not match its image type.`)
  return value
}

export function validateSchoolLogoDataUrl(value: unknown) {
  return validateImageDataUrl(value, 'school logo')
}

export function validateStudentPhotoDataUrl(value: unknown) {
  return validateImageDataUrl(value, 'learner passport photo')
}
