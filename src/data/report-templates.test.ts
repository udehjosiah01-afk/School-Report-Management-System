import assert from 'node:assert/strict'
import test from 'node:test'
import { getReportTemplateId, getReportTemplateSubjects, getReportTermLayout } from './report-templates.ts'

test('JSS 1 and JSS 2 select the first/second-term design for the first two terms', () => {
  assert.equal(getReportTermLayout('First Term'), 'first-second')
  assert.equal(getReportTermLayout('Second Term'), 'first-second')
  assert.equal(getReportTermLayout('Third Term'), 'third')

  for (const className of ['JSS 1', 'JSS 2']) {
    assert.equal(getReportTemplateId(className, 'First Term'), 'jss1-2-first-second')
    assert.equal(getReportTemplateId(className, 'Second Term'), 'jss1-2-first-second')
    assert.equal(getReportTemplateId(className, 'Third Term'), 'jss1-2-third')
  }
})

test('JSS 3 and all senior classes select their own first/second and third-term designs', () => {
  for (const className of ['JSS 3', 'SS 1', 'SS 2', 'SS 3']) {
    const level = className.startsWith('JSS') ? 'jss3' : 'ss'
    assert.equal(getReportTemplateId(className, 'First Term'), `${level}-first-second`)
    assert.equal(getReportTemplateId(className, 'Second Term'), `${level}-first-second`)
    assert.equal(getReportTemplateId(className, 'Third Term'), `${level}-third`)
  }
})

test('report templates expose the updated subject lists for each class level', () => {
  const jss12Subjects = getReportTemplateSubjects('JSS 1')
  const jss3Subjects = getReportTemplateSubjects('JSS 3')
  const ssSubjects = getReportTemplateSubjects('SS 1')

  assert.deepEqual(jss12Subjects?.map(subject => subject.name), [
    'Mathematics', 'English', 'Intermediate Science', 'Business Studies', 'Global Perspective',
    'Digital Technologies', 'Social and Citizenship Studies', 'Cultural and Creative Arts',
    'Christian Religious Studies', 'Hausa', 'Physical and Health Education',
    'Nigerian History', 'Trade', 'French',
  ])
  assert.deepEqual(jss3Subjects?.map(subject => subject.name), [
    'Mathematics', 'English', 'Basic Science', 'Basic Technology',
    'Information Communication Technology', 'Social Studies', 'Security Education',
    'Business Studies', 'Cultural and Creative Arts', 'Christian Religious Studies',
    'Hausa', 'Physical and Health Education', 'Nigerian History', 'Agric Science',
    'Home Economics', 'Civic Education', 'French',
  ])
  assert.deepEqual(ssSubjects?.map(subject => subject.name), [
    'Mathematics', 'English Language', 'Chemistry', 'Commerce', 'Literature', 'Physics',
    'Government', 'Geography', 'Biology', 'Further Mathematics', 'Economics',
    'Agricultural Science', 'Technical Drawing', 'C.R.S.', 'Digital Technologies',
    'Citizenship and Heritage Studies', 'Global Perspective', 'Trade',
  ])
  assert.deepEqual(ssSubjects?.map(subject => subject.serialNumber), Array.from({ length: 18 }, (_, index) => index + 1))
  assert.equal(getReportTemplateSubjects('Other class'), null)
})
