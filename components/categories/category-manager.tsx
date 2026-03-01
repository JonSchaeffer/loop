'use client'

import { useState, useTransition } from 'react'
import { type Category } from '@prisma/client'
import { createCategory, updateCategory, deleteCategory } from '@/actions/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type CategoryWithCount = Category & { _count: { tasks: number } }

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

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`h-6 w-6 rounded-full ring-offset-1 transition-shadow ${
            value === color ? 'ring-2 ring-gray-500' : 'hover:ring-1 hover:ring-gray-300'
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}

function CategoryRow({
  category,
  onDeleted,
}: {
  category: CategoryWithCount
  onDeleted: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const [color, setColor] = useState(category.color)
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    if (!name.trim()) return
    startTransition(async () => {
      await updateCategory(category.id, { name: name.trim(), color })
      setEditing(false)
    })
  }

  const handleDelete = () => {
    if (
      !confirm(
        category._count.tasks > 0
          ? `Delete "${category.name}"? It is used by ${category._count.tasks} task(s). Those tasks will have no category.`
          : `Delete "${category.name}"?`
      )
    )
      return
    startTransition(async () => {
      await deleteCategory(category.id)
      onDeleted(category.id)
    })
  }

  if (editing) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') setEditing(false)
          }}
        />
        <ColorPicker value={color} onChange={setColor} />
        <div className="flex gap-2">
          <Button size="sm" disabled={isPending || !name.trim()} onClick={handleSave}>
            {isPending ? 'Saving…' : 'Save'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 bg-white">
      <div className="flex items-center gap-3">
        <span
          className="h-4 w-4 rounded-full shrink-0"
          style={{ backgroundColor: category.color }}
        />
        <span className="font-medium text-gray-900">{category.name}</span>
        <span className="text-xs text-gray-400">{category._count.tasks} task(s)</span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-gray-400 hover:text-gray-700"
          onClick={() => setEditing(true)}
        >
          ✎
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-gray-400 hover:text-red-500"
          onClick={handleDelete}
          disabled={isPending}
        >
          ✕
        </Button>
      </div>
    </div>
  )
}

export function CategoryManager({ categories: initial }: { categories: CategoryWithCount[] }) {
  const [categories, setCategories] = useState(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [isPending, startTransition] = useTransition()

  const handleAdd = () => {
    if (!newName.trim()) return
    startTransition(async () => {
      const created = await createCategory({ name: newName.trim(), color: newColor })
      setCategories((prev) =>
        [...prev, { ...created, _count: { tasks: 0 } }].sort((a, b) => a.name.localeCompare(b.name))
      )
      setNewName('')
      setNewColor(PRESET_COLORS[0])
      setShowAdd(false)
    })
  }

  return (
    <div className="space-y-3">
      {categories.length === 0 && !showAdd && (
        <p className="text-sm text-gray-400 py-4">No categories yet.</p>
      )}

      {categories.map((cat) => (
        <CategoryRow
          key={cat.id}
          category={cat}
          onDeleted={(id) => setCategories((prev) => prev.filter((c) => c.id !== id))}
        />
      ))}

      {showAdd ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-4 space-y-3 bg-gray-50">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name"
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') setShowAdd(false)
            }}
          />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <div className="flex gap-2">
            <Button size="sm" disabled={isPending || !newName.trim()} onClick={handleAdd}>
              {isPending ? 'Saving…' : 'Add Category'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
          + New Category
        </Button>
      )}
    </div>
  )
}
