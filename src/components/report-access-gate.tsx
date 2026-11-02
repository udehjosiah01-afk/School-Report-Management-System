export function ReportAccessGate({
  schoolEmail,
  admissionNumber,
  code,
  onSubmit,
  error,
}: {
  schoolEmail: string
  admissionNumber: string
  code: string
  onSubmit: (payload: { schoolEmail: string; admissionNumber: string; code: string }) => Promise<void> | void
  error?: string
}) {
  return <form className="record-form" onSubmit={async event => {
    event.preventDefault()
    await onSubmit({ schoolEmail, admissionNumber, code })
  }}>
    <label>School contact email<input value={schoolEmail} readOnly /></label>
    <label>Admission number<input value={admissionNumber} readOnly /></label>
    <label>Four-digit parent passcode<input type="password" inputMode="numeric" value={code} readOnly /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button type="submit" className="primary">Open report card</button>
  </form>
}
