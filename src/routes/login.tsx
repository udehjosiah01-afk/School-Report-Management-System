import { acceptInvite, handleAuthCallback, login, logout } from '@netlify/identity'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getCurrentStaff } from '../server/auth'
import { bootstrapInitialAdministrator } from '../server/school-actions'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    if (await getCurrentStaff()) throw redirect({ to: '/school-data' })
  },
  component: Login,
})

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    void handleAuthCallback()
      .then(result => {
        if (!active || !result) return
        if (result.type === 'invite' && result.token) {
          setInviteToken(result.token)
          return
        }
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
      if (inviteToken && password !== confirmPassword) {
        throw new Error('The passwords do not match.')
      }
      const user = inviteToken
        ? await acceptInvite(inviteToken, password)
        : await login(email.trim(), password)
      const accountEmail = user.email ?? email.trim()
      if (user.email) setEmail(user.email)
      if (!user.roles?.some(role => role === 'admin' || role === 'teacher')) {
        try {
          await bootstrapInitialAdministrator()
          await logout()
          const refreshedUser = await login(accountEmail, password)
          if (refreshedUser.roles?.includes('admin')) {
            window.location.assign('/school-data')
            return
          }
        } catch (reason) {
          await logout()
          throw new Error(reason instanceof Error ? reason.message : 'Your account does not have a school staff role. Ask your administrator for access.')
        }
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
      <h1>{inviteToken ? 'Set your password.' : 'Welcome back.'}</h1>
      <p>{inviteToken ? 'Choose a password to finish setting up your invited school account.' : 'Sign in with the school account invited by your administrator.'}</p>
      <form onSubmit={submit} className="record-form">
        {!inviteToken && <label>Email address<input autoComplete="username" type="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>}
        <label>{inviteToken ? 'New password' : 'Password'}<input autoComplete={inviteToken ? 'new-password' : 'current-password'} type="password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} /></label>
        {inviteToken && <label>Confirm password<input autoComplete="new-password" type="password" minLength={8} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary" type="submit" disabled={submitting}>{submitting ? 'Please wait…' : inviteToken ? 'Set password' : 'Sign in'}</button>
      </form>
      <p className="auth-note">Accounts are invite-only. Contact your school administrator if you need access or a staff role.</p>
    </section>
  </main>
}
