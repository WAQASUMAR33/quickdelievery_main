/**
 * Seed script — creates an ADMIN user
 * Run: node scripts/seed-admin.js
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const prisma = new PrismaClient()

const ADMIN_EMAIL    = 'admin@quickdelivery.com'
const ADMIN_PASSWORD = 'Admin@1234'
const ADMIN_NAME     = 'Super Admin'
const ADMIN_PHONE    = '+92 300 0000000'

async function main() {
  console.log('🔍 Checking for existing admin...')

  const existing = await prisma.users.findUnique({ where: { email: ADMIN_EMAIL } })

  if (existing) {
    console.log(`✅ Admin already exists: ${existing.email} (role: ${existing.role})`)
    return
  }

  const salt           = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt)
  const uid            = crypto.randomUUID()

  const admin = await prisma.users.create({
    data: {
      email:             ADMIN_EMAIL,
      password:          hashedPassword,
      username:          ADMIN_NAME,
      phoneNumber:       ADMIN_PHONE,
      role:              'ADMIN',
      uid,
      emailVerification: true,
      type:              'local',
    },
  })

  console.log('✅ Admin created successfully!')
  console.log('──────────────────────────────')
  console.log(`  Email    : ${ADMIN_EMAIL}`)
  console.log(`  Password : ${ADMIN_PASSWORD}`)
  console.log(`  Role     : ${admin.role}`)
  console.log('──────────────────────────────')
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
