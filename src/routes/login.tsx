import { acceptInvite, handleAuthCallback, login } from '@netlify/identity'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getCurrentIdentity, getCurrentStaff } from '../server/auth'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const identity = await getCurrentIdentity()
    if (!identity) return
    throw redirect({ to: await getCurrentStaff() ? '/school-data' : '/school-setup' })
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
      .then(async result => {
        if (!active || !result) return
        if (result.type === 'invite' && result.token) {
          setInviteToken(result.token)
          return
        }
        if (result.type === 'confirmation' && result.user) {
          const staff = await getCurrentStaff()
          window.location.assign(staff ? '/school-data' : '/school-setup')
        } else if (result.user) {
          window.location.assign(await getCurrentStaff() ? '/school-data' : '/school-setup')
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
      if (user.email) setEmail(user.email)
      const staff = await getCurrentStaff()
      window.location.assign(staff ? '/school-data' : '/school-setup')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sign-in failed. Please try again.')
      setSubmitting(false)
    }
  }

  return <main className="auth-page">
    <a className="brand" href="/">classfolio<span className="brand-dot">.</span></a>
    <section className="auth-card">
      <div className="eyebrow">{inviteToken ? 'STAFF WORKSPACE' : 'SCHOOL WORKSPACE'}</div>
      <h1>{inviteToken ? 'Set your password.' : 'Welcome back.'}</h1>
      <p>{inviteToken
        ? 'Choose a password to finish setting up your invited school staff account.'
        : 'Sign in to your school account, or register your school to create a new account.'}</p>
      <form onSubmit={submit} className="record-form">
        {!inviteToken && <label>Email address<input autoComplete="username" type="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>}
        <label>{inviteToken ? 'New password' : 'Password'}<input autoComplete={inviteToken ? 'new-password' : 'current-password'} type="password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} /></label>
        {inviteToken && <label>Confirm password<input autoComplete="new-password" type="password" minLength={8} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary" type="submit" disabled={submitting}>{submitting ? 'Please wait…' : inviteToken ? 'Set password' : 'Sign in'}</button>
      </form>
      <p className="auth-note">Teachers and other staff need to be added by their school administrator. <a href="/signup">New school? Create an account</a></p>
    </section>
  </main>
}
