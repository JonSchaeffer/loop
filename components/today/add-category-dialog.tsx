'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { createCategory } from '@/actions/categories'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const PRESET_COLORS = [
  '#4f46e5',
  '#0891b2',
  '#059669',
  '#d97706',
  '#dc2626',
  '#6b7280',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#65a30d',
]

export function AddCategoryDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [isPending, startTransition] = useTransition()

  const handleOpen = useCallback(() => {
    setName('')
    setColor(PRESET_COLORS[0])
    setOpen(true)
  }, [])

  // Keyboard shortcut: C to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === 'c' &&
        !open &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      ) {
        handleOpen()
      }
    }
    window.addEventListener('keyup', handler)
    return () => window.removeEventListener('keyup', handler)
  }, [open, handleOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    startTransition(async () => {
      try {
        await createCategory({ name: name.trim(), color })
        setOpen(false)
        toast.success(`Category "${name.trim()}" created.`)
      } catch {
        toast.error('Failed to create category. Please try again.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={handleOpen} className="gap-1">
          <span aria-hidden>+</span> Category
          <kbd className="ml-1 text-xs text-gray-400 font-mono">C</kbd>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Category</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Board, HR, Finance"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full ring-offset-2 transition-shadow ${
                    color === c ? 'ring-2 ring-gray-500' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={isPending || !name.trim()} className="flex-1">
              {isPending ? 'Saving…' : 'Create Category'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
