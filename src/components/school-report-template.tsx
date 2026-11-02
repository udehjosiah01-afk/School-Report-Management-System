export function SchoolReportTemplate({
  school,
  className = 'JSS 1',
  term = 'Third Term',
  subjects,
  student,
}: {
  school?: ReportSchoolBranding | null
  className?: string
  term?: ResultTerm
  subjects: readonly ReportTemplateSubject[]
  student?: ReportStudent | null
}) {
  const schoolName = school?.name || 'YOUR SCHOOL NAME'
  const schoolAddress = school?.address || 'SCHOOL ADDRESS'
  const termLayout = getReportTermLayout(term)
  const isThirdTerm = termLayout === 'third'

  return <section className="jss-report-preview">
    <div className="jss-report-preview-note">
      <strong>Blank template preview</strong>
      <span>{className} · {termLayout === 'third' ? 'Third Term page' : 'First / Second Term page'} ({term}). {student?.name ? 'Score results and grading calculations are not included in this preview.' : 'No student details, marks, or grading calculations are filled in.'}</span>
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
        </div>
      </section>

      <section className="jss-report-grid" aria-label="Subject summary">
        {subjects.map(subject => <div key={subject.id} className="jss-subject-row">
          <span>{subject.name}</span>
          <strong>{subject.teacherName || 'Teacher'}</strong>
        </div>)}
      </section>
      {isThirdTerm && <ReportTotals />}
    </article>
  </section>
}
