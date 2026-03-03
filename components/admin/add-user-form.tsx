'use client'

import { useState, useTransition } from 'react'
import { adminCreateUser } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function AddUserForm() {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      try {
        await adminCreateUser(form.email, form.password)
        toast.success(`User ${form.email} created.`)
        setForm({ email: '', password: '' })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="new-email">Email</Label>
        <Input
          id="new-email"
          type="email"
          value={form.email}
          onChange={set('email')}
          placeholder="user@example.com"
          required
          className="w-64"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="new-password">Password</Label>
        <Input
          id="new-password"
          type="password"
          value={form.password}
          onChange={set('password')}
          placeholder="Min 8 characters"
          required
          className="w-48"
        />
      </div>
      <div className="space-y-1">
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Adding…' : 'Add User'}
        </Button>
      </div>
    </form>
  )
}
