import { getUser, type User } from '@netlify/identity'
import { createServerFn } from '@tanstack/react-start'

export type StaffRole = 'admin' | 'teacher'

export function hasStaffRole(user: User | null, role?: StaffRole) {
  if (!user) return false
  const roles = user.roles ?? []
  return role ? roles.includes(role) : roles.some(value => value === 'admin' || value === 'teacher')
}

export async function requireStaff(role?: StaffRole) {
  const user = await getUser()
  if (!user || !hasStaffRole(user, role)) {
    throw new Error('A signed-in school administrator or teacher account is required.')
  }
  return user
}

export const getCurrentStaff = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getUser()
  if (!user || !hasStaffRole(user)) return null
  return {
    id: user.id,
    email: user.email ?? '',
    name: user.name ?? '',
    roles: (user.roles ?? []).filter((role): role is StaffRole => role === 'admin' || role === 'teacher'),
  }
})
