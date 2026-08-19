const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('🚀 Starting Grocery Schema & Seed Setup...');

  // 1. Ensure 'vertical' column exists on MySQL tables via raw SQL safely
  const tablesToAlter = ['categories', 'sub_categories', 'products', 'businesses', 'food_deals', 'orders'];
  
  for (const table of tablesToAlter) {
    try {
      const checkCol = await prisma.$queryRawUnsafe(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${table}' AND COLUMN_NAME = 'vertical';
      `);
      if (!checkCol || checkCol.length === 0) {
        console.log(`Adding 'vertical' column to table '${table}'...`);
        await prisma.$queryRawUnsafe(`ALTER TABLE \`${table}\` ADD COLUMN \`vertical\` VARCHAR(50) NOT NULL DEFAULT 'FOOD';`);
      } else {
        console.log(`Column 'vertical' already exists on table '${table}'.`);
      }
    } catch (e) {
      console.warn(`Note on table ${table}:`, e.message);
    }
  }

  // 2. Create or find Grocery Mart Vendors (Users + Businesses)
  const martsData = [
    {
      uid: 'vendor_pandamart_bahria',
      username: 'Pandamart - Bahria Town (RWP)',
      email: 'pandamart.bahria@quickdelivery.com',
      phoneNumber: '+923001234561',
      businessName: 'Pandamart - Bahria Town (RWP)',
      urlLogo: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200',
      urlCoverPhoto: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
      address: 'Commercial Hub, Bahria Town Phase 7, Rawalpindi',
      deliveryTime: 'From 15 min',
      cashbackBadge: '40% cashback',
      deliveryFee: 0.0,
      vertical: 'GROCERY'
    },
    {
      uid: 'vendor_assetz_mart',
      username: 'Assetz Mart',
      email: 'assetz.mart@quickdelivery.com',
      phoneNumber: '+923001234562',
      businessName: 'Assetz Mart',
      urlLogo: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=200',
      urlCoverPhoto: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=800',
      address: 'Main Civic Center, Phase 4, Bahria Town',
      deliveryTime: 'From 15 min',
      cashbackBadge: '40% cashback',
      deliveryFee: 0.0,
      vertical: 'GROCERY'
    },
    {
      uid: 'vendor_alfatah_bahria',
      username: 'Al-Fatah (Bahria Town Phase 7)',
      email: 'alfatah.bahria@quickdelivery.com',
      phoneNumber: '+923001234563',
      businessName: 'Al-Fatah (Bahria Town Phase 7)',
      urlLogo: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=200',
      urlCoverPhoto: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800',
      address: 'Corniche Road, Phase 7, Bahria Town, Rawalpindi',
      deliveryTime: 'From 20 min',
      cashbackBadge: '15% discount',
      deliveryFee: 0.0,
      vertical: 'GROCERY'
    }
  ];

  // Get or create Business Category for Grocery
  let groceryBizCat = await prisma.businessCategory.findFirst({
    where: { categoryTitle: 'Grocery & Supermarket' }
  });
  if (!groceryBizCat) {
    groceryBizCat = await prisma.businessCategory.create({
      data: { categoryTitle: 'Grocery & Supermarket' }
    });
  }

  let groceryBizType = await prisma.businessType.findFirst({
    where: { typeTitle: 'Supermarket / Mart' }
  });
  if (!groceryBizType) {
    groceryBizType = await prisma.businessType.create({
      data: {
        typeTitle: 'Supermarket / Mart',
        businessCategoryId: groceryBizCat.id
      }
    });
  }

  const createdVendorUids = [];

  for (const m of martsData) {
    let user = await prisma.users.findUnique({ where: { email: m.email } });
    if (!user) {
      user = await prisma.users.create({
        data: {
          uid: m.uid,
          username: m.username,
          email: m.email,
          phoneNumber: m.phoneNumber,
          role: 'VENDOR',
          emailVerification: true
        }
      });
      console.log(`Created vendor user: ${m.username}`);
    }
    createdVendorUids.push(user.uid);

    let biz = await prisma.business.findUnique({ where: { email: m.email } });
    if (!biz) {
      await prisma.business.create({
        data: {
          email: m.email,
          businessName: m.businessName,
          firstName: 'Store',
          lastName: 'Manager',
          cnicNo: '37405-1234567-1',
          businessTypeId: groceryBizType.id,
          businessCategoryId: groceryBizCat.id,
          phoneNumber1: m.phoneNumber,
          streetAddress: m.address,
          state: 'Punjab',
          city: 'Rawalpindi',
          postalCode: '46000',
          urlCnicFront: 'https://images.unsplash.com/photo-1544717305-2782549b5136',
          urlCnicBack: 'https://images.unsplash.com/photo-1544717305-2782549b5136',
          bankName: 'Meezan Bank',
          bankIbanNo: 'PK00MEZN0001234567890123',
          bankAccountTitle: m.businessName,
          billingAddress: m.address,
          urlLogo: m.urlLogo,
          urlCoverPhoto: m.urlCoverPhoto,
          verificationStatus: 'APPROVED'
        }
      });
      console.log(`Created business store: ${m.businessName}`);
    }

    // Update vertical on business table
    await prisma.$queryRawUnsafe(`UPDATE \`businesses\` SET \`vertical\` = 'GROCERY' WHERE \`email\` = '${m.email}';`);
  }

  // 3. Create Grocery Categories & Subcategories
  const groceryCategories = [
    {
      name: 'Dairy & Eggs',
      code: 'GROC_DAIRY_EGGS',
      image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300',
      subs: [
        { name: 'Fresh Eggs', code: 'SUB_EGGS' },
        { name: 'Fresh Milk & Cream', code: 'SUB_MILK' },
        { name: 'Butter & Margarine', code: 'SUB_BUTTER' },
        { name: 'Cheese & Yogurt', code: 'SUB_CHEESE' }
      ]
    },
    {
      name: 'Fresh Fruits & Vegetables',
      code: 'GROC_PRODUCE',
      image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300',
      subs: [
        { name: 'Fresh Fruits', code: 'SUB_FRUITS' },
        { name: 'Fresh Vegetables', code: 'SUB_VEG' },
        { name: 'Herbs & Seasoning', code: 'SUB_HERBS' }
      ]
    },
    {
      name: 'Beverages & Cold Drinks',
      code: 'GROC_BEVERAGES',
      image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300',
      subs: [
        { name: 'Carbonated Soft Drinks', code: 'SUB_SODAS' },
        { name: 'Juices & Nectars', code: 'SUB_JUICES' },
        { name: 'Tea & Coffee', code: 'SUB_TEA' },
        { name: 'Mineral Water', code: 'SUB_WATER' }
      ]
    },
    {
      name: 'Snacks & Confectionery',
      code: 'GROC_SNACKS',
      image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300',
      subs: [
        { name: 'Chips & Crisps', code: 'SUB_CHIPS' },
        { name: 'Biscuits & Cookies', code: 'SUB_BISCUITS' },
        { name: 'Chocolates & Candies', code: 'SUB_CHOCOLATES' }
      ]
    }
  ];

  const subCatMap = {};

  for (const gc of groceryCategories) {
    let cat = await prisma.category.findUnique({ where: { code: gc.code } });
    if (!cat) {
      cat = await prisma.category.create({
        data: {
          name: gc.name,
          code: gc.code,
          image: gc.image,
          createdBy: createdVendorUids[0] || 'system',
          status: 'ACTIVE'
        }
      });
      console.log(`Created grocery category: ${gc.name}`);
    }
    // Tag vertical
    await prisma.$queryRawUnsafe(`UPDATE \`categories\` SET \`vertical\` = 'GROCERY' WHERE \`id\` = ${cat.id};`);

    for (const sub of gc.subs) {
      let subCat = await prisma.subCategory.findUnique({ where: { subCatCode: sub.code } });
      if (!subCat) {
        subCat = await prisma.subCategory.create({
          data: {
            catId: cat.id,
            subCatName: sub.name,
            subCatCode: sub.code,
            image: gc.image,
            status: true
          }
        });
        console.log(`  Created subcategory: ${sub.name}`);
      }
      await prisma.$queryRawUnsafe(`UPDATE \`sub_categories\` SET \`vertical\` = 'GROCERY' WHERE \`sub_cat_id\` = ${subCat.subCatId};`);
      subCatMap[sub.code] = { catId: cat.id, subCatId: subCat.subCatId };
    }
  }

  // 4. Create Grocery Products (matching exact screenshot items)
  const groceryProducts = [
    {
      sku: 'SKU_EGGS_12_BF',
      name: 'brightfarms Fresh Eggs 12 Pieces',
      brand: 'brightfarms',
      unit: '12 Pieces',
      price: 300.00,
      salePrice: 270.00,
      discount: 10.00, // 10% off
      stock: 100,
      vendorUid: 'vendor_pandamart_bahria',
      subCode: 'SUB_EGGS',
      images: ['https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500'],
      description: 'Grade-A farm fresh large white eggs packed with pure protein and vitamins.'
    },
    {
      sku: 'SKU_OLPERS_MILK_1L',
      name: "Olper's Full Cream Milk 1000ml",
      brand: "Olper's",
      unit: '1000ml',
      price: 380.00,
      salePrice: 357.20,
      discount: 6.00, // 6% off
      stock: 150,
      vendorUid: 'vendor_pandamart_bahria',
      subCode: 'SUB_MILK',
      images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500'],
      description: 'Pure, homogenized UHT milk offering full-body richness and wholesome nourishment.'
    },
    {
      sku: 'SKU_BANANA_HALF_DOZEN',
      name: 'brightfarm fresh banana half dozen',
      brand: 'brightfarms',
      unit: '6 Pieces (Half Dozen)',
      price: 240.00,
      salePrice: 199.00,
      discount: 17.00,
      stock: 80,
      vendorUid: 'vendor_pandamart_bahria',
      subCode: 'SUB_FRUITS',
      images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500'],
      description: 'Naturally ripened sweet and fresh bananas harvested directly from sunny orchards.'
    },
    {
      sku: 'SKU_PREMA_MILK_425G',
      name: 'Prema Pure Pasteurized Milk 425g',
      brand: 'Prema',
      unit: '425g Pouch',
      price: 245.00,
      salePrice: 220.00,
      discount: 10.00,
      stock: 90,
      vendorUid: 'vendor_pandamart_bahria',
      subCode: 'SUB_MILK',
      images: ['https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500'],
      description: 'Fresh organic pasteurized pure cow milk with rich cream layer.'
    },
    {
      sku: 'SKU_PEPSI_15L',
      name: 'Pepsi Cola 1.5 Litre Bottle',
      brand: 'Pepsi',
      unit: '1.5 Litres',
      price: 210.00,
      salePrice: 189.00,
      discount: 10.00,
      stock: 200,
      vendorUid: 'vendor_assetz_mart',
      subCode: 'SUB_SODAS',
      images: ['https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=500'],
      description: 'Refreshing bold cola carbonated soft drink served chilled.'
    },
    {
      sku: 'SKU_7UP_15L',
      name: '7UP Lemon Lime 1.5 Litre Bottle',
      brand: '7UP',
      unit: '1.5 Litres',
      price: 210.00,
      salePrice: 189.00,
      discount: 10.00,
      stock: 200,
      vendorUid: 'vendor_assetz_mart',
      subCode: 'SUB_SODAS',
      images: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500'],
      description: 'Crisp, clean, refreshing lemon and lime carbonated beverage with zero caffeine.'
    },
    {
      sku: 'SKU_LAYS_CLASSIC_65G',
      name: "Lay's Classic Salted Potato Chips 65g",
      brand: "Lay's",
      unit: '65g Pack',
      price: 100.00,
      salePrice: 90.00,
      discount: 10.00,
      stock: 120,
      vendorUid: 'vendor_alfatah_bahria',
      subCode: 'SUB_CHIPS',
      images: ['https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500'],
      description: 'Crispy golden fried potato chips lightly seasoned with natural sea salt.'
    },
    {
      sku: 'SKU_TAPAL_DANEDAR_450G',
      name: 'Tapal Danedar Black Tea 450g',
      brand: 'Tapal',
      unit: '450g Box',
      price: 780.00,
      salePrice: 720.00,
      discount: 8.00,
      stock: 75,
      vendorUid: 'vendor_alfatah_bahria',
      subCode: 'SUB_TEA',
      images: ['https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=500'],
      description: 'Premium quality blend of golden CTC tea grains producing rich aroma and strong taste.'
    }
  ];

  for (const gp of groceryProducts) {
    const subInfo = subCatMap[gp.subCode];
    if (!subInfo) continue;

    let prod = await prisma.product.findUnique({ where: { sku: gp.sku } });
    if (!prod) {
      prod = await prisma.product.create({
        data: {
          sku: gp.sku,
          proName: gp.name,
          brandName: gp.brand,
          packageWeight: gp.unit,
          price: gp.price,
          salePrice: gp.salePrice,
          discount: gp.discount,
          cost: gp.salePrice * 0.8,
          stock: gp.stock,
          qnty: gp.stock,
          catId: subInfo.catId,
          subCatId: subInfo.subCatId,
          vendorId: gp.vendorUid,
          createdById: gp.vendorUid,
          approvalStatus: 'Approved',
          status: true,
          description: gp.description,
          proImages: JSON.stringify(gp.images)
        }
      });
      console.log(`Created grocery product: ${gp.name}`);
    }
    // Tag vertical
    await prisma.$queryRawUnsafe(`UPDATE \`products\` SET \`vertical\` = 'GROCERY' WHERE \`pro_id\` = ${prod.proId};`);
  }

  // 5. Create Grocery Promotional Deals (matching "Save big on your groceries" banners)
  const groceryDeals = [
    {
      customTitle: 'Azaadi Deals',
      badgeLabel: 'Up to 25% off',
      customPriceLabel: '25% off groceries',
      customImageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',
      customItemsJson: JSON.stringify({ themeColor: '#E91E63', discount: '25% OFF', category: 'All Groceries', subtitle: 'Azaadi Deals' }),
      sortOrder: 1,
      vendorUid: 'vendor_pandamart_bahria'
    },
    {
      customTitle: 'Fresh Mart Savings',
      badgeLabel: 'Up to 10% off',
      customPriceLabel: '10% off groceries',
      customImageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600',
      customItemsJson: JSON.stringify({ themeColor: '#00897B', discount: '10% OFF', category: 'Dairy & Produce', subtitle: 'Save big' }),
      sortOrder: 2,
      vendorUid: 'vendor_assetz_mart'
    },
    {
      customTitle: 'Pandamart Beverage Fest',
      badgeLabel: 'Up to 15% off',
      customPriceLabel: '15% off beverages',
      customImageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600',
      customItemsJson: JSON.stringify({ themeColor: '#D81B60', discount: '15% OFF', category: 'Cold Drinks & Juices', subtitle: 'Pandamart' }),
      sortOrder: 3,
      vendorUid: 'vendor_pandamart_bahria'
    }
  ];

  for (const gd of groceryDeals) {
    let deal = await prisma.foodDeal.findFirst({ where: { customTitle: gd.customTitle } });
    if (!deal) {
      deal = await prisma.foodDeal.create({
        data: {
          customTitle: gd.customTitle,
          badgeLabel: gd.badgeLabel,
          customPriceLabel: gd.customPriceLabel,
          customImageUrl: gd.customImageUrl,
          customItemsJson: gd.customItemsJson,
          sortOrder: gd.sortOrder,
          vendorUid: gd.vendorUid,
          active: true
        }
      });
      console.log(`Created grocery promo deal: ${gd.customTitle}`);
    }
    await prisma.$queryRawUnsafe(`UPDATE \`food_deals\` SET \`vertical\` = 'GROCERY' WHERE \`deal_id\` = ${deal.dealId};`);
  }

  console.log('✅ Grocery Database Setup & Seeding Complete!');
}

seed()
  .catch(e => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
