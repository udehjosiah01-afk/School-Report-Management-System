import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { getCurrentIdentity, getCurrentStaff } from '../server/auth'
import { registerSchool } from '../server/school-actions'
import { SchoolLogoUpload } from '../components/school-logo-upload'
import { SchoolColorFields } from '../components/school-color-fields'
import { DEFAULT_ACCENT_COLOR, DEFAULT_MAIN_COLOR } from '../data/school-branding'

export const Route = createFileRoute('/school-setup')({
  beforeLoad: async () => {
    if (!(await getCurrentIdentity())) throw redirect({ to: '/login' })
    if (await getCurrentStaff()) throw redirect({ to: '/school-data' })
  },
  component: SchoolSetup,
})

function SchoolSetup() {
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    contactEmail: '',
    motto: '',
    logoUrl: null as string | null,
    mainColor: DEFAULT_MAIN_COLOR,
    accentColor: DEFAULT_ACCENT_COLOR,
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await registerSchool({ data: form })
      window.location.assign('/school-data')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The school profile could not be saved.')
      setSubmitting(false)
    }
  }

  return <main className="auth-page">
    <a className="brand" href="/">classfolio<span className="brand-dot">.</span></a>
    <section className="auth-card">
      <div className="eyebrow">SCHOOL PROFILE</div>
      <h1>Tell us about your school.</h1>
      <p>These details identify your school on its report cards. You can upload a logo now or change your branding later in the school workspace.</p>
      <form onSubmit={submit} className="record-form">
        <label>School name<input required maxLength={160} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
        <label>School address<textarea required maxLength={300} rows={3} value={form.address} onChange={event => setForm({ ...form, address: event.target.value })} /></label>
        <SchoolLogoUpload logoUrl={form.logoUrl} schoolName={form.name} onChange={logoUrl => setForm(current => ({ ...current, logoUrl }))}/>
        <SchoolColorFields mainColor={form.mainColor} accentColor={form.accentColor} onChange={colors => setForm(current => ({ ...current, ...colors }))}/>
        <label>School phone number<input autoComplete="tel" required maxLength={40} value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} /></label>
        <label>School contact email<input autoComplete="email" type="email" required maxLength={254} value={form.contactEmail} onChange={event => setForm({ ...form, contactEmail: event.target.value })} /></label>
        <label>School motto <span className="optional-label">(optional)</span><input maxLength={160} value={form.motto} onChange={event => setForm({ ...form, motto: event.target.value })} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary" type="submit" disabled={submitting}>{submitting ? 'Saving school…' : 'Create my school workspace'}</button>
      </form>
    </section>
  </main>
}
