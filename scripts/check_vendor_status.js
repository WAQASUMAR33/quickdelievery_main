const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const businesses = await prisma.business.findMany({
    include: { businessCategory: true, businessType: true }
  })
  console.log('=== BUSINESSES IN DB ===')
  console.log(JSON.stringify(businesses.map(b => ({
    id: b.id,
    email: b.email,
    businessName: b.businessName,
    verificationStatus: b.verificationStatus,
    category: b.businessCategory?.categoryTitle,
    type: b.businessType?.typeTitle
  })), null, 2))

  const vendors = await prisma.users.findMany({
    where: { role: 'VENDOR' }
  })
  console.log('=== VENDORS (USERS) IN DB ===')
  console.log(JSON.stringify(vendors.map(v => ({
    id: v.id,
    uid: v.uid,
    email: v.email,
    username: v.username,
    role: v.role,
    emailVerification: v.emailVerification,
    status: v.status
  })), null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
