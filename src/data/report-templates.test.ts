import assert from 'node:assert/strict'
import test from 'node:test'
import { getReportTemplateId } from './report-templates.ts'

test('JSS 1 and JSS 2 select the first/second-term design for the first two terms', () => {
  for (const className of ['JSS 1', 'JSS 2']) {
    assert.equal(getReportTemplateId(className, 'First Term'), 'jss1-2-first-second')
    assert.equal(getReportTemplateId(className, 'Second Term'), 'jss1-2-first-second')
    assert.equal(getReportTemplateId(className, 'Third Term'), 'jss1-2-third')
  }
})

test('classes without an uploaded report design do not fall back to the JSS 1/2 template', () => {
  for (const className of ['JSS 3', 'SS 1', 'SS 2', 'SS 3']) {
    assert.equal(getReportTemplateId(className, 'First Term'), null)
    assert.equal(getReportTemplateId(className, 'Second Term'), null)
    assert.equal(getReportTemplateId(className, 'Third Term'), null)
  }
})
