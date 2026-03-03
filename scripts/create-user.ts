#!/usr/bin/env tsx
/**
 * Creates a user account in the database.
 *
 * Usage:
 *   npx tsx scripts/create-user.ts <email> <password>
 *
 * Example:
 *   npx tsx scripts/create-user.ts user@example.com changeme
 *
 * Requires DATABASE_URL in the environment (or .env / .env.local).
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local first, then .env (mirrors Next.js behavior)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import bcrypt from 'bcryptjs'
import { prisma } from '../lib/db'

async function main() {
  const [email, password] = process.argv.slice(2)

  if (!email || !password) {
    console.error('Usage: npx tsx scripts/create-user.ts <email> <password>')
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('Error: password must be at least 8 characters.')
    process.exit(1)
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.error(`Error: a user with email "${email}" already exists.`)
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, passwordHash },
  })

  console.log(`Created user: ${user.email} (id: ${user.id})`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
