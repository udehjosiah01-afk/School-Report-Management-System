import { useState } from 'react'

export function SchoolAccessControls({
  classId,
  subjectId,
  teacherName,
  teacherIdentityUserId,
  onResetTeacherCode,
  studentName,
  studentId,
  onResetParentCode,
}: {
  classId?: string
  subjectId?: string
  teacherName?: string
  teacherIdentityUserId?: string
  onResetTeacherCode?: (payload: { identityUserId: string; classId: string; subjectId: string }) => Promise<{ code: string } | void>
  studentName?: string
  studentId?: string
  onResetParentCode?: (payload: { studentId: string }) => Promise<{ code: string } | void>
}) {
  const [issuedCode, setIssuedCode] = useState('')
  const [error, setError] = useState('')
  const hasTeacher = Boolean(teacherIdentityUserId && classId && subjectId)
  const hasParent = Boolean(studentId)

  async function issueCode(action: () => Promise<{ code: string } | void>) {
    setIssuedCode('')
    setError('')
    try {
      const result = await action()
      if (result?.code) setIssuedCode(result.code)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The access code could not be issued.')
    }
  }

  return <div className="school-access-controls">
    {hasTeacher && <section>
      <h3>Teacher subject code</h3>
      <p>Required after staff sign-in to open this assigned score sheet. A reset invalidates the previous code.</p>
      <button type="button" className="secondary" disabled={!onResetTeacherCode} onClick={() => {
        if (teacherIdentityUserId && classId && subjectId && onResetTeacherCode) {
          void issueCode(() => onResetTeacherCode({ identityUserId: teacherIdentityUserId, classId, subjectId }))
        }
      }}>Reset and issue new teacher code</button>
      {teacherName && <small>Teacher: {teacherName}</small>}
    </section>}

    {hasParent && <section>
      <h3>Parent report access code</h3>
      <p>Parents use this learner-specific code to access published report cards. A reset invalidates the previous code.</p>
      <button type="button" className="secondary" disabled={!onResetParentCode} onClick={() => {
        if (studentId && onResetParentCode) void issueCode(() => onResetParentCode({ studentId }))
      }}>Reset and issue new parent code</button>
      {studentName && <small>Learner: {studentName}</small>}
    </section>}
    {issuedCode && <p className="form-notice access-code-issued" role="status">
      New four-digit code: <strong>{issuedCode}</strong>. Copy it now and share it privately; it cannot be viewed again.
    </p>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>
}
