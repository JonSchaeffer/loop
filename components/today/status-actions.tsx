'use client'

import { useTransition } from 'react'
import { Status } from '@prisma/client'
import { updateTaskStatus } from '@/actions/tasks'
import { Button } from '@/components/ui/button'

interface StatusActionsProps {
  taskId: string
  currentStatus: Status
  isPending?: boolean
}

const TRANSITIONS: Record<
  Status,
  { label: string; next: Status; variant?: 'default' | 'outline' | 'ghost' }[]
> = {
  WAITING: [{ label: 'Done', next: Status.DONE, variant: 'default' }],
  FOLLOW_UP_DUE: [
    { label: '← Waiting', next: Status.WAITING, variant: 'ghost' },
    { label: 'Done', next: Status.DONE, variant: 'default' },
  ],
  OVERDUE: [
    { label: '← Waiting', next: Status.WAITING, variant: 'ghost' },
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
    </div>
  )
}
