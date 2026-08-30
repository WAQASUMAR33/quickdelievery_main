const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultData = [
  {
    category: 'Restaurants & Food',
    types: [
      'Fast Food',
      'Casual / Fine Dining',
      'Cafe & Coffee Shop',
      'Pizzeria / Italian',
      'Bakery & Desserts',
      'Burgers & Sandwiches',
      'Asian & Chinese',
      'Desi & Traditional',
      'Cloud Kitchen / Home Chef',
      'Food Truck / Street Food',
    ],
  },
  {
    category: 'Grocery & Supermarket',
    types: [
      'Supermarket / Mart',
      'Grocery Store',
      'Organic & Health Store',
      'Wholesale Mart',
    ],
  },
  {
    category: 'Pharmacy & Healthcare',
    types: [
      'Pharmacy / Chemist',
      'Medical Store & Supplies',
      'Organic & Wellness Supplements',
    ],
  },
  {
    category: 'Bakery & Confectionery',
    types: [
      'Artisan Bakery',
      'Pastry & Cake Shop',
      'Traditional Sweets (Mithai)',
    ],
  },
  {
    category: 'Fresh Meat & Seafood',
    types: [
      'Butcher Shop / Fresh Meat',
      'Poultry Shop',
      'Fresh Seafood & Fish',
    ],
  },
  {
    category: 'Fresh Fruits & Vegetables',
    types: [
      'Fresh Fruit Market',
      'Vegetable Market',
      'Farm Fresh Produce',
    ],
  },
  {
    category: 'Flowers & Gifts',
    types: [
      'Florist / Fresh Flowers',
      'Gift & Souvenir Shop',
    ],
  },
  {
    category: 'Pet Supplies',
    types: [
      'Pet Food & Accessories',
      'Pet Care & Supplies',
    ],
  },
];

async function seed() {
  console.log('Seeding business categories and types...');
  for (const item of defaultData) {
    let cat = await prisma.businessCategory.findFirst({
      where: { categoryTitle: item.category },
    });
    if (!cat) {
      cat = await prisma.businessCategory.create({
        data: { categoryTitle: item.category },
      });
      console.log(`Created category: ${cat.categoryTitle}`);
    } else {
      console.log(`Category exists: ${cat.categoryTitle}`);
    }

    for (const typeTitle of item.types) {
      let type = await prisma.businessType.findFirst({
        where: {
          typeTitle,
          businessCategoryId: cat.id,
        },
      });
      if (!type) {
        type = await prisma.businessType.create({
          data: {
            typeTitle,
            businessCategoryId: cat.id,
          },
        });
        console.log(`  - Created type: ${type.typeTitle}`);
      }
    }
  }
  console.log('Seeding completed successfully!');
}

seed()
  .catch((err) => {
    console.error('Error during seeding:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
