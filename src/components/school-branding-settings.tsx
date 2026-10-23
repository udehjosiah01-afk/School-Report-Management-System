import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { SchoolColorFields } from './school-color-fields'
import { SchoolLogoUpload } from './school-logo-upload'
import { updateSchoolBranding } from '../server/school-actions'
import type { ReportSchoolBranding } from './junior-report-template'
import { DEFAULT_ACCENT_COLOR, DEFAULT_MAIN_COLOR } from '../data/school-branding'

export type SchoolBrandingProfile = ReportSchoolBranding & {
  phone: string
  contactEmail: string
  mainColor: string
  accentColor: string
}

export function SchoolBrandingSettings({ school }: { school: SchoolBrandingProfile }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: school.name,
    address: school.address,
    phone: school.phone,
    contactEmail: school.contactEmail,
    motto: school.motto ?? '',
    logoUrl: school.logoUrl ?? null,
    mainColor: school.mainColor || DEFAULT_MAIN_COLOR,
    accentColor: school.accentColor || DEFAULT_ACCENT_COLOR,
  })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setNotice('')
    setError('')
    try {
      await updateSchoolBranding({ data: form })
      setNotice('School settings saved.')
      await router.invalidate()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'School settings could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return <form className="record-form records-branding-form" onSubmit={submit}>
    <label>School name<input required maxLength={160} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })}/></label>
    <label>School address<textarea required maxLength={300} rows={3} value={form.address} onChange={event => setForm({ ...form, address: event.target.value })}/></label>
    <SchoolLogoUpload logoUrl={form.logoUrl} schoolName={form.name} onChange={logoUrl => setForm(current => ({ ...current, logoUrl }))}/>
    <SchoolColorFields mainColor={form.mainColor} accentColor={form.accentColor} onChange={colors => setForm(current => ({ ...current, ...colors }))}/>
    <label>School phone number<input autoComplete="tel" required maxLength={40} value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })}/></label>
    <label>School contact email<input autoComplete="email" type="email" required maxLength={254} value={form.contactEmail} onChange={event => setForm({ ...form, contactEmail: event.target.value })}/></label>
    <label>School motto <span className="optional-label">(optional)</span><input maxLength={160} value={form.motto} onChange={event => setForm({ ...form, motto: event.target.value })}/></label>
    {notice && <p className="form-notice" role="status">{notice}</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="primary" type="submit" disabled={saving}>{saving ? 'Saving settings…' : 'Save school settings'}</button>
  </form>
}
