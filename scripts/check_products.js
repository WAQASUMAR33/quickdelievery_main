const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({
    include: { vendor: true, category: true, productCategory: true }
  })
  console.log('=== PRODUCTS IN DB ===')
  console.log(JSON.stringify(products.map(p => ({
    id: p.proId,
    name: p.proName,
    price: p.price,
    vendorId: p.vendorId,
    vendorEmail: p.vendor?.email,
    status: p.status,
    approvalStatus: p.approvalStatus,
    category: p.category?.name,
    productCategory: p.productCategory?.productCategoryName
  })), null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
