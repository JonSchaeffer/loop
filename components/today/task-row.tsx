'use client'

import { useState } from 'react'
import { type Task, type Category, Status, Priority } from '@prisma/client'
import { format, isPast } from 'date-fns'
import { StatusActions } from './status-actions'
import { EditTaskSheet } from './edit-task-sheet'
import { Button } from '@/components/ui/button'

type TaskWithCategory = Task & { category: Category | null }

const STATUS_STYLES: Record<Status, string> = {
  OVERDUE: 'border-l-red-400 bg-red-50',
  FOLLOW_UP_DUE: 'border-l-amber-400 bg-amber-50',
  WAITING: 'border-l-blue-400 bg-white',
  DONE: 'border-l-green-400 bg-green-50',
}

const PRIORITY_DOT: Record<Priority, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-amber-400',
  LOW: 'bg-gray-300',
}

interface TaskRowProps {
  task: TaskWithCategory
  categories: Category[]
}

export function TaskRow({ task, categories }: TaskRowProps) {
  const [editOpen, setEditOpen] = useState(false)
  const isOverdueDate =
    task.followUpDate && isPast(task.followUpDate) && task.status !== Status.DONE

  const categoryTint = task.category
    ? `${task.category.color}18` // hex color + 18 = ~10% opacity tint
    : undefined

  return (
    <>
      <div
        className={`border border-gray-200 rounded-lg border-l-4 px-4 py-3 ${STATUS_STYLES[task.status]}`}
        style={categoryTint ? { backgroundColor: categoryTint } : undefined}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            {/* Priority dot */}
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`}
              title={`Priority: ${task.priority}`}
            />

            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">{task.title}</p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                {task.recipient && (
                  <span className="text-xs text-gray-500 truncate">To: {task.recipient}</span>
                )}
                {task.followUpDate && (
                  <span
                    className={`text-xs ${isOverdueDate ? 'text-red-600 font-medium' : 'text-gray-500'}`}
                  >
                    Follow-up: {format(task.followUpDate, 'MMM d')}
                    {isOverdueDate && ' (overdue)'}
                  </span>
                )}
                {task.sentDate && (
                  <span className="text-xs text-gray-400">
                    Sent: {format(task.sentDate, 'MMM d')}
                  </span>
                )}
              </div>

              {task.notes && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">{task.notes}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {task.category && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full text-white shrink-0"
                style={{ backgroundColor: task.category.color }}
              >
                {task.category.name}
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditOpen(true)}
              className="text-xs h-7 px-2 text-gray-400 hover:text-gray-700"
              title="Edit task"
            >
              ✎
            </Button>
            <StatusActions taskId={task.id} currentStatus={task.status} />
          </div>
        </div>
      </div>

      <EditTaskSheet
        task={task}
        categories={categories}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
