const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.product.updateMany({
    data: {
      approvalStatus: 'Approved'
    }
  })
  console.log(`Updated ${result.count} products to Approved.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
