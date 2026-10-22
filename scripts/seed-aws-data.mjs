import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config()

import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { uploadBufferToS3 } from '../src/lib/s3.js'

const prisma = new PrismaClient()

const ARTIFACT_DIR = 'C:/Users/theit/.gemini/antigravity-ide/brain/d1e8843a-f61f-4424-b678-ca5f1862a4c6'

const LOCAL_IMAGES = {
  burger: path.join(ARTIFACT_DIR, 'gourmet_smash_burger_1792582028470.jpg'),
  pizza: path.join(ARTIFACT_DIR, 'artisan_pizza_neapolitan_1792582058716.jpg'),
  produce: path.join(ARTIFACT_DIR, 'fresh_organic_produce_1792582087591.jpg'),
  bakery: path.join(ARTIFACT_DIR, 'artisan_french_bakery_1792582124220.jpg'),
}

async function uploadImageToS3(localPath, s3Filename, folder) {
  if (!fs.existsSync(localPath)) {
    throw new Error(`Local image not found at ${localPath}`)
  }
  const buffer = fs.readFileSync(localPath)
  const result = await uploadBufferToS3(buffer, {
    fileName: s3Filename,
    contentType: 'image/jpeg',
    folder,
  })
  console.log(`   Uploaded: ${result.key} -> ${result.url}`)
  return result.url
}

async function seedData() {
  console.log('===============================================================')
  console.log('🚀 SEEDING VENDORS, CATEGORIES, PRODUCTS & AI IMAGES INTO AWS')
  console.log('===============================================================\n')

  try {
    // -------------------------------------------------------------------------
    // 1. Upload AI-generated images to Amazon S3
    // -------------------------------------------------------------------------
    console.log('1️⃣ [AMAZON S3] Uploading AI-generated assets to S3 bucket (rapidtechpro)...')

    const burgerUrl = await uploadImageToS3(LOCAL_IMAGES.burger, 'gourmet-smash-burger.jpg', 'products')
    const pizzaUrl = await uploadImageToS3(LOCAL_IMAGES.pizza, 'neapolitan-margherita-pizza.jpg', 'products')
    const produceUrl = await uploadImageToS3(LOCAL_IMAGES.produce, 'organic-fresh-produce.jpg', 'products')
    const bakeryUrl = await uploadImageToS3(LOCAL_IMAGES.bakery, 'parisian-artisan-bakery.jpg', 'products')

    const burgerCatUrl = await uploadImageToS3(LOCAL_IMAGES.burger, 'cat-food-dining.jpg', 'categories')
    const pizzaCatUrl = await uploadImageToS3(LOCAL_IMAGES.pizza, 'cat-italian-pizzas.jpg', 'categories')
    const produceCatUrl = await uploadImageToS3(LOCAL_IMAGES.produce, 'cat-groceries-produce.jpg', 'categories')
    const bakeryCatUrl = await uploadImageToS3(LOCAL_IMAGES.bakery, 'cat-bakery-desserts.jpg', 'categories')

    console.log('✅ All AI images uploaded to Amazon S3 & CloudFront successfully!\n')

    // -------------------------------------------------------------------------
    // 2. Seed Business Categories & Business Types
    // -------------------------------------------------------------------------
    console.log('2️⃣ [RDS DATABASE] Creating Business Categories and Types...')

    let bcRestaurant = await prisma.businessCategory.findFirst({ where: { categoryTitle: 'Restaurant & Dining' } })
    if (!bcRestaurant) {
      bcRestaurant = await prisma.businessCategory.create({ data: { categoryTitle: 'Restaurant & Dining' } })
    }

    let bcGrocery = await prisma.businessCategory.findFirst({ where: { categoryTitle: 'Grocery & Supermarket' } })
    if (!bcGrocery) {
      bcGrocery = await prisma.businessCategory.create({ data: { categoryTitle: 'Grocery & Supermarket' } })
    }

    let bcBakery = await prisma.businessCategory.findFirst({ where: { categoryTitle: 'Bakery & Patisserie' } })
    if (!bcBakery) {
      bcBakery = await prisma.businessCategory.create({ data: { categoryTitle: 'Bakery & Patisserie' } })
    }

    let btBurger = await prisma.businessType.findFirst({ where: { typeTitle: 'Gourmet Fast Food & Burgers' } })
    if (!btBurger) {
      btBurger = await prisma.businessType.create({
        data: { typeTitle: 'Gourmet Fast Food & Burgers', businessCategoryId: bcRestaurant.id },
      })
    }

    let btItalian = await prisma.businessType.findFirst({ where: { typeTitle: 'Artisan Italian Trattoria' } })
    if (!btItalian) {
      btItalian = await prisma.businessType.create({
        data: { typeTitle: 'Artisan Italian Trattoria', businessCategoryId: bcRestaurant.id },
      })
    }

    let btProduce = await prisma.businessType.findFirst({ where: { typeTitle: 'Organic Farm & Produce Market' } })
    if (!btProduce) {
      btProduce = await prisma.businessType.create({
        data: { typeTitle: 'Organic Farm & Produce Market', businessCategoryId: bcGrocery.id },
      })
    }

    let btBakery = await prisma.businessType.findFirst({ where: { typeTitle: 'French Artisan Patisserie' } })
    if (!btBakery) {
      btBakery = await prisma.businessType.create({
        data: { typeTitle: 'French Artisan Patisserie', businessCategoryId: bcBakery.id },
      })
    }

    console.log('✅ Business categories and business types verified.\n')

    // -------------------------------------------------------------------------
    // 3. Seed Main Categories
    // -------------------------------------------------------------------------
    console.log('3️⃣ [RDS DATABASE] Creating Main Categories...')

    const defaultAdminUid = 'admin_system_seed'
    let adminUser = await prisma.users.findUnique({ where: { uid: defaultAdminUid } })
    if (!adminUser) {
      const adminPassword = await bcrypt.hash('Admin@123456', 10)
      adminUser = await prisma.users.create({
        data: {
          uid: defaultAdminUid,
          username: 'System Admin',
          email: 'admin@quickdelivery.com',
          phoneNumber: '+61412345678',
          role: 'ADMIN',
          emailVerification: true,
          password: adminPassword,
        },
      })
    }

    const catFood = await prisma.category.upsert({
      where: { code: 'FOOD_DINING' },
      update: { image: burgerCatUrl },
      create: {
        name: 'Food & Dining',
        code: 'FOOD_DINING',
        description: 'Delicious hot meals from top restaurants, diners, and specialty chefs',
        vertical: 'FOOD',
        status: 'ACTIVE',
        image: burgerCatUrl,
        createdBy: defaultAdminUid,
      },
    })

    const catGrocery = await prisma.category.upsert({
      where: { code: 'GROCERY_PRODUCE' },
      update: { image: produceCatUrl },
      create: {
        name: 'Fresh Groceries',
        code: 'GROCERY_PRODUCE',
        description: 'Organic fruits, fresh vegetables, dairy, pantry essentials, and farm produce',
        vertical: 'GROCERY',
        status: 'ACTIVE',
        image: produceCatUrl,
        createdBy: defaultAdminUid,
      },
    })

    const catBakery = await prisma.category.upsert({
      where: { code: 'BAKERY_SWEETS' },
      update: { image: bakeryCatUrl },
      create: {
        name: 'Bakery & Desserts',
        code: 'BAKERY_SWEETS',
        description: 'Freshly baked artisan croissants, pastries, sourdough, and desserts',
        vertical: 'FOOD',
        status: 'ACTIVE',
        image: bakeryCatUrl,
        createdBy: defaultAdminUid,
      },
    })

    console.log('✅ Main categories created:', catFood.name, '|', catGrocery.name, '|', catBakery.name, '\n')

    // -------------------------------------------------------------------------
    // 4. Seed Product Categories
    // -------------------------------------------------------------------------
    console.log('4️⃣ [RDS DATABASE] Creating Product Categories...')

    let pcBurgers = await prisma.productCategory.findFirst({ where: { categoryId: catFood.id, productCategoryName: 'Gourmet Burgers & Fries' } })
    if (!pcBurgers) {
      pcBurgers = await prisma.productCategory.create({
        data: {
          productCategoryName: 'Gourmet Burgers & Fries',
          categoryId: catFood.id,
          productCategoryDescription: 'Juicy handcrafted smash burgers, gourmet sides, and fries',
          image: burgerUrl,
        },
      })
    }

    let pcPizzas = await prisma.productCategory.findFirst({ where: { categoryId: catFood.id, productCategoryName: 'Wood-Fired Pizzas' } })
    if (!pcPizzas) {
      pcPizzas = await prisma.productCategory.create({
        data: {
          productCategoryName: 'Wood-Fired Pizzas',
          categoryId: catFood.id,
          productCategoryDescription: 'Traditional stone-baked pizzas with authentic mozzarella',
          image: pizzaUrl,
        },
      })
    }

    let pcProduce = await prisma.productCategory.findFirst({ where: { categoryId: catGrocery.id, productCategoryName: 'Organic Fruits & Greens' } })
    if (!pcProduce) {
      pcProduce = await prisma.productCategory.create({
        data: {
          productCategoryName: 'Organic Fruits & Greens',
          categoryId: catGrocery.id,
          productCategoryDescription: 'Fresh local farm fruits, mixed berries, and crisp greens',
          image: produceUrl,
        },
      })
    }

    let pcPastries = await prisma.productCategory.findFirst({ where: { categoryId: catBakery.id, productCategoryName: 'French Breads & Pastries' } })
    if (!pcPastries) {
      pcPastries = await prisma.productCategory.create({
        data: {
          productCategoryName: 'French Breads & Pastries',
          categoryId: catBakery.id,
          productCategoryDescription: 'Golden flaky croissants, macarons, and rustic baguettes',
          image: bakeryUrl,
        },
      })
    }

    console.log('✅ Product categories created.\n')

    // -------------------------------------------------------------------------
    // 5. Seed SubCategories
    // -------------------------------------------------------------------------
    console.log('5️⃣ [RDS DATABASE] Creating SubCategories...')

    const subBurgers = await prisma.subCategory.upsert({
      where: { subCatCode: 'SUB_SMASH_BURGERS' },
      update: { image: burgerUrl },
      create: {
        subCatName: 'Double Smash Cheeseburgers',
        subCatCode: 'SUB_SMASH_BURGERS',
        image: burgerUrl,
        catId: catFood.id,
        productCategoryId: pcBurgers.productCategoryId,
        vertical: 'FOOD',
        status: true,
      },
    })

    const subPizzas = await prisma.subCategory.upsert({
      where: { subCatCode: 'SUB_NEAPOLITAN_PIZZA' },
      update: { image: pizzaUrl },
      create: {
        subCatName: 'Neapolitan Artisan Pizzas',
        subCatCode: 'SUB_NEAPOLITAN_PIZZA',
        image: pizzaUrl,
        catId: catFood.id,
        productCategoryId: pcPizzas.productCategoryId,
        vertical: 'FOOD',
        status: true,
      },
    })

    const subProduce = await prisma.subCategory.upsert({
      where: { subCatCode: 'SUB_ORGANIC_BERRIES' },
      update: { image: produceUrl },
      create: {
        subCatName: 'Fresh Fruits & Berry Baskets',
        subCatCode: 'SUB_ORGANIC_BERRIES',
        image: produceUrl,
        catId: catGrocery.id,
        productCategoryId: pcProduce.productCategoryId,
        vertical: 'GROCERY',
        status: true,
      },
    })

    const subBakery = await prisma.subCategory.upsert({
      where: { subCatCode: 'SUB_BUTTER_CROISSANTS' },
      update: { image: bakeryUrl },
      create: {
        subCatName: 'Butter Croissants & Baguettes',
        subCatCode: 'SUB_BUTTER_CROISSANTS',
        image: bakeryUrl,
        catId: catBakery.id,
        productCategoryId: pcPastries.productCategoryId,
        vertical: 'FOOD',
        status: true,
      },
    })

    console.log('✅ Subcategories created.\n')

    // -------------------------------------------------------------------------
    // 6. Seed Vendor Users & Businesses
    // -------------------------------------------------------------------------
    console.log('6️⃣ [RDS DATABASE] Creating Vendors and Business Profiles...')

    const vendorPassword = await bcrypt.hash('Vendor@123456', 10)

    const vendorsData = [
      {
        uid: 'vendor_the_burger_lab',
        username: 'The Burger Lab',
        email: 'contact@burgerlab.com',
        phone: '+61411222333',
        businessName: 'The Gourmet Burger Lab',
        category: catFood.id,
        businessCatId: bcRestaurant.id,
        businessTypeId: btBurger.id,
        city: 'Sydney',
        state: 'NSW',
        street: '142 George Street, The Rocks',
        postal: '2000',
        logo: burgerUrl,
        cover: burgerUrl,
        lat: -33.8568,
        lng: 151.2093,
      },
      {
        uid: 'vendor_bella_italia',
        username: 'Bella Italia Bistro',
        email: 'chef@bellaitalia.com',
        phone: '+61422333444',
        businessName: 'Bella Italia Trattoria & Pizzeria',
        category: catFood.id,
        businessCatId: bcRestaurant.id,
        businessTypeId: btItalian.id,
        city: 'Sydney',
        state: 'NSW',
        street: '88 Crown Street, Surry Hills',
        postal: '2010',
        logo: pizzaUrl,
        cover: pizzaUrl,
        lat: -33.8864,
        lng: 151.2144,
      },
      {
        uid: 'vendor_green_harvest',
        username: 'Green Harvest Organics',
        email: 'orders@greenharvest.com',
        phone: '+61433444555',
        businessName: 'Green Harvest Organic Supermarket',
        category: catGrocery.id,
        businessCatId: bcGrocery.id,
        businessTypeId: btProduce.id,
        city: 'Melbourne',
        state: 'VIC',
        street: '512 Chapel Street, South Yarra',
        postal: '3141',
        logo: produceUrl,
        cover: produceUrl,
        lat: -37.8421,
        lng: 144.9932,
      },
      {
        uid: 'vendor_maison_moreau',
        username: 'Maison Moreau Bakery',
        email: 'bonjour@maisonmoreau.com',
        phone: '+61444555666',
        businessName: 'Maison Moreau French Patisserie',
        category: catBakery.id,
        businessCatId: bcBakery.id,
        businessTypeId: btBakery.id,
        city: 'Melbourne',
        state: 'VIC',
        street: '228 Flinders Lane, Melbourne CBD',
        postal: '3000',
        logo: bakeryUrl,
        cover: bakeryUrl,
        lat: -37.8164,
        lng: 144.9668,
      },
    ]

    for (const v of vendorsData) {
      await prisma.users.upsert({
        where: { email: v.email },
        update: { role: 'VENDOR' },
        create: {
          uid: v.uid,
          username: v.username,
          email: v.email,
          phoneNumber: v.phone,
          role: 'VENDOR',
          emailVerification: true,
          password: vendorPassword,
        },
      })

      const existingBiz = await prisma.business.findFirst({ where: { email: v.email } })
      if (!existingBiz) {
        await prisma.business.create({
          data: {
            email: v.email,
            businessName: v.businessName,
            firstName: v.username.split(' ')[0],
            lastName: v.username.split(' ')[1] || 'Store',
            cnicNo: '42101-9988776-1',
            businessTypeId: v.businessTypeId,
            businessCategoryId: v.businessCatId,
            phoneNumber1: v.phone,
            streetAddress: v.street,
            city: v.city,
            state: v.state,
            postalCode: v.postal,
            billingAddress: v.street,
            urlCnicFront: v.logo,
            urlCnicBack: v.cover,
            bankName: 'Commonwealth Bank of Australia',
            bankIbanNo: 'AU8900012345678901',
            bankAccountTitle: v.businessName,
            urlLogo: v.logo,
            urlCoverPhoto: v.cover,
            latitude: v.lat,
            longitude: v.lng,
            vertical: 'FOOD',
            categoryId: v.category,
            verificationStatus: 'APPROVED',
          },
        })
      }
      console.log(`   Vendor verified: ${v.businessName} (${v.email})`)
    }

    console.log('✅ Vendor and Business records created.\n')

    // -------------------------------------------------------------------------
    // 7. Seed Products
    // -------------------------------------------------------------------------
    console.log('7️⃣ [RDS DATABASE] Creating Products with Amazon S3 image links...')

    const productsData = [
      {
        proName: 'Double Truffle Smash Cheeseburger',
        sku: 'BURGER-TRUFFLE-01',
        price: 15.99,
        cost: 6.50,
        discount: 10.0,
        salePrice: 14.39,
        stock: 50,
        qnty: 50,
        catId: catFood.id,
        subCatId: subBurgers.subCatId,
        productCategoryId: pcBurgers.productCategoryId,
        vendorId: 'vendor_the_burger_lab',
        createdById: 'vendor_the_burger_lab',
        description: 'Two aged Angus beef smash patties with double American cheddar, caramelized onions, crisp streaky bacon, and house truffle aioli on a toasted buttered brioche bun.',
        keyFeatures: '100% Angus Beef, Double Melted Cheddar, Truffle Aioli, Brioche Bun',
        ingredients: 'Angus beef, Cheddar cheese, Bacon, Brioche, Truffle oil, Special sauce',
        proImages: JSON.stringify([burgerUrl]),
        approvalStatus: 'Approved',
        status: true,
      },
      {
        proName: 'Classic Double Cheeseburger & Crispy Fries',
        sku: 'BURGER-CLASSIC-02',
        price: 13.50,
        cost: 5.00,
        discount: 0.0,
        stock: 75,
        qnty: 75,
        catId: catFood.id,
        subCatId: subBurgers.subCatId,
        productCategoryId: pcBurgers.productCategoryId,
        vendorId: 'vendor_the_burger_lab',
        createdById: 'vendor_the_burger_lab',
        description: 'Classic double beef smash burger with crisp dill pickles, fresh sliced tomatoes, iceberg lettuce, and golden salted shoestring fries.',
        keyFeatures: 'Juicy Smash Patties, Golden Fries Combo, House Pickles',
        ingredients: 'Beef patty, American cheese, Pickles, Tomato, Lettuce, Russet potatoes',
        proImages: JSON.stringify([burgerUrl]),
        approvalStatus: 'Approved',
        status: true,
      },
      {
        proName: 'Wood-Fired Neapolitan Margherita Pizza',
        sku: 'PIZZA-MARGHERITA-01',
        price: 18.50,
        cost: 7.00,
        discount: 15.0,
        salePrice: 15.72,
        stock: 40,
        qnty: 40,
        catId: catFood.id,
        subCatId: subPizzas.subCatId,
        productCategoryId: pcPizzas.productCategoryId,
        vendorId: 'vendor_bella_italia',
        createdById: 'vendor_bella_italia',
        description: 'Authentic 12-inch Neapolitan pizza baked in a 900° wood-fired oven with crushed San Marzano tomatoes, fresh buffalo mozzarella, aromatic basil, and extra virgin olive oil.',
        keyFeatures: 'Blistered Crust, Buffalo Mozzarella, San Marzano Tomatoes, Hand-Tossed',
        ingredients: '00 Flour, San Marzano tomatoes, Fresh mozzarella, Basil leaves, Olive oil',
        proImages: JSON.stringify([pizzaUrl]),
        approvalStatus: 'Approved',
        status: true,
      },
      {
        proName: 'Organic Farmhouse Fruit & Berry Crate',
        sku: 'PRODUCE-BERRY-CRATE-01',
        price: 24.99,
        cost: 12.00,
        discount: 5.0,
        salePrice: 23.74,
        stock: 35,
        qnty: 35,
        catId: catGrocery.id,
        subCatId: subProduce.subCatId,
        productCategoryId: pcProduce.productCategoryId,
        vendorId: 'vendor_green_harvest',
        createdById: 'vendor_green_harvest',
        description: 'Generous wooden crate loaded with handpicked organic Honeycrisp apples, Hass avocados, sweet blueberries, raspberries, and fresh garden citrus.',
        keyFeatures: '100% Certified Organic, Locally Farmed, Fresh Daily Harvest',
        ingredients: 'Organic apples, Avocados, Blueberries, Raspberries, Lemons, Oranges',
        proImages: JSON.stringify([produceUrl]),
        approvalStatus: 'Approved',
        status: true,
      },
      {
        proName: 'Artisan Parisian Butter Croissant Box (6-Pack)',
        sku: 'BAKERY-CROISSANT-01',
        price: 16.50,
        cost: 6.00,
        discount: 0.0,
        stock: 30,
        qnty: 30,
        catId: catBakery.id,
        subCatId: subBakery.subCatId,
        productCategoryId: pcPastries.productCategoryId,
        vendorId: 'vendor_maison_moreau',
        createdById: 'vendor_maison_moreau',
        description: 'Freshly baked each morning using imported French cultured butter. Flaky, shatteringly crisp honeycomb interior with golden buttery layers.',
        keyFeatures: 'Imported French Butter, 27-Layer Lamination, Freshly Baked Daily',
        ingredients: 'French flour, Cultured butter, Milk, Yeast, Sea salt',
        proImages: JSON.stringify([bakeryUrl]),
        approvalStatus: 'Approved',
        status: true,
      },
    ]

    for (const p of productsData) {
      await prisma.product.upsert({
        where: { sku: p.sku },
        update: {
          proImages: p.proImages,
          price: p.price,
          salePrice: p.salePrice || null,
          approvalStatus: 'Approved',
          status: true,
        },
        create: p,
      })
      console.log(`   Product seeded: ${p.proName} ($${p.price})`)
    }

    console.log('✅ All products seeded.\n')

    // -------------------------------------------------------------------------
    // 8. Seed Food Deals
    // -------------------------------------------------------------------------
    console.log('8️⃣ [RDS DATABASE] Creating Featured Food Deals...')

    const burgerProduct = await prisma.product.findUnique({ where: { sku: 'BURGER-TRUFFLE-01' } })
    const pizzaProduct = await prisma.product.findUnique({ where: { sku: 'PIZZA-MARGHERITA-01' } })

    if (burgerProduct) {
      const existingDeal = await prisma.foodDeal.findFirst({ where: { productId: burgerProduct.proId } })
      if (!existingDeal) {
        await prisma.foodDeal.create({
          data: {
            productId: burgerProduct.proId,
            vendorUid: 'vendor_the_burger_lab',
            vertical: 'FOOD',
            customTitle: '🍔 Smash Burger Combo Feast (Save 20%)',
            customPriceLabel: '$14.39 (Was $15.99)',
            customImageUrl: burgerUrl,
            badgeLabel: 'HOT DEAL',
            sortOrder: 1,
            active: true,
          },
        })
        console.log('   Food deal created for Burger Lab.')
      }
    }

    if (pizzaProduct) {
      const existingPizzaDeal = await prisma.foodDeal.findFirst({ where: { productId: pizzaProduct.proId } })
      if (!existingPizzaDeal) {
        await prisma.foodDeal.create({
          data: {
            productId: pizzaProduct.proId,
            vendorUid: 'vendor_bella_italia',
            vertical: 'FOOD',
            customTitle: '🍕 Neapolitan Pizza Night Deal',
            customPriceLabel: '$15.72 (Save 15%)',
            customImageUrl: pizzaUrl,
            badgeLabel: 'POPULAR',
            sortOrder: 2,
            active: true,
          },
        })
        console.log('   Food deal created for Bella Italia.')
      }
    }

    console.log('✅ Deals created successfully.\n')

  } catch (err) {
    console.error('❌ Seeding failed:', err)
  } finally {
    await prisma.$disconnect()
  }

  console.log('===============================================================')
  console.log('🎉 ALL VENDORS, CATEGORIES, PRODUCTS & AI IMAGES SEEDED TO AWS!')
  console.log('===============================================================')
}

seedData()
