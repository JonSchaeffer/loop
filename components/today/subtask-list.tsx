'use client'

import { useState, useTransition, useRef } from 'react'
import { type SubTask } from '@prisma/client'
import { addSubTask, toggleSubTask, deleteSubTask } from '@/actions/subtasks'

interface SubTaskListProps {
  taskId: string
  subTasks: SubTask[]
  /** compact=true renders a tighter layout for inline use on the task card */
  compact?: boolean
}

export function SubTaskList({ taskId, subTasks: initial, compact = false }: SubTaskListProps) {
  const [subTasks, setSubTasks] = useState(initial)
  const [showInput, setShowInput] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = () => {
    const title = newTitle.trim()
    if (!title) return
    startTransition(async () => {
      const created = await addSubTask(taskId, title)
      setSubTasks((prev) => [...prev, created])
      setNewTitle('')
      // Keep input open for rapid entry
      inputRef.current?.focus()
    })
  }

  const handleToggle = (id: string) => {
    // Optimistic toggle
    setSubTasks((prev) => prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)))
    startTransition(async () => {
      await toggleSubTask(id)
    })
  }

  const handleDelete = (id: string) => {
    setSubTasks((prev) => prev.filter((s) => s.id !== id))
    startTransition(async () => {
      await deleteSubTask(id)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
    if (e.key === 'Escape') {
      setShowInput(false)
      setNewTitle('')
    }
  }

  return (
    <div className={compact ? 'space-y-1 mt-1' : 'space-y-2'}>
      {subTasks.map((sub) => (
        <div key={sub.id} className="flex items-center gap-2 group">
          <input
            type="checkbox"
            checked={sub.done}
            onChange={() => handleToggle(sub.id)}
            disabled={isPending}
            className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 cursor-pointer shrink-0"
          />
          <span
            className={`flex-1 ${compact ? 'text-xs' : 'text-sm'} ${
              sub.done ? 'line-through text-gray-400' : 'text-gray-600'
            }`}
          >
            {sub.title}
          </span>
          <button
            type="button"
            onClick={() => handleDelete(sub.id)}
            disabled={isPending}
            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-xs transition-opacity shrink-0"
            title="Remove subtask"
          >
            ✕
          </button>
        </div>
      ))}

      {showInput ? (
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Subtask title…"
            autoFocus
            disabled={isPending}
            className={`flex-1 border-b border-gray-300 focus:border-indigo-400 outline-none bg-transparent ${
              compact ? 'text-xs py-0.5' : 'text-sm py-1'
            } text-gray-700 placeholder:text-gray-400`}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={isPending || !newTitle.trim()}
            className="text-xs text-indigo-500 hover:text-indigo-700 disabled:opacity-40 shrink-0"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowInput(false)
              setNewTitle('')
            }}
            className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className={`text-gray-400 hover:text-gray-600 transition-colors ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        >
          + subtask
        </button>
      )}
    </div>
  )
}
