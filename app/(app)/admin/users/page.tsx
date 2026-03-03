import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/admin'
import { adminDeleteUser } from '@/actions/admin'
import { AddUserForm } from '@/components/admin/add-user-form'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

export default async function AdminUsersPage() {
  const session = await auth()
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } })

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Add and remove user accounts.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Add User</h2>
        <AddUserForm />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 text-gray-900">{user.email}</td>
                <td className="px-4 py-3 text-gray-500">{format(user.createdAt, 'MMM d, yyyy')}</td>
                <td className="px-4 py-3 text-gray-500">
                  {isAdmin(user.email) ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                      Admin
                    </span>
                  ) : (
                    <span className="text-gray-400">User</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {user.id !== session?.user?.id && (
                    <form
                      action={async () => {
                        'use server'
                        await adminDeleteUser(user.id)
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        type="submit"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
