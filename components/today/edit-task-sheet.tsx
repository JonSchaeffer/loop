'use client'

import { useState, useTransition } from 'react'
import { type Task, type Category, type SubTask, Priority } from '@prisma/client'
import { updateTask } from '@/actions/tasks'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CategorySelect } from './category-select'
import { SubTaskList } from './subtask-list'
import { format } from 'date-fns'

type TaskWithDetails = Task & { category: Category | null; subTasks: SubTask[] }

interface EditTaskSheetProps {
  task: TaskWithDetails
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toDateInputValue(date: Date | null): string {
  if (!date) return ''
  return format(date, 'yyyy-MM-dd')
}

export function EditTaskSheet({ task, categories, open, onOpenChange }: EditTaskSheetProps) {
  const [isPending, startTransition] = useTransition()

  // Re-sync form when task prop changes (e.g. after a save)
  const [form, setForm] = useState({
    title: task.title,
    recipient: task.recipient ?? '',
    categoryId: task.categoryId ?? '',
    priority: task.priority,
    sentDate: toDateInputValue(task.sentDate),
    followUpDate: toDateInputValue(task.followUpDate),
    notes: task.notes ?? '',
  })
  const [localCategories, setLocalCategories] = useState(categories)

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return

    startTransition(async () => {
      await updateTask(task.id, {
        title: form.title.trim(),
        recipient: form.recipient.trim() || undefined,
        categoryId: form.categoryId || undefined,
        priority: form.priority as Priority,
        sentDate: form.sentDate ? new Date(form.sentDate) : null,
        followUpDate: form.followUpDate ? new Date(form.followUpDate) : null,
        notes: form.notes.trim() || undefined,
      })
      onOpenChange(false)
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Task</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">
              Subject / Task <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-title"
              value={form.title}
              onChange={(e) => set('title')(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-recipient">Recipient</Label>
            <Input
              id="edit-recipient"
              value={form.recipient}
              onChange={(e) => set('recipient')(e.target.value)}
              placeholder="e.g. Dr. Smith"
            />
          </div>

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

          <div className="space-y-1.5">
            <Label htmlFor="edit-priority">Priority</Label>
            <select
              id="edit-priority"
              value={form.priority}
              onChange={(e) => set('priority')(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-sentDate">Date Sent</Label>
              <Input
                id="edit-sentDate"
                type="date"
                value={form.sentDate}
                onChange={(e) => set('sentDate')(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-followUpDate">Follow-up Date</Label>
              <Input
                id="edit-followUpDate"
                type="date"
                value={form.followUpDate}
                onChange={(e) => set('followUpDate')(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={form.notes}
              onChange={(e) => set('notes')(e.target.value)}
              placeholder="Any context or details…"
              rows={3}
            />
          </div>

          {/* Subtasks */}
          <div className="space-y-1.5">
            <Label>Subtasks</Label>
            <SubTaskList taskId={task.id} subTasks={task.subTasks} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending || !form.title.trim()} className="flex-1">
              {isPending ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
