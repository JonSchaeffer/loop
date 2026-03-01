import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Status } from '@prisma/client'
import { startOfDay, subDays, subMonths, startOfWeek, format } from 'date-fns'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const { range = 'month' } = await searchParams

  const now = new Date()
  const rangeStart =
    range === 'day'
      ? startOfDay(now)
      : range === 'week'
        ? startOfWeek(now, { weekStartsOn: 1 })
        : subMonths(now, 1)

  const [created, completed, allTasks, categories, followUpCounts] = await Promise.all([
    // Tasks created in range
    prisma.task.findMany({
      where: { userId, createdAt: { gte: rangeStart } },
      select: { id: true, createdAt: true, status: true, categoryId: true },
    }),

    // Tasks completed in range
    prisma.task.findMany({
      where: { userId, status: Status.DONE, completedAt: { gte: rangeStart } },
      select: { id: true, completedAt: true, createdAt: true, categoryId: true },
    }),

    // All non-done tasks for status breakdown
    prisma.task.findMany({
      where: { userId, status: { not: Status.DONE } },
      select: { status: true },
    }),

    prisma.category.findMany({
      where: { userId },
      select: { id: true, name: true, color: true },
    }),

    // Follow-up counts per task (completed tasks only, for distribution)
    prisma.task.findMany({
      where: { userId, status: Status.DONE, completedAt: { gte: rangeStart } },
      select: { id: true, _count: { select: { followUps: true } } },
    }),
  ])

  // --- Volume over time (daily buckets) ---
  const days = range === 'day' ? 24 : range === 'week' ? 7 : 30
  const buckets = Array.from({ length: days }, (_, i) => {
    const date =
      range === 'day'
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), i)
        : subDays(now, days - 1 - i)
    const label = range === 'day' ? `${i}:00` : format(date, 'MMM d')
    const dayStart = range === 'day' ? date : startOfDay(date)
    const dayEnd =
      range === 'day' ? new Date(date.getTime() + 3600000) : startOfDay(subDays(date, -1))
    return {
      label,
      created: created.filter((t) => t.createdAt >= dayStart && t.createdAt < dayEnd).length,
      completed: completed.filter(
        (t) => t.completedAt && t.completedAt >= dayStart && t.completedAt < dayEnd
      ).length,
    }
  })

  // --- Status breakdown (open tasks) ---
  const statusCounts = [Status.OVERDUE, Status.FOLLOW_UP_DUE, Status.WAITING].map((s) => ({
    status: s,
    count: allTasks.filter((t) => t.status === s).length,
  }))

  // --- Category breakdown (completed in range) ---
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))
  const categoryBreakdown = categories
    .map((c) => ({
      name: c.name,
      color: c.color,
      completed: completed.filter((t) => t.categoryId === c.id).length,
      created: created.filter((t) => t.categoryId === c.id).length,
    }))
    .filter((c) => c.created > 0 || c.completed > 0)
    .sort((a, b) => b.created - a.created)

  // --- Time-to-complete by category (days) ---
  const timeToComplete = categories
    .map((c) => {
      const done = completed.filter((t) => t.categoryId === c.id && t.completedAt)
      if (done.length === 0) return null
      const avg =
        done.reduce((sum, t) => {
          const ms = t.completedAt!.getTime() - t.createdAt.getTime()
          return sum + ms / (1000 * 60 * 60 * 24)
        }, 0) / done.length
      return { name: c.name, color: c.color, avgDays: Math.round(avg * 10) / 10 }
    })
    .filter(Boolean) as { name: string; color: string; avgDays: number }[]

  // --- Follow-up distribution ---
  const followUpDist = [0, 1, 2, 3].map((n) => ({
    label: n === 3 ? '3+' : String(n),
    count: followUpCounts.filter((t) =>
      n === 3 ? t._count.followUps >= 3 : t._count.followUps === n
    ).length,
  }))

  // --- Summary stats ---
  const stats = {
    created: created.length,
    completed: completed.length,
    open: allTasks.length,
    avgDaysToComplete:
      completed.length > 0
        ? Math.round(
            (completed.reduce((sum, t) => {
              const ms = t.completedAt!.getTime() - t.createdAt.getTime()
              return sum + ms / (1000 * 60 * 60 * 24)
            }, 0) /
              completed.length) *
              10
          ) / 10
        : null,
  }

  void categoryMap // used above

  return (
    <DashboardClient
      range={range}
      stats={stats}
      buckets={buckets}
      statusCounts={statusCounts}
      categoryBreakdown={categoryBreakdown}
      timeToComplete={timeToComplete}
      followUpDist={followUpDist}
    />
  )
}
