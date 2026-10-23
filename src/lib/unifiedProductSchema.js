/**
 * Unified Single-Product Data Definition & Schema Template
 * Combines standard retail catalog attributes (Vital Info, Pricing, Discoverability, Images, Variations, Shipping)
 * with restaurant/food-specific attributes (Ingredients, Allergens, Modifiers, Dietary Info).
 */

export const UNIFIED_PRODUCT_PHASES = {
  PHASE_1: {
    id: 'phase_1',
    title: 'Phase 1: Core Identifiers & Taxonomy (Vital Info)',
    description: 'Fundamental product and menu item identification, branding, and taxonomy classification.',
    fields: [
      { key: 'item_sku', label: 'Item SKU', type: 'string', required: true, example: 'QD-BURGER-001', help: 'Unique internal stock-keeping unit identifier for the product/dish.' },
      { key: 'product_name', altKey: 'item_name', label: 'Product Name / Item Name', type: 'string', required: true, example: 'Truffle Angus Gourmet Burger', help: 'The title of the product or menu dish.' },
      { key: 'brand_name', label: 'Brand Name', type: 'string', required: false, example: 'Burger Lab House Specials', help: 'Registered brand name or restaurant name for house-prepared items.' },
      { key: 'manufacturer', label: 'Manufacturer / Producer', type: 'string', required: false, example: 'Burger Lab Artisanal Kitchen', help: 'Maker or culinary producer of the item.' },
      { key: 'product_id', label: 'Product ID (Barcode)', type: 'string', required: false, example: '896400012345', help: 'Barcode value (UPC, EAN, ISBN, JAN) or blank for custom menu items.' },
      { key: 'product_id_type', label: 'Product ID Type', type: 'enum', options: ['UPC', 'EAN', 'GTIN', 'ASIN', 'ISBN', 'NONE'], default: 'NONE', help: 'Type of identifier.' },
      { key: 'product_type', altKey: 'product_subtype', label: 'Product Type / Subtype', type: 'string', required: false, example: 'Restaurant Items / Gourmet Burgers', help: 'Amazon taxonomy classification.' },
      { key: 'menu_section_name', label: 'Menu Section Name', type: 'string', required: false, example: 'Chef Signature Entrees', help: 'Food/Restaurant category grouping (e.g. Appetizers, Entrees, Beverages).' },
    ],
  },

  PHASE_2: {
    id: 'phase_2',
    title: 'Phase 2: Pricing, Availability & Offer Data',
    description: 'Commercial pricing, currency, stock status, promotions, order limits, and tax classifications.',
    fields: [
      { key: 'price', label: 'Standard Price', type: 'number', required: true, example: 1250, help: 'Regular baseline selling price.' },
      { key: 'currency', label: 'Currency', type: 'string', default: 'PKR', example: 'PKR', help: 'Currency format (USD, PKR, EUR, etc.).' },
      { key: 'quantity', altKey: 'inventory_status', label: 'Quantity / Inventory Status', type: 'number', default: 50, example: 50, help: 'Number of stock units available or status (active vs. 86\'d).' },
      { key: 'condition_type', label: 'Condition Type', type: 'enum', options: ['New', 'Prepared Fresh', 'Refurbished', 'Used'], default: 'Prepared Fresh', help: 'Physical state of the merchandise.' },
      { key: 'fulfillment_channel', label: 'Fulfillment Channel', type: 'enum', options: ['DEFAULT', 'MERCHANT_DELIVERY', 'EXPRESS_COURIER', 'AMAZON_NA'], default: 'DEFAULT', help: 'Shipping/dispatch method.' },
      { key: 'sale_price', label: 'Sale Price', type: 'number', required: false, example: 1099, help: 'Promotional discount pricing.' },
      { key: 'sale_from_date', label: 'Sale From Date', type: 'date', required: false, example: '2026-10-01', help: 'Active start timeframe for promotional price.' },
      { key: 'sale_end_date', label: 'Sale End Date', type: 'date', required: false, example: '2026-10-31', help: 'Active end timeframe for promotional price.' },
      { key: 'max_order_quantity', label: 'Max Order Quantity', type: 'number', default: 10, example: 10, help: 'Limit per customer order transaction.' },
      { key: 'tax_code', label: 'Tax Code', type: 'string', default: 'FOOD_PREP_STD', example: 'FOOD_PREP_STD', help: 'Tax classification code (differentiating retail goods vs prepared food).' },
    ],
  },

  PHASE_3: {
    id: 'phase_3',
    title: 'Phase 3: Discoverability, Content & Descriptions',
    description: 'Scannable bullet points, comprehensive narrative copy, search metadata keywords, and demographic targets.',
    fields: [
      { key: 'bullet_point1', label: 'Bullet Point 1', type: 'string', example: '100% Grass-fed Prime Angus Beef Patty grilled over lava stones', help: 'Scannable feature highlight or core ingredient summary.' },
      { key: 'bullet_point2', label: 'Bullet Point 2', type: 'string', example: 'Layered with aged English cheddar, caramelized shallots, and black truffle mayo', help: 'Scannable feature highlight 2.' },
      { key: 'bullet_point3', label: 'Bullet Point 3', type: 'string', example: 'Toasted brioche bun baked fresh daily in-house', help: 'Scannable feature highlight 3.' },
      { key: 'bullet_point4', label: 'Bullet Point 4', type: 'string', example: 'Served with crispy skin-on garlic parmesan rosemary fries', help: 'Scannable feature highlight 4.' },
      { key: 'bullet_point5', label: 'Bullet Point 5', type: 'string', example: 'Tamper-evident thermal-insulated packaging preserving heat for 45 minutes', help: 'Scannable feature highlight 5.' },
      { key: 'product_description', label: 'Product Description', type: 'text', required: true, example: 'Our signature Truffle Angus Gourmet Burger is crafted for the discerning palate...', help: 'Narrative detailing product features, use cases, or preparation style.' },
      { key: 'generic_keywords', label: 'Generic Keywords (Search Terms)', type: 'string', example: 'gourmet burger, angus beef, truffle burger, dinner, artisan food', help: 'Backend metadata search tokens (up to 200 bytes).' },
      { key: 'target_audience', label: 'Target Audience', type: 'string', example: 'Unisex-Adult, Foodies, Gourmet Diners', help: 'Demographic identifiers.' },
    ],
  },

  PHASE_4: {
    id: 'phase_4',
    title: 'Phase 4: Food, Dietary & Safety Compliance',
    description: 'Ingredient lists, allergen warnings, dietary certifications, shelf life expiration, and safety handling.',
    fields: [
      { key: 'ingredients', label: 'Ingredients', type: 'text', example: 'Angus Beef (65%), Brioche Flour (Wheat, Butter, Eggs), English Cheddar (Milk, Salt, Cultures), Black Truffle Oil, Mayonnaise, Shallots, Rosemary.', help: 'Complete component listing ordered by weight.' },
      { key: 'allergen_information', label: 'Allergen Information', type: 'string', example: 'Contains: Milk, Wheat, Eggs. May contain traces of Sesame and Soy.', help: 'Major allergen declarations.' },
      { key: 'diet_type', label: 'Diet Type', type: 'string', example: 'Halal Certified, High Protein', help: 'Special classifications (e.g. Gluten-Free, Vegan, Vegetarian, Halal, Kosher).' },
      { key: 'is_expiration_dated_product', label: 'Expiration Dated Product', type: 'boolean', default: true, example: true, help: 'Indicator for items with a short shelf life or fresh consumption window.' },
      { key: 'unit_count', label: 'Unit Count', type: 'number', default: 1, example: 1, help: 'Serving sizes or item units.' },
      { key: 'unit_count_type', label: 'Unit Count Type', type: 'string', default: 'serving', example: 'serving', help: 'Unit metrics (serving, gram, oz, pack).' },
      { key: 'hazmat_type', label: 'Hazmat / Safety Info', type: 'string', default: 'Not Applicable - Perishable Food', example: 'Not Applicable - Perishable Food', help: 'Chemical, battery, or food safety storage instructions.' },
    ],
  },

  PHASE_5: {
    id: 'phase_5',
    title: 'Phase 5: Modifiers, Options & Variations (Customizations)',
    description: 'Variant hierarchy (Parent/Child), variation themes (Size, Color), and restaurant add-ons/customization groups.',
    fields: [
      { key: 'parent_child', label: 'Parent / Child', type: 'enum', options: ['Standalone', 'Parent', 'Child'], default: 'Standalone', help: 'Designates row as Parent, Child, or standalone.' },
      { key: 'parent_sku', label: 'Parent SKU', type: 'string', required: false, example: '', help: 'SKU linkage for variant items.' },
      { key: 'variation_theme', label: 'Variation Theme', type: 'string', required: false, example: 'Size / Combos', help: 'Split attribute (e.g. Size, Color, Flavor, Portion).' },
      { key: 'modifier_group_name', label: 'Modifier Group Name', type: 'string', required: false, example: 'Extra Toppings & Sauces', help: 'Customization group title (e.g. Choose Protein, Add-ons).' },
      { key: 'modifier_item_name', label: 'Modifier Item Name', type: 'string', required: false, example: 'Melted Truffle Cheese, Extra Beef Patty, Fried Egg', help: 'Specific modifier options.' },
      { key: 'modifier_price_delta', label: 'Modifier Price Delta', type: 'number', default: 150, example: 150, help: 'Price adjustment associated with the modifier.' },
      { key: 'min_selections', label: 'Min Selections', type: 'number', default: 0, example: 0, help: 'Minimum required selections.' },
      { key: 'max_selections', label: 'Max Selections', type: 'number', default: 4, example: 4, help: 'Maximum allowable selections.' },
    ],
  },

  PHASE_6: {
    id: 'phase_6',
    title: 'Phase 6: Image Media Assets',
    description: 'High-resolution primary showcase and secondary angles, packaging, or styled culinary shots.',
    fields: [
      { key: 'main_image_url', label: 'Main Image URL', type: 'url', required: true, example: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', help: 'Primary high-resolution photo.' },
      { key: 'other_image_url1', label: 'Other Image 1', type: 'url', required: false, example: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80', help: 'Secondary angle shot 1.' },
      { key: 'other_image_url2', label: 'Other Image 2', type: 'url', required: false, example: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80', help: 'Secondary angle shot 2.' },
      { key: 'other_image_url3', label: 'Other Image 3', type: 'url', required: false, help: 'Secondary angle shot 3.' },
      { key: 'other_image_url4', label: 'Other Image 4', type: 'url', required: false, help: 'Secondary angle shot 4.' },
      { key: 'other_image_url5', label: 'Other Image 5', type: 'url', required: false, help: 'Secondary angle shot 5.' },
      { key: 'other_image_url6', label: 'Other Image 6', type: 'url', required: false, help: 'Secondary angle shot 6.' },
      { key: 'other_image_url7', label: 'Other Image 7', type: 'url', required: false, help: 'Secondary angle shot 7.' },
      { key: 'other_image_url8', label: 'Other Image 8', type: 'url', required: false, help: 'Secondary angle shot 8.' },
    ],
  },

  PHASE_7: {
    id: 'phase_7',
    title: 'Phase 7: Dimensions, Weight & Shipping',
    description: 'Item physical metrics, packed shipping weight, and package dimensional measurements.',
    fields: [
      { key: 'item_weight', label: 'Item Weight', type: 'number', default: 450, example: 450, help: 'Net weight of the item.' },
      { key: 'item_weight_unit', label: 'Item Weight Unit', type: 'enum', options: ['grams', 'kg', 'oz', 'lbs'], default: 'grams', help: 'Weight unit.' },
      { key: 'shipping_weight', label: 'Shipping Weight', type: 'number', default: 550, example: 550, help: 'Total shipping package weight.' },
      { key: 'shipping_weight_unit', label: 'Shipping Weight Unit', type: 'enum', options: ['grams', 'kg', 'oz', 'lbs'], default: 'grams', help: 'Shipping weight unit.' },
      { key: 'item_length', label: 'Item Length', type: 'number', default: 15, example: 15, help: 'Package length.' },
      { key: 'item_width', label: 'Item Width', type: 'number', default: 15, example: 15, help: 'Package width.' },
      { key: 'item_height', label: 'Item Height', type: 'number', default: 12, example: 12, help: 'Package height.' },
      { key: 'dimensional_unit', label: 'Dimensional Unit', type: 'enum', options: ['cm', 'inches', 'mm'], default: 'cm', help: 'Unit for dimensions.' },
    ],
  },
}

/**
 * Ordered list of all column keys for flat file CSV / XML exports
 */
export const UNIFIED_CSV_COLUMNS = [
  // Phase 1: Vital Info
  'item_sku',
  'product_name',
  'brand_name',
  'manufacturer',
  'product_id',
  'product_id_type',
  'product_type',
  'menu_section_name',

  // Phase 2: Pricing & Offer
  'price',
  'currency',
  'quantity',
  'condition_type',
  'fulfillment_channel',
  'sale_price',
  'sale_from_date',
  'sale_end_date',
  'max_order_quantity',
  'tax_code',

  // Phase 3: Discoverability & Description
  'bullet_point1',
  'bullet_point2',
  'bullet_point3',
  'bullet_point4',
  'bullet_point5',
  'product_description',
  'generic_keywords',
  'target_audience',

  // Phase 4: Food, Dietary & Safety
  'ingredients',
  'allergen_information',
  'diet_type',
  'is_expiration_dated_product',
  'unit_count',
  'unit_count_type',
  'hazmat_type',

  // Phase 5: Modifiers & Variations
  'parent_child',
  'parent_sku',
  'variation_theme',
  'modifier_group_name',
  'modifier_item_name',
  'modifier_price_delta',
  'min_selections',
  'max_selections',

  // Phase 6: Images
  'main_image_url',
  'other_image_url1',
  'other_image_url2',
  'other_image_url3',
  'other_image_url4',
  'other_image_url5',
  'other_image_url6',
  'other_image_url7',
  'other_image_url8',

  // Phase 7: Dimensions & Shipping
  'item_weight',
  'item_weight_unit',
  'shipping_weight',
  'shipping_weight_unit',
  'item_length',
  'item_width',
  'item_height',
  'dimensional_unit',
]

/**
 * Normalizes a database product model into the standard 7-Phase Unified Product Schema
 */
export function normalizeProductToUnified(product) {
  if (!product) return null

  // Extract images
  let images = []
  if (Array.isArray(product.proImages)) {
    images = product.proImages
  } else if (typeof product.proImages === 'string') {
    try {
      const parsed = JSON.parse(product.proImages)
      images = Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      images = product.proImages.split(/[\s,]+/).filter(Boolean)
    }
  }

  // Extract bullet points / key features
  let bullets = []
  if (Array.isArray(product.keyFeatures)) {
    bullets = product.keyFeatures
  } else if (typeof product.keyFeatures === 'string') {
    try {
      const parsed = JSON.parse(product.keyFeatures)
      bullets = Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      bullets = product.keyFeatures.split(/\n+/).filter(Boolean)
    }
  }

  // Extract variations / modifiers
  let rawVariations = null
  if (product.variations) {
    if (typeof product.variations === 'object') {
      rawVariations = product.variations
    } else if (typeof product.variations === 'string') {
      try {
        rawVariations = JSON.parse(product.variations)
      } catch {}
    }
  }

  let modifierGroupName = ''
  let modifierItemName = ''
  let modifierPriceDelta = 0

  if (Array.isArray(rawVariations)) {
    modifierGroupName = 'Add-ons & Options'
    modifierItemName = rawVariations.map(a => `${a.name || a.label} (+Rs. ${a.price || 0})`).join('; ')
    modifierPriceDelta = rawVariations[0]?.price ? parseFloat(rawVariations[0].price) : 0
  }

  // Dimensions parser
  let itemLength = 15
  let itemWidth = 15
  let itemHeight = 12
  if (product.productDimensions) {
    const parts = product.productDimensions.match(/[\d.]+/g)
    if (parts && parts.length >= 3) {
      itemLength = parseFloat(parts[0]) || 15
      itemWidth = parseFloat(parts[1]) || 15
      itemHeight = parseFloat(parts[2]) || 12
    }
  }

  // Package weight parser
  let itemWeight = 450
  let itemWeightUnit = 'grams'
  if (product.packageWeight) {
    const num = parseFloat(product.packageWeight)
    if (!isNaN(num)) itemWeight = num
    if (product.packageWeight.toLowerCase().includes('kg')) itemWeightUnit = 'kg'
    else if (product.packageWeight.toLowerCase().includes('oz')) itemWeightUnit = 'oz'
    else if (product.packageWeight.toLowerCase().includes('lb')) itemWeightUnit = 'lbs'
  }

  const isFood = product.vertical === 'FOOD' || !!product.ingredients || !!product.prepTime

  return {
    // Phase 1
    item_sku: product.sku || `QD-${product.proId}`,
    product_name: product.proName || '',
    brand_name: product.brandName || product.vendor?.username || 'House Special',
    manufacturer: product.manufacturer || product.brandName || 'Store Producer',
    product_id: product.barcode || '',
    product_id_type: product.barcode ? 'UPC' : 'NONE',
    product_type: product.productType || (isFood ? 'Grocery & Gourmet Food / Restaurant Items' : 'Retail General Merchandise'),
    menu_section_name: product.category?.name || product.subCategory?.subCatName || 'Chef Specials',

    // Phase 2
    price: parseFloat(product.price || 0),
    currency: product.currency || 'PKR',
    quantity: parseInt(product.stock ?? product.qnty ?? 50),
    condition_type: product.conditionType || (isFood ? 'Prepared Fresh' : 'New'),
    fulfillment_channel: 'DEFAULT',
    sale_price: product.salePrice ? parseFloat(product.salePrice) : (parseFloat(product.discount || 0) > 0 ? parseFloat(product.price) * (1 - parseFloat(product.discount) / 100) : ''),
    sale_from_date: product.saleStartDate ? new Date(product.saleStartDate).toISOString().split('T')[0] : '',
    sale_end_date: product.saleEndDate ? new Date(product.saleEndDate).toISOString().split('T')[0] : '',
    max_order_quantity: 10,
    tax_code: isFood ? 'FOOD_PREP_STD' : 'RETAIL_GOODS_STD',

    // Phase 3
    bullet_point1: bullets[0] || (isFood ? 'Prepared fresh on order using premium ingredients' : 'Authentic brand guaranteed'),
    bullet_point2: bullets[1] || (isFood ? 'Tamper-evident sealed packaging maintaining temperature' : 'Durable build and verified performance'),
    bullet_point3: bullets[2] || (product.warranty || '7-Day return policy and buyer guarantee'),
    bullet_point4: bullets[3] || 'Express doorstep dispatch across local service radius',
    bullet_point5: bullets[4] || '100% Quality checked and verified by marketplace inspectors',
    product_description: product.description || '',
    generic_keywords: `${product.proName} ${product.category?.name || ''} ${product.brandName || ''}`.trim(),
    target_audience: 'Unisex-Adult, Family, General Consumers',

    // Phase 4
    ingredients: product.ingredients || (isFood ? 'Quality culinary spices, house recipe components, fresh produce.' : ''),
    allergen_information: isFood ? 'Prepared in a kitchen environment handling gluten, dairy, nuts, and sesame.' : 'None',
    diet_type: isFood ? 'Halal, Quality Assured' : '',
    is_expiration_dated_product: isFood,
    unit_count: 1,
    unit_count_type: isFood ? 'serving' : 'item',
    hazmat_type: 'Not Applicable',

    // Phase 5
    parent_child: 'Standalone',
    parent_sku: '',
    variation_theme: product.size ? 'Size' : (product.color ? 'Color' : ''),
    modifier_group_name: modifierGroupName,
    modifier_item_name: modifierItemName,
    modifier_price_delta: modifierPriceDelta,
    min_selections: 0,
    max_selections: 4,

    // Phase 6
    main_image_url: images[0] || '',
    other_image_url1: images[1] || '',
    other_image_url2: images[2] || '',
    other_image_url3: images[3] || '',
    other_image_url4: images[4] || '',
    other_image_url5: images[5] || '',
    other_image_url6: images[6] || '',
    other_image_url7: images[7] || '',
    other_image_url8: images[8] || '',

    // Phase 7
    item_weight: itemWeight,
    item_weight_unit: itemWeightUnit,
    shipping_weight: Math.round(itemWeight * 1.15),
    shipping_weight_unit: itemWeightUnit,
    item_length: itemLength,
    item_width: itemWidth,
    item_height: itemHeight,
    dimensional_unit: 'cm',
  }
}

/**
 * Maps a unified 7-Phase record into Prisma Database Product model data
 */
export function mapUnifiedToDatabase(unified) {
  if (!unified) return null

  // Collect images into array
  const proImages = [
    unified.main_image_url,
    unified.other_image_url1,
    unified.other_image_url2,
    unified.other_image_url3,
    unified.other_image_url4,
    unified.other_image_url5,
    unified.other_image_url6,
    unified.other_image_url7,
    unified.other_image_url8,
  ].filter(url => url && typeof url === 'string' && url.trim().startsWith('http'))

  // Collect bullet points into array
  const keyFeatures = [
    unified.bullet_point1,
    unified.bullet_point2,
    unified.bullet_point3,
    unified.bullet_point4,
    unified.bullet_point5,
  ].filter(b => b && typeof b === 'string' && b.trim())

  // Format dimensions
  const productDimensions = `${unified.item_length || 15}x${unified.item_width || 15}x${unified.item_height || 12} ${unified.dimensional_unit || 'cm'}`
  const packageWeight = `${unified.item_weight || 450} ${unified.item_weight_unit || 'grams'}`

  // Parse modifier items into structured add-ons if provided
  let variations = null
  if (unified.modifier_item_name) {
    const rawItems = unified.modifier_item_name.split(';').map(s => s.trim()).filter(Boolean)
    if (rawItems.length > 0) {
      variations = rawItems.map(item => {
        const match = item.match(/\(\+Rs\.?\s*(\d+)\)/i)
        const price = match ? parseFloat(match[1]) : (unified.modifier_price_delta || 0)
        const name = item.replace(/\(\+Rs\.?\s*\d+\)/i, '').trim()
        return { name, price }
      })
    }
  }

  return {
    sku: unified.item_sku || `QD-${Date.now().toString(36).toUpperCase()}`,
    proName: unified.product_name || unified.item_name || 'Untitled Item',
    description: unified.product_description || '',
    price: parseFloat(unified.price || 0),
    stock: parseInt(unified.quantity || 50),
    qnty: parseInt(unified.quantity || 50),
    barcode: unified.product_id || null,
    brandName: unified.brand_name || null,
    manufacturer: unified.manufacturer || null,
    productType: unified.product_type || null,
    conditionType: unified.condition_type || 'New',
    currency: unified.currency || 'PKR',
    ingredients: unified.ingredients || null,
    salePrice: unified.sale_price ? parseFloat(unified.sale_price) : null,
    saleStartDate: unified.sale_from_date ? new Date(unified.sale_from_date) : null,
    saleEndDate: unified.sale_end_date ? new Date(unified.sale_end_date) : null,
    proImages: proImages.length > 0 ? proImages : null,
    keyFeatures: keyFeatures.length > 0 ? keyFeatures : null,
    variations: variations,
    productDimensions,
    packageWeight,
    status: true,
  }
}

/**
 * Converts a list of unified product objects into a standard flat-file CSV string
 */
export function exportUnifiedToFlatCsv(products) {
  const unifiedList = Array.isArray(products)
    ? products.map(p => (p.item_sku ? p : normalizeProductToUnified(p))).filter(Boolean)
    : []

  const escapeCsv = (val) => {
    if (val === undefined || val === null) return '""'
    const str = String(val).replace(/"/g, '""')
    return `"${str}"`
  }

  const headerRow = UNIFIED_CSV_COLUMNS.map(escapeCsv).join(',')
  const dataRows = unifiedList.map(prod => {
    return UNIFIED_CSV_COLUMNS.map(col => escapeCsv(prod[col])).join(',')
  })

  return [headerRow, ...dataRows].join('\r\n')
}

/**
 * Converts a list of unified product objects into a standard XML feed
 */
export function exportUnifiedToXml(products) {
  const unifiedList = Array.isArray(products)
    ? products.map(p => (p.item_sku ? p : normalizeProductToUnified(p))).filter(Boolean)
    : []

  const escapeXml = (val) => {
    if (val === undefined || val === null) return ''
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  const itemsXml = unifiedList.map(p => `
    <item>
      <vital_info>
        <item_sku>${escapeXml(p.item_sku)}</item_sku>
        <product_name>${escapeXml(p.product_name)}</product_name>
        <brand_name>${escapeXml(p.brand_name)}</brand_name>
        <manufacturer>${escapeXml(p.manufacturer)}</manufacturer>
        <product_id>${escapeXml(p.product_id)}</product_id>
        <product_id_type>${escapeXml(p.product_id_type)}</product_id_type>
        <product_type>${escapeXml(p.product_type)}</product_type>
        <menu_section_name>${escapeXml(p.menu_section_name)}</menu_section_name>
      </vital_info>
      <offer_data>
        <price>${p.price || 0}</price>
        <currency>${escapeXml(p.currency)}</currency>
        <quantity>${p.quantity || 0}</quantity>
        <condition_type>${escapeXml(p.condition_type)}</condition_type>
        <fulfillment_channel>${escapeXml(p.fulfillment_channel)}</fulfillment_channel>
        <sale_price>${p.sale_price || ''}</sale_price>
        <sale_from_date>${escapeXml(p.sale_from_date)}</sale_from_date>
        <sale_end_date>${escapeXml(p.sale_end_date)}</sale_end_date>
        <max_order_quantity>${p.max_order_quantity || 10}</max_order_quantity>
        <tax_code>${escapeXml(p.tax_code)}</tax_code>
      </offer_data>
      <discoverability>
        <bullet_points>
          <bullet_point>${escapeXml(p.bullet_point1)}</bullet_point>
          <bullet_point>${escapeXml(p.bullet_point2)}</bullet_point>
          <bullet_point>${escapeXml(p.bullet_point3)}</bullet_point>
          <bullet_point>${escapeXml(p.bullet_point4)}</bullet_point>
          <bullet_point>${escapeXml(p.bullet_point5)}</bullet_point>
        </bullet_points>
        <product_description>${escapeXml(p.product_description)}</product_description>
        <generic_keywords>${escapeXml(p.generic_keywords)}</generic_keywords>
        <target_audience>${escapeXml(p.target_audience)}</target_audience>
      </discoverability>
      <compliance_dietary>
        <ingredients>${escapeXml(p.ingredients)}</ingredients>
        <allergen_information>${escapeXml(p.allergen_information)}</allergen_information>
        <diet_type>${escapeXml(p.diet_type)}</diet_type>
        <is_expiration_dated_product>${p.is_expiration_dated_product}</is_expiration_dated_product>
        <unit_count>${p.unit_count || 1}</unit_count>
        <unit_count_type>${escapeXml(p.unit_count_type)}</unit_count_type>
        <hazmat_type>${escapeXml(p.hazmat_type)}</hazmat_type>
      </compliance_dietary>
      <customizations>
        <parent_child>${escapeXml(p.parent_child)}</parent_child>
        <parent_sku>${escapeXml(p.parent_sku)}</parent_sku>
        <variation_theme>${escapeXml(p.variation_theme)}</variation_theme>
        <modifier_group_name>${escapeXml(p.modifier_group_name)}</modifier_group_name>
        <modifier_item_name>${escapeXml(p.modifier_item_name)}</modifier_item_name>
        <modifier_price_delta>${p.modifier_price_delta || 0}</modifier_price_delta>
        <min_selections>${p.min_selections || 0}</min_selections>
        <max_selections>${p.max_selections || 4}</max_selections>
      </customizations>
      <image_assets>
        <main_image_url>${escapeXml(p.main_image_url)}</main_image_url>
        <other_image_url1>${escapeXml(p.other_image_url1)}</other_image_url1>
        <other_image_url2>${escapeXml(p.other_image_url2)}</other_image_url2>
        <other_image_url3>${escapeXml(p.other_image_url3)}</other_image_url3>
        <other_image_url4>${escapeXml(p.other_image_url4)}</other_image_url4>
        <other_image_url5>${escapeXml(p.other_image_url5)}</other_image_url5>
        <other_image_url6>${escapeXml(p.other_image_url6)}</other_image_url6>
        <other_image_url7>${escapeXml(p.other_image_url7)}</other_image_url7>
        <other_image_url8>${escapeXml(p.other_image_url8)}</other_image_url8>
      </image_assets>
      <dimensions_shipping>
        <item_weight>${p.item_weight || 0}</item_weight>
        <item_weight_unit>${escapeXml(p.item_weight_unit)}</item_weight_unit>
        <shipping_weight>${p.shipping_weight || 0}</shipping_weight>
        <shipping_weight_unit>${escapeXml(p.shipping_weight_unit)}</shipping_weight_unit>
        <item_length>${p.item_length || 0}</item_length>
        <item_width>${p.item_width || 0}</item_width>
        <item_height>${p.item_height || 0}</item_height>
        <dimensional_unit>${escapeXml(p.dimensional_unit)}</dimensional_unit>
      </dimensions_shipping>
    </item>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<catalog xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" generated="${new Date().toISOString()}">
  <channel>QuickDelivery Unified Catalog Feed</channel>
  <total_items>${unifiedList.length}</total_items>
  <items>${itemsXml}
  </items>
</catalog>`
}

/**
 * Parses flat file CSV lines into unified product objects
 */
export function parseFlatCsvToUnified(csvString) {
  if (!csvString || typeof csvString !== 'string') return []

  const lines = []
  let currentRow = []
  let currentField = ''
  let insideQuotes = false

  // Character by character CSV lexer supporting multiline fields and escaped quotes
  for (let i = 0; i < csvString.length; i++) {
    const char = csvString[i]
    const nextChar = csvString[i + 1]

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"'
        i++ // Skip escaped quote
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim())
      currentField = ''
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++ // Skip CRLF
      currentRow.push(currentField.trim())
      if (currentRow.some(col => col.length > 0)) {
        lines.push(currentRow)
      }
      currentRow = []
      currentField = ''
    } else {
      currentField += char
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    if (currentRow.some(col => col.length > 0)) {
      lines.push(currentRow)
    }
  }

  if (lines.length < 2) return []

  const headerRow = lines[0].map(h => h.toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, ''))
  const results = []

  for (let r = 1; r < lines.length; r++) {
    const row = lines[r]
    const item = {}
    for (let c = 0; c < headerRow.length; c++) {
      const colName = headerRow[c]
      item[colName] = row[c] !== undefined ? row[c] : ''
    }

    if (item.item_sku || item.product_name || item.item_name) {
      results.push(item)
    }
  }

  return results
}

/**
 * Generates sample unified products (1 food dish and 1 retail merchandise item)
 */
export function getSampleUnifiedProducts() {
  return [
    {
      item_sku: 'QD-BURGER-ANGUS-01',
      product_name: 'Gourmet Truffle Angus Beef Burger',
      brand_name: 'Burger Lab Artisanal',
      manufacturer: 'Burger Lab Central Kitchen',
      product_id: '896400010011',
      product_id_type: 'UPC',
      product_type: 'Grocery & Gourmet Food / Restaurant Items',
      menu_section_name: 'Chef Signature Entrees',
      price: 1350,
      currency: 'PKR',
      quantity: 45,
      condition_type: 'Prepared Fresh',
      fulfillment_channel: 'DEFAULT',
      sale_price: 1199,
      sale_from_date: '2026-10-01',
      sale_end_date: '2026-11-30',
      max_order_quantity: 6,
      tax_code: 'FOOD_PREP_STD',
      bullet_point1: '100% Grass-fed Prime Angus Beef Patty grilled over lava coals',
      bullet_point2: 'Layered with aged English cheddar, caramelized shallots, and black truffle mayo',
      bullet_point3: 'Toasted brioche bun baked fresh daily in-house',
      bullet_point4: 'Includes crispy skin-on rosemary garlic fries',
      bullet_point5: 'Thermal insulated tamper-evident delivery packaging keeping fresh for 45 mins',
      product_description: 'An indulgent, multi-award-winning artisanal burger crafted with prime Angus beef, house-made truffle reduction, and golden English cheddar on a buttery brioche.',
      generic_keywords: 'burger, angus beef, gourmet dinner, fast food, halal burger',
      target_audience: 'Unisex-Adult, Foodies, Gourmet Diners',
      ingredients: 'Angus Beef (65%), Wheat Brioche Flour, English Cheddar (Milk, Salt, Cultures), Black Truffle Oil, Mayonnaise, Shallots, Rosemary.',
      allergen_information: 'Contains: Milk, Wheat, Eggs. May contain traces of Sesame.',
      diet_type: 'Halal Certified, High Protein',
      is_expiration_dated_product: true,
      unit_count: 1,
      unit_count_type: 'serving',
      hazmat_type: 'Not Applicable - Perishable Food',
      parent_child: 'Standalone',
      parent_sku: '',
      variation_theme: 'Portion / Meal Combo',
      modifier_group_name: 'Add-ons & Sides',
      modifier_item_name: 'Melted Truffle Cheese (+Rs. 150); Extra Angus Patty (+Rs. 450); Garlic Aioli Dip (+Rs. 80)',
      modifier_price_delta: 150,
      min_selections: 0,
      max_selections: 3,
      main_image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
      other_image_url1: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80',
      other_image_url2: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
      other_image_url3: '',
      other_image_url4: '',
      other_image_url5: '',
      other_image_url6: '',
      other_image_url7: '',
      other_image_url8: '',
      item_weight: 480,
      item_weight_unit: 'grams',
      shipping_weight: 600,
      shipping_weight_unit: 'grams',
      item_length: 18,
      item_width: 18,
      item_height: 14,
      dimensional_unit: 'cm',
    },
    {
      item_sku: 'QD-TECH-HEADPHONE-PRO',
      product_name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
      brand_name: 'Sony',
      manufacturer: 'Sony Corporation',
      product_id: '027242923508',
      product_id_type: 'UPC',
      product_type: 'Consumer Electronics / Audio',
      menu_section_name: 'Personal Audio & Gadgets',
      price: 89900,
      currency: 'PKR',
      quantity: 15,
      condition_type: 'New',
      fulfillment_channel: 'EXPRESS_COURIER',
      sale_price: 84900,
      sale_from_date: '2026-10-15',
      sale_end_date: '2026-11-15',
      max_order_quantity: 2,
      tax_code: 'RETAIL_GOODS_STD',
      bullet_point1: 'Industry-leading noise cancellation with 8 microphones and Auto NC Optimizer',
      bullet_point2: 'Magnificent sound engineered with the Integrated Processor V1',
      bullet_point3: 'Up to 30-hour battery life with quick charging (3 min charge for 3 hours of playback)',
      bullet_point4: 'Ultra-comfortable lightweight design with soft fit leather',
      bullet_point5: 'Multipoint connection allows you to quickly switch between two devices',
      product_description: 'The WH-1000XM5 headphones rewrite the rules for distraction-free listening. Two processors control 8 microphones for unprecedented noise cancellation and exceptional call quality.',
      generic_keywords: 'noise cancelling, wireless headphones, bluetooth audio, sony xm5, over ear',
      target_audience: 'Audiophiles, Professionals, Travelers, Students',
      ingredients: 'Not Applicable (Electronic Hardware)',
      allergen_information: 'Not Applicable',
      diet_type: 'Not Applicable',
      is_expiration_dated_product: false,
      unit_count: 1,
      unit_count_type: 'item',
      hazmat_type: 'Lithium Ion Battery - Contained in Equipment',
      parent_child: 'Parent',
      parent_sku: '',
      variation_theme: 'Color',
      modifier_group_name: 'Accessories & Protection',
      modifier_item_name: 'Hard Travel Case (+Rs. 2500); Premium Audio Cable (+Rs. 1200)',
      modifier_price_delta: 2500,
      min_selections: 0,
      max_selections: 2,
      main_image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      other_image_url1: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80',
      other_image_url2: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
      other_image_url3: '',
      other_image_url4: '',
      other_image_url5: '',
      other_image_url6: '',
      other_image_url7: '',
      other_image_url8: '',
      item_weight: 250,
      item_weight_unit: 'grams',
      shipping_weight: 750,
      shipping_weight_unit: 'grams',
      item_length: 22,
      item_width: 20,
      item_height: 8,
      dimensional_unit: 'cm',
    },
  ]
}
