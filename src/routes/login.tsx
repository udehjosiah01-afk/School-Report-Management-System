import { handleAuthCallback, login, logout } from '@netlify/identity'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getCurrentStaff } from '../server/auth'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    if (await getCurrentStaff()) throw redirect({ to: '/school-data' })
  },
  component: Login,
})

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    void handleAuthCallback()
      .then(result => {
        if (!active || !result) return
        if (result.user?.roles?.some(role => role === 'admin' || role === 'teacher')) {
          window.location.assign('/school-data')
        } else {
          setError('Your account does not have a school staff role. Ask your administrator for access.')
        }
      })
      .catch(reason => {
        if (active) setError(reason instanceof Error ? reason.message : 'The invitation could not be verified.')
      })
    return () => { active = false }
  }, [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = await login(email.trim(), password)
      if (!user.roles?.some(role => role === 'admin' || role === 'teacher')) {
        await logout()
        throw new Error('Your account does not have a school staff role. Ask your administrator for access.')
      }
      window.location.assign('/school-data')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sign-in failed. Please try again.')
      setSubmitting(false)
    }
  }

  return <main className="auth-page">
    <a className="brand" href="/">classfolio<span className="brand-dot">.</span></a>
    <section className="auth-card">
      <div className="eyebrow">STAFF WORKSPACE</div>
      <h1>Welcome back.</h1>
      <p>Sign in with the school account invited by your administrator.</p>
      <form onSubmit={submit} className="record-form">
        <label>Email address<input autoComplete="username" type="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>
        <label>Password<input autoComplete="current-password" type="password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="auth-note">Accounts are invite-only. Contact your school administrator if you need access.</p>
    </section>
  </main>
}
