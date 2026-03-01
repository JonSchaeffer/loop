'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

async function requireUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

async function requireTaskOwner(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task || task.userId !== userId) throw new Error('Not found')
  return task
}

export async function addSubTask(taskId: string, title: string) {
  const userId = await requireUserId()
  await requireTaskOwner(taskId, userId)

  const subTask = await prisma.subTask.create({
    data: { taskId, title: title.trim() },
  })

  revalidatePath('/today')
  return subTask
}

export async function toggleSubTask(subTaskId: string) {
  const userId = await requireUserId()

  const subTask = await prisma.subTask.findUnique({
    where: { id: subTaskId },
    include: { task: true },
  })
  if (!subTask || subTask.task.userId !== userId) throw new Error('Not found')

  await prisma.subTask.update({
    where: { id: subTaskId },
    data: { done: !subTask.done },
  })

  revalidatePath('/today')
}

export async function deleteSubTask(subTaskId: string) {
  const userId = await requireUserId()

  const subTask = await prisma.subTask.findUnique({
    where: { id: subTaskId },
    include: { task: true },
  })
  if (!subTask || subTask.task.userId !== userId) throw new Error('Not found')

  await prisma.subTask.delete({ where: { id: subTaskId } })
  revalidatePath('/today')
}
