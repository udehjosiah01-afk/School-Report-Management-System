import type { ResultTerm } from './workbook-calculations'
import { jss3Subjects, juniorSubjects, seniorSubjects } from './curriculum.ts'

export type ReportTemplateId =
  | 'jss1-2-first-second'
  | 'jss1-2-third'
  | 'jss3-first-second'
  | 'jss3-third'
  | 'ss-first-second'
  | 'ss-third'

export type ReportTermLayout = 'first-second' | 'third'

export function getReportTermLayout(term: ResultTerm): ReportTermLayout {
  return term === 'Third Term' ? 'third' : 'first-second'
}

export function getReportTemplateId(className: string, term: ResultTerm): ReportTemplateId | null {
  const isJss12 = className === 'JSS 1' || className === 'JSS 2'
  const isJss3 = className === 'JSS 3'
  const isSenior = className === 'SS 1' || className === 'SS 2' || className === 'SS 3'
  if (!isJss12 && !isJss3 && !isSenior) return null

  const termDesign = getReportTermLayout(term)
  if (isJss12) return `jss1-2-${termDesign}`
  if (isJss3) return `jss3-${termDesign}`
  return `ss-${termDesign}`
}

export type ReportTemplateSubject = {
  name: string
  serialNumber: number
}

function numberedSubjects(subjects: readonly string[]): ReportTemplateSubject[] {
  return subjects.map((name, index) => ({ name, serialNumber: index + 1 }))
}

export function getReportTemplateSubjects(className: string): ReportTemplateSubject[] | null {
  if (className === 'JSS 1' || className === 'JSS 2') return numberedSubjects(juniorSubjects)
  if (className === 'JSS 3') return numberedSubjects(jss3Subjects)
  if (className === 'SS 1' || className === 'SS 2' || className === 'SS 3') return numberedSubjects(seniorSubjects)
  return null
}
