'use client'

import { useState, useTransition, useRef } from 'react'
import { type ResponseLog } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import { addResponseLog, deleteResponseLog } from '@/actions/response-logs'

interface ResponseLogListProps {
  taskId: string
  logs: ResponseLog[]
}

export function ResponseLogList({ taskId, logs: initial }: ResponseLogListProps) {
  const [logs, setLogs] = useState(initial)
  const [showInput, setShowInput] = useState(false)
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleAdd = () => {
    const trimmed = content.trim()
    if (!trimmed) return
    startTransition(async () => {
      const created = await addResponseLog(taskId, trimmed)
      setLogs((prev) => [created, ...prev])
      setContent('')
      setShowInput(false)
    })
  }

  const handleDelete = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id))
    startTransition(async () => {
      await deleteResponseLog(id)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
    if (e.key === 'Escape') {
      setShowInput(false)
      setContent('')
    }
  }

  return (
    <div className="mt-1.5 space-y-1">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-1.5 group">
          <div className="flex-1 min-w-0">
            <span className="text-xs text-gray-400 mr-1.5">
              {formatDistanceToNow(log.createdAt, { addSuffix: true })}
            </span>
            <span className="text-xs text-gray-600">{log.content}</span>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(log.id)}
            disabled={isPending}
            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-xs transition-opacity shrink-0 mt-0.5"
            title="Remove log"
          >
            ✕
          </button>
        </div>
      ))}

      {showInput ? (
        <div className="space-y-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Log a response… (Enter to save, Esc to cancel)"
            autoFocus
            disabled={isPending}
            rows={2}
            className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:border-indigo-400 outline-none resize-none text-gray-700 placeholder:text-gray-400 bg-white"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending || !content.trim()}
              className="text-xs text-indigo-500 hover:text-indigo-700 disabled:opacity-40"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInput(false)
                setContent('')
              }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          + log response
        </button>
      )}
    </div>
  )
}
