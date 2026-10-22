import { demoSubjectsForClass, seniorSubjects } from './curriculum.ts'

// Demonstration records, deliberately separate from future persisted school data.
export const subjects = seniorSubjects
export const names = ['Chisom Okafor', 'Joseph Adeyemi', 'Aisha Bello', 'Emmanuel Eze', 'Zainab Ibrahim', 'Daniel Uche', 'Favour Obi', 'Samuel Adebayo', 'Esther Nwosu', 'Ibrahim Musa', 'Grace Edet', 'David Ojo', 'Blessing Akpan', 'Joshua Dada', 'Peace Ibe', 'Michael Usman']
export const classes = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']
export const subjectsByClass = Object.fromEntries(classes.map(schoolClass => [
  schoolClass,
  demoSubjectsForClass(schoolClass),
]))
export const terms = ['First Term', 'Second Term', 'Third Term'] as const
export type Scores = Record<string, [number | null, number | null]>
export function initialScores(): Scores {
  const result: Scores = {}
  classes.forEach((c, ci) => terms.forEach((t, ti) => names.forEach((_, i) => subjectsByClass[c].forEach((s, si) => {
    result[`${c}/${t}/${i}/${s}`] = [18 + ((i * 7 + si * 3 + ci + ti * 2) % 23), 25 + ((i * 11 + si * 7 + ci * 3 + ti * 4) % 36)]
  }))))
  return result
}
