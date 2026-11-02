export function SchoolAccessControls({
  schoolId,
  classId,
  subjectId,
  teacherName,
  teacherIdentityUserId,
  onGenerateTeacherCode,
  onResetTeacherCode,
  studentName,
  studentId,
  onGenerateParentCode,
  onResetParentCode,
}: {
  schoolId?: string
  classId?: string
  subjectId?: string
  teacherName?: string
  teacherIdentityUserId?: string
  onGenerateTeacherCode?: (payload: { identityUserId: string; classId: string; subjectId: string }) => Promise<{ code: string } | void>
  onResetTeacherCode?: (payload: { identityUserId: string; classId: string; subjectId: string }) => Promise<{ code: string } | void>
  studentName?: string
  studentId?: string
  onGenerateParentCode?: (payload: { studentId: string }) => Promise<{ code: string } | void>
  onResetParentCode?: (payload: { studentId: string }) => Promise<{ code: string } | void>
}) {
  return <div className="school-access-controls">
    <section className="records-section">
      <h3>Teacher subject code</h3>
      <p>Each teacher can be assigned a unique four-digit code for a class/subject combination. The admin can regenerate it if it is misplaced.</p>
      <div className="school-access-actions">
        <button type="button" className="primary" disabled={!teacherIdentityUserId || !classId || !subjectId || !onGenerateTeacherCode} onClick={() => teacherIdentityUserId && classId && subjectId && onGenerateTeacherCode?.({ identityUserId: teacherIdentityUserId, classId, subjectId })}>Generate code</button>
        <button type="button" className="secondary" disabled={!teacherIdentityUserId || !classId || !subjectId || !onResetTeacherCode} onClick={() => teacherIdentityUserId && classId && subjectId && onResetTeacherCode?.({ identityUserId: teacherIdentityUserId, classId, subjectId })}>Reset code</button>
      </div>
      {teacherName && <small>Teacher: {teacherName}</small>}
    </section>

    <section className="records-section">
      <h3>Parent report access code</h3>
      <p>Parents view a child’s report card by entering the four-digit passcode assigned to that learner. The school administrator manages reset and recovery.</p>
      <div className="school-access-actions">
        <button type="button" className="primary" disabled={!studentId || !onGenerateParentCode} onClick={() => studentId && onGenerateParentCode?.({ studentId })}>Generate passcode</button>
        <button type="button" className="secondary" disabled={!studentId || !onResetParentCode} onClick={() => studentId && onResetParentCode?.({ studentId })}>Reset passcode</button>
      </div>
      {studentName && <small>Learner: {studentName}</small>}
    </section>
  </div>
}
