const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const catCount = await prisma.businessCategory.count();
  const typeCount = await prisma.businessType.count();
  console.log('business_categories count:', catCount);
  console.log('business_types count:', typeCount);
  if (catCount > 0) {
    const cats = await prisma.businessCategory.findMany();
    console.log('Categories:', JSON.stringify(cats, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
