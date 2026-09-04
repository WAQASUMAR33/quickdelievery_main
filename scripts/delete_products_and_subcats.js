const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting deletion of all products and all sub-categories...');

  // 1. Delete Wishlist items if any
  const deletedWishlists = await prisma.wishlist.deleteMany({});
  console.log(`Deleted ${deletedWishlists.count} wishlist items.`);

  // 2. Delete FoodDeals referencing products or all food deals
  // Since food deals are directly tied to products (Azadi deal with proId 25, etc.)
  const deletedDeals = await prisma.foodDeal.deleteMany({});
  console.log(`Deleted ${deletedDeals.count} food deals.`);

  // 3. Delete OrderItems
  const deletedOrderItems = await prisma.orderItem.deleteMany({});
  console.log(`Deleted ${deletedOrderItems.count} order items.`);

  // 4. Delete all Products
  const deletedProducts = await prisma.product.deleteMany({});
  console.log(`Deleted ${deletedProducts.count} products.`);

  // 5. Delete all SubCategories
  const deletedSubCategories = await prisma.subCategory.deleteMany({});
  console.log(`Deleted ${deletedSubCategories.count} sub categories.`);

  console.log('Deletion completed successfully!');
}

main()
  .catch((err) => {
    console.error('Error during deletion:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
