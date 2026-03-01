'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { type Task, type Category, type SubTask } from '@prisma/client'
import { TaskRow } from './task-row'

type TaskWithDetails = Task & { category: Category | null; subTasks: SubTask[] }

interface SortableTaskRowProps {
  task: TaskWithDetails
  categories: Category[]
}

export function SortableTaskRow({ task, categories }: SortableTaskRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex items-start gap-1"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-3.5 h-5 w-4 shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
        title="Drag to reorder"
        tabIndex={-1}
      >
        ⠿
      </button>
      <div className="flex-1 min-w-0">
        <TaskRow task={task} categories={categories} />
      </div>
    </div>
  )
}
