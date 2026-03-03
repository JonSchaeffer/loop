'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

const SHORTCUT_GROUPS = [
  {
    label: 'Tasks',
    shortcuts: [
      { keys: ['N'], description: 'New task (full form)' },
      { keys: ['Q'], description: 'Quick-add task by title' },
      { keys: ['/'], description: 'Focus search' },
      { keys: ['['], description: 'Go to previous day' },
      { keys: [']'], description: 'Go to next day' },
    ],
  },
  {
    label: 'Navigate',
    shortcuts: [
      { keys: ['T'], description: 'Go to Today' },
      { keys: ['G', 'T'], description: 'Go to Today' },
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'C'], description: 'Go to Categories' },
    ],
  },
  {
    label: 'General',
    shortcuts: [
      { keys: ['?'], description: 'Show / hide shortcuts' },
      { keys: ['Esc'], description: 'Close panel / clear search' },
    ],
  },
]

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pendingG = useRef(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      if (inInput) return

      // ? → toggle shortcuts
      if (e.key === '?') {
        e.preventDefault()
        setOpen((prev) => !prev)
        return
      }

      // T → go to today
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        router.push('/today')
        return
      }

      // G chord → navigate
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault()
        pendingG.current = true
        setTimeout(() => {
          pendingG.current = false
        }, 1500)
        return
      }

      if (pendingG.current) {
        pendingG.current = false
        if (e.key === 't' || e.key === 'T') {
          e.preventDefault()
          router.push('/today')
        }
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault()
          router.push('/dashboard')
        }
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault()
          router.push('/categories')
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-xs">
        <SheetHeader>
          <SheetTitle>Keyboard Shortcuts</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-5 px-4 pb-4">
          {SHORTCUT_GROUPS.map(({ label, shortcuts }) => (
            <div key={label}>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                {label}
              </p>
              <div className="space-y-0.5">
                {shortcuts.map(({ keys, description }) => (
                  <div
                    key={keys.join('+')}
                    className="flex items-center justify-between py-1.5 border-b border-gray-100"
                  >
                    <span className="text-sm text-gray-700">{description}</span>
                    <div className="flex items-center gap-1">
                      {keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
                            {k}
                          </kbd>
                          {i < keys.length - 1 && (
                            <span className="text-xs text-gray-400">then</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
