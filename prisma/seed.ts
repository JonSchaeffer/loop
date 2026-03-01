import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const passwordHash = await bcrypt.hash('changeme', 12)

  const user = await prisma.user.upsert({
    where: { email: 'admin@loop.local' },
    update: {},
    create: {
      email: 'admin@loop.local',
      passwordHash,
    },
  })

  console.log(`Created user: ${user.email}`)

  // Seed placeholder categories — update names in the app after first login
  const defaultCategories = [
    { name: 'Dean 1', color: '#4f46e5' },
    { name: 'Dean 2', color: '#0891b2' },
    { name: 'Dean 3', color: '#059669' },
    { name: 'Dean 4', color: '#d97706' },
    { name: 'Head Dean', color: '#dc2626' },
    { name: 'General', color: '#6b7280' },
  ]

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: cat.name } },
      update: { color: cat.color },
      create: { userId: user.id, ...cat },
    })
  }

  console.log(`Seeded ${defaultCategories.length} categories`)
  console.log('\nDefault credentials:')
  console.log('  Email:    admin@loop.local')
  console.log('  Password: changeme')
  console.log('\nChange the password after first login!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
