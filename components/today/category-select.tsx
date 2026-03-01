'use client'

import { useState, useTransition } from 'react'
import { type Category } from '@prisma/client'
import { createCategory } from '@/actions/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

interface CategorySelectProps {
  categories: Category[]
  value: string
  onChange: (categoryId: string, updatedCategories: Category[]) => void
}

export function CategorySelect({ categories, value, onChange }: CategorySelectProps) {
  const [localCategories, setLocalCategories] = useState(categories)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [isPending, startTransition] = useTransition()

  const handleAddCategory = () => {
    if (!newName.trim()) return
    startTransition(async () => {
      const created = await createCategory({ name: newName.trim(), color: newColor })
      const updated = [...localCategories, created].sort((a, b) => a.name.localeCompare(b.name))
      setLocalCategories(updated)
      onChange(created.id, updated)
      setNewName('')
      setNewColor(PRESET_COLORS[0])
      setShowAdd(false)
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value, localCategories)}
          className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          <option value="">No category</option>
          {localCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 px-2 shrink-0"
          onClick={() => setShowAdd((v) => !v)}
          title="Add category"
        >
          +
        </Button>
      </div>

      {showAdd && (
        <div className="border border-dashed border-gray-300 rounded-lg p-3 space-y-2 bg-gray-50">
          <Label className="text-xs text-gray-500">New category</Label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name"
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
          />
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewColor(color)}
                className={`h-5 w-5 rounded-full ring-offset-1 transition-shadow ${
                  newColor === color ? 'ring-2 ring-gray-500' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs"
              disabled={isPending || !newName.trim()}
              onClick={handleAddCategory}
            >
              {isPending ? 'Saving…' : 'Add'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
