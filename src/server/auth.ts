import { eq } from 'drizzle-orm'
import { getUser, type User } from '@netlify/identity'
import { createServerFn } from '@tanstack/react-start'
import { schoolMemberships } from '../data/schema'
import { getDb } from './database'

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

export function hasStaffRole(user: User | null, role?: StaffRole) {
  if (!user) return false
  const roles = user.roles ?? []
  return role ? roles.includes(role) : roles.some(value => value === 'admin' || value === 'teacher')
}

export async function getIdentityUser() {
  const user = await getUser()
  if (!user) return null
  return {
    id: user.id,
    email: user.email ?? '',
    name: user.name ?? '',
  }
}

export async function getStaffForIdentity(identityUserId: string): Promise<StaffContext | null> {
  const [membership] = await getDb()
    .select()
    .from(schoolMemberships)
    .where(eq(schoolMemberships.identityUserId, identityUserId))
    .limit(1)
  if (!membership || (membership.role !== 'admin' && membership.role !== 'teacher')) return null

  const user = await getUser()
  if (!user) return null
  return {
    id: user.id,
    email: user.email ?? '',
    name: user.name ?? '',
    roles: [membership.role],
    role: membership.role,
    membershipId: membership.id,
    schoolId: membership.schoolId,
  }
}

export async function requireStaff(role?: StaffRole) {
  const identity = await getUser()
  if (!identity) {
    throw new Error('Sign in with your school account to continue.')
  }
  const staff = await getStaffForIdentity(identity.id)
  if (!staff || (role && staff.role !== role)) {
    throw new Error(role === 'admin'
      ? 'A school administrator account is required for this action.'
      : 'A signed-in member of this school is required.')
  }
  return staff
}

export const getCurrentIdentity = createServerFn({ method: 'GET' }).handler(async () => getIdentityUser())

export const getCurrentStaff = createServerFn({ method: 'GET' }).handler(async () => {
  const identity = await getIdentityUser()
  return identity ? getStaffForIdentity(identity.id) : null
})
