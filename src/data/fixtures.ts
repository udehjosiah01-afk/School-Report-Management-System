import { demoSubjectsForClass, workbookSeniorSubjects } from './curriculum.ts'

// Curriculum fixtures for the workspace preview; no student records are included.
export const subjects = workbookSeniorSubjects
export const classes = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']
export const subjectsByClass = Object.fromEntries(classes.map(schoolClass => [
  schoolClass,
  demoSubjectsForClass(schoolClass),
]))
export const terms = ['First Term', 'Second Term', 'Third Term'] as const
