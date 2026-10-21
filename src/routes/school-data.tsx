import { logout } from '@netlify/identity'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getCurrentStaff } from '../server/auth'
import {
  assignTeacher,
  createAcademicTerm,
  createSchoolClass,
  createStudent,
  createSubject,
  getIdentityStaff,
  getSchoolSetup,
  getScoreSheet,
} from '../server/school-actions'
import { saveDraftScore } from '../server/score-actions'

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
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [className, setClassName] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [termName, setTermName] = useState('First Term')
  const [student, setStudent] = useState({ admissionNumber: '', firstName: '', lastName: '', classId: '', subjectIds: [] as string[] })
  const [teacherAssignments, setTeacherAssignments] = useState({ identityUserId: '', classId: '', subjectId: '' })
  const [staffList, setStaffList] = useState<Awaited<ReturnType<typeof getIdentityStaff>>>([])
  const [sheetSelection, setSheetSelection] = useState({ classId: '', subjectId: '', termId: '' })
  const [scoreRows, setScoreRows] = useState<Awaited<ReturnType<typeof getScoreSheet>>>([])

  useEffect(() => {
    if (!student.classId && setup.classes[0]) setStudent(current => ({ ...current, classId: setup.classes[0].id }))
    setSheetSelection(current => ({
      classId: current.classId || setup.classes[0]?.id || '',
      subjectId: current.subjectId || setup.subjects[0]?.id || '',
      termId: current.termId || setup.terms[0]?.id || '',
    }))
  }, [setup, student.classId])

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
    try {
      setScoreRows(await getScoreSheet({ data: sheetSelection }))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The score sheet could not be loaded.')
    }
  }

  async function loadStaff() {
    setError('')
    try {
      setStaffList(await getIdentityStaff())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Staff accounts could not be loaded.')
    }
  }

  async function signOut() {
    await logout()
    window.location.assign('/login')
  }

  return <main className="records-page">
    <header className="records-header">
      <a className="brand" href="/">classfolio<span className="brand-dot">.</span></a>
      <div><span>{staff.name || staff.email}</span><button className="secondary" onClick={signOut}>Sign out</button></div>
    </header>
    <div className="records-content">
      <div className="eyebrow">CONNECTED SCHOOL WORKSPACE</div>
      <h1>School records</h1>
      <p>Records entered here are saved in your Netlify Database. Draft scores are restricted to assigned staff and unpublished terms.</p>
      {notice && <p className="form-notice" role="status">{notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {isAdmin && <section className="records-section">
        <h2>Set up classes, subjects, and terms</h2>
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
            <h3>Add a subject</h3>
            <label>Subject name<input required maxLength={120} value={subjectName} onChange={event => setSubjectName(event.target.value)} placeholder="Subject name" /></label>
            <button className="primary" type="submit">Save subject</button>
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
          <label>Class<select required value={student.classId} onChange={event => setStudent({ ...student, classId: event.target.value })}><option value="">Select class</option>{setup.classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Academic year<input required maxLength={20} value={academicYear} onChange={event => setAcademicYear(event.target.value)} placeholder="2025 / 2026" /></label>
          <fieldset className="subject-registration"><legend>Subjects registered for this student</legend>{setup.subjects.map(item => <label key={item.id}><input type="checkbox" checked={student.subjectIds.includes(item.id)} onChange={event => setStudent(current => ({ ...current, subjectIds: event.target.checked ? [...current.subjectIds, item.id] : current.subjectIds.filter(id => id !== item.id) }))} />{item.name}</label>)}</fieldset>
          <button className="primary" type="submit" disabled={!setup.classes.length || !student.subjectIds.length}>Save student</button>
        </form>
      </section>}

      {isAdmin && <section className="records-section">
        <div className="section-heading"><div><h2>Assign a teacher</h2><p>Teachers can enter scores only for their assigned classes and subjects.</p></div><button className="secondary" onClick={() => void loadStaff()}>Load staff accounts</button></div>
        <form className="record-form enrollment-form" onSubmit={event => {
          event.preventDefault()
          void run(() => assignTeacher({ data: teacherAssignments }), 'Teacher assignment saved.')
        }}>
          <label>Teacher account<select required value={teacherAssignments.identityUserId} onChange={event => setTeacherAssignments({ ...teacherAssignments, identityUserId: event.target.value })}><option value="">Select teacher</option>{staffList.filter(item => item.roles.includes('teacher')).map(item => <option key={item.id} value={item.id}>{item.email}</option>)}</select></label>
          <label>Class<select required value={teacherAssignments.classId} onChange={event => setTeacherAssignments({ ...teacherAssignments, classId: event.target.value })}><option value="">Select class</option>{setup.classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Subject<select required value={teacherAssignments.subjectId} onChange={event => setTeacherAssignments({ ...teacherAssignments, subjectId: event.target.value })}><option value="">Select subject</option>{setup.subjects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <button className="primary" type="submit">Save assignment</button>
        </form>
      </section>}

      <section className="records-section">
        <h2>Enter draft scores</h2>
        <div className="score-selection">
          <label>Class<select value={sheetSelection.classId} onChange={event => setSheetSelection({ ...sheetSelection, classId: event.target.value })}><option value="">Select class</option>{setup.classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Subject<select value={sheetSelection.subjectId} onChange={event => setSheetSelection({ ...sheetSelection, subjectId: event.target.value })}><option value="">Select subject</option>{setup.subjects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Term<select value={sheetSelection.termId} onChange={event => setSheetSelection({ ...sheetSelection, termId: event.target.value })}><option value="">Select term</option>{setup.terms.map(item => <option key={item.id} value={item.id}>{item.academicYear} · {item.name}</option>)}</select></label>
          <button className="primary" onClick={() => void loadScores()} disabled={!sheetSelection.classId || !sheetSelection.subjectId || !sheetSelection.termId}>Load score sheet</button>
        </div>
        {scoreRows.length > 0 && <div className="records-table-wrap"><table className="records-table">
          <thead><tr><th>Student</th><th>Admission no.</th><th>Test / 40</th><th>Examination / 60</th><th></th></tr></thead>
          <tbody>{scoreRows.map(row => <tr key={row.enrollmentId}>
            <td>{row.firstName} {row.lastName}</td>
            <td>{row.admissionNumber}</td>
            <td><input aria-label={`Test score for ${row.firstName} ${row.lastName}`} type="number" min="0" max="40" step="1" value={row.testScore ?? ''} onChange={event => setScoreRows(rows => rows.map(item => item.enrollmentId === row.enrollmentId ? { ...item, testScore: event.target.value === '' ? null : Number(event.target.value) } : item))} /></td>
            <td><input aria-label={`Examination score for ${row.firstName} ${row.lastName}`} type="number" min="0" max="60" step="1" value={row.examScore ?? ''} onChange={event => setScoreRows(rows => rows.map(item => item.enrollmentId === row.enrollmentId ? { ...item, examScore: event.target.value === '' ? null : Number(event.target.value) } : item))} /></td>
            <td><button className="secondary" onClick={() => void run(() => saveDraftScore({ data: { enrollmentId: row.enrollmentId, subjectId: sheetSelection.subjectId, termId: sheetSelection.termId, testScore: row.testScore, examScore: row.examScore } }), `Draft saved for ${row.firstName} ${row.lastName}.`)}>Save draft</button></td>
          </tr>)}</tbody>
        </table></div>}
        {scoreRows.length === 0 && <p className="records-empty">Load an assigned class, subject, and term to enter draft scores. Empty scores remain blank; this screen does not calculate report results.</p>}
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
