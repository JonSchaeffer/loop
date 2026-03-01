import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { format, startOfDay, endOfDay, subDays, isToday, parseISO } from 'date-fns'
import { TaskList } from '@/components/today/task-list'
import { AddTaskSheet } from '@/components/today/add-task-sheet'
import { DateSidebar } from '@/components/today/date-sidebar'
import { Status } from '@prisma/client'

const STATUS_ORDER: Record<Status, number> = {
  OVERDUE: 0,
  FOLLOW_UP_DUE: 1,
  WAITING: 2,
  DONE: 3,
}

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const { date: dateParam } = await searchParams
  const viewDate = dateParam ? parseISO(dateParam) : new Date()
  const viewingToday = isToday(viewDate)
  const dayStart = startOfDay(viewDate)
  const dayEnd = endOfDay(viewDate)

  // Only auto-mark overdue when viewing today
  if (viewingToday) {
    await prisma.task.updateMany({
      where: {
        userId,
        followUpDate: { lt: new Date() },
        status: { in: [Status.WAITING, Status.FOLLOW_UP_DUE] },
      },
      data: { status: Status.OVERDUE },
    })
  }

  const [tasks, categories] = await Promise.all([
    viewingToday
      ? // Today: show all open tasks + tasks completed today
        prisma.task.findMany({
          where: {
            userId,
            OR: [
              { status: { not: Status.DONE } },
              { status: Status.DONE, completedAt: { gte: dayStart } },
            ],
          },
          include: { category: true, subTasks: { orderBy: { sortOrder: 'asc' } } },
        })
      : // Historical: tasks that existed and were not yet completed as of that date
        prisma.task.findMany({
          where: {
            userId,
            createdAt: { lte: dayEnd },
            OR: [{ completedAt: null }, { completedAt: { gte: dayStart } }],
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

  // Build date list for sidebar (today + last 29 days)
  const sidebarDates = Array.from({ length: 30 }, (_, i) => subDays(new Date(), i))

  return (
    <div className="flex gap-6">
      <DateSidebar dates={sidebarDates} selectedDate={viewDate} />

      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {viewingToday ? 'Today' : format(viewDate, 'MMMM d, yyyy')}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {viewingToday ? format(new Date(), 'EEEE, MMMM d, yyyy') : format(viewDate, 'EEEE')}
            </p>
          </div>
          {viewingToday && <AddTaskSheet categories={categories} />}
        </div>

        <TaskList tasks={sorted} categories={categories} readonly={!viewingToday} />
      </div>
    </div>
  )
}
