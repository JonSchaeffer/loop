import { type Task, type Category, Status } from '@prisma/client'
import { TaskRow } from './task-row'

type TaskWithCategory = Task & { category: Category | null }

const STATUS_LABELS: Record<Status, string> = {
  OVERDUE: 'Overdue',
  FOLLOW_UP_DUE: 'Follow-up Due',
  WAITING: 'Waiting',
  DONE: 'Done',
}

const STATUS_GROUP_ORDER: Status[] = [Status.OVERDUE, Status.FOLLOW_UP_DUE, Status.WAITING]

interface TaskListProps {
  tasks: TaskWithCategory[]
}

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg font-medium">All clear!</p>
        <p className="text-sm mt-1">
          No open tasks. Press N or click &ldquo;+ New Task&rdquo; to add one.
        </p>
      </div>
    )
  }

  const groups = STATUS_GROUP_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    items: tasks.filter((t) => t.status === status),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="space-y-6">
      {groups.map(({ status, label, items }) => (
        <section key={status}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            {label} <span className="ml-1 text-gray-300">({items.length})</span>
          </h2>
          <div className="space-y-2">
            {items.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
