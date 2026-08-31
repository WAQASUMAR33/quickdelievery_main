import { prisma } from '@/lib/prisma'
import { getAuthUser, requireRole, ADMIN_ROLES } from '@/lib/auth-server'

// Catalog taxonomy types that only admins may create/update/delete.
const ADMIN_ONLY_TYPES = ['category', 'subcategory', 'productcategory']

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
          businessType: true,
          businessCategory: true
        }
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

    if (type === 'products') {
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
            approver: true,

            creator: true
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

      // Parse JSON fields back to arrays/objects
      const processedProducts = products.map(product => {
        const vendorEmail = product.vendor?.email
        const biz = vendorEmail ? businessMap[vendorEmail.toLowerCase()] : null
        try {
          return {
            ...product,
            vendor: product.vendor ? {
              ...product.vendor,
              businessName: biz?.businessName || product.vendor.username,
              urlLogo: biz?.urlLogo || null
            } : null,
            proImages: product.proImages ? JSON.parse(product.proImages) : null,
            keyFeatures: product.keyFeatures ? JSON.parse(product.keyFeatures) : null,
            variations: product.variations ? JSON.parse(product.variations) : null,
            reviews: product.reviews ? JSON.parse(product.reviews) : null
          }
        } catch (parseError) {
          console.warn('JSON parse error for product:', product.proId, parseError)
          return {
            ...product,
            vendor: product.vendor ? {
              ...product.vendor,
              businessName: biz?.businessName || product.vendor.username,
              urlLogo: biz?.urlLogo || null
            } : null,
            proImages: null,
            keyFeatures: null,
            variations: null,
            reviews: null
          }
        }
      })

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
          sizeName:          data.sizeName          || null,
          size:              data.size              || null,
          color:             data.color             || null,
          currency:          data.currency          || 'USD',
          salePrice:         data.salePrice  ? parseFloat(data.salePrice)  : null,
          saleStartDate:     data.saleStartDate ? new Date(data.saleStartDate) : null,
          saleEndDate:       data.saleEndDate   ? new Date(data.saleEndDate)   : null,
        }
      })

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
