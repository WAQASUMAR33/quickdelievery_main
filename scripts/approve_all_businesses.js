const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.business.updateMany({
    data: {
      verificationStatus: 'APPROVED'
    }
  })
  console.log(`Updated ${result.count} business profiles to APPROVED.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
