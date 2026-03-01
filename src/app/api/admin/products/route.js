import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const vendorId = searchParams.get('vendorId') || ''
    const status = searchParams.get('status') || ''
    const approvalStatus = searchParams.get('approvalStatus') || ''
    const sortBy = searchParams.get('sortBy') || 'newest'

    // Build where clause
    const whereClause = {}
    
    if (search) {
      whereClause.OR = [
        { proName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (categoryId) {
      whereClause.catId = categoryId
    }
    
    if (vendorId) {
      whereClause.vendorId = vendorId
    }
    
    if (status !== '') {
      whereClause.status = status === 'true'
    }
    
    if (approvalStatus) {
      whereClause.approvalStatus = approvalStatus
    }

    // Build order by clause
    let orderBy = { createdAt: 'desc' }
    switch (sortBy) {
      case 'name':
        orderBy = { proName: 'asc' }
        break
      case 'price_low':
        orderBy = { price: 'asc' }
        break
      case 'price_high':
        orderBy = { price: 'desc' }
        break
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      default:
        orderBy = { createdAt: 'desc' }
    }

    // Get products with pagination
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        vendor: {
          select: {
            id: true,
            username: true,
            email: true,
            businessName: true,
            role: true
          }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    })

    // Get total count
    const totalCount = await prisma.product.count({ where: whereClause })

    // Get statistics
    const totalProducts = await prisma.product.count()
    const approvedProducts = await prisma.product.count({ where: { approvalStatus: 'Approved' } })
    const pendingProducts = await prisma.product.count({ where: { approvalStatus: 'Pending' } })
    const rejectedProducts = await prisma.product.count({ where: { approvalStatus: 'Rejected' } })
    const activeProducts = await prisma.product.count({ where: { status: true } })

    return Response.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      stats: {
        totalProducts,
        approvedProducts,
        pendingProducts,
        rejectedProducts,
        activeProducts
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return Response.json({
      success: false,
      error: 'Failed to fetch products'
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const {
      proName,
      description,
      price,
      salePrice,
      sku,
      barcode,
      stock,
      catId,
      subCatId,
      vendorId,
      proImages,
      specifications,
      features,
      status = true,
      approvalStatus = 'Pending'
    } = await request.json()

    // Validate required fields
    if (!proName || !price || !catId || !vendorId) {
      return Response.json({
        success: false,
        error: 'Missing required fields: proName, price, catId, vendorId'
      }, { status: 400 })
    }

    // Parse JSON fields
    let parsedImages = []
    let parsedSpecifications = {}
    let parsedFeatures = []

    try {
      if (proImages) {
        parsedImages = typeof proImages === 'string' ? JSON.parse(proImages) : proImages
      }
      if (specifications) {
        parsedSpecifications = typeof specifications === 'string' ? JSON.parse(specifications) : specifications
      }
      if (features) {
        parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features
      }
    } catch (parseError) {
      return Response.json({
        success: false,
        error: 'Invalid JSON format in specifications, features, or images'
      }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        proName,
        description,
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        sku,
        barcode,
        stock: stock ? parseInt(stock) : 0,
        catId,
        subCatId,
        vendorId,
        proImages: parsedImages,
        specifications: parsedSpecifications,
        features: parsedFeatures,
        status,
        approvalStatus,
        approveById: null
      },
      include: {
        category: true,
        vendor: {
          select: {
            id: true,
            username: true,
            email: true,
            businessName: true,
            role: true
          }
        }
      }
    })

    return Response.json({
      success: true,
      data: product,
      message: 'Product created successfully'
    })
  } catch (error) {
    console.error('Error creating product:', error)
    return Response.json({
      success: false,
      error: 'Failed to create product'
    }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const {
      id,
      proName,
      description,
      price,
      salePrice,
      sku,
      barcode,
      stock,
      catId,
      subCatId,
      vendorId,
      proImages,
      specifications,
      features,
      status,
      approvalStatus
    } = await request.json()

    if (!id) {
      return Response.json({
        success: false,
        error: 'Product ID is required'
      }, { status: 400 })
    }

    // Build update data
    const updateData = {}
    
    if (proName !== undefined) updateData.proName = proName
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseFloat(price)
    if (salePrice !== undefined) updateData.salePrice = salePrice ? parseFloat(salePrice) : null
    if (sku !== undefined) updateData.sku = sku
    if (barcode !== undefined) updateData.barcode = barcode
    if (stock !== undefined) updateData.stock = parseInt(stock)
    if (catId !== undefined) updateData.catId = catId
    if (subCatId !== undefined) updateData.subCatId = subCatId
    if (vendorId !== undefined) updateData.vendorId = vendorId
    if (status !== undefined) updateData.status = status
    if (approvalStatus !== undefined) updateData.approvalStatus = approvalStatus

    // Parse JSON fields if provided
    if (proImages !== undefined) {
      try {
        updateData.proImages = typeof proImages === 'string' ? JSON.parse(proImages) : proImages
      } catch (error) {
        return Response.json({
          success: false,
          error: 'Invalid JSON format in proImages'
        }, { status: 400 })
      }
    }

    if (specifications !== undefined) {
      try {
        updateData.specifications = typeof specifications === 'string' ? JSON.parse(specifications) : specifications
      } catch (error) {
        return Response.json({
          success: false,
          error: 'Invalid JSON format in specifications'
        }, { status: 400 })
      }
    }

    if (features !== undefined) {
      try {
        updateData.features = typeof features === 'string' ? JSON.parse(features) : features
      } catch (error) {
        return Response.json({
          success: false,
          error: 'Invalid JSON format in features'
        }, { status: 400 })
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        vendor: {
          select: {
            id: true,
            username: true,
            email: true,
            businessName: true,
            role: true
          }
        }
      }
    })

    return Response.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    })
  } catch (error) {
    console.error('Error updating product:', error)
    return Response.json({
      success: false,
      error: 'Failed to update product'
    }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return Response.json({
        success: false,
        error: 'Product ID is required'
      }, { status: 400 })
    }

    await prisma.product.delete({
      where: { id }
    })

    return Response.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return Response.json({
      success: false,
      error: 'Failed to delete product'
    }, { status: 500 })
  }
}
