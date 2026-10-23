import type { ResultTerm } from './workbook-calculations'

export type ReportTemplateId = 'jss1-2-first-second' | 'jss1-2-third'

export function getReportTemplateId(className: string, term: ResultTerm): ReportTemplateId | null {
  if (className !== 'JSS 1' && className !== 'JSS 2') return null
  return term === 'Third Term' ? 'jss1-2-third' : 'jss1-2-first-second'
}
