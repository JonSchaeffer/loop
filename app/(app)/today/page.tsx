import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { TaskList } from '@/components/today/task-list'
import { AddTaskSheet } from '@/components/today/add-task-sheet'
import { Status } from '@prisma/client'

const STATUS_ORDER: Record<Status, number> = {
  OVERDUE: 0,
  FOLLOW_UP_DUE: 1,
  WAITING: 2,
  DONE: 3,
}

export default async function TodayPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  // Auto-mark tasks as overdue when followUpDate has passed
  await prisma.task.updateMany({
    where: {
      userId,
      followUpDate: { lt: new Date() },
      status: { in: [Status.WAITING, Status.FOLLOW_UP_DUE] },
    },
    data: { status: Status.OVERDUE },
  })

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [tasks, categories] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId,
        OR: [
          { status: { not: Status.DONE } },
          { status: Status.DONE, completedAt: { gte: startOfToday } },
        ],
      },
      include: { category: true, subTasks: { orderBy: { sortOrder: 'asc' } } },
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    }),
  ])

  const sorted = tasks.sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (statusDiff !== 0) return statusDiff
    if (a.followUpDate && b.followUpDate) return a.followUpDate.getTime() - b.followUpDate.getTime()
    if (a.followUpDate) return -1
    if (b.followUpDate) return 1
    return a.createdAt.getTime() - b.createdAt.getTime()
  })

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today</h1>
          <p className="text-sm text-gray-500 mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <AddTaskSheet categories={categories} />
      </div>

      <TaskList tasks={sorted} categories={categories} />
    </div>
  )
}
