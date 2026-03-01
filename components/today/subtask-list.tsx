'use client'

import { useState, useTransition } from 'react'
import { type SubTask } from '@prisma/client'
import { addSubTask, toggleSubTask, deleteSubTask } from '@/actions/subtasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SubTaskListProps {
  taskId: string
  subTasks: SubTask[]
}

export function SubTaskList({ taskId, subTasks }: SubTaskListProps) {
  const [newTitle, setNewTitle] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    startTransition(async () => {
      await addSubTask(taskId, newTitle.trim())
      setNewTitle('')
    })
  }

  const handleToggle = (id: string) => {
    startTransition(async () => {
      await toggleSubTask(id)
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteSubTask(id)
    })
  }

  return (
    <div className="space-y-2">
      {subTasks.map((sub) => (
        <div key={sub.id} className="flex items-center gap-2 group">
          <input
            type="checkbox"
            checked={sub.done}
            onChange={() => handleToggle(sub.id)}
            disabled={isPending}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
          />
          <span
            className={`flex-1 text-sm ${sub.done ? 'line-through text-gray-400' : 'text-gray-700'}`}
          >
            {sub.title}
          </span>
          <button
            type="button"
            onClick={() => handleDelete(sub.id)}
            disabled={isPending}
            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-xs transition-opacity"
            title="Remove subtask"
          >
            ✕
          </button>
        </div>
      ))}

      <form onSubmit={handleAdd} className="flex gap-2 mt-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a subtask…"
          className="h-8 text-sm"
          disabled={isPending}
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={isPending || !newTitle.trim()}
          className="h-8 px-3 shrink-0"
        >
          Add
        </Button>
      </form>
    </div>
  )
}
