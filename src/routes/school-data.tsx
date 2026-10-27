import { logout } from '@netlify/identity'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { Printer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getCurrentStaff } from '../server/auth'
import { JuniorReportTemplate } from '../components/junior-report-template'
import { getReportTemplateId } from '../data/report-templates'
import { isResultTerm } from '../data/workbook-calculations'
import type { ResultTerm } from '../data/workbook-calculations'
import { schoolThemeStyle } from '../data/school-branding'
import {
  assignTeacher,
  addSchoolStaff,
  createAcademicTerm,
  createSchoolClass,
  createStudent,
  createSubject,
  getSchoolStaff,
  getSchoolSetup,
  getScoreSheet,
  saveClassSubjects,
  setStaffRole,
} from '../server/school-actions'
import { saveDraftScore } from '../server/score-actions'

type ScoreSheetSaveFailure = {
  studentName: string
  message: string
}

type ScoreSheetSaveSummary = {
  savedCount: number
  totalCount: number
  failures: ScoreSheetSaveFailure[]
  refreshError?: string
}

export const Route = createFileRoute('/school-data')({
  beforeLoad: async () => {
    const staff = await getCurrentStaff()
    if (!staff) throw redirect({ to: '/login' })
    return { staff }
  },
  loader: () => getSchoolSetup(),
  component: SchoolData,
})

function SchoolData() {
  const { staff } = Route.useRouteContext()
  const setup = Route.useLoaderData()
  const router = useRouter()
  const isAdmin = staff.roles.includes('admin')
  const [showReportPreview, setShowReportPreview] = useState(false)
  const [reportClassName, setReportClassName] = useState(() => setup.classes.find(item => item.name === 'JSS 1')?.name ?? setup.classes[0]?.name ?? '')
  const [reportTerm, setReportTerm] = useState<ResultTerm>('Third Term')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [className, setClassName] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [termName, setTermName] = useState('First Term')
  const [subjectToAdd, setSubjectToAdd] = useState('')
  const [coverageTermId, setCoverageTermId] = useState(() => setup.terms.at(-1)?.id ?? '')
  const [student, setStudent] = useState({ admissionNumber: '', firstName: '', lastName: '', classId: '', subjectIds: [] as string[] })
  const [teacherAssignments, setTeacherAssignments] = useState({ identityUserId: '', classId: '', subjectId: '' })
  const [staffEmail, setStaffEmail] = useState('')
  const [staffList, setStaffList] = useState<Awaited<ReturnType<typeof getSchoolStaff>>>([])
  const [staffRole, setStaffRoleValue] = useState({ membershipId: '', role: 'teacher' })
  const [classSubjectSelection, setClassSubjectSelection] = useState({ classId: '', subjectIds: [] as string[] })
  const [sheetSelection, setSheetSelection] = useState({ classId: '', subjectId: '', termId: '' })
  const [loadedSheetSelection, setLoadedSheetSelection] = useState<typeof sheetSelection | null>(null)
  const [scoreRows, setScoreRows] = useState<Awaited<ReturnType<typeof getScoreSheet>>>([])
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkSaveProgress, setBulkSaveProgress] = useState({ completed: 0, total: 0 })
  const [bulkSaveSummary, setBulkSaveSummary] = useState<ScoreSheetSaveSummary | null>(null)
  const [individualSavingIds, setIndividualSavingIds] = useState<ReadonlySet<string>>(() => new Set())
  const bulkSavingRef = useRef(false)
  const individualSavingIdsRef = useRef(new Set<string>())
  const scoreSheetIsCurrent = loadedSheetSelection !== null &&
    loadedSheetSelection.classId === sheetSelection.classId &&
    loadedSheetSelection.subjectId === sheetSelection.subjectId &&
    loadedSheetSelection.termId === sheetSelection.termId
  const reportTemplateId = getReportTemplateId(reportClassName, reportTerm)
  const termScoreCoverage = setup.scoreCoverage.filter(item => item.termId === coverageTermId)
  const classesMissingScores = termScoreCoverage
    .map(item => ({
      ...item,
      className: setup.classes.find(schoolClass => schoolClass.id === item.classId)?.name ?? 'Class',
      missingCount: Math.max(0, item.expectedCount - item.completeCount),
    }))
    .filter(item => item.missingCount > 0)

  useEffect(() => {
    if (!student.classId && setup.classes[0]) {
      const classId = setup.classes[0].id
      const subjectIds = setup.classSubjects.filter(item => item.classId === classId).map(item => item.subjectId)
      setStudent(current => ({ ...current, classId, subjectIds }))
    }
    if (!classSubjectSelection.classId && setup.classes[0]) {
      const classId = setup.classes[0].id
      const subjectIds = setup.classSubjects.filter(item => item.classId === classId).map(item => item.subjectId)
      setClassSubjectSelection({ classId, subjectIds })
    }
    setSheetSelection(current => ({
      classId: current.classId || setup.classes[0]?.id || '',
      subjectId: current.subjectId || setup.subjects.find(subject =>
        setup.classSubjects.some(item => item.classId === (current.classId || setup.classes[0]?.id) && item.subjectId === subject.id),
      )?.id || '',
      termId: current.termId || setup.terms[0]?.id || '',
    }))
  }, [setup, student.classId, classSubjectSelection.classId])

  async function refresh(message: string) {
    setNotice(message)
    setError('')
    await router.invalidate()
  }

  async function run(action: () => Promise<unknown>, success: string) {
    setNotice('')
    setError('')
    try {
      await action()
      await refresh(success)
      return true
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The request failed. Please try again.')
      return false
    }
  }

  async function loadScores() {
    setNotice('')
    setError('')
    setLoadedSheetSelection(null)
    try {
      const selected = { ...sheetSelection }
      const rows = await getScoreSheet({ data: selected })
      setScoreRows(rows)
      setLoadedSheetSelection(selected)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The score sheet could not be loaded.')
    }
  }

  async function saveIndividualScore(row: (typeof scoreRows)[number]) {
    if (bulkSavingRef.current || individualSavingIdsRef.current.has(row.enrollmentId)) return
    individualSavingIdsRef.current.add(row.enrollmentId)
    setIndividualSavingIds(new Set(individualSavingIdsRef.current))
    try {
      await run(
        () => saveDraftScore({
          data: {
            enrollmentId: row.enrollmentId,
            subjectId: loadedSheetSelection!.subjectId,
            termId: loadedSheetSelection!.termId,
            testScore: row.testScore,
            examScore: row.examScore,
          },
        }),
        `Draft saved for ${row.firstName} ${row.lastName}.`,
      )
    } finally {
      individualSavingIdsRef.current.delete(row.enrollmentId)
      setIndividualSavingIds(new Set(individualSavingIdsRef.current))
    }
  }

  async function saveAllDraftScores() {
    if (
      bulkSavingRef.current ||
      individualSavingIdsRef.current.size > 0 ||
      !scoreSheetIsCurrent ||
      !loadedSheetSelection ||
      scoreRows.length === 0
    ) return

    bulkSavingRef.current = true
    setBulkSaving(true)
    setBulkSaveSummary(null)
    setNotice('')
    setError('')
    const selected = { ...loadedSheetSelection }
    const rowsToSave = scoreRows.map(row => ({ ...row }))
    const failures: ScoreSheetSaveFailure[] = []
    let savedCount = 0
    setBulkSaveProgress({ completed: 0, total: rowsToSave.length })

    try {
      for (const row of rowsToSave) {
        try {
          await saveDraftScore({
            data: {
              enrollmentId: row.enrollmentId,
              subjectId: selected.subjectId,
              termId: selected.termId,
              testScore: row.testScore,
              examScore: row.examScore,
            },
          })
          savedCount += 1
        } catch (reason) {
          failures.push({
            studentName: `${row.firstName} ${row.lastName}`,
            message: reason instanceof Error ? reason.message : 'The score could not be saved.',
          })
        }
        setBulkSaveProgress({ completed: savedCount + failures.length, total: rowsToSave.length })
      }

      let refreshError: string | undefined
      if (savedCount > 0) {
        try {
          const refreshedRows = await getScoreSheet({ data: selected })
          setScoreRows(refreshedRows)
          setLoadedSheetSelection(selected)
        } catch (reason) {
          refreshError = reason instanceof Error ? reason.message : 'The updated score sheet could not be reloaded.'
        }
        try {
          await router.invalidate()
        } catch (reason) {
          const message = reason instanceof Error ? reason.message : 'School workspace data could not be refreshed.'
          refreshError = refreshError ? `${refreshError} ${message}` : message
        }
      }

      setBulkSaveSummary({
        savedCount,
        totalCount: rowsToSave.length,
        failures,
        refreshError,
      })
    } finally {
      bulkSavingRef.current = false
      setBulkSaving(false)
    }
  }

  async function loadStaff() {
    setError('')
    try {
      setStaffList(await getSchoolStaff())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Staff accounts could not be loaded.')
    }
  }

  async function signOut() {
    await logout()
    window.location.assign('/login')
  }

  return <main className="records-page" style={schoolThemeStyle(setup.school?.mainColor, setup.school?.accentColor)}>
    <header className="records-header">
      <a className="records-school-brand" href="/school-data">
        {setup.school?.logoUrl
          ? <img src={setup.school.logoUrl} alt=""/>
          : <span className="records-school-seal"><span>{setup.school?.name?.slice(0, 1) || 'S'}</span></span>}
        <span><strong>{setup.school?.name ?? 'School workspace'}</strong><small>School administration <i>·</i> Classfolio</small></span>
      </a>
      <div><span>{staff.name || staff.email}</span><a className="secondary" href="/settings">Settings</a><button className="secondary" onClick={signOut}>Sign out</button></div>
    </header>
    <div className="records-content">
      <div className="eyebrow">CONNECTED SCHOOL WORKSPACE</div>
      <h1>{setup.school?.name ?? 'School records'}</h1>
      {setup.school && <p className="school-profile-line">{setup.school.address} · {setup.school.phone} · {setup.school.contactEmail}{setup.school.motto ? ` · ${setup.school.motto}` : ''}</p>}
      <p>Records entered here are saved in your Netlify Database. Draft scores are restricted to assigned staff and unpublished terms.</p>
      {notice && <p className="form-notice" role="status">{notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      <section className="school-dashboard" aria-label="School activity overview">
        <article className="school-dashboard-card">
          <span>Enrolled students</span>
          <strong>{setup.enrollments.length}</strong>
          <small>Current school records</small>
        </article>
        <article className="school-dashboard-card">
          <span>{isAdmin ? 'Classes needing scores' : 'Score overview'}</span>
          {isAdmin && setup.terms.length > 0 && <label className="dashboard-term-select">Term<select aria-label="Score status term" value={coverageTermId} onChange={event => setCoverageTermId(event.target.value)}>
            {setup.terms.map(item => <option key={item.id} value={item.id}>{item.academicYear} · {item.name}</option>)}
          </select></label>}
          <strong>{isAdmin && termScoreCoverage.length ? classesMissingScores.length : '—'}</strong>
          <small>{!isAdmin
            ? 'Score progress is not included in the staff overview.'
            : termScoreCoverage.length
              ? 'Based on registered subjects and complete draft entries'
              : 'No eligible student-subject records for this term'}</small>
        </article>
        <article className="school-dashboard-card dashboard-reports-card">
          <span>Reports ready to print</span>
          <strong>—</strong>
          <small>No generated reports are stored yet. Blank templates are previews only.</small>
        </article>
        <div className="school-dashboard-detail">
          <h2>Classes with missing scores</h2>
          {classesMissingScores.length
            ? <ul>{classesMissingScores.map(item => <li key={item.classId}>
                <strong>{item.className}</strong>
                <span>{item.missingCount} of {item.expectedCount} subject scores need completion</span>
              </li>)}</ul>
            : <p>{!isAdmin
              ? 'Score completion overview is available to school administrators.'
              : termScoreCoverage.length
                ? 'All registered subject scores are complete for this term.'
                : 'No score completion data is available for the selected term yet.'}</p>}
        </div>
      </section>

      {isAdmin && setup.school && <section className="records-section school-settings-link">
        <div><h2>School settings</h2><p>Update your school identity, logo, and colours used on printed reports.</p></div>
        <a className="primary" href="/settings">Open settings</a>
      </section>}

      <section className="records-section report-preview-section">
        <div className="section-heading">
          <div><h2>School report template</h2><p>The report design uses this school’s saved name, address, and logo.</p></div>
          <div className="report-preview-actions">
            {showReportPreview && <>
              <label>Class<select value={reportClassName} onChange={event => setReportClassName(event.target.value)}>
                {setup.classes.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
              </select></label>
              <label>Term<select value={reportTerm} onChange={event => {
                if (isResultTerm(event.target.value)) setReportTerm(event.target.value)
              }}>
                <option>First Term</option><option>Second Term</option><option>Third Term</option>
              </select></label>
            </>}
            <button className="secondary" type="button" onClick={() => setShowReportPreview(value => !value)}>{showReportPreview ? 'Hide preview' : 'Preview report'}</button>
            {showReportPreview && reportTemplateId && <button className="primary" type="button" onClick={() => window.print()}><Printer size={16}/> Print template</button>}
          </div>
        </div>
        {showReportPreview && (reportTemplateId
          ? <JuniorReportTemplate school={setup.school} className={reportClassName} term={reportTerm}/>
          : <p className="report-template-unavailable">A report template for {reportClassName} has not been uploaded yet. The matching JSS 3 or SS design can be added when available.</p>)}
      </section>

      {isAdmin && <section className="records-section">
        <h2>Classes, subjects, and terms</h2>
        <p>Each class has its own subject list. Start with the school catalogue, add subjects for different curricula, and configure each class before enrolling students.</p>
        <div className="records-grid">
          <form className="record-form" onSubmit={event => {
            event.preventDefault()
            void run(() => createSchoolClass({ data: { name: className } }), 'Class saved.')
              .then(saved => { if (saved) setClassName('') })
          }}>
            <h3>Add a class</h3>
            <label>Class name<input required maxLength={120} value={className} onChange={event => setClassName(event.target.value)} placeholder="e.g. SS 1" /></label>
            <button className="primary" type="submit">Save class</button>
          </form>
          <form className="record-form" onSubmit={event => {
            event.preventDefault()
            void run(() => createSubject({ data: { name: subjectName } }), 'Subject saved.')
              .then(saved => { if (saved) setSubjectName('') })
          }}>
            <h3>Add to the school subject catalogue</h3>
            <p>Add a curriculum subject that is not already listed. You can then select it for any class.</p>
            <label>Subject name<input required maxLength={120} value={subjectName} onChange={event => setSubjectName(event.target.value)} placeholder="Subject name" /></label>
            <button className="primary" type="submit">Add subject</button>
          </form>
          <form className="record-form" onSubmit={event => {
            event.preventDefault()
            void run(() => createAcademicTerm({ data: { academicYear, name: termName } }), 'Academic term saved.')
          }}>
            <h3>Add an academic term</h3>
            <label>Academic year<input required maxLength={20} value={academicYear} onChange={event => setAcademicYear(event.target.value)} placeholder="2025 / 2026" /></label>
            <label>Term<select value={termName} onChange={event => setTermName(event.target.value)}><option>First Term</option><option>Second Term</option><option>Third Term</option></select></label>
            <button className="primary" type="submit">Save term</button>
          </form>
        </div>
        <form className="record-form class-subject-form" onSubmit={event => {
          event.preventDefault()
          void run(() => saveClassSubjects({ data: classSubjectSelection }), 'Class subject list saved.')
        }}>
          <h3>Choose subjects for each class</h3>
          <p>Choose a class, then build its curriculum from the school subject catalogue. Changes are saved for that class only and must be configured before students are enrolled.</p>
          <label>Class<select required value={classSubjectSelection.classId} onChange={event => {
            const classId = event.target.value
            setSubjectToAdd('')
            setClassSubjectSelection({
              classId,
              subjectIds: setup.classSubjects.filter(item => item.classId === classId).map(item => item.subjectId),
            })
          }}><option value="">Select class</option>
            <optgroup label="Junior secondary">{setup.classes.filter(item => item.name.startsWith('JSS ')).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>
            <optgroup label="Senior secondary">{setup.classes.filter(item => item.name.startsWith('SS ')).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>
            <optgroup label="Other classes">{setup.classes.filter(item => !item.name.startsWith('JSS ') && !item.name.startsWith('SS ')).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>
          </select></label>
          <div className="class-subject-add">
            <label>Choose a subject from the catalogue<select value={subjectToAdd} onChange={event => setSubjectToAdd(event.target.value)} disabled={!classSubjectSelection.classId}>
              <option value="">Select a subject</option>
              {setup.subjects.map(item => <option key={item.id} value={item.id} disabled={classSubjectSelection.subjectIds.includes(item.id)}>
                {item.name}{classSubjectSelection.subjectIds.includes(item.id) ? ' (already selected)' : ''}
              </option>)}
            </select></label>
            <button className="secondary" type="button" disabled={!subjectToAdd || !classSubjectSelection.classId} onClick={() => {
              setClassSubjectSelection(current => current.subjectIds.includes(subjectToAdd)
                ? current
                : { ...current, subjectIds: [...current.subjectIds, subjectToAdd] })
              setSubjectToAdd('')
            }}>Add to class</button>
          </div>
          <div className="class-subject-list" aria-live="polite">
            <strong>Subjects selected for {setup.classes.find(item => item.id === classSubjectSelection.classId)?.name ?? 'this class'} ({classSubjectSelection.subjectIds.length})</strong>
            {classSubjectSelection.subjectIds.length
              ? <ul>{classSubjectSelection.subjectIds.map(subjectId => {
                  const subject = setup.subjects.find(item => item.id === subjectId)
                  return subject && <li key={subjectId}><span>{subject.name}</span><button className="text-button" type="button" aria-label={`Remove ${subject.name} from this class`} onClick={() => setClassSubjectSelection(current => ({
                    ...current,
                    subjectIds: current.subjectIds.filter(id => id !== subjectId),
                  }))}>Remove</button></li>
                })}</ul>
              : <p>No subjects selected. Choose subjects from the catalogue above.</p>}
          </div>
          <button className="primary" type="submit" disabled={!classSubjectSelection.classId}>Save class curriculum</button>
        </form>
      </section>}

      {isAdmin && <section className="records-section">
        <h2>Enroll a student</h2>
        <form className="record-form enrollment-form" onSubmit={event => {
          event.preventDefault()
          void run(() => createStudent({ data: { ...student, academicYear } }), 'Student enrollment saved.')
            .then(saved => {
              if (saved) setStudent(current => ({ ...current, admissionNumber: '', firstName: '', lastName: '', subjectIds: [] }))
            })
        }}>
          <label>Admission number<input required maxLength={40} value={student.admissionNumber} onChange={event => setStudent({ ...student, admissionNumber: event.target.value })} /></label>
          <label>First name<input required maxLength={80} value={student.firstName} onChange={event => setStudent({ ...student, firstName: event.target.value })} /></label>
          <label>Last name<input required maxLength={80} value={student.lastName} onChange={event => setStudent({ ...student, lastName: event.target.value })} /></label>
          <label>Class<select required value={student.classId} onChange={event => {
            const classId = event.target.value
            setStudent({
              ...student,
              classId,
              subjectIds: setup.classSubjects.filter(item => item.classId === classId).map(item => item.subjectId),
            })
          }}><option value="">Select class</option>{setup.classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Academic year<input required maxLength={20} value={academicYear} onChange={event => setAcademicYear(event.target.value)} placeholder="2025 / 2026" /></label>
          <fieldset className="subject-registration"><legend>Subjects registered for this student</legend>{setup.subjects.filter(item => setup.classSubjects.some(link => link.classId === student.classId && link.subjectId === item.id)).map(item => <label key={item.id}><input type="checkbox" checked={student.subjectIds.includes(item.id)} onChange={event => setStudent(current => ({ ...current, subjectIds: event.target.checked ? [...current.subjectIds, item.id] : current.subjectIds.filter(id => id !== item.id) }))} />{item.name}</label>)}{!student.subjectIds.length && <span>Configure subjects for this class before enrolling students.</span>}</fieldset>
          <button className="primary" type="submit" disabled={!setup.classes.length || !student.subjectIds.length}>Save student</button>
        </form>
      </section>}

      {isAdmin && <section className="records-section">
        <div className="section-heading"><div><h2>Staff accounts and assignments</h2><p>Invite the staff member in Netlify Identity first, then add their email to this school and assign their access.</p></div><button className="secondary" onClick={() => void loadStaff()}>Load school staff</button></div>
        <form className="record-form enrollment-form" onSubmit={event => {
          event.preventDefault()
          void run(() => addSchoolStaff({ data: { email: staffEmail } }), 'Teacher added to this school.')
            .then(saved => { if (saved) { setStaffEmail(''); void loadStaff() } })
        }}>
          <label>Invited staff email<input required type="email" value={staffEmail} onChange={event => setStaffEmail(event.target.value)} /></label>
          <button className="primary" type="submit">Add teacher account</button>
        </form>
        {staffList.length > 0 && <div className="records-table-wrap"><table className="records-table"><thead><tr><th>Staff email</th><th>Current role</th><th>Change role</th></tr></thead><tbody>{staffList.map(item => <tr key={item.id}>
          <td>{item.email}</td><td>{item.role}</td><td><select aria-label={`Role for ${item.email}`} value={item.role} onChange={event => {
            const role = event.target.value
            setStaffRoleValue({ membershipId: item.id, role })
            void run(() => setStaffRole({ data: { membershipId: item.id, role } }), 'Staff role updated.')
          }}><option value="teacher">Teacher</option><option value="admin">Administrator</option></select></td>
        </tr>)}</tbody></table></div>}
        <form className="record-form enrollment-form" onSubmit={event => {
          event.preventDefault()
          void run(() => setStaffRole({ data: staffRole }), 'Staff role saved. Sign in again for the new role to take effect.')
        }}>
          <label>School staff member<select required value={staffRole.membershipId} onChange={event => setStaffRoleValue({ ...staffRole, membershipId: event.target.value })}><option value="">Select account</option>{staffList.map(item => <option key={item.id} value={item.id}>{item.email || item.id} · {item.role}</option>)}</select></label>
          <label>Role<select value={staffRole.role} onChange={event => setStaffRoleValue({ ...staffRole, role: event.target.value })}><option value="teacher">Teacher</option><option value="admin">Administrator</option></select></label>
          <button className="primary" type="submit" disabled={!staffRole.membershipId}>Save role</button>
        </form>
        <h3>Assign a teacher</h3>
        <form className="record-form enrollment-form" onSubmit={event => {
          event.preventDefault()
          void run(() => assignTeacher({ data: teacherAssignments }), 'Teacher assignment saved.')
        }}>
          <label>Teacher account<select required value={teacherAssignments.identityUserId} onChange={event => setTeacherAssignments({ ...teacherAssignments, identityUserId: event.target.value })}><option value="">Select teacher</option>{staffList.filter(item => item.role === 'teacher').map(item => <option key={item.id} value={item.identityUserId}>{item.email}</option>)}</select></label>
          <label>Class<select required value={teacherAssignments.classId} onChange={event => setTeacherAssignments({ ...teacherAssignments, classId: event.target.value })}><option value="">Select class</option>{setup.classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Subject<select required value={teacherAssignments.subjectId} onChange={event => setTeacherAssignments({ ...teacherAssignments, subjectId: event.target.value })}><option value="">Select subject</option>{setup.subjects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <button className="primary" type="submit">Save assignment</button>
        </form>
      </section>}

      <section className="records-section">
        <h2>Enter draft scores</h2>
        <div className="score-selection">
          <label>Class<select value={sheetSelection.classId} disabled={bulkSaving} onChange={event => { setLoadedSheetSelection(null); setScoreRows([]); setBulkSaveSummary(null); setSheetSelection({ ...sheetSelection, classId: event.target.value }) }}><option value="">Select class</option>{setup.classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Subject<select value={sheetSelection.subjectId} disabled={bulkSaving} onChange={event => { setLoadedSheetSelection(null); setScoreRows([]); setBulkSaveSummary(null); setSheetSelection({ ...sheetSelection, subjectId: event.target.value }) }}><option value="">Select subject</option>{setup.subjects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Term<select value={sheetSelection.termId} disabled={bulkSaving} onChange={event => { setLoadedSheetSelection(null); setScoreRows([]); setBulkSaveSummary(null); setSheetSelection({ ...sheetSelection, termId: event.target.value }) }}><option value="">Select term</option>{setup.terms.map(item => <option key={item.id} value={item.id}>{item.academicYear} · {item.name}</option>)}</select></label>
          <button className="primary" onClick={() => void loadScores()} disabled={bulkSaving || !sheetSelection.classId || !sheetSelection.subjectId || !sheetSelection.termId}>Load score sheet</button>
          {scoreSheetIsCurrent && scoreRows.length > 0 && <button className="primary" type="button" onClick={() => void saveAllDraftScores()} disabled={bulkSaving || individualSavingIds.size > 0}>
            {bulkSaving ? 'Saving score sheet…' : 'Save all draft scores'}
          </button>}
        </div>
        {bulkSaving && <p className="form-notice" role="status">Saving score sheet… {bulkSaveProgress.completed} of {bulkSaveProgress.total} rows processed.</p>}
        {bulkSaveSummary && <>
          <p className={bulkSaveSummary.failures.length || bulkSaveSummary.refreshError ? 'form-error' : 'form-notice'} role={bulkSaveSummary.failures.length || bulkSaveSummary.refreshError ? 'alert' : 'status'}>
            {bulkSaveSummary.failures.length
              ? `Saved ${bulkSaveSummary.savedCount} of ${bulkSaveSummary.totalCount} rows. Some scores could not be saved.`
              : `Saved all ${bulkSaveSummary.savedCount} draft score rows.`}
            {bulkSaveSummary.refreshError && ` Refresh issue: ${bulkSaveSummary.refreshError}`}
          </p>
          {bulkSaveSummary.failures.length > 0 && <ul className="form-error" aria-label="Scores that failed to save">
            {bulkSaveSummary.failures.map((failure, index) => <li key={`${failure.studentName}-${index}`}>{failure.studentName}: {failure.message}</li>)}
          </ul>}
        </>}
        {scoreSheetIsCurrent && scoreRows.length > 0 && <div className="records-table-wrap"><table className="records-table">
          <thead><tr><th>Student</th><th>Admission no.</th><th>Test / 40</th><th>Examination / 60</th><th></th></tr></thead>
          <tbody>{scoreRows.map(row => <tr key={row.enrollmentId}>
            <td>{row.firstName} {row.lastName}</td>
            <td>{row.admissionNumber}</td>
            <td><input aria-label={`Test score for ${row.firstName} ${row.lastName}`} type="number" min="0" max="40" step="1" disabled={bulkSaving} value={row.testScore ?? ''} onChange={event => setScoreRows(rows => rows.map(item => item.enrollmentId === row.enrollmentId ? { ...item, testScore: event.target.value === '' ? null : Number(event.target.value) } : item))} /></td>
            <td><input aria-label={`Examination score for ${row.firstName} ${row.lastName}`} type="number" min="0" max="60" step="1" disabled={bulkSaving} value={row.examScore ?? ''} onChange={event => setScoreRows(rows => rows.map(item => item.enrollmentId === row.enrollmentId ? { ...item, examScore: event.target.value === '' ? null : Number(event.target.value) } : item))} /></td>
            <td><button className="secondary" disabled={bulkSaving || individualSavingIds.has(row.enrollmentId)} onClick={() => void saveIndividualScore(row)}>{individualSavingIds.has(row.enrollmentId) ? 'Saving…' : 'Save draft'}</button></td>
          </tr>)}</tbody>
        </table></div>}
        {scoreSheetIsCurrent && scoreRows.length === 0
          ? <p className="records-empty">No students are registered for the selected class, subject, and academic term.</p>
          : !scoreSheetIsCurrent && <p className="records-empty">Load an assigned class, subject, and term to enter draft scores. Empty scores remain blank; this screen does not calculate report results.</p>}
      </section>

      <section className="records-section">
        <h2>Current roster</h2>
        {setup.enrollments.length > 0
          ? <div className="records-table-wrap"><table className="records-table"><thead><tr><th>Student</th><th>Admission no.</th><th>Class</th><th>Academic year</th></tr></thead><tbody>
            {setup.enrollments.map(item => <tr key={item.id}><td>{item.firstName} {item.lastName}</td><td>{item.admissionNumber}</td><td>{item.className}</td><td>{item.academicYear}</td></tr>)}
          </tbody></table></div>
          : <p className="records-empty">No student enrollments are available yet.</p>}
      </section>
    </div>
  </main>
}
