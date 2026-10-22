import { getUser, signup } from '@netlify/identity'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { getCurrentIdentity } from '../server/auth'

export const Route = createFileRoute('/signup')({
  beforeLoad: async () => {
    if (await getCurrentIdentity()) throw redirect({ to: '/school-setup' })
  },
  component: Signup,
})

function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      const user = await signup(email.trim(), password, { full_name: name.trim() })
      if (await getUser()) {
        window.location.assign('/school-setup')
        return
      }
      setNotice(`We sent an account confirmation link to ${user.email ?? email}. Confirm your email, then sign in to enter your school details.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your account could not be created. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="auth-page">
    <a className="brand" href="/">classfolio<span className="brand-dot">.</span></a>
    <section className="auth-card">
      <div className="eyebrow">START A SCHOOL WORKSPACE</div>
      <h1>Create your account.</h1>
      <p>Verify your email, then add your school profile. Your school becomes its own private workspace.</p>
      <form onSubmit={submit} className="record-form">
        <label>Your name<input autoComplete="name" required maxLength={120} value={name} onChange={event => setName(event.target.value)} /></label>
        <label>Email address<input autoComplete="email" type="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>
        <label>Password<input autoComplete="new-password" type="password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} /></label>
        <label>Confirm password<input autoComplete="new-password" type="password" minLength={8} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>
        {notice && <p className="form-notice" role="status">{notice}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary" type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Create school account'}</button>
      </form>
      <p className="auth-note">Already have an account? <a href="/login">Sign in</a></p>
    </section>
  </main>
}
