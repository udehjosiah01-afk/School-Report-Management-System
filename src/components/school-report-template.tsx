import { BookOpen } from 'lucide-react'
import type { ResultTerm } from '../data/workbook-calculations'
import { getReportTermLayout } from '../data/report-templates'
import type { ReportTemplateSubject } from '../data/report-templates'
import '../report-template.css'

export type ReportSchoolBranding = {
  name: string
  address: string
  phone?: string
  contactEmail?: string
  motto?: string
  logoUrl?: string | null
}

export type ReportStudent = {
  name?: string
  admissionNumber?: string
  passportPhotoDataUrl?: string | null
}

function BlankField({ label, value = '' }: { label: string; value?: string }) {
  return <div className="jss-field"><span>{label}</span>{value ? <strong>{value}</strong> : <i aria-hidden="true"/>}</div>
}

function ReportTotals() {
  return <section className="jss-report-totals" aria-label="Report totals">
    <BlankField label="TOTAL MARKS OBTAINED"/>
    <BlankField label="TOTAL MARKS OBTAINABLE"/>
    <BlankField label="AVERAGE"/>
    <BlankField label="GRADE"/>
  </section>
}

export function SchoolReportTemplate({
  school,
  className = 'JSS 1',
  term = 'Third Term',
  academicYear,
  subjects,
  student,
  publishedReport = false,
}: {
  school?: ReportSchoolBranding | null
  className?: string
  term?: ResultTerm
  academicYear?: string
  subjects: readonly ReportTemplateSubject[]
  student?: ReportStudent | null
  publishedReport?: boolean
}) {
  const schoolName = school?.name || 'YOUR SCHOOL NAME'
  const schoolAddress = school?.address || 'SCHOOL ADDRESS'
  const termLayout = getReportTermLayout(term)
  const isThirdTerm = termLayout === 'third'

  return <section className="jss-report-preview">
    <div className="jss-report-preview-note">
      <strong>{publishedReport ? 'Published report card' : 'Blank template preview'}</strong>
      <span>{className} · {termLayout === 'third' ? 'Third Term page' : 'First / Second Term page'} ({term}){academicYear ? ` · ${academicYear}` : ''}. {publishedReport ? 'Only saved test and examination scores are shown; grading rules are not configured here.' : 'No student details, marks, or grading calculations are filled in.'}</span>
    </div>
    <article className="jss-report-card" aria-label={`${student?.name ? `${student.name} ` : 'Blank '}${schoolName} ${className} ${term} report template`}>
      {school?.logoUrl && <img className="jss-report-watermark" src={school.logoUrl} alt="" aria-hidden="true"/>}
      <header className="jss-report-header">
        {school?.logoUrl
          ? <img src={school.logoUrl} alt={`${schoolName} logo`}/>
          : <span className="jss-report-logo-placeholder" aria-hidden="true"><BookOpen size={36}/></span>}
        <div>
          <h2>{schoolName}</h2>
          <p>{schoolAddress}</p>
          {school?.motto && <p className="jss-report-motto">{school.motto}</p>}
          <h3>TERMINAL REPORT SHEET</h3>
        </div>
      </header>

      <section className="jss-student-fields" aria-label="Student and term information">
        <div className="jss-student-photo">
          {student?.passportPhotoDataUrl
            ? <img src={student.passportPhotoDataUrl} alt={`${student.name ?? 'Student'} passport portrait`} />
            : <span className="jss-student-photo-placeholder">PASSPORT PHOTO</span>}
        </div>
        <div className="jss-student-details">
          <BlankField label="STUDENT'S NAME" value={student?.name ?? ''} />
          <BlankField label="ADMISSION NUMBER" value={student?.admissionNumber ?? ''} />
          <BlankField label="CLASS" value={className} />
          <BlankField label="TERM" value={term} />
          {academicYear && <BlankField label="ACADEMIC YEAR" value={academicYear}/>}
        </div>
      </section>

      <section className="jss-report-grid" aria-label="Subject scores">
        <table className="jss-report-subject-table">
          <thead><tr><th scope="col">Subject</th><th scope="col">Test / 40</th><th scope="col">Examination / 60</th><th scope="col">Total / 100</th></tr></thead>
          <tbody>{subjects.map(subject => {
            const total = typeof subject.testScore === 'number' && typeof subject.examScore === 'number'
              ? subject.testScore + subject.examScore
              : null
            return <tr key={`${subject.serialNumber}-${subject.name}`}>
              <th scope="row">{subject.name}</th>
              <td>{subject.testScore ?? ''}</td>
              <td>{subject.examScore ?? ''}</td>
              <td>{total ?? ''}</td>
            </tr>
          })}</tbody>
        </table>
      </section>
      {isThirdTerm && !publishedReport && <ReportTotals />}
    </article>
  </section>
}
