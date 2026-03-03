import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function createPrismaClient() {
  // max: 1 keeps serverless functions (Vercel) from exhausting DB connections.
  // A pooled connection string (e.g. Neon's pooled URL) should be used in production.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 1 })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
