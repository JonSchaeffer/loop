import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { CategoryManager } from '@/components/categories/category-manager'

export default async function CategoriesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: { name: 'asc' },
    include: { _count: { select: { tasks: true } } },
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
      <CategoryManager categories={categories} />
    </div>
  )
}
