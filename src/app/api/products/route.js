import { prisma } from '@/lib/prisma'
import { getAuthUser, requireRole, ADMIN_ROLES } from '@/lib/auth-server'
import { broadcastRealtimeEvent } from '@/lib/realtime'

// Catalog taxonomy types that only admins may create/update/delete.
const ADMIN_ONLY_TYPES = ['category', 'subcategory', 'productcategory']

let productsCache = null
let productsCacheTime = 0

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const categoryId = searchParams.get('categoryId')
    const vendorId = searchParams.get('vendorId')
    const vertical = searchParams.get('vertical') // 'FOOD' or 'GROCERY'

    let whereClause = {}
    if (vertical) {
      whereClause.vertical = vertical
    }

    if (type === 'vendors') {
      const vendorWhere = {
        verificationStatus: 'APPROVED'
      }
      if (vertical) {
        vendorWhere.vertical = vertical
      }

      const businesses = await prisma.business.findMany({
        where: vendorWhere,
        include: {
          category: true,
        },
      })

      // Fetch corresponding vendor users to get their uid
      const emails = businesses.map(b => b.email)
      const users = await prisma.users.findMany({
        where: {
          email: { in: emails },
          role: 'VENDOR'
        },
        select: {
          uid: true,
          email: true,
          username: true
        }
      })

      const userMap = {}
      users.forEach(u => {
        userMap[u.email.toLowerCase()] = u
      })

      const data = businesses.map(b => {
        const u = userMap[b.email.toLowerCase()]
        return {
          ...b,
          uid: u?.uid || null,
          username: u?.username || b.firstName + ' ' + b.lastName
        }
      })

      return Response.json({
        success: true,
        data
      })
    }

    if (type === 'categories') {
      const catWhere = {}
      if (vertical) {
        catWhere.vertical = vertical
      }

      const categories = await prisma.category.findMany({
        where: catWhere,
        include: {
          subCategories: true,
          _count: {
            select: { products: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return Response.json({
        success: true,
        data: categories
      })
    }

    if (type === 'subcategories') {
      if (categoryId) {
        whereClause.catId = parseInt(categoryId) || categoryId
      }
      const productCategoryId = searchParams.get('productCategoryId')
      if (productCategoryId) {
        whereClause.productCategoryId = parseInt(productCategoryId) || productCategoryId
      }

      const subcategories = await prisma.subCategory.findMany({
        where: whereClause,
        include: {
          category: true,
          productCategory: true,
          _count: {
            select: { products: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return Response.json({
        success: true,
        data: subcategories
      })
    }

    if (type === 'productcategories') {
      const productCategories = await prisma.productCategory.findMany({
        include: {
          category: true,
          _count: {
            select: { products: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return Response.json({
        success: true,
        data: productCategories
      })
    }

    if (type === 'suggestions') {
      const q = (searchParams.get('q') || '').trim()
      if (!q) {
        return Response.json({
          success: true,
          data: { products: [], categories: [], vendors: [] }
        })
      }

      const [matchedProducts, matchedCategories, matchedVendors] = await Promise.all([
        prisma.product.findMany({
          where: {
            OR: [
              { proName: { contains: q } },
              { description: { contains: q } }
            ]
          },
          include: {
            category: { select: { id: true, name: true, code: true } },
            vendor: { select: { uid: true, username: true } },
          },
          take: 6,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.category.findMany({
          where: {
            OR: [
              { name: { contains: q } },
              { description: { contains: q } }
            ]
          },
          select: { id: true, name: true, code: true, image: true, vertical: true },
          take: 4
        }),
        prisma.business.findMany({
          where: {
            businessName: { contains: q },
            verificationStatus: 'APPROVED'
          },
          select: { id: true, businessName: true, urlLogo: true, email: true },
          take: 3
        })
      ])

      const safeJson = (val, fallback = []) => {
        if (!val) return fallback
        if (Array.isArray(val)) return val
        if (typeof val === 'string') {
          const trimmed = val.trim()
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try { return JSON.parse(trimmed) } catch {}
          }
          if (trimmed.includes('http') && trimmed.includes(' ')) {
            return trimmed.split(/\s+/).filter(Boolean)
          }
          return [trimmed]
        }
        return [val]
      }

      const normalizeUrl = (url) => {
        if (!url || typeof url !== 'string') return ''
        if (url.includes('rapidtechpro.s3') || (url.includes('s3.') && url.includes('rapidtechpro'))) {
          try {
            const u = new URL(url)
            let p = u.pathname.replace(/^\/+/, '')
            if (p.startsWith('rapidtechpro/')) p = p.substring('rapidtechpro/'.length)
            return `https://d1nvnelpyr43e7.cloudfront.net/${p}`
          } catch {
            return url.replace(/https:\/\/[^/]*s3[^/]*\/rapidtechpro\//, 'https://d1nvnelpyr43e7.cloudfront.net/')
                      .replace(/https:\/\/rapidtechpro\.s3[^/]*\//, 'https://d1nvnelpyr43e7.cloudfront.net/')
          }
        }
        return url
      }

      const processedProducts = matchedProducts.map(p => ({
        ...p,
        proImages: safeJson(p.proImages, []).map(normalizeUrl)
      }))

      return Response.json({
        success: true,
        data: {
          products: processedProducts,
          categories: matchedCategories,
          vendors: matchedVendors
        }
      })
    }

    if (type === 'search') {
      const q = (searchParams.get('q') || '').trim()
      const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')) : null
      const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')) : null
      const brands = searchParams.get('brands') ? searchParams.get('brands').split(',').map(b => b.trim()).filter(Boolean) : []
      const colors = searchParams.get('colors') ? searchParams.get('colors').split(',').map(c => c.trim()).filter(Boolean) : []
      const inStock = searchParams.get('inStock') === 'true' || searchParams.get('inStock') === '1'
      const catId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')) : null
      const subCatId = searchParams.get('subCatId') ? parseInt(searchParams.get('subCatId')) : null
      const sortBy = searchParams.get('sortBy') || 'relevance'
      const limit = parseInt(searchParams.get('limit')) || 40

      const searchWhere = { status: true }

      if (q) {
        searchWhere.OR = [
          { proName: { contains: q } },
          { description: { contains: q } },
          { brandName: { contains: q } },
          { color: { contains: q } },
        ]
      }

      if (inStock) {
        searchWhere.stock = { gt: 0 }
      }

      if (catId) {
        searchWhere.catId = catId
      }

      if (subCatId) {
        searchWhere.subCatId = subCatId
      }

      if (brands.length > 0) {
        searchWhere.brandName = { in: brands }
      }

      if (colors.length > 0) {
        searchWhere.color = { in: colors }
      }

      let orderBy = { createdAt: 'desc' }
      if (sortBy === 'price_asc') {
        orderBy = { price: 'asc' }
      } else if (sortBy === 'price_desc') {
        orderBy = { price: 'desc' }
      }

      const rawProducts = await prisma.product.findMany({
        where: searchWhere,
        include: {
          category: { select: { id: true, name: true, code: true, vertical: true } },
          subCategory: { select: { subCatId: true, subCatName: true, subCatCode: true } },
          vendor: { select: { uid: true, username: true } },
        },
        take: limit,
        orderBy,
      })

      const safeJson = (val, fallback = []) => {
        if (!val) return fallback
        if (Array.isArray(val)) return val
        if (typeof val === 'string') {
          const trimmed = val.trim()
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try { return JSON.parse(trimmed) } catch {}
          }
          if (trimmed.includes('http') && trimmed.includes(' ')) {
            return trimmed.split(/\s+/).filter(Boolean)
          }
          return [trimmed]
        }
        return [val]
      }

      // Filter by min/max price if specified (handles salePrice fallback)
      let filtered = rawProducts
      if (minPrice !== null || maxPrice !== null) {
        filtered = filtered.filter(p => {
          const effPrice = parseFloat(p.salePrice || p.price || 0)
          if (minPrice !== null && effPrice < minPrice) return false
          if (maxPrice !== null && effPrice > maxPrice) return false
          return true
        })
      }

      // Compute facets from results
      const brandMap = {}
      const colorMap = {}
      const categoryMap = {}
      let minP = Infinity
      let maxP = 0
      let inStockTotal = 0

      filtered.forEach(p => {
        const effPrice = parseFloat(p.salePrice || p.price || 0)
        if (effPrice < minP) minP = effPrice
        if (effPrice > maxP) maxP = effPrice
        if (p.stock > 0) inStockTotal++

        if (p.brandName) {
          brandMap[p.brandName] = (brandMap[p.brandName] || 0) + 1
        }
        if (p.color) {
          colorMap[p.color] = (colorMap[p.color] || 0) + 1
        }
        if (p.category?.name) {
          categoryMap[p.category.name] = (categoryMap[p.category.name] || 0) + 1
        }
      })

      const processedProducts = filtered.map(p => ({
        ...p,
        proImages: safeJson(p.proImages, []).map(normalizeUrl)
      }))

      return Response.json({
        success: true,
        data: {
          products: processedProducts,
          totalCount: processedProducts.length,
          facets: {
            brands: Object.entries(brandMap).map(([name, count]) => ({ name, count })),
            colors: Object.entries(colorMap).map(([name, count]) => ({ name, count })),
            categories: Object.entries(categoryMap).map(([name, count]) => ({ name, count })),
            priceRange: {
              min: minP === Infinity ? 0 : Math.floor(minP),
              max: maxP === 0 ? 1000 : Math.ceil(maxP),
            },
            inStockCount: inStockTotal,
          }
        }
      })
    }

    if (type === 'products') {
      const isPublicUnfiltered = !categoryId && !vendorId && !vertical && !searchParams.get('productCategoryId')
      if (isPublicUnfiltered && productsCache && (Date.now() - productsCacheTime < 60000)) {
        return Response.json({
          success: true,
          data: productsCache
        })
      }

      if (categoryId) {
        whereClause.catId = parseInt(categoryId) || categoryId
      }
      if (vertical) {
        whereClause.vertical = vertical
      }

      // Vendor isolation: a request bearing a VENDOR token is locked to that
      // vendor's own products, regardless of any vendorId query param they send.
      // Admins / public storefront are unaffected and may filter explicitly.
      const authUser = await getAuthUser(request)
      if (authUser && authUser.role === 'VENDOR') {
        whereClause.vendorId = authUser.uid
      } else if (vendorId) {
        whereClause.vendorId = vendorId
      }

      const [products, businesses] = await Promise.all([
        prisma.product.findMany({
          where: whereClause,
          include: {
            category: true,
            subCategory: true,
            productCategory: true,
            vendor: true,
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.business.findMany({
          select: {
            email: true,
            businessName: true,
            urlLogo: true
          }
        })
      ])

      const businessMap = {}
      businesses.forEach(b => {
        businessMap[b.email.toLowerCase()] = b
      })

      // Parse JSON fields safely so one invalid field never drops images
      const safeJson = (val, fallback = null) => {
        if (!val) return fallback
        if (typeof val !== 'string') return val
        try {
          return JSON.parse(val)
        } catch {
          if (fallback !== null) return fallback
          return [val]
        }
      }

      const normalizeUrl = (url) => {
        if (!url || typeof url !== 'string') return ''
        if (url.includes('rapidtechpro.s3') || (url.includes('s3.') && url.includes('rapidtechpro'))) {
          try {
            const u = new URL(url)
            let p = u.pathname.replace(/^\/+/, '')
            if (p.startsWith('rapidtechpro/')) p = p.substring('rapidtechpro/'.length)
            return `https://d1nvnelpyr43e7.cloudfront.net/${p}`
          } catch {
            return url.replace(/https:\/\/[^/]*s3[^/]*\/rapidtechpro\//, 'https://d1nvnelpyr43e7.cloudfront.net/')
                      .replace(/https:\/\/rapidtechpro\.s3[^/]*\//, 'https://d1nvnelpyr43e7.cloudfront.net/')
          }
        }
        return url
      }

      const processedProducts = products.map(product => {
        const vendorEmail = product.vendor?.email
        const biz = vendorEmail ? businessMap[vendorEmail.toLowerCase()] : null
        return {
          ...product,
          vendor: product.vendor ? {
            ...product.vendor,
            businessName: biz?.businessName || product.vendor.username,
            urlLogo: biz?.urlLogo || null
          } : null,
          proImages: safeJson(product.proImages, []).map(normalizeUrl),
          keyFeatures: safeJson(product.keyFeatures, typeof product.keyFeatures === 'string' ? product.keyFeatures.split(',').map(s => s.trim()) : []),
          variations: safeJson(product.variations, []),
          reviews: safeJson(product.reviews, [])
        }
      })

      if (isPublicUnfiltered) {
        productsCache = processedProducts
        productsCacheTime = Date.now()
      }

      return Response.json({
        success: true,
        data: processedProducts
      })
    }

    return Response.json({
      success: false,
      error: 'Invalid type parameter'
    }, { status: 400 })

  } catch (error) {
    console.error('Error fetching data:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { type, ...data } = body

    if (ADMIN_ONLY_TYPES.includes(type)) {
      const auth = await requireRole(request, ADMIN_ROLES)
      if (auth.error) {
        return Response.json({ success: false, error: auth.error }, { status: auth.status })
      }
    }

    if (type === 'category') {
      // Map incoming payload to schema fields
      const statusEnum = (data.status === true || data.status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE'

      // Generate unique code if not provided or if it already exists
      let catCode = data.catCode
      if (!catCode) {
        catCode = data.catName.toLowerCase().replace(/\s+/g, '-')
      }

      // Check if the code already exists and make it unique
      let existingCategory = await prisma.category.findUnique({
        where: { code: catCode }
      })

      let counter = 1
      let originalCode = catCode
      while (existingCategory) {
        catCode = `${originalCode}-${counter}`
        existingCategory = await prisma.category.findUnique({
          where: { code: catCode }
        })
        counter++
      }

      const category = await prisma.category.create({
        data: {
          code: catCode,
          name: data.catName,
          description: data.description ?? null,
          image: data.image ?? null,
          status: statusEnum,
          vertical: data.vertical || 'FOOD',
          createdBy: data.createdBy || 'system'
        }
      })


      return Response.json({
        success: true,
        data: category,
        message: 'Category created successfully'
      })
    }

    if (type === 'subcategory') {
      // Generate unique subCatCode if not provided or if it already exists
      let subCatCode = data.subCatCode
      if (!subCatCode) {
        subCatCode = data.subCatName.toLowerCase().replace(/\s+/g, '-')
      }

      // Check if the code already exists and make it unique
      let existingSubcategory = await prisma.subCategory.findUnique({
        where: { subCatCode }
      })

      let counter = 1
      let originalCode = subCatCode
      while (existingSubcategory) {
        subCatCode = `${originalCode}-${counter}`
        existingSubcategory = await prisma.subCategory.findUnique({
          where: { subCatCode }
        })
        counter++
      }

      const parsedCatId = data.catId ? parseInt(data.catId) : (data.categoryId ? parseInt(data.categoryId) : null)
      const parsedProductCatId = data.productCategoryId ? parseInt(data.productCategoryId) : null

      const subcategory = await prisma.subCategory.create({
        data: {
          subCatCode,
          subCatName: data.subCatName,
          image: data.image || null,
          catId: parsedCatId,
          productCategoryId: parsedProductCatId,
          vertical: data.vertical || 'FOOD',
          status: (data.status === true || data.status === 'ACTIVE')
        },
        include: {
          category: true,
          productCategory: true
        }
      })

      return Response.json({
        success: true,
        data: subcategory,
        message: 'Subcategory created successfully'
      })
    }

    if (type === 'productcategory') {
      const productCategory = await prisma.productCategory.create({
        data: {
          productCategoryName: data.productCategoryName,
          productCategoryDescription: data.productCategoryDescription || null,
          image: data.image || null,
          categoryId: data.categoryId
        }
      })

      return Response.json({
        success: true,
        data: productCategory,
        message: 'Product category created successfully'
      })
    }

    if (type === 'product') {
      // Products can be created by ADMIN, SUPER_ADMIN, or VENDOR.
      const auth = await requireRole(request, ['ADMIN', 'SUPER_ADMIN', 'VENDOR'])
      if (auth.error) {
        return Response.json({ success: false, error: auth.error }, { status: auth.status })
      }
      const authUser = auth.user

      // Vendors can only create products if they have an approved business
      if (authUser.role === 'VENDOR') {
        const business = await prisma.business.findFirst({
          where: {
            email: authUser.email,
            verificationStatus: 'APPROVED'
          }
        })
        if (!business) {
          return Response.json({
            success: false,
            error: 'You must have an approved business registration to add products. Please wait for admin approval or register your business.'
          }, { status: 403 })
        }
      }

      // Vendors can only create products under their own account. Admins may
      // create on behalf of a vendor using the vendorId supplied in the body.
      const vendorId    = authUser.role === 'VENDOR' ? authUser.uid : data.vendorId
      const createdById = authUser.role === 'VENDOR' ? authUser.uid : (data.createdById || authUser.uid)

      const product = await prisma.product.create({
        data: {
          proName: data.proName,
          description: data.description,
          catId: data.catId,
          subCatId: data.subCatId,
          productCategoryId: data.productCategoryId ? parseInt(data.productCategoryId) : null,
          price: parseFloat(data.price),
          cost: parseFloat(data.cost),
          discount: parseFloat(data.discount || 0),
          sku: data.sku,
          barcode: data.barcode,
          qnty: parseInt(data.qnty),
          stock: parseInt(data.stock),
          proImages: data.proImages ? JSON.stringify(data.proImages) : null,
          vendorId,
          status: (data.status === undefined ? true : !!data.status),
          approvalStatus: 'Pending',
          createdById,
          // New Product Fields
          brandName: data.brandName || null,
          manufacturer: data.manufacturer || null,
          keyFeatures: data.keyFeatures ? JSON.stringify(data.keyFeatures) : null,
          productType: data.productType || null,
          variations: data.variations ? JSON.stringify(data.variations) : null,
          sizeName: data.sizeName || null,
          modelNumber: data.modelNumber || null,
          productDimensions: data.productDimensions || null,
          packageWeight: data.packageWeight || null,
          salePrice: data.salePrice ? parseFloat(data.salePrice) : null,
          saleStartDate: data.saleStartDate ? new Date(data.saleStartDate) : null,
          saleEndDate: data.saleEndDate ? new Date(data.saleEndDate) : null,
          currency: data.currency || 'USD',
          conditionType: data.conditionType || null,
          warranty: data.warranty || null,
          ingredients: data.ingredients || null,
          reviews: data.reviews ? JSON.stringify(data.reviews) : null,
          size: data.size || null,
          color: data.color || null
        }
      })

      console.log('Product created successfully:', product.proId)

      return Response.json({
        success: true,
        data: product,
        message: 'Product created successfully'
      })
    }

    return Response.json({
      success: false,
      error: 'Invalid type parameter'
    }, { status: 400 })

  } catch (error) {
    console.error('Error creating data:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { type, id, ...data } = body

    if (ADMIN_ONLY_TYPES.includes(type)) {
      const auth = await requireRole(request, ADMIN_ROLES)
      if (auth.error) {
        return Response.json({ success: false, error: auth.error }, { status: auth.status })
      }
    }

    if (type === 'category') {
      const category = await prisma.category.update({
        where: { id: parseInt(id, 10) },
        data: {
          code: data.catCode,
          name: data.catName,
          description: data.description,
          image: data.image !== undefined ? (data.image || null) : undefined,
          vertical: data.vertical || undefined,
          status: (data.status === true || data.status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE'
        }
      })

      return Response.json({
        success: true,
        data: category,
        message: 'Category updated successfully'
      })
    }

    if (type === 'subcategory') {
      const parsedCatId = data.catId ? parseInt(data.catId) : (data.categoryId ? parseInt(data.categoryId) : undefined)
      const parsedProductCatId = data.productCategoryId !== undefined ? (data.productCategoryId ? parseInt(data.productCategoryId) : null) : undefined

      const subcategory = await prisma.subCategory.update({
        where: { subCatId: parseInt(id) },
        data: {
          subCatCode: data.subCatCode,
          subCatName: data.subCatName,
          image: data.image !== undefined ? (data.image || null) : undefined,
          catId: parsedCatId,
          productCategoryId: parsedProductCatId,
          vertical: data.vertical || undefined,
          status: (data.status === true || data.status === 'ACTIVE')
        },
        include: {
          category: true,
          productCategory: true
        }
      })

      return Response.json({
        success: true,
        data: subcategory,
        message: 'Subcategory updated successfully'
      })
    }

    if (type === 'productcategory') {
      const productCategory = await prisma.productCategory.update({
        where: { productCategoryId: parseInt(id) },
        data: {
          productCategoryName: data.productCategoryName,
          category: { connect: { id: parseInt(data.categoryId) } },
          productCategoryDescription: data.productCategoryDescription,
          image: data.image !== undefined ? (data.image || null) : undefined
        },
        include: {
          category: true
        }
      })

      return Response.json({
        success: true,
        data: productCategory,
        message: 'Product category updated successfully'
      })
    }

    if (type === 'product') {
      const authUser = await getAuthUser(request)
      if (!authUser) {
        return Response.json({ success: false, error: 'Authentication required' }, { status: 401 })
      }

      const existing = await prisma.product.findUnique({
        where: { proId: parseInt(id) },
        select: { vendorId: true }
      })
      if (!existing) {
        return Response.json({ success: false, error: 'Product not found' }, { status: 404 })
      }
      if (authUser.role === 'VENDOR' && existing.vendorId !== authUser.uid) {
        return Response.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      // Vendors cannot reassign a product to another vendor.
      const nextVendorId = authUser.role === 'VENDOR'
        ? existing.vendorId
        : (data.vendorId || undefined)

      const product = await prisma.product.update({
        where: { proId: parseInt(id) },
        data: {
          proName:           data.proName,
          description:       data.description,
          catId:             data.catId,
          subCatId:          data.subCatId,
          productCategoryId: data.productCategoryId !== undefined ? (data.productCategoryId ? parseInt(data.productCategoryId) : null) : undefined,
          price:             parseFloat(data.price),
          cost:              parseFloat(data.cost),
          discount:          parseFloat(data.discount || 0),
          sku:               data.sku,
          barcode:           data.barcode,
          qnty:              parseInt(data.qnty),
          stock:             parseInt(data.stock),
          proImages:         data.proImages ? JSON.stringify(data.proImages) : null,
          vendorId:          nextVendorId,
          status:            !!data.status,
          vertical:          data.vertical || undefined,
          brandName:         data.brandName         || null,

          manufacturer:      data.manufacturer      || null,
          productType:       data.productType       || null,
          modelNumber:       data.modelNumber       || null,
          productDimensions: data.productDimensions || null,
          packageWeight:     data.packageWeight     || null,
          conditionType:     data.conditionType     || null,
          warranty:          data.warranty          || null,
          ingredients:       data.ingredients       || null,
          keyFeatures:       data.keyFeatures ? (typeof data.keyFeatures === 'string' ? data.keyFeatures : JSON.stringify(data.keyFeatures)) : undefined,
          variations:        data.variations !== undefined ? (typeof data.variations === 'string' ? data.variations : JSON.stringify(data.variations)) : undefined,
          sizeName:          data.sizeName          || null,
          size:              data.size              || null,
          color:             data.color             || null,
          currency:          data.currency          || 'USD',
          salePrice:         data.salePrice  ? parseFloat(data.salePrice)  : null,
          saleStartDate:     data.saleStartDate ? new Date(data.saleStartDate) : null,
          saleEndDate:       data.saleEndDate   ? new Date(data.saleEndDate)   : null,
        }
      })

      // Broadcast real-time event to refresh storefronts, inventory & carts
      try {
        broadcastRealtimeEvent('PRODUCT_UPDATED', { proId: product.proId })
      } catch (err) {
        console.warn('Realtime product update broadcast error:', err)
      }

      return Response.json({
        success: true,
        data: product,
        message: 'Product updated successfully'
      })
    }

    if (type === 'approve-product') {
      const authUser = await getAuthUser(request)
      if (!authUser || !['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
        return Response.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      const updateData = {
        approvalStatus: data.approvalStatus,
        updatedAt: new Date()
      }

      // Only set approveById if provided (for approved products)
      if (data.approveById) {
        updateData.approveById = data.approveById
      }

      const product = await prisma.product.update({
        where: { proId: parseInt(id) },
        data: updateData
      })

      return Response.json({
        success: true,
        data: product,
        message: `Product ${data.approvalStatus.toLowerCase()} successfully`
      })
    }

    return Response.json({
      success: false,
      error: 'Invalid type parameter'
    }, { status: 400 })

  } catch (error) {
    console.error('Error updating data:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (ADMIN_ONLY_TYPES.includes(type)) {
      const auth = await requireRole(request, ADMIN_ROLES)
      if (auth.error) {
        return Response.json({ success: false, error: auth.error }, { status: auth.status })
      }
    }

    if (!id) {
      return Response.json({
        success: false,
        error: 'ID is required'
      }, { status: 400 })
    }

    if (type === 'category') {
      await prisma.category.delete({
        where: { id: parseInt(id, 10) }
      })

      return Response.json({
        success: true,
        message: 'Category deleted successfully'
      })
    }

    if (type === 'subcategory') {
      await prisma.subCategory.delete({
        where: { subCatId: parseInt(id) }
      })

      return Response.json({
        success: true,
        message: 'Subcategory deleted successfully'
      })
    }

    if (type === 'productcategory') {
      const countObj = await prisma.productCategory.findUnique({
        where: { productCategoryId: parseInt(id) },
        include: {
          _count: {
            select: { products: true }
          }
        }
      })
      if (countObj && countObj._count.products > 0) {
        return Response.json({
          success: false,
          error: 'Cannot delete product category with active products'
        }, { status: 409 })
      }

      await prisma.productCategory.delete({
        where: { productCategoryId: parseInt(id) }
      })

      return Response.json({
        success: true,
        message: 'Product category deleted successfully'
      })
    }

    if (type === 'product') {
      const authUser = await getAuthUser(request)
      if (!authUser) {
        return Response.json({ success: false, error: 'Authentication required' }, { status: 401 })
      }

      const existing = await prisma.product.findUnique({
        where: { proId: parseInt(id) },
        select: { vendorId: true }
      })
      if (!existing) {
        return Response.json({ success: false, error: 'Product not found' }, { status: 404 })
      }
      if (authUser.role === 'VENDOR' && existing.vendorId !== authUser.uid) {
        return Response.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      await prisma.product.delete({
        where: { proId: parseInt(id) }
      })

      return Response.json({
        success: true,
        message: 'Product deleted successfully'
      })
    }

    return Response.json({
      success: false,
      error: 'Invalid type parameter'
    }, { status: 400 })

  } catch (error) {
    console.error('Error deleting data:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
