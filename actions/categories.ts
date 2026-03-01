'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

async function requireUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

export async function createCategory(data: { name: string; color: string }) {
  const userId = await requireUserId()

  const category = await prisma.category.create({
    data: { ...data, userId },
  })

  revalidatePath('/today')
  revalidatePath('/categories')
  return category
}

export async function updateCategory(id: string, data: { name?: string; color?: string }) {
  const userId = await requireUserId()

  const category = await prisma.category.findUnique({ where: { id } })
  if (!category || category.userId !== userId) throw new Error('Not found')

  const updated = await prisma.category.update({ where: { id }, data })
  revalidatePath('/today')
  revalidatePath('/categories')
  return updated
}

export async function deleteCategory(id: string) {
  const userId = await requireUserId()

  const category = await prisma.category.findUnique({ where: { id } })
  if (!category || category.userId !== userId) throw new Error('Not found')

  await prisma.category.delete({ where: { id } })
  revalidatePath('/today')
  revalidatePath('/categories')
}
