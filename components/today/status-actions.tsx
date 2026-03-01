'use client'

import { useTransition } from 'react'
import { Status } from '@prisma/client'
import { updateTaskStatus, deleteTask } from '@/actions/tasks'
import { Button } from '@/components/ui/button'

interface StatusActionsProps {
  taskId: string
  currentStatus: Status
}

const TRANSITIONS: Record<
  Status,
  { label: string; next: Status; variant?: 'default' | 'outline' | 'ghost' }[]
> = {
  WAITING: [
    { label: 'Follow-up Due', next: Status.FOLLOW_UP_DUE, variant: 'outline' },
    { label: 'Done', next: Status.DONE, variant: 'default' },
  ],
  FOLLOW_UP_DUE: [
    { label: '← Waiting', next: Status.WAITING, variant: 'ghost' },
    { label: 'Done', next: Status.DONE, variant: 'default' },
  ],
  OVERDUE: [
    { label: 'Follow Up', next: Status.FOLLOW_UP_DUE, variant: 'outline' },
    { label: 'Done', next: Status.DONE, variant: 'default' },
  ],
  DONE: [],
}

export function StatusActions({ taskId, currentStatus }: StatusActionsProps) {
  const [isPending, startTransition] = useTransition()

  const transitions = TRANSITIONS[currentStatus]

  const handleStatusChange = (next: Status) => {
    startTransition(async () => {
      await updateTaskStatus(taskId, next)
    })
  }

  const handleDelete = () => {
    if (!confirm('Delete this task?')) return
    startTransition(async () => {
      await deleteTask(taskId)
    })
  }

  return (
    <div className="flex items-center gap-1">
      {transitions.map(({ label, next, variant }) => (
        <Button
          key={next}
          size="sm"
          variant={variant ?? 'outline'}
          disabled={isPending}
          onClick={() => handleStatusChange(next)}
          className="text-xs h-7 px-2"
        >
          {label}
        </Button>
      ))}
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={handleDelete}
        className="text-xs h-7 px-2 text-gray-400 hover:text-red-500"
        title="Delete task"
      >
        ✕
      </Button>
    </div>
  )
}
