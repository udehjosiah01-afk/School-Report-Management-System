import { createFileRoute } from '@tanstack/react-router'
import { Printer, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { ReportAccessGate } from '../components/report-access-gate'
import { SchoolReportTemplate } from '../components/school-report-template'
import { isResultTerm } from '../data/workbook-calculations'
import { schoolThemeStyle } from '../data/school-branding'
import { verifyParentReportAccess } from '../server/school-actions'

export const Route = createFileRoute('/parent-report')({ component: ParentReportPage })

function ParentReportPage() {
  const [schoolEmail, setSchoolEmail] = useState('')
  const [admissionNumber, setAdmissionNumber] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [report, setReport] = useState<Awaited<ReturnType<typeof verifyParentReportAccess>> | null>(null)
  const [selectedReportIndex, setSelectedReportIndex] = useState(0)
  const selectedReport = report?.reports[selectedReportIndex]
  const term = selectedReport && isResultTerm(selectedReport.termName) ? selectedReport.termName : undefined

  async function submitAccess(payload: { schoolEmail: string; admissionNumber: string; code: string }) {
    setError('')
    setReport(null)
    setSelectedReportIndex(0)
    try {
      const verified = await verifyParentReportAccess({ data: payload })
      setReport(verified)
      setCode('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The report could not be opened.')
    }
  }

  return <main className="parent-report-page" style={schoolThemeStyle(report?.school.mainColor, report?.school.accentColor)}>
    <header className="parent-report-header">
      <div>
        <span className="landing-kicker"><ShieldCheck size={16}/> SECURE FAMILY ACCESS</span>
        <h1>Student report cards</h1>
      </div>
      {report && selectedReport && <button className="primary" type="button" onClick={() => window.print()}><Printer size={16}/> Print report</button>}
    </header>

    {!report && <section className="records-section parent-report-controls">
      <p>Enter the school contact email, the learner’s admission number, and the four-digit passcode supplied by the school.</p>
      <ReportAccessGate
        schoolEmail={schoolEmail}
        admissionNumber={admissionNumber}
        code={code}
        onSchoolEmailChange={setSchoolEmail}
        onAdmissionNumberChange={setAdmissionNumber}
        onCodeChange={setCode}
        onSubmit={submitAccess}
        error={error}
      />
    </section>}

    {report && <section>
      <header className="parent-report-school">
        {report.school.logoUrl && <img src={report.school.logoUrl} alt={`${report.school.name} logo`}/>}
        <div>
          <h2>{report.school.name}</h2>
          <p>{report.school.address}{report.school.phone ? ` · ${report.school.phone}` : ''}</p>
          {report.school.motto && <p>{report.school.motto}</p>}
        </div>
      </header>
      {report.reports.length === 0
        ? <p className="form-notice" role="status">There are no published report cards for this learner yet. Contact the school office if you expected a report.</p>
        : <>
            <section className="records-section parent-report-controls">
              <p>Showing published results only. Your passcode is learner-specific and cannot be changed here.</p>
              <label>Published report<select value={selectedReportIndex} onChange={event => setSelectedReportIndex(Number(event.target.value))}>
                {report.reports.map((item, index) => <option key={`${item.academicYear}-${item.termName}-${index}`} value={index}>
                  {item.academicYear} · {item.termName} · {item.className}
                </option>)}
              </select></label>
            </section>
            {selectedReport && term && <SchoolReportTemplate
              school={report.school}
              className={selectedReport.className}
              term={term}
              academicYear={selectedReport.academicYear}
              subjects={selectedReport.subjects}
              student={report.student}
              publishedReport
            />}
          </>}
    </section>}
  </main>
}
