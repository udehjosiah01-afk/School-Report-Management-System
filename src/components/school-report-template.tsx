import { BookOpen } from 'lucide-react'
import { ordinal } from '../data/workbook-calculations'
import type { CalculatedReportStudent, ResultTerm } from '../data/workbook-calculations'
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

function ReportTotals({ summary }: { summary?: Pick<CalculatedReportStudent, 'totalMarksObtained' | 'totalMarksObtainable' | 'average' | 'grade' | 'position'> }) {
  return <section className="jss-report-totals" aria-label="Report totals">
    <BlankField label="TOTAL MARKS OBTAINED" value={summary?.totalMarksObtained?.toFixed(1) ?? ''}/>
    <BlankField label="TOTAL MARKS OBTAINABLE" value={summary?.totalMarksObtainable.toString() ?? ''}/>
    <BlankField label="AVERAGE" value={summary?.average?.toFixed(2) ?? ''}/>
    <BlankField label="GRADE" value={summary?.grade ?? ''}/>
    {summary?.position !== null && summary?.position !== undefined && <BlankField label="POSITION IN CLASS" value={ordinal(summary.position)}/>}
  </section>
}

export function SchoolReportTemplate({
  school,
  className = 'JSS 1',
  term = 'Third Term',
  academicYear,
  subjects,
  student,
  summary,
  publishedReport = false,
}: {
  school?: ReportSchoolBranding | null
  className?: string
  term?: ResultTerm
  academicYear?: string
  subjects: readonly ReportTemplateSubject[]
  student?: ReportStudent | null
  summary?: Pick<CalculatedReportStudent, 'totalMarksObtained' | 'totalMarksObtainable' | 'average' | 'grade' | 'position'>
  publishedReport?: boolean
}) {
  const schoolName = school?.name || 'YOUR SCHOOL NAME'
  const schoolAddress = school?.address || 'SCHOOL ADDRESS'
  const termLayout = getReportTermLayout(term)
  const isThirdTerm = termLayout === 'third'

  return <section className="jss-report-preview">
    <div className="jss-report-preview-note">
      <strong>{publishedReport ? 'Published report card' : 'Blank template preview'}</strong>
      <span>{className} · {termLayout === 'third' ? 'Third Term page' : 'First / Second Term page'} ({term}){academicYear ? ` · ${academicYear}` : ''}. {publishedReport ? 'Results use the school-approved workbook calculation rules.' : 'No student details, marks, or grading calculations are filled in.'}</span>
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
          <thead><tr>
            <th scope="col">Subject</th>
            <th scope="col">Test / 40</th>
            <th scope="col">Examination / 60</th>
            <th scope="col">Total / 100</th>
            {isThirdTerm
              ? <><th scope="col">First Term</th><th scope="col">Second Term</th><th scope="col">Three-term average</th><th scope="col">Grade</th><th scope="col">Position</th></>
              : <><th scope="col">Grade</th><th scope="col">Class average</th><th scope="col">Remark</th><th scope="col">Position</th></>}
          </tr></thead>
          <tbody>{subjects.map(subject => {
            const total = subject.total ?? (typeof subject.testScore === 'number' && typeof subject.examScore === 'number'
              ? subject.testScore + subject.examScore
              : null)
            return <tr key={`${subject.serialNumber}-${subject.name}`}>
              <th scope="row">{subject.name}</th>
              <td>{subject.testScore ?? ''}</td>
              <td>{subject.examScore ?? ''}</td>
              <td>{total ?? ''}</td>
              {isThirdTerm
                ? <>
                    <td>{subject.firstTermTotal ?? ''}</td>
                    <td>{subject.secondTermTotal ?? ''}</td>
                    <td>{subject.average?.toFixed(1) ?? ''}</td>
                    <td>{subject.grade ?? ''}</td>
                    <td>{subject.position ? ordinal(subject.position) : ''}</td>
                  </>
                : <>
                    <td>{subject.grade ?? ''}</td>
                    <td>{subject.classAverage?.toFixed(2) ?? ''}</td>
                    <td>{subject.remark ?? ''}</td>
                    <td>{subject.position ? ordinal(subject.position) : ''}</td>
                  </>}
            </tr>
          })}</tbody>
        </table>
      </section>
      <ReportTotals summary={summary}/>
    </article>
  </section>
}
