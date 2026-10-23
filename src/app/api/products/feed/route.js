import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, requireRole } from '@/lib/auth-server'
import {
  exportUnifiedToFlatCsv,
  exportUnifiedToXml,
  normalizeProductToUnified,
  mapUnifiedToDatabase,
  parseFlatCsvToUnified,
  getSampleUnifiedProducts,
  UNIFIED_CSV_COLUMNS,
} from '@/lib/unifiedProductSchema'

export const dynamic = 'force-dynamic'

/**
 * GET /api/products/feed
 * Export or download template for unified 7-phase product catalog
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'csv').toLowerCase()
    const type = (searchParams.get('type') || 'export').toLowerCase()
    const vendorId = searchParams.get('vendorId')

    // If downloading blank template / sample data
    if (type === 'template') {
      const samples = getSampleUnifiedProducts()

      if (format === 'csv') {
        const csvContent = exportUnifiedToFlatCsv(samples)
        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="unified_product_catalog_template.csv"',
          },
        })
      }

      if (format === 'xml') {
        const xmlContent = exportUnifiedToXml(samples)
        return new NextResponse(xmlContent, {
          status: 200,
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Content-Disposition': 'attachment; filename="unified_product_catalog_template.xml"',
          },
        })
      }

      return NextResponse.json({
        success: true,
        schema: UNIFIED_CSV_COLUMNS,
        samples,
      })
    }

    // Export actual store catalog
    const where = {}
    if (vendorId) {
      where.vendorId = vendorId
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        subCategory: true,
        vendor: { select: { uid: true, username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    const unifiedList = products.map(normalizeProductToUnified)

    if (format === 'csv') {
      const csvContent = exportUnifiedToFlatCsv(unifiedList)
      const filename = vendorId ? `vendor_${vendorId}_catalog_feed.csv` : 'store_catalog_unified_feed.csv'
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    if (format === 'xml') {
      const xmlContent = exportUnifiedToXml(unifiedList)
      const filename = vendorId ? `vendor_${vendorId}_catalog_feed.xml` : 'store_catalog_unified_feed.xml'
      return new NextResponse(xmlContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      count: unifiedList.length,
      data: unifiedList,
    })
  } catch (error) {
    console.error('Error generating product feed:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/products/feed
 * Ingest / Bulk upload products matching the unified 7-phase schema
 */
export async function POST(request) {
  try {
    const auth = await requireRole(request, ['ADMIN', 'SUPER_ADMIN', 'VENDOR'])
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }
    const authUser = auth.user

    const contentType = request.headers.get('content-type') || ''
    let incomingItems = []

    if (contentType.includes('text/csv') || contentType.includes('application/octet-stream')) {
      const csvText = await request.text()
      incomingItems = parseFlatCsvToUnified(csvText)
    } else {
      const body = await request.json()
      if (Array.isArray(body)) {
        incomingItems = body
      } else if (body.csv) {
        incomingItems = parseFlatCsvToUnified(body.csv)
      } else if (body.items && Array.isArray(body.items)) {
        incomingItems = body.items
      }
    }

    if (!incomingItems || incomingItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid product rows found in feed payload. Please verify your CSV columns match the 7-phase schema template.',
      }, { status: 400 })
    }

    // Determine default category and subcategory
    const defaultCat = await prisma.category.findFirst()
    const defaultSub = await prisma.subCategory.findFirst({ where: { catId: defaultCat?.id } })

    const results = { created: 0, updated: 0, errors: [] }

    for (let i = 0; i < incomingItems.length; i++) {
      const raw = incomingItems[i]
      try {
        const dbPayload = mapUnifiedToDatabase(raw)
        if (!dbPayload || !dbPayload.proName) {
          results.errors.push(`Row ${i + 1}: Missing product title/name`)
          continue
        }

        const vendorId = authUser.role === 'VENDOR' ? authUser.uid : (raw.vendor_id || authUser.uid)

        // Check if product with this SKU already exists
        const existing = await prisma.product.findUnique({
          where: { sku: dbPayload.sku },
        })

        if (existing) {
          // If vendor, ensure ownership
          if (authUser.role === 'VENDOR' && existing.vendorId !== authUser.uid) {
            results.errors.push(`Row ${i + 1}: SKU ${dbPayload.sku} is owned by another vendor.`)
            continue
          }

          await prisma.product.update({
            where: { proId: existing.proId },
            data: {
              proName: dbPayload.proName,
              description: dbPayload.description,
              price: dbPayload.price,
              stock: dbPayload.stock,
              qnty: dbPayload.qnty,
              barcode: dbPayload.barcode,
              brandName: dbPayload.brandName,
              manufacturer: dbPayload.manufacturer,
              productType: dbPayload.productType,
              conditionType: dbPayload.conditionType,
              currency: dbPayload.currency,
              ingredients: dbPayload.ingredients,
              salePrice: dbPayload.salePrice,
              saleStartDate: dbPayload.saleStartDate,
              saleEndDate: dbPayload.saleEndDate,
              proImages: dbPayload.proImages ? JSON.stringify(dbPayload.proImages) : existing.proImages,
              keyFeatures: dbPayload.keyFeatures ? JSON.stringify(dbPayload.keyFeatures) : existing.keyFeatures,
              variations: dbPayload.variations ? JSON.stringify(dbPayload.variations) : existing.variations,
              productDimensions: dbPayload.productDimensions,
              packageWeight: dbPayload.packageWeight,
            },
          })
          results.updated++
        } else {
          // Create new product
          await prisma.product.create({
            data: {
              sku: dbPayload.sku,
              proName: dbPayload.proName,
              description: dbPayload.description,
              price: dbPayload.price,
              cost: dbPayload.price * 0.7,
              stock: dbPayload.stock,
              qnty: dbPayload.qnty,
              barcode: dbPayload.barcode,
              brandName: dbPayload.brandName,
              manufacturer: dbPayload.manufacturer,
              productType: dbPayload.productType,
              conditionType: dbPayload.conditionType,
              currency: dbPayload.currency,
              ingredients: dbPayload.ingredients,
              salePrice: dbPayload.salePrice,
              saleStartDate: dbPayload.saleStartDate,
              saleEndDate: dbPayload.saleEndDate,
              proImages: dbPayload.proImages ? JSON.stringify(dbPayload.proImages) : null,
              keyFeatures: dbPayload.keyFeatures ? JSON.stringify(dbPayload.keyFeatures) : null,
              variations: dbPayload.variations ? JSON.stringify(dbPayload.variations) : null,
              productDimensions: dbPayload.productDimensions,
              packageWeight: dbPayload.packageWeight,
              vendorId,
              createdById: authUser.uid,
              catId: defaultCat?.id || 1,
              subCatId: defaultSub?.subCatId || 1,
              status: true,
              approvalStatus: authUser.role === 'VENDOR' ? 'Pending' : 'Approved',
            },
          })
          results.created++
        }
      } catch (rowErr) {
        results.errors.push(`Row ${i + 1} (${raw.item_sku || raw.product_name}): ${rowErr.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Feed processed: ${results.created} created, ${results.updated} updated`,
      results,
    })
  } catch (error) {
    console.error('Error ingesting product feed:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
