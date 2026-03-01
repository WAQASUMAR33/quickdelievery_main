import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const categoryId = searchParams.get('categoryId')
    const vendorId = searchParams.get('vendorId')

    let whereClause = {}

    if (type === 'categories') {
      const categories = await prisma.category.findMany({
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
        whereClause.catId = categoryId
      }

      const subcategories = await prisma.subCategory.findMany({
        where: whereClause,
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
        data: subcategories
      })
    }

    if (type === 'products') {
      if (categoryId) {
        whereClause.catId = categoryId
      }
      if (vendorId) {
        whereClause.vendorId = vendorId
      }

      const products = await prisma.product.findMany({
        where: whereClause,
        include: {
          category: true,
          subCategory: true,
          vendor: true,
          approver: true,
          creator: true
        },
        orderBy: { createdAt: 'desc' }
      })

      // Parse JSON fields back to arrays/objects
      const processedProducts = products.map(product => {
        try {
          return {
            ...product,
            proImages: product.proImages ? JSON.parse(product.proImages) : null,
            keyFeatures: product.keyFeatures ? JSON.parse(product.keyFeatures) : null,
            variations: product.variations ? JSON.parse(product.variations) : null,
            reviews: product.reviews ? JSON.parse(product.reviews) : null
          }
        } catch (parseError) {
          console.warn('JSON parse error for product:', product.proId, parseError)
          return {
            ...product,
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
          status: statusEnum,
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

      const subcategory = await prisma.subCategory.create({
        data: {
          subCatCode,
          subCatName: data.subCatName,
          catId: data.catId,
          status: (data.status === true || data.status === 'ACTIVE')
        }
      })

      return Response.json({
        success: true,
        data: subcategory,
        message: 'Subcategory created successfully'
      })
    }

    if (type === 'product') {
      console.log('Creating product with data:', {
        proName: data.proName,
        catId: data.catId,
        subCatId: data.subCatId,
        price: data.price,
        cost: data.cost,
        vendorId: data.vendorId,
        createdById: data.createdById
      })
      
      const product = await prisma.product.create({
        data: {
          proName: data.proName,
          description: data.description,
          catId: data.catId,
          subCatId: data.subCatId,
          price: parseFloat(data.price),
          cost: parseFloat(data.cost),
          discount: parseFloat(data.discount || 0),
          sku: data.sku,
          barcode: data.barcode,
          qnty: parseInt(data.qnty),
          stock: parseInt(data.stock),
          proImages: data.proImages ? JSON.stringify(data.proImages) : null,
          vendorId: data.vendorId,
          status: (data.status === undefined ? true : !!data.status),
          approvalStatus: 'Pending',
          createdById: data.createdById,
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

    if (type === 'category') {
      const category = await prisma.category.update({
        where: { id },
        data: {
          code: data.catCode,
          name: data.catName,
          description: data.description,
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
      const subcategory = await prisma.subCategory.update({
        where: { id },
        data: {
          subCatCode: data.subCatCode,
          subCatName: data.subCatName,
          catId: data.catId,
          status: (data.status === true || data.status === 'ACTIVE')
        }
      })

      return Response.json({
        success: true,
        data: subcategory,
        message: 'Subcategory updated successfully'
      })
    }

    if (type === 'product') {
      const product = await prisma.product.update({
        where: { proId: parseInt(id) },
        data: {
          proName: data.proName,
          description: data.description,
          catId: data.catId,
          subCatId: data.subCatId,
          price: parseFloat(data.price),
          cost: parseFloat(data.cost),
          discount: parseFloat(data.discount || 0),
          sku: data.sku,
          barcode: data.barcode,
          qnty: parseInt(data.qnty),
          stock: parseInt(data.stock),
          proImages: data.proImages ? JSON.stringify(data.proImages) : null,
            vendorId: data.vendorId,
          status: !!data.status
        }
      })

      return Response.json({
        success: true,
        data: product,
        message: 'Product updated successfully'
      })
    }

    if (type === 'approve-product') {
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

    if (!id) {
      return Response.json({
        success: false,
        error: 'ID is required'
      }, { status: 400 })
    }

    if (type === 'category') {
      await prisma.category.delete({
        where: { id }
      })

      return Response.json({
        success: true,
        message: 'Category deleted successfully'
      })
    }

    if (type === 'subcategory') {
      await prisma.subCategory.delete({
        where: { id }
      })

      return Response.json({
        success: true,
        message: 'Subcategory deleted successfully'
      })
    }

    if (type === 'product') {
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
