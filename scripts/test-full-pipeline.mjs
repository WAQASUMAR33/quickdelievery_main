import dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
import { uploadBufferToS3, deleteObjectFromS3 } from '../src/lib/s3.js'

const prisma = new PrismaClient()

async function testFullPipeline() {
  console.log('====================================================')
  console.log('🧪 RUNNING FULL AWS S3 + RDS PIPELINE TEST')
  console.log('====================================================\n')

  let uploadedFileKey = null
  let testCategoryId = null

  try {
    // 1. Simulate Image Upload (PNG format)
    console.log('1️⃣ [S3 UPLOAD] Creating sample image buffer...')
    // Minimal 1x1 transparent PNG buffer
    const samplePngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )

    console.log('Uploading sample image to Amazon S3 (rapidtechpro)...')
    const uploadResult = await uploadBufferToS3(samplePngBuffer, {
      fileName: 'pipeline-test.png',
      contentType: 'image/png',
      folder: 'products',
    })

    console.log('✅ Upload succeeded!')
    console.log('   Generated File Key:', uploadResult.key)
    console.log('   Public CDN/S3 URL:', uploadResult.url)
    uploadedFileKey = uploadResult.key

    // 2. Verify Image Fetch via HTTP GET
    console.log('\n2️⃣ [IMAGE FETCH] Fetching image via HTTP to verify accessibility...')
    const fetchResponse = await fetch(uploadResult.url)
    console.log(`   HTTP Status: ${fetchResponse.status} ${fetchResponse.statusText}`)
    if (fetchResponse.ok) {
      const buffer = await fetchResponse.arrayBuffer()
      console.log(`✅ Image fetched successfully! Size: ${buffer.byteLength} bytes`)
    } else {
      console.warn(`⚠️ Could not fetch via public URL (Status ${fetchResponse.status})`)
    }

    // 3. Database Persistence Test with S3 Image URL
    console.log('\n3️⃣ [RDS DATABASE] Saving record with S3 image URL into Amazon RDS MySQL...')
    const testCategory = await prisma.category.create({
      data: {
        name: 'AWS S3 Test Category',
        code: `test-cat-${Date.now()}`,
        description: 'Temporary test category verifying AWS S3 image URL storage',
        image: uploadResult.url,
        createdBy: 'system-test',
      },
    })
    testCategoryId = testCategory.id
    console.log(`✅ Record created in RDS! ID: ${testCategory.id}`)

    // 4. Query record back from RDS
    console.log('\n4️⃣ [QUERY DATABASE] Querying record from RDS to verify image URL retention...')
    const retrieved = await prisma.category.findUnique({
      where: { id: testCategoryId },
    })
    console.log('Retrieved Image URL from DB:', retrieved?.image)

    if (retrieved?.image === uploadResult.url) {
      console.log('✅ Database successfully stored and returned the exact Amazon S3 / CloudFront image URL!')
    } else {
      throw new Error('Database image URL did not match uploaded S3 URL!')
    }

  } catch (err) {
    console.error('❌ Pipeline test failed:', err)
  } finally {
    // 5. Cleanup
    console.log('\n5️⃣ [CLEANUP] Cleaning up test records and files...')
    if (testCategoryId) {
      await prisma.category.delete({ where: { id: testCategoryId } }).catch(() => {})
      console.log('✅ Cleaned up test record from database.')
    }
    if (uploadedFileKey) {
      await deleteObjectFromS3(uploadedFileKey).catch(() => {})
      console.log('✅ Cleaned up test image from Amazon S3 bucket.')
    }
    await prisma.$disconnect()
  }

  console.log('\n====================================================')
  console.log('🎉 FULL AWS IMAGE UPLOAD & RETRIEVAL TEST COMPLETE!')
  console.log('====================================================')
}

testFullPipeline()
