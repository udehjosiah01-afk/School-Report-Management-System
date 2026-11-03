export function ReportAccessGate({
  schoolEmail,
  admissionNumber,
  code,
  onSchoolEmailChange,
  onAdmissionNumberChange,
  onCodeChange,
  onSubmit,
  error,
}: {
  schoolEmail: string
  admissionNumber: string
  code: string
  onSchoolEmailChange: (value: string) => void
  onAdmissionNumberChange: (value: string) => void
  onCodeChange: (value: string) => void
  onSubmit: (payload: { schoolEmail: string; admissionNumber: string; code: string }) => Promise<void> | void
  error?: string
}) {
  return <form className="record-form" onSubmit={async event => {
    event.preventDefault()
    await onSubmit({ schoolEmail, admissionNumber, code })
  }}>
    <label>School contact email<input required type="email" autoComplete="organization" value={schoolEmail} onChange={event => onSchoolEmailChange(event.target.value)} /></label>
    <label>Learner admission number<input required autoComplete="off" value={admissionNumber} onChange={event => onAdmissionNumberChange(event.target.value)} /></label>
    <label>Four-digit parent passcode<input required type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="one-time-code" value={code} onChange={event => onCodeChange(event.target.value.replace(/\D/g, '').slice(0, 4))} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button type="submit" className="primary">Open report card</button>
  </form>
}
