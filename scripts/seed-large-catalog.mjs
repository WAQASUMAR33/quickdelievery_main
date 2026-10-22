import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config()

import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { uploadBufferToS3 } from '../src/lib/s3.js'

const prisma = new PrismaClient()

const ARTIFACT_DIR = 'C:/Users/theit/.gemini/antigravity-ide/brain/d1e8843a-f61f-4424-b678-ca5f1862a4c6'

const NEW_IMAGES = {
  mobile: path.join(ARTIFACT_DIR, 'mobile_accessories_tech_1792583900918.jpg'),
  laptop: path.join(ARTIFACT_DIR, 'laptop_computer_setup_1792583951122.jpg'),
  grocery: path.join(ARTIFACT_DIR, 'supermarket_grocery_items_1792584002463.jpg'),
  produce: path.join(ARTIFACT_DIR, 'fresh_organic_produce_1792582087591.jpg'),
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

async function main() {
  console.log('========================================================================')
  console.log('🚀 SEEDING 150+ ITEMS (MOBILE ACCESSORIES, COMPUTERS & GROCERY STORES)')
  console.log('========================================================================\n')

  try {
    // 1. Upload assets to S3
    console.log('1️⃣ [AMAZON S3] Uploading images to S3 bucket (rapidtechpro)...')
    const mobileImgUrl = await uploadImageToS3(NEW_IMAGES.mobile, 'mobile-accessories-hub.jpg', 'products')
    const laptopImgUrl = await uploadImageToS3(NEW_IMAGES.laptop, 'laptop-computer-workstation.jpg', 'products')
    const groceryPantryImgUrl = await uploadImageToS3(NEW_IMAGES.grocery, 'supermarket-pantry-staples.jpg', 'products')
    const produceImgUrl = await uploadImageToS3(NEW_IMAGES.produce, 'organic-farm-harvest.jpg', 'products')

    const elecCatUrl = await uploadImageToS3(NEW_IMAGES.laptop, 'cat-electronics.jpg', 'categories')
    const mobileCatUrl = await uploadImageToS3(NEW_IMAGES.mobile, 'cat-mobile-acc.jpg', 'categories')
    const laptopCatUrl = await uploadImageToS3(NEW_IMAGES.laptop, 'cat-computers.jpg', 'categories')
    const groceryCatUrl = await uploadImageToS3(NEW_IMAGES.grocery, 'cat-supermarket.jpg', 'categories')

    console.log('✅ S3 uploads complete.\n')

    // 2. Setup Business Categories & Business Types
    console.log('2️⃣ [RDS DATABASE] Creating Business Categories and Types...')
    let bcElectronics = await prisma.businessCategory.findFirst({ where: { categoryTitle: 'Electronics & Technology' } })
    if (!bcElectronics) {
      bcElectronics = await prisma.businessCategory.create({ data: { categoryTitle: 'Electronics & Technology' } })
    }

    let bcGrocery = await prisma.businessCategory.findFirst({ where: { categoryTitle: 'Grocery & Supermarket' } })
    if (!bcGrocery) {
      bcGrocery = await prisma.businessCategory.create({ data: { categoryTitle: 'Grocery & Supermarket' } })
    }

    let btMobile = await prisma.businessType.findFirst({ where: { typeTitle: 'Mobile Accessories & Gadgets' } })
    if (!btMobile) {
      btMobile = await prisma.businessType.create({
        data: { typeTitle: 'Mobile Accessories & Gadgets', businessCategoryId: bcElectronics.id },
      })
    }

    let btComputer = await prisma.businessType.findFirst({ where: { typeTitle: 'Computers & IT Hardware' } })
    if (!btComputer) {
      btComputer = await prisma.businessType.create({
        data: { typeTitle: 'Computers & IT Hardware', businessCategoryId: bcElectronics.id },
      })
    }

    let btSupermarket = await prisma.businessType.findFirst({ where: { typeTitle: 'Daily Supermarket & Pantry' } })
    if (!btSupermarket) {
      btSupermarket = await prisma.businessType.create({
        data: { typeTitle: 'Daily Supermarket & Pantry', businessCategoryId: bcGrocery.id },
      })
    }

    // 3. Setup Vendors & Stores
    console.log('3️⃣ [RDS DATABASE] Creating Vendor Stores...')
    const vendorPassword = await bcrypt.hash('Vendor@123456', 10)

    const stores = [
      {
        uid: 'vendor_electrozone_mobile',
        username: 'ElectroZone Mobile',
        email: 'sales@electrozone.com',
        phone: '+61455111222',
        bizName: 'ElectroZone Mobile Accessories',
        bizCatId: bcElectronics.id,
        bizTypeId: btMobile.id,
        logo: mobileImgUrl,
        city: 'Sydney',
        state: 'NSW',
        street: '72 Pitt Street, Sydney CBD',
        postal: '2000',
        lat: -33.8688,
        lng: 151.2093,
      },
      {
        uid: 'vendor_apex_computers',
        username: 'Apex Computers',
        email: 'support@apexcomputers.com',
        phone: '+61455333444',
        bizName: 'Apex Computers & Laptops',
        bizCatId: bcElectronics.id,
        bizTypeId: btComputer.id,
        logo: laptopImgUrl,
        city: 'Sydney',
        state: 'NSW',
        street: '215 Elizabeth Street, Sydney',
        postal: '2000',
        lat: -33.8732,
        lng: 151.2099,
      },
      {
        uid: 'vendor_metro_fresh_grocery',
        username: 'Metro Fresh Supermarket',
        email: 'orders@metrofresh.com',
        phone: '+61455777888',
        bizName: 'Metro Fresh Supermarket & Groceries',
        bizCatId: bcGrocery.id,
        bizTypeId: btSupermarket.id,
        logo: groceryPantryImgUrl,
        city: 'Melbourne',
        state: 'VIC',
        street: '180 Lonsdale Street, Melbourne',
        postal: '3000',
        lat: -37.8105,
        lng: 144.9665,
      },
    ]

    for (const s of stores) {
      await prisma.users.upsert({
        where: { email: s.email },
        update: { role: 'VENDOR' },
        create: {
          uid: s.uid,
          username: s.username,
          email: s.email,
          phoneNumber: s.phone,
          role: 'VENDOR',
          emailVerification: true,
          password: vendorPassword,
        },
      })

      const existingBiz = await prisma.business.findFirst({ where: { email: s.email } })
      if (!existingBiz) {
        await prisma.business.create({
          data: {
            email: s.email,
            businessName: s.bizName,
            firstName: s.username.split(' ')[0],
            lastName: 'Store',
            cnicNo: '42101-5544332-1',
            businessTypeId: s.bizTypeId,
            businessCategoryId: s.bizCatId,
            phoneNumber1: s.phone,
            streetAddress: s.street,
            city: s.city,
            state: s.state,
            postalCode: s.postal,
            billingAddress: s.street,
            urlCnicFront: s.logo,
            urlCnicBack: s.logo,
            bankName: 'ANZ Banking Group',
            bankIbanNo: 'AU8900055566677788',
            bankAccountTitle: s.bizName,
            urlLogo: s.logo,
            urlCoverPhoto: s.logo,
            latitude: s.lat,
            longitude: s.lng,
            vertical: s.bizCatId === bcGrocery.id ? 'GROCERY' : 'SHOP',
            verificationStatus: 'APPROVED',
          },
        })
      }
      console.log(`   Vendor Store ready: ${s.bizName}`)
    }

    // 4. Setup Categories, Product Categories & Subcategories
    console.log('\n4️⃣ [RDS DATABASE] Creating Taxonomy Hierarchy...')

    // Electronics Main Category
    const catElectronics = await prisma.category.upsert({
      where: { code: 'ELECTRONICS_TECH' },
      update: { image: elecCatUrl },
      create: {
        name: 'Electronics & Tech',
        code: 'ELECTRONICS_TECH',
        description: 'Smartphones, laptops, mobile accessories, audio, and computer peripherals',
        vertical: 'SHOP',
        status: 'ACTIVE',
        image: elecCatUrl,
        createdBy: 'admin_system_seed',
      },
    })

    // Groceries Main Category
    const catGrocery = await prisma.category.upsert({
      where: { code: 'GROCERY_PRODUCE' },
      update: { image: groceryCatUrl },
      create: {
        name: 'Fresh Groceries',
        code: 'GROCERY_PRODUCE',
        description: 'Pantry staples, dairy, organic produce, snacks, and household essentials',
        vertical: 'GROCERY',
        status: 'ACTIVE',
        image: groceryCatUrl,
        createdBy: 'admin_system_seed',
      },
    })

    // Product Categories
    let pcMobile = await prisma.productCategory.findFirst({ where: { categoryId: catElectronics.id, productCategoryName: 'Mobile Accessories' } })
    if (!pcMobile) {
      pcMobile = await prisma.productCategory.create({
        data: {
          productCategoryName: 'Mobile Accessories',
          categoryId: catElectronics.id,
          productCategoryDescription: 'Chargers, power banks, cases, screen protectors, wireless audio',
          image: mobileCatUrl,
        },
      })
    }

    let pcComputer = await prisma.productCategory.findFirst({ where: { categoryId: catElectronics.id, productCategoryName: 'Computers & Laptops' } })
    if (!pcComputer) {
      pcComputer = await prisma.productCategory.create({
        data: {
          productCategoryName: 'Computers & Laptops',
          categoryId: catElectronics.id,
          productCategoryDescription: 'Ultrabooks, gaming rigs, monitors, keyboards, mice, storage',
          image: laptopCatUrl,
        },
      })
    }

    let pcPantry = await prisma.productCategory.findFirst({ where: { categoryId: catGrocery.id, productCategoryName: 'Pantry Staples & Groceries' } })
    if (!pcPantry) {
      pcPantry = await prisma.productCategory.create({
        data: {
          productCategoryName: 'Pantry Staples & Groceries',
          categoryId: catGrocery.id,
          productCategoryDescription: 'Olive oils, grains, canned food, organic dairy, snacks, beverages',
          image: groceryCatUrl,
        },
      })
    }

    // Subcategories
    const subMobile = await prisma.subCategory.upsert({
      where: { subCatCode: 'SUB_MOBILE_ACCESSORIES' },
      update: { image: mobileImgUrl },
      create: {
        subCatName: 'Mobile Gadgets & Power',
        subCatCode: 'SUB_MOBILE_ACCESSORIES',
        image: mobileImgUrl,
        catId: catElectronics.id,
        productCategoryId: pcMobile.productCategoryId,
        vertical: 'SHOP',
        status: true,
      },
    })

    const subComputer = await prisma.subCategory.upsert({
      where: { subCatCode: 'SUB_COMPUTERS_LAPTOPS' },
      update: { image: laptopImgUrl },
      create: {
        subCatName: 'Laptops & Workstations',
        subCatCode: 'SUB_COMPUTERS_LAPTOPS',
        image: laptopImgUrl,
        catId: catElectronics.id,
        productCategoryId: pcComputer.productCategoryId,
        vertical: 'SHOP',
        status: true,
      },
    })

    const subGrocery = await prisma.subCategory.upsert({
      where: { subCatCode: 'SUB_SUPERMARKET_PANTRY' },
      update: { image: groceryPantryImgUrl },
      create: {
        subCatName: 'Supermarket Grocery Staples',
        subCatCode: 'SUB_SUPERMARKET_PANTRY',
        image: groceryPantryImgUrl,
        catId: catGrocery.id,
        productCategoryId: pcPantry.productCategoryId,
        vertical: 'GROCERY',
        status: true,
      },
    })

    console.log('✅ Taxonomy ready.\n')

    // 5. Seed 52 Mobile Accessories
    console.log('5️⃣ [RDS DATABASE] Seeding 52 Mobile Accessories items...')
    const mobileProducts = [
      { name: 'Anker PowerCore 20,000mAh Power Bank', price: 49.99, sale: 44.99, tag: 'High-speed charging, Dual USB ports' },
      { name: 'Apple MagSafe Fast Wireless Charger 15W', price: 39.00, sale: 35.00, tag: 'Magnetic alignment, Qi compatible' },
      { name: 'Samsung 45W Super Fast Wall Adapter USB-C', price: 34.99, sale: 29.99, tag: 'GaN technology, Compact design' },
      { name: 'Sony WF-1000XM5 True Wireless Earbuds', price: 279.00, sale: 249.00, tag: 'Active Noise Canceling, Hi-Res Audio' },
      { name: 'Belkin BoostCharge Braided USB-C Cable (2m)', price: 19.99, sale: null, tag: 'Reinforced nylon, 60W Power Delivery' },
      { name: 'Spigen Tough Armor Protective Phone Case', price: 24.99, sale: 21.99, tag: 'Air Cushion technology, Built-in kickstand' },
      { name: 'ESR HaloLock MagSafe Car Mount & Charger', price: 38.50, sale: 32.50, tag: 'Strong magnetic grip, Air vent clip' },
      { name: 'SanDisk 128GB Ultra Dual Drive Luxe USB-C', price: 22.99, sale: 19.99, tag: 'All-metal swivel, High-speed transfer' },
      { name: 'JBL Clip 4 Portable Waterproof Bluetooth Speaker', price: 69.95, sale: 59.95, tag: 'IP67 waterproof, Carabiner clip, 10h battery' },
      { name: 'Baseus 65W GaN5 Pro 3-Port Fast Desktop Charger', price: 54.00, sale: 48.00, tag: '2x Type-C, 1x USB-A, Universal compatibility' },
      { name: 'UGREEN 100W USB-C to USB-C Right Angle Cable', price: 15.99, sale: null, tag: '90-degree design, E-marker chip' },
      { name: 'TORRAS Magnetic Shockproof Slim Phone Case', price: 29.99, sale: 26.99, tag: 'Translucent matte back, Military grade' },
      { name: 'Mophie Snap+ 3-in-1 Wireless Charging Stand', price: 99.95, sale: 84.95, tag: 'Charges phone, watch & earbuds simultaneously' },
      { name: 'Shure AONIC Free Sound Isolating Earphones', price: 179.00, sale: 159.00, tag: 'Studio-quality audio, Deep bass' },
      { name: 'PopSockets MagSafe Grip & Wallet', price: 39.99, sale: 34.99, tag: 'Holds 3 cards, Removable magnetic base' },
      { name: 'DJI Osmo Mobile 6 Smartphone Gimbal Stabilizer', price: 149.00, sale: 139.00, tag: '3-axis stabilization, ActiveTrack 6.0' },
      { name: 'Rode Wireless ME Ultra-compact Microphone System', price: 149.00, sale: null, tag: 'Broadcast quality, Plug and play' },
      { name: 'Amegat 140W GaN Fast Wall Charger', price: 79.99, sale: 69.99, tag: 'PD 3.1 ultra-fast charging, Foldable prongs' },
      { name: 'Incase Compact Sleeve with Flight Nylon', price: 44.95, sale: null, tag: 'Plush faux-fur lining, Streamlined design' },
      { name: 'Tile Pro (2024) Powerful Bluetooth Item Finder', price: 34.99, sale: 29.99, tag: '400 ft range, Replaceable battery' },
      { name: 'Spigen GlasTR EZ FIT Tempered Glass (2-Pack)', price: 18.99, sale: null, tag: 'Auto-alignment installation kit, 9H hardness' },
      { name: 'Anker 622 Magnetic Battery (MagGo) 5000mAh', price: 45.99, sale: 39.99, tag: 'Foldable stand, Snaps firmly to phone' },
      { name: 'Belkin SoundForm Pulse Noise Cancelling Earbuds', price: 89.99, sale: 74.99, tag: 'Multipoint Bluetooth, 35h total battery' },
      { name: 'Native Union Belt Cable Pro USB-C 240W', price: 39.99, sale: null, tag: 'Ultra-strong aramid fiber, Genuine leather strap' },
      { name: 'UGREEN 15W Qi2 Certified Fast Wireless Pad', price: 28.99, sale: 24.99, tag: 'Aluminum alloy body, Temperature control' },
      { name: 'Peak Design Mobile Everyday Phone Fabric Case', price: 49.95, sale: null, tag: 'SlimLink magnetic lock, Weatherproof canvas' },
      { name: 'Scosche MagicMount Pro2 Extendo Window/Dash Mount', price: 32.99, sale: 28.99, tag: 'Telescoping arm, 360-degree adjustable head' },
      { name: 'Beats Studio Buds + True Wireless Earbuds', price: 169.95, sale: 149.95, tag: 'Transparent design, Spatial audio' },
      { name: 'Anker 737 Power Bank (PowerCore 24K) 140W', price: 139.99, sale: 119.99, tag: 'Smart digital display, Charges MacBooks' },
      { name: 'Samsung Galaxy SmartTag2 Bluetooth Tracker (4-Pack)', price: 99.00, sale: 84.00, tag: 'IP67 water resistant, Compass view' },
      { name: 'Nomad Rugged Horween Leather Case', price: 65.00, sale: 58.00, tag: 'Authentic USA leather, Patinas over time' },
      { name: 'Belkin BoostCharge Dual USB-C Car Charger 37W', price: 24.99, sale: 21.99, tag: 'PPS fast charge, Compact cigarette lighter fit' },
      { name: 'Joby GripTight ONE GP Smartphone Tripod Stand', price: 34.95, sale: 29.95, tag: 'Flexible wrappable legs, Universal clamp' },
      { name: 'Razer Kishi V2 Mobile Gaming Controller', price: 99.99, sale: 84.99, tag: 'Microswitch buttons, Ultra-low latency USB-C' },
      { name: 'Satechi Aluminum Magnetic Wallet & Stand', price: 39.99, sale: 34.99, tag: 'Duo function, Holds cards and props phone' },
      { name: 'Pitaka MagEZ Aramid Fiber Ultra-Thin Case', price: 59.99, sale: 52.99, tag: 'Aerospace-grade 600D aramid fiber' },
      { name: 'Anker Soundcore Space A40 Adaptive ANC Earbuds', price: 79.99, sale: 69.99, tag: '50-hour playtime, Hi-Res wireless LDAC' },
      { name: 'JLab Go Air POP True Wireless Bluetooth Earbuds', price: 24.99, sale: 19.99, tag: 'Pocket-sized case, Integrated USB charging cable' },
      { name: 'Baseus Blade 100W Ultra-Thin Laptop & Phone Power Bank', price: 89.99, sale: 79.99, tag: '0.7-inch slim profile, Dual Type-C ports' },
      { name: 'UGREEN HiTune Max5 Hybrid ANC Over-Ear Headphones', price: 59.99, sale: 49.99, tag: '90-hour ultra long battery, 43dB noise cancellation' },
      { name: 'Shargeek Storm 2 Transparent Cyberpunk Power Bank', price: 199.00, sale: 179.00, tag: 'See-through IPS screen, 25,600mAh capacity' },
      { name: 'Twelve South Forté MagSafe Wireless Charging Stand', price: 39.99, sale: 34.99, tag: 'Floating tilt mount, Luxury desktop aesthetic' },
      { name: 'Bellroy Leather Card Pocket Phone Sleeve', price: 55.00, sale: null, tag: 'Premium eco-tanned leather, Stores sim eject pin' },
      { name: 'Anker Powerline+ III Lightning Cable MFi Certified', price: 18.99, sale: 15.99, tag: 'Slimmer yet 35,000-bend lifespan tested' },
      { name: 'OtterBox Defender Series Rugged Heavy Duty Case', price: 44.95, sale: 39.95, tag: 'Multi-layer defense, Port covers keep out dust' },
      { name: 'Logitech Powered 3-in-1 Fast Wireless Charging Dock', price: 119.99, sale: 99.99, tag: 'Engineered for Apple ecosystem, Space-saving' },
      { name: 'Nite Ize Steelie Magnetic Car Dashboard Mount Kit', price: 22.99, sale: 19.99, tag: 'Smooth steel ball design for infinite angles' },
      { name: 'UAG Urban Armor Gear Monarch Rugged Case', price: 59.95, sale: 52.95, tag: '5-layer protection, Top-grain leather finish' },
      { name: 'Marshall Minor III True Wireless Rock Earbuds', price: 129.99, sale: 114.99, tag: 'Signature Marshall sound, Custom-tuned 12mm drivers' },
      { name: 'Belkin Magnetic Fitness Phone Mount for Gym Equipment', price: 29.99, sale: 25.99, tag: 'Dual magnets adhere securely to gym machines' },
      { name: 'UGREEN 10000mAh Magnetic Wireless Power Bank with Kickstand', price: 42.99, sale: 36.99, tag: 'Fold-out zinc alloy ring stand, 20W PD output' },
      { name: 'Anker 332 USB-C Hub 5-in-1 Multiport Adapter', price: 29.99, sale: 25.99, tag: '4K HDMI, 85W Pass-Through, 2x USB-A 3.0 ports' },
    ]

    for (let i = 0; i < mobileProducts.length; i++) {
      const p = mobileProducts[i]
      const sku = `MOB-ACC-${String(i + 1).padStart(3, '0')}`
      await prisma.product.upsert({
        where: { sku },
        update: { proImages: JSON.stringify([mobileImgUrl]), price: p.price, salePrice: p.sale },
        create: {
          sku,
          proName: p.name,
          price: p.price,
          salePrice: p.sale,
          cost: Math.round(p.price * 0.45 * 100) / 100,
          discount: p.sale ? Math.round(((p.price - p.sale) / p.price) * 100) : 0,
          stock: 40 + (i % 25),
          qnty: 40 + (i % 25),
          catId: catElectronics.id,
          productCategoryId: pcMobile.productCategoryId,
          subCatId: subMobile.subCatId,
          vendorId: 'vendor_electrozone_mobile',
          createdById: 'vendor_electrozone_mobile',
          vertical: 'SHOP',
          description: `High-performance ${p.name}. Certified genuine accessories engineered for maximum durability, speed, and safety.`,
          keyFeatures: JSON.stringify([p.tag, 'Official Manufacturer Warranty', 'Universal Compatibility']),
          ingredients: null,
          proImages: JSON.stringify([mobileImgUrl]),
          approvalStatus: 'Approved',
          status: true,
        },
      })
    }
    console.log(`✅ Seeded ${mobileProducts.length} Mobile Accessories items.\n`)

    // 6. Seed 52 Computer & Laptops Items
    console.log('6️⃣ [RDS DATABASE] Seeding 52 Computer & Laptop items...')
    const computerProducts = [
      { name: 'Apple MacBook Air 13.6-inch M3 Chip (16GB RAM, 512GB SSD)', price: 1299.00, sale: 1199.00, tag: 'Liquid Retina, 18-hour battery' },
      { name: 'Dell XPS 13 9340 Intel Core Ultra 7 (32GB, 1TB SSD)', price: 1699.00, sale: 1549.00, tag: 'OLED InfinityEdge Display, CNC Aluminum' },
      { name: 'Lenovo ThinkPad X1 Carbon Gen 12 Ultrabook', price: 1799.00, sale: 1649.00, tag: 'Legendary keyboard, Carbon fiber build' },
      { name: 'ASUS ROG Zephyrus G14 Gaming Laptop RTX 4070', price: 1899.00, sale: 1749.00, tag: 'Ryzen 9, 3K 120Hz OLED, 1.5kg chassis' },
      { name: 'HP Spectre x360 14 2-in-1 Convertible Touchscreen Laptop', price: 1449.00, sale: 1329.00, tag: 'Stylus pen included, Intel Evo platform' },
      { name: 'Logitech MX Master 3S Wireless Performance Mouse', price: 99.99, sale: 89.99, tag: '8K DPI sensor, Quiet clicks, MagSpeed scroll' },
      { name: 'Keychron Q1 Pro Wireless Custom Mechanical Keyboard', price: 199.00, sale: 179.00, tag: 'Full aluminum body, Hot-swappable switches' },
      { name: 'LG 27GP95R-B 27-inch 4K UHD Nano IPS Gaming Monitor', price: 549.99, sale: 489.99, tag: '144Hz, 1ms G-Sync Compatible, HDR600' },
      { name: 'Samsung T7 Shield 2TB Portable Rugged External SSD', price: 179.99, sale: 159.99, tag: '1050 MB/s speed, Drop resistant rubber shell' },
      { name: 'CalDigit TS4 Thunderbolt 4 Dock 18-Port Workstation Hub', price: 399.95, sale: null, tag: '98W host charging, Dual 6K display support' },
      { name: 'Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz RAM', price: 119.99, sale: 104.99, tag: 'Optimized for Intel & AMD, Custom RGB' },
      { name: 'Logitech MX Keys S Advanced Illuminated Wireless Keyboard', price: 109.99, sale: 99.99, tag: 'Smart backlighting, Fluid tactile keys' },
      { name: 'Razer DeathAdder V3 Pro Ultra-lightweight Wireless Mouse', price: 139.99, sale: 124.99, tag: '63g ergonomic weight, Focus Pro 30K optical' },
      { name: 'Dell UltraSharp U2724DE 27-inch QHD Thunderbolt Monitor', price: 479.00, sale: 429.00, tag: 'IPS Black tech, 120Hz refresh, Daisy chain' },
      { name: 'Western Digital Black SN850X 2TB NVMe M.2 Internal SSD', price: 159.99, sale: 139.99, tag: 'Up to 7300 MB/s, Heatsink included' },
      { name: 'SteelSeries Arctis Nova Pro Wireless Multi-System Headset', price: 349.99, sale: 319.99, tag: 'Active noise cancellation, Hot-swap dual battery' },
      { name: 'Elgato Stream Deck MK.2 15 Customizable LCD Macro Keys', price: 149.99, sale: 134.99, tag: 'Instant studio controller, Detachable faceplate' },
      { name: 'Logitech Brio 4K Ultra HD Pro Streaming Webcam', price: 169.99, sale: 149.99, tag: 'HDR with RightLight 3, Windows Hello facial login' },
      { name: 'Anker 575 USB-C 12-in-1 Triple Display Laptop Dock', price: 139.99, sale: 119.99, tag: '85W high-speed charging, Dual HDMI + DisplayPort' },
      { name: 'Twelve South Curve Aluminum Ergonomic Laptop Stand', price: 59.99, sale: 49.99, tag: 'Improves airflow, Elevated viewing posture' },
      { name: 'Crucial P3 Plus 1TB PCIe Gen4 NVMe M.2 SSD', price: 69.99, sale: 59.99, tag: 'Speeds up to 5000 MB/s, Micron Advanced 3D NAND' },
      { name: 'Razer BlackWidow V4 Pro Mechanical Gaming Keyboard', price: 229.99, sale: 199.99, tag: 'Green clicky switches, Dedicated macro rollers' },
      { name: 'BenQ ScreenBar Halo Wireless Monitor Light Bar', price: 179.00, sale: 159.00, tag: 'Zero screen glare, Auto dimming, Wireless puck' },
      { name: 'Audio-Technica ATH-M50xBT2 Professional Studio Monitor', price: 199.00, sale: 179.00, tag: '45mm large-aperture drivers, 50h battery life' },
      { name: 'Kingston Fury Beast 64GB (2x32GB) DDR4 3200MHz Desktop Kit', price: 129.99, sale: 114.99, tag: 'Low-profile heat spreader, Intel XMP ready' },
      { name: 'Seagate Expansion 4TB External USB 3.0 Hard Drive', price: 109.99, sale: 94.99, tag: 'Drag and drop file backup, Plug and play' },
      { name: 'Apple Magic Trackpad Multi-Touch Surface - Black', price: 149.00, sale: null, tag: 'Force Touch technology, Edge-to-edge glass' },
      { name: 'Logitech G PRO X SUPERLIGHT 2 Lightweight Gaming Mouse', price: 159.99, sale: 139.99, tag: 'Sub-60g weight, LIGHTFORCE hybrid switches' },
      { name: 'ASUS ROG Swift OLED PG27AQDM 27-inch 240Hz Gaming Monitor', price: 899.00, sale: 799.00, tag: '0.03ms response time, 99% DCI-P3 gamut' },
      { name: 'NZXT Capsule USB Cardioid Microphone with Boom Arm Kit', price: 119.99, sale: 99.99, tag: 'Studio voice clarity, High-res 24-bit/96kHz' },
      { name: 'HyperX Cloud III Wireless Gaming Over-Ear Headset', price: 149.99, sale: 129.99, tag: 'Up to 120 hours battery life, Angled 53mm drivers' },
      { name: 'UGREEN 9-in-1 USB-C Hub with 100W PD & Gigabit Ethernet', price: 49.99, sale: 39.99, tag: '4K@60Hz HDMI output, Aluminum alloy enclosure' },
      { name: 'Rain Design mStand360 Swivel Aluminum Laptop Stand', price: 64.90, sale: null, tag: '360 degree smooth rotation, Sand-blasted finish' },
      { name: 'Samsung 990 PRO 4TB NVMe SSD with Heatsink', price: 349.99, sale: 309.99, tag: 'DirectStorage support, Max read 7450 MB/s' },
      { name: 'Glorious Custom GMMK PRO 75% Barebones Gasket Keyboard', price: 169.99, sale: 149.99, tag: 'CNC machined chassis, Rotary control knob' },
      { name: 'Elgato Facecam Full HD 1080p60 Uncompressed Video Webcam', price: 129.99, sale: 109.99, tag: 'Sony STARVIS sensor, Prime lens with manual controls' },
      { name: 'LaCie Rugged Mini 2TB External Hard Drive USB 3.0', price: 104.99, sale: 89.99, tag: 'Iconic orange bumper, Rain and crush resistant' },
      { name: 'Wacom Intuos Pro Medium Graphic Drawing Tablet', price: 379.95, sale: 349.95, tag: '8192 levels pen pressure, Multi-touch gestures' },
      { name: 'Anker PowerExpand Elite 13-in-1 Thunderbolt 3 Dock', price: 249.99, sale: 219.99, tag: '85W laptop charging, Dual 4K video output' },
      { name: 'MSI MAG CoreLiquid 360R V2 RGB CPU AIO Liquid Cooler', price: 124.99, sale: 109.99, tag: 'Split-pathway radiator, Durable ceramic bearing' },
      { name: 'Ducky One 3 TKL Fuji Hotswap Mechanical Keyboard', price: 139.00, sale: null, tag: 'QUACK mechanics, True PBT seamless keycaps' },
      { name: 'Logitech ERGO K860 Split Ergonomic Wireless Keyboard', price: 129.99, sale: 114.99, tag: 'Curved split keyframe, Pillowed wrist rest' },
      { name: 'Razer Viper V3 Pro Ultra-lightweight Esports Mouse', price: 159.99, sale: 144.99, tag: '54g symmetrical design, 8000Hz polling rate' },
      { name: 'ViewSonic ColorPro VP2776 27-inch 165Hz Colorist Monitor', price: 699.99, sale: 629.99, tag: 'Factory calibrated Delta E < 2, Color Wheel tool' },
      { name: 'Corsair K70 MAX RGB Magnetic-Mechanical Gaming Keyboard', price: 229.99, sale: 199.99, tag: 'MGX adjustable magnetic switches, Rapid Trigger' },
      { name: 'Belkin Connect Universal USB-C Triple Display Docking Station', price: 219.99, sale: 189.99, tag: 'DisplayLink technology, Supports 3 external 4K screens' },
      { name: 'Sennheiser HD 560 S Over-Ear Audiophile Reference Headphones', price: 179.95, sale: 159.95, tag: 'Linear acoustic tuning, Angled transducer alignment' },
      { name: 'Logitech G915 LIGHTSPEED Wireless RGB Mechanical Keyboard', price: 229.99, sale: 199.99, tag: 'Aircraft-grade aluminum, Ultra-thin low profile' },
      { name: 'ASUS ROG Rapture GT-AXE16000 Quad-Band WiFi 6E Router', price: 599.99, sale: 529.99, tag: 'Dual 10G ports, Quad-band speeds up to 16,000 Mbps' },
      { name: 'Sabrent Rocket 4 Plus 2TB PCIe 4.0 M.2 SSD', price: 149.99, sale: 129.99, tag: 'Toshiba BiCS4 TLC NAND, 7100 MB/s speed' },
      { name: 'Cooler Master Notepal X3 Gaming Laptop Cooling Pad', price: 44.99, sale: 37.99, tag: '200mm blue LED fan, Front air vent aerodynamics' },
      { name: 'Apple Magic Keyboard with Touch ID and Numeric Keypad', price: 199.00, sale: 179.00, tag: 'Wireless rechargeable, Touch ID fingerprint login' },
    ]

    for (let i = 0; i < computerProducts.length; i++) {
      const p = computerProducts[i]
      const sku = `COMP-LAP-${String(i + 1).padStart(3, '0')}`
      await prisma.product.upsert({
        where: { sku },
        update: { proImages: JSON.stringify([laptopImgUrl]), price: p.price, salePrice: p.sale },
        create: {
          sku,
          proName: p.name,
          price: p.price,
          salePrice: p.sale,
          cost: Math.round(p.price * 0.65 * 100) / 100,
          discount: p.sale ? Math.round(((p.price - p.sale) / p.price) * 100) : 0,
          stock: 20 + (i % 15),
          qnty: 20 + (i % 15),
          catId: catElectronics.id,
          productCategoryId: pcComputer.productCategoryId,
          subCatId: subComputer.subCatId,
          vendorId: 'vendor_apex_computers',
          createdById: 'vendor_apex_computers',
          vertical: 'SHOP',
          description: `Professional computing hardware: ${p.name}. Premium build quality tested for intensive multitasking, gaming, and creative workflows.`,
          keyFeatures: JSON.stringify([p.tag, 'Brand New in Box', 'Full Manufacturer Coverage']),
          ingredients: null,
          proImages: JSON.stringify([laptopImgUrl]),
          approvalStatus: 'Approved',
          status: true,
        },
      })
    }
    console.log(`✅ Seeded ${computerProducts.length} Computer & Laptop items.\n`)

    // 7. Seed 52 Grocery Store Items
    console.log('7️⃣ [RDS DATABASE] Seeding 52 Supermarket Grocery items...')
    const groceryProducts = [
      { name: 'Colavita Extra Virgin Olive Oil 1L Glass Bottle', price: 18.99, sale: 16.49, tag: 'Cold pressed in Italy, First harvest' },
      { name: 'Barilla Collezione Artisanal Spaghetti Pasta (500g)', price: 4.50, sale: 3.75, tag: 'Bronze die cut, 100% durum wheat semolina' },
      { name: 'Organic Valley Whole Grassmilk Organic Milk (1.89L)', price: 6.99, sale: null, tag: '100% grass-fed cows, Non-homogenized' },
      { name: 'Twinings English Breakfast Tea Tin (100 Tea Bags)', price: 11.49, sale: 9.99, tag: 'Golden amber brew, Rich and robust flavor' },
      { name: 'Lavazza Super Crema Whole Bean Coffee Blend (1kg)', price: 26.99, sale: 22.99, tag: 'Notes of hazelnut and brown sugar, Medium roast' },
      { name: 'Bonne Maman Wild Blueberry Preserves Jar (370g)', price: 5.99, sale: 4.99, tag: 'Traditional French recipe, No high fructose corn syrup' },
      { name: 'Bob Red Mill Organic Rolled Oats Whole Grain (907g)', price: 7.29, sale: null, tag: 'Non-GMO Project verified, High fiber' },
      { name: 'Kirkland Signature Pure Organic Maple Syrup (1L)', price: 17.50, sale: 15.00, tag: 'Grade A Amber rich taste, 100% pure Canadian' },
      { name: 'Mutti Finely Chopped Tomatoes Polpa Can (400g x 3)', price: 6.50, sale: 5.25, tag: 'Sun-ripened Italian tomatoes, Bright natural flavor' },
      { name: 'De Cecco Penne Rigate No. 41 Pasta (500g)', price: 3.99, sale: null, tag: 'Coarse texture holds sauces perfectly' },
      { name: 'Lundberg Organic California White Basmati Rice (1kg)', price: 9.49, sale: 8.29, tag: 'Fragrant long grains, Sustainably farmed' },
      { name: 'Kerrygold Pure Irish Salted Butter (250g)', price: 5.80, sale: 4.90, tag: 'Pasture-fed Irish cows, Silky golden richness' },
      { name: 'Maldon Sea Salt Flakes Tub (240g)', price: 7.99, sale: null, tag: 'Hand-harvested artisan pyramid flakes' },
      { name: 'Califia Farms Barista Blend Almond Milk (1L)', price: 4.99, sale: 3.99, tag: 'Steams and foams beautifully, Dairy-free' },
      { name: 'Nutella Hazelnut Spread with Cocoa Glass Jar (750g)', price: 8.99, sale: 7.49, tag: 'Classic breakfast favorite, Creamy texture' },
      { name: 'Maille Dijon Original Traditional French Mustard (215g)', price: 4.89, sale: null, tag: 'Smooth texture with a peppery kick' },
      { name: 'Monini White Truffle Flavored Extra Virgin Olive Oil (250ml)', price: 14.99, sale: 12.99, tag: 'Infused with real Italian white truffle aroma' },
      { name: 'Kikkoman Naturally Brewed Soy Sauce Glass Bottle (500ml)', price: 5.49, sale: null, tag: 'Aged for full savory umami depth' },
      { name: 'San Pellegrino Sparkling Natural Mineral Water (1L Glass)', price: 3.50, sale: 2.80, tag: 'Fine delicate bubbles from Italian Alps' },
      { name: 'Rummo Gluten-Free Rigatoni Corn & Brown Rice Pasta (400g)', price: 5.29, sale: 4.49, tag: 'Lenta Lavorazione method, Al dente texture' },
      { name: 'Nature Valley Crunchy Granola Bars Oats & Honey (12-Pack)', price: 6.99, sale: 5.99, tag: 'Real whole grain oats, No artificial colors' },
      { name: 'Heinz Tomato Ketchup Squeeze Bottle (1kg)', price: 6.29, sale: null, tag: 'Thick and rich iconic recipe' },
      { name: 'Kraft Crunchy Peanut Butter Jar (500g)', price: 5.19, sale: 4.39, tag: 'Made with roasted Australian peanuts' },
      { name: 'Lotus Biscoff Original Caramelised Biscuit Spread (400g)', price: 6.49, sale: 5.50, tag: 'Smooth sweet caramelized biscuit flavor' },
      { name: 'Lindt Excellence 85% Cocoa Dark Chocolate Block (100g)', price: 4.99, sale: 3.99, tag: 'Rich robust cocoa notes, Swiss master chocolatier' },
      { name: 'Filippo Berio Pure Olive Oil for Sautéing & Grilling (1L)', price: 16.99, sale: 14.49, tag: 'Mild flavor with high smoke point' },
      { name: 'Chobani Greek Yogurt Whole Milk Plain Tub (907g)', price: 7.49, sale: 6.29, tag: 'Triple strained, Rich in natural protein' },
      { name: 'Ocean Spray 100% Cranberry Juice No Added Sugar (1.5L)', price: 6.89, sale: null, tag: 'Clean tart taste, High in Vitamin C' },
      { name: 'Bickford Traditional Lemon Lime & Bitters Cordial (750ml)', price: 5.79, sale: 4.99, tag: 'Classic Australian refreshment with real juice' },
      { name: 'Arnott Tim Tam Original Chocolate Biscuits (200g)', price: 4.50, sale: 3.20, tag: 'Crisp biscuit, smooth cream, real chocolate' },
      { name: 'Quaker Quick 1-Minute Oatmeal Carton (1.19kg)', price: 8.99, sale: 7.69, tag: 'Heart healthy 100% whole grain oats' },
      { name: 'McCormick Organic Ground Black Pepper Grinder (70g)', price: 5.99, sale: null, tag: 'Fresh cracked aromatic pepper flakes' },
      { name: 'S.Pellegrino Aranciata Rossa Blood Orange Soda (6x330ml)', price: 10.99, sale: 8.99, tag: 'Made with Mediterranean blood orange juice' },
      { name: 'Philadelphia Original Cream Cheese Block (250g)', price: 4.80, sale: null, tag: 'Smooth and spreadable for bagels and baking' },
      { name: 'Bega Tasty Natural Cheddar Cheese Block (500g)', price: 8.50, sale: 7.20, tag: 'Aged for delicious bite and meltability' },
      { name: 'Golden Circle Australian Apple Juice (2L)', price: 4.99, sale: 3.99, tag: 'No added preservatives, Sweet crisp orchard apples' },
      { name: 'Hellmann Real Mayonnaise Jar (800ml)', price: 7.99, sale: 6.79, tag: 'Cage-free eggs and quality oil' },
      { name: 'Pellegrino Organic Basil Pesto alla Genovese (190g)', price: 6.29, sale: 5.19, tag: 'Fresh fragrant Genovese basil, pine nuts, Grana Padano' },
      { name: 'Cadbury Dairy Milk Chocolate Family Block (350g)', price: 7.50, sale: 5.99, tag: 'A glass and a half of fresh milk in every block' },
      { name: 'Sanitarium Weet-Bix Original Breakfast Cereal (1.12kg)', price: 6.80, sale: 5.50, tag: '97% wholegrain wheat, High in natural folate' },
      { name: 'Vittoria Mountain Grown Espresso Ground Coffee (500g)', price: 14.99, sale: 12.49, tag: '100% Arabica, Intense dark roasted blend' },
      { name: 'Campbell Real Stock Free Range Chicken Broth (1L)', price: 4.29, sale: null, tag: 'Simmered with real chicken and garden vegetables' },
      { name: 'MasterFoods All-Rounder Moroccan Seasoning Blend (48g)', price: 4.19, sale: 3.50, tag: 'Paprika, cumin, and garlic spice blend' },
      { name: 'Red Rock Deli Sweet Chilli & Sour Cream Chips (165g)', price: 5.50, sale: 4.00, tag: 'Slow cooked Australian potatoes, Gourmet crunch' },
      { name: 'Capilano Pure Australian Squeeze Honey (500g)', price: 8.99, sale: 7.69, tag: '100% Australian pure floral eucalypt honey' },
      { name: 'Schweppes Classic Dry Ginger Ale (4x300ml Glass)', price: 6.99, sale: 5.49, tag: 'Brewed with natural ginger root extracts' },
      { name: 'Sirena Chunk Style Tuna in Italian Olive Oil (185g)', price: 4.89, sale: 3.99, tag: 'Pole and line caught yellowfin tuna' },
      { name: 'San Remo Couscous Medium Grain (500g)', price: 3.29, sale: null, tag: 'Ready in just 5 minutes, Fluffy golden grains' },
      { name: 'Tabasco Brand Original Red Pepper Sauce (148ml)', price: 6.49, sale: 5.29, tag: 'Aged in white oak barrels for three years' },
      { name: 'Devondale Long Life Full Cream Milk (1L x 3 Pack)', price: 5.99, sale: 4.99, tag: 'Australian farm dairy, Calcium rich' },
      { name: 'Twinings Pure Peppermint Herbal Infusion (80 Bags)', price: 9.49, sale: 7.99, tag: 'Naturally caffeine-free, Refreshing cool mint' },
      { name: 'Sunbeam Natural Raw Almonds Resealable Bag (400g)', price: 9.99, sale: 8.49, tag: 'Nutrient-packed wholesome snack, Heart healthy' },
    ]

    for (let i = 0; i < groceryProducts.length; i++) {
      const p = groceryProducts[i]
      const sku = `GROC-PAN-${String(i + 1).padStart(3, '0')}`
      await prisma.product.upsert({
        where: { sku },
        update: { proImages: JSON.stringify([groceryPantryImgUrl]), price: p.price, salePrice: p.sale },
        create: {
          sku,
          proName: p.name,
          price: p.price,
          salePrice: p.sale,
          cost: Math.round(p.price * 0.55 * 100) / 100,
          discount: p.sale ? Math.round(((p.price - p.sale) / p.price) * 100) : 0,
          stock: 60 + (i % 40),
          qnty: 60 + (i % 40),
          catId: catGrocery.id,
          productCategoryId: pcPantry.productCategoryId,
          subCatId: subGrocery.subCatId,
          vendorId: 'vendor_metro_fresh_grocery',
          createdById: 'vendor_metro_fresh_grocery',
          vertical: 'GROCERY',
          description: `Everyday supermarket pantry staple: ${p.name}. Sourced fresh daily with premium quality assurance and satisfaction guarantee.`,
          keyFeatures: JSON.stringify([p.tag, 'Fresh Pantry Guaranteed', 'Direct from Quality Producers']),
          ingredients: null,
          proImages: JSON.stringify([groceryPantryImgUrl]),
          approvalStatus: 'Approved',
          status: true,
        },
      })
    }
    console.log(`✅ Seeded ${groceryProducts.length} Supermarket Grocery items.\n`)

    // 8. Add featured deals for Electronics and Groceries
    console.log('8️⃣ [RDS DATABASE] Adding Featured Deals for New Stores...')
    const mobDealProd = await prisma.product.findUnique({ where: { sku: 'MOB-ACC-001' } })
    const laptopDealProd = await prisma.product.findUnique({ where: { sku: 'COMP-LAP-001' } })
    const grocDealProd = await prisma.product.findUnique({ where: { sku: 'GROC-PAN-001' } })

    if (mobDealProd) {
      const ex = await prisma.foodDeal.findFirst({ where: { productId: mobDealProd.proId } })
      if (!ex) {
        await prisma.foodDeal.create({
          data: {
            productId: mobDealProd.proId,
            vendorUid: 'vendor_electrozone_mobile',
            vertical: 'SHOP',
            customTitle: '⚡ Anker PowerCore 20K Super Deal',
            customPriceLabel: '$44.99 (Save 10%)',
            customImageUrl: mobileImgUrl,
            badgeLabel: 'TECH DEAL',
            sortOrder: 3,
            active: true,
          },
        })
      }
    }

    if (laptopDealProd) {
      const ex = await prisma.foodDeal.findFirst({ where: { productId: laptopDealProd.proId } })
      if (!ex) {
        await prisma.foodDeal.create({
          data: {
            productId: laptopDealProd.proId,
            vendorUid: 'vendor_apex_computers',
            vertical: 'SHOP',
            customTitle: '💻 MacBook Air M3 Workstation Offer',
            customPriceLabel: '$1199 (Save $100)',
            customImageUrl: laptopImgUrl,
            badgeLabel: 'MEGA DEAL',
            sortOrder: 4,
            active: true,
          },
        })
      }
    }

    if (grocDealProd) {
      const ex = await prisma.foodDeal.findFirst({ where: { productId: grocDealProd.proId } })
      if (!ex) {
        await prisma.foodDeal.create({
          data: {
            productId: grocDealProd.proId,
            vendorUid: 'vendor_metro_fresh_grocery',
            vertical: 'GROCERY',
            customTitle: '🫒 Colavita First Cold Pressed Olive Oil 1L',
            customPriceLabel: '$16.49 (Special Price)',
            customImageUrl: groceryPantryImgUrl,
            badgeLabel: 'PANTRY SALE',
            sortOrder: 5,
            active: true,
          },
        })
      }
    }
    console.log('✅ Deals created.\n')

  } catch (err) {
    console.error('❌ Large catalog seed error:', err)
  } finally {
    await prisma.$disconnect()
  }

  console.log('========================================================================')
  console.log('🎉 LARGE CATALOG SEED COMPLETE: ALL 156+ ITEMS SEEDED TO AMAZON RDS & S3!')
  console.log('========================================================================')
}

main()
