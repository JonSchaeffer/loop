'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

async function requireUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

export async function addResponseLog(taskId: string, content: string) {
  const userId = await requireUserId()

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task || task.userId !== userId) throw new Error('Not found')

  const log = await prisma.responseLog.create({
    data: { taskId, content: content.trim() },
  })

  revalidatePath('/today')
  return log
}

export async function deleteResponseLog(id: string) {
  const userId = await requireUserId()

  const log = await prisma.responseLog.findUnique({
    where: { id },
    include: { task: true },
  })
  if (!log || log.task.userId !== userId) throw new Error('Not found')

  await prisma.responseLog.delete({ where: { id } })
  revalidatePath('/today')
}
