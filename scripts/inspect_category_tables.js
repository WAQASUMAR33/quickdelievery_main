const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  const subCategories = await prisma.subCategory.findMany();
  const productCategories = await prisma.productCategory.findMany();

  console.log('--- CATEGORIES (Category table) ---');
  console.log(JSON.stringify(categories, null, 2));

  console.log('\n--- SUB CATEGORIES (SubCategory table) ---');
  console.log(JSON.stringify(subCategories, null, 2));

  console.log('\n--- PRODUCT CATEGORIES (ProductCategory table) ---');
  console.log(JSON.stringify(productCategories, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
