'use client'

import { useState, useEffect, useRef, useTransition, useMemo } from 'react'
import { type Category, Priority } from '@prisma/client'
import { createTask } from '@/actions/tasks'
import { parseQuickTask } from '@/lib/parse-quick-task'
import { toast } from 'sonner'

interface QuickAddTaskProps {
  categories: Category[]
}

export function QuickAddTask({ categories }: QuickAddTaskProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const hints = useMemo(() => parseQuickTask(value, categories), [value, categories])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setTimeout(() => setValue(''), 0)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const title = value.trim()
    if (!title) return

    startTransition(async () => {
      try {
        await createTask({
          title,
          priority: Priority.MEDIUM,
          sentDate: new Date(),
          categoryId: hints.categoryId,
          followUpDate: hints.followUpDate ?? null,
          dueDate: hints.dueDate ?? null,
        })
        toast.success('Task added.')
        setOpen(false)
      } catch {
        toast.error('Failed to add task.')
      }
    })
  }

  if (!open) return null

  const hasHints = hints.categoryName || hints.followUpLabel || hints.dueDateLabel

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg mx-4">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center px-4 py-3 gap-3">
            <span className="text-gray-400 text-sm shrink-0">Task</span>
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
              placeholder="What needs to be done?"
              className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
              disabled={isPending}
            />
            <kbd className="shrink-0 px-1.5 py-0.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded text-gray-400">
              Enter
            </kbd>
          </div>

          {hasHints && (
            <div className="flex items-center gap-3 px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              {hints.categoryName && (
                <span className="text-xs text-gray-500">
                  Category: <span className="font-medium text-gray-700">{hints.categoryName}</span>
                </span>
              )}
              {hints.dueDateLabel && (
                <span className="text-xs text-gray-500">
                  Due: <span className="font-medium text-gray-700">{hints.dueDateLabel}</span>
                </span>
              )}
              {hints.followUpLabel && (
                <span className="text-xs text-gray-500">
                  Remind: <span className="font-medium text-gray-700">{hints.followUpLabel}</span>
                </span>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
