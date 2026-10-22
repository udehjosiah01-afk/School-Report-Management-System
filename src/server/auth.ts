import { createServerFn } from '@tanstack/react-start'

export type StaffRole = 'admin' | 'teacher'
export type StaffContext = {
  id: string
  email: string
  name: string
  roles: StaffRole[]
  role: StaffRole
  membershipId: string
  schoolId: string
}

export const getCurrentIdentity = createServerFn({ method: 'GET' }).handler(async () => {
  const { getIdentityUser } = await import('./auth.server')
  return getIdentityUser()
})

export const getCurrentStaff = createServerFn({ method: 'GET' }).handler(async () => {
  const { getIdentityUser, getStaffForIdentity } = await import('./auth.server')
  const identity = await getIdentityUser()
  return identity ? getStaffForIdentity(identity.id) : null
})
