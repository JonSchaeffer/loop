'use client'

import { useTransition } from 'react'
import { Status } from '@prisma/client'
import { updateTaskStatus, snoozeTask } from '@/actions/tasks'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

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

function SnoozeButtons({ taskId, isPending }: { taskId: string; isPending: boolean }) {
  const [isSnoozing, startTransition] = useTransition()

  const handleSnooze = (days: number) => {
    startTransition(async () => {
      try {
        await snoozeTask(taskId, days)
      } catch {
        toast.error('Failed to snooze task. Please try again.')
      }
    })
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending || isSnoozing}
        onClick={() => handleSnooze(1)}
        className="text-xs h-7 px-2 text-gray-500"
        title="Snooze 24 hours"
      >
        24h
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending || isSnoozing}
        onClick={() => handleSnooze(7)}
        className="text-xs h-7 px-2 text-gray-500"
        title="Snooze 1 week"
      >
        1wk
      </Button>
    </>
  )
}

export function StatusActions({ taskId, currentStatus }: StatusActionsProps) {
  const [isPending, startTransition] = useTransition()
  const transitions = TRANSITIONS[currentStatus]
  const showSnooze = currentStatus === Status.OVERDUE || currentStatus === Status.FOLLOW_UP_DUE

  const handleStatusChange = (next: Status) => {
    startTransition(async () => {
      try {
        await updateTaskStatus(taskId, next)
      } catch {
        toast.error('Failed to update status. Please try again.')
      }
    })
  }

  return (
    <div className="flex items-center gap-1">
      {showSnooze && <SnoozeButtons taskId={taskId} isPending={isPending} />}
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
