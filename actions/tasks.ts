'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Status, Priority } from '@prisma/client'
import { revalidatePath } from 'next/cache'

async function requireUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

export async function createTask(data: {
  title: string
  recipient?: string
  categoryId?: string
  priority: Priority
  sentDate?: Date | null
  followUpDate?: Date | null
  notes?: string
}) {
  const userId = await requireUserId()

  const task = await prisma.task.create({
    data: {
      ...data,
      userId,
      status: Status.WAITING,
      categoryId: data.categoryId || null,
    },
  })

  await prisma.statusEvent.create({
    data: { taskId: task.id, fromStatus: null, toStatus: Status.WAITING },
  })

  revalidatePath('/today')
  return task
}

export async function updateTaskStatus(taskId: string, newStatus: Status) {
  const userId = await requireUserId()

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { subTasks: true },
  })
  if (!task || task.userId !== userId) throw new Error('Not found')

  if (newStatus === Status.DONE && task.subTasks.some((s) => !s.done)) {
    await prisma.subTask.updateMany({
      where: { taskId, done: false },
      data: { done: true },
    })
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: newStatus,
      completedAt: newStatus === Status.DONE ? new Date() : null,
    },
  })

  await prisma.statusEvent.create({
    data: { taskId, fromStatus: task.status, toStatus: newStatus },
  })

  revalidatePath('/today')
  return updated
}

export async function updateTask(
  taskId: string,
  data: {
    title: string
    recipient?: string
    categoryId?: string
    priority: Priority
    sentDate?: Date | null
    followUpDate?: Date | null
    notes?: string
  }
) {
  const userId = await requireUserId()

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task || task.userId !== userId) throw new Error('Not found')

  await prisma.task.update({
    where: { id: taskId },
    data: {
      ...data,
      categoryId: data.categoryId || null,
    },
  })

  revalidatePath('/today')
}

export async function reorderTasks(orderedIds: string[]) {
  const userId = await requireUserId()

  // Verify all tasks belong to this user in one query
  const tasks = await prisma.task.findMany({
    where: { id: { in: orderedIds }, userId },
    select: { id: true },
  })
  if (tasks.length !== orderedIds.length) throw new Error('Not found')

  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.task.update({ where: { id }, data: { sortOrder: index } }))
  )

  revalidatePath('/today')
}

export async function deleteTask(taskId: string) {
  const userId = await requireUserId()

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task || task.userId !== userId) throw new Error('Not found')

  await prisma.task.delete({ where: { id: taskId } })
  revalidatePath('/today')
}
