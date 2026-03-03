'use server'

import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    throw new Error('Unauthorized')
  }
  return session.user
}

export async function adminCreateUser(email: string, password: string) {
  await requireAdmin()

  if (password.length < 8) throw new Error('Password must be at least 8 characters.')

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('A user with that email already exists.')

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.create({ data: { email, passwordHash } })
  revalidatePath('/admin/users')
}

export async function adminDeleteUser(id: string) {
  const me = await requireAdmin()

  if (id === me.id) throw new Error('You cannot delete your own account.')

  await prisma.user.delete({ where: { id } })
  revalidatePath('/admin/users')
}
