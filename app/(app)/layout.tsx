import Link from 'next/link'
import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-lg font-bold text-indigo-600 tracking-tight">Loop</span>
            <nav className="flex items-center gap-1">
              <Link
                href="/today"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Today
              </Link>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-400 hover:bg-gray-100 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/categories"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Categories
              </Link>
            </nav>
          </div>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/login' })
            }}
          >
            <Button variant="ghost" size="sm" type="submit" className="text-gray-500">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
