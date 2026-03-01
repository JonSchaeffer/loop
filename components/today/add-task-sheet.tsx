'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { type Category, Priority } from '@prisma/client'
import { createTask } from '@/actions/tasks'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CategorySelect } from './category-select'

interface AddTaskSheetProps {
  categories: Category[]
}

const EMPTY_FORM = {
  title: '',
  recipient: '',
  categoryId: '',
  priority: 'MEDIUM' as Priority,
  sentDate: '',
  followUpDate: '',
  notes: '',
}

export function AddTaskSheet({ categories }: AddTaskSheetProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState(EMPTY_FORM)
  const [localCategories, setLocalCategories] = useState(categories)

  const set = (field: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleOpen = useCallback(() => {
    setForm({ ...EMPTY_FORM, sentDate: new Date().toISOString().split('T')[0] })
    setOpen(true)
  }, [])

  // Keyboard shortcut: N to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === 'n' &&
        !open &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault()
        handleOpen()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, handleOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return

    startTransition(async () => {
      await createTask({
        title: form.title.trim(),
        recipient: form.recipient.trim() || undefined,
        categoryId: form.categoryId || undefined,
        priority: form.priority,
        sentDate: form.sentDate ? new Date(form.sentDate) : null,
        followUpDate: form.followUpDate ? new Date(form.followUpDate) : null,
        notes: form.notes.trim() || undefined,
      })
      setOpen(false)
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button onClick={handleOpen} size="sm" className="gap-1">
          <span aria-hidden>+</span> New Task
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Task</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">
              Subject / Task <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set('title')(e.target.value)}
              placeholder="e.g. Confirm meeting with Provost"
              autoFocus
              required
            />
          </div>

          {/* Recipient */}
          <div className="space-y-1.5">
            <Label htmlFor="recipient">Recipient</Label>
            <Input
              id="recipient"
              value={form.recipient}
              onChange={(e) => set('recipient')(e.target.value)}
              placeholder="e.g. Dr. Smith"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <CategorySelect
              categories={localCategories}
              value={form.categoryId}
              onChange={(id, updated) => {
                setForm((prev) => ({ ...prev, categoryId: id }))
                setLocalCategories(updated)
              }}
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              value={form.priority}
              onChange={(e) => set('priority')(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sentDate">Date Sent</Label>
              <Input
                id="sentDate"
                type="date"
                value={form.sentDate}
                onChange={(e) => set('sentDate')(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="followUpDate">Follow-up Date</Label>
              <Input
                id="followUpDate"
                type="date"
                value={form.followUpDate}
                onChange={(e) => set('followUpDate')(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set('notes')(e.target.value)}
              placeholder="Any context or details…"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending || !form.title.trim()} className="flex-1">
              {isPending ? 'Adding…' : 'Add Task'}
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
      </SheetContent>
    </Sheet>
  )
}
