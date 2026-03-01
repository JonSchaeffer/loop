'use client'

import { useState } from 'react'
import { type Task, type Category, type SubTask, Status, Priority } from '@prisma/client'
import { TaskRow } from './task-row'
import { Input } from '@/components/ui/input'

type TaskWithDetails = Task & { category: Category | null; subTasks: SubTask[] }

const STATUS_LABELS: Record<Status, string> = {
  OVERDUE: 'Overdue',
  FOLLOW_UP_DUE: 'Follow-up Due',
  WAITING: 'Waiting',
  DONE: 'Done',
}

const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
}

const STATUS_GROUP_ORDER: Status[] = [Status.OVERDUE, Status.FOLLOW_UP_DUE, Status.WAITING]

interface TaskListProps {
  tasks: TaskWithDetails[]
  categories: Category[]
}

export function TaskList({ tasks, categories }: TaskListProps) {
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = tasks.filter((t) => {
    if (search) {
      const q = search.toLowerCase()
      const matches =
        t.title.toLowerCase().includes(q) ||
        (t.recipient ?? '').toLowerCase().includes(q) ||
        (t.notes ?? '').toLowerCase().includes(q)
      if (!matches) return false
    }
    if (filterCategory && t.categoryId !== filterCategory) return false
    if (filterPriority && t.priority !== filterPriority) return false
    if (filterStatus && t.status !== filterStatus) return false
    return true
  })

  const openTasks = filtered.filter((t) => t.status !== Status.DONE)
  const doneTasks = filtered.filter((t) => t.status === Status.DONE)
  const hasActiveFilter = search || filterCategory || filterPriority || filterStatus

  const groups = STATUS_GROUP_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    items: openTasks.filter((t) => t.status === status),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks…"
          className="h-8 text-sm w-48"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm shadow-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm shadow-sm"
        >
          <option value="">All priorities</option>
          {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm shadow-sm"
        >
          <option value="">All statuses</option>
          {STATUS_GROUP_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {hasActiveFilter && (
          <button
            onClick={() => {
              setSearch('')
              setFilterCategory('')
              setFilterPriority('')
              setFilterStatus('')
            }}
            className="h-8 px-2 text-xs text-gray-400 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Task groups */}
      <div className="space-y-6">
        {openTasks.length === 0 && doneTasks.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            {hasActiveFilter ? (
              <p className="text-sm">No tasks match your filters.</p>
            ) : (
              <>
                <p className="text-lg font-medium">All clear!</p>
                <p className="text-sm mt-1">
                  No open tasks. Press N or click &ldquo;+ New Task&rdquo; to add one.
                </p>
              </>
            )}
          </div>
        )}

        {openTasks.length === 0 && doneTasks.length > 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-lg font-medium">All clear!</p>
            <p className="text-sm mt-1">No open tasks.</p>
          </div>
        )}

        {groups.map(({ status, label, items }) => (
          <section key={status}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              {label} <span className="ml-1 text-gray-300">({items.length})</span>
            </h2>
            <div className="space-y-2">
              {items.map((task) => (
                <TaskRow key={task.id} task={task} categories={categories} />
              ))}
            </div>
          </section>
        ))}

        {doneTasks.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              {STATUS_LABELS[Status.DONE]}{' '}
              <span className="ml-1 text-gray-300">({doneTasks.length})</span>
            </h2>
            <div className="space-y-2 opacity-50">
              {doneTasks.map((task) => (
                <TaskRow key={task.id} task={task} categories={categories} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
