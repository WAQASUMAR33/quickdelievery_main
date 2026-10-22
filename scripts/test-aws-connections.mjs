import dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const prisma = new PrismaClient()

async function testDatabase() {
  console.log('\n--- 1. TESTING AMAZON RDS DATABASE ---')
  try {
    await prisma.$connect()
    console.log('✅ Successfully connected to Amazon RDS MySQL database!')

    const userCount = await prisma.users.count()
    console.log(`✅ Table query verified: users count = ${userCount}`)

    const categoryCount = await prisma.category.count()
    console.log(`✅ Table query verified: categories count = ${categoryCount}`)

    console.log('🎉 Amazon RDS Database is 100% WORKING!')
  } catch (err) {
    console.error('❌ Database connection error:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

async function testS3() {
  console.log('\n--- 2. TESTING AMAZON S3 STORAGE BUCKET ---')
  const region = process.env.REGION || process.env.AWS_REGION || 'ap-southeast-2'
  const bucketName = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME
  const accessKeyId = process.env.ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
  const customDomain = process.env.S3_CUSTOM_DOMAIN || process.env.AWS_S3_CUSTOM_DOMAIN

  console.log(`Region: ${region}`)
  console.log(`Bucket: ${bucketName}`)
  console.log(`Custom Domain / CloudFront: ${customDomain || 'None'}`)

  if (!bucketName || !accessKeyId || !secretAccessKey) {
    console.error('❌ Missing S3 credentials in .env')
    return
  }

  const s3 = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  })

  const testKey = `test-health-check/test-${Date.now()}.txt`
  const testContent = `AWS S3 health test performed at ${new Date().toISOString()}`

  try {
    // 1. Upload test file
    console.log(`Uploading test file: ${testKey}...`)
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: Buffer.from(testContent),
        ContentType: 'text/plain',
      })
    )
    console.log('✅ Upload to Amazon S3 successful!')

    // 2. Format URLs
    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${testKey}`
    const cloudfrontUrl = customDomain ? `https://${customDomain.replace(/^https?:\/\//, '')}/${testKey}` : null

    console.log(`   S3 Direct URL: ${s3Url}`)
    if (cloudfrontUrl) {
      console.log(`   CloudFront URL: ${cloudfrontUrl}`)
    }

    // 3. Test HTTP accessibility
    const targetUrl = cloudfrontUrl || s3Url
    console.log(`Testing HTTP GET request to: ${targetUrl}...`)
    try {
      const res = await fetch(targetUrl)
      if (res.ok) {
        const text = await res.text()
        console.log(`✅ Public access verified via HTTP (status ${res.status})! Content: "${text.trim()}"`)
      } else {
        console.warn(`⚠️ HTTP GET returned status ${res.status}. (If CloudFront, it might take 1-2 minutes to invalidate/propagate, or check bucket public access policy).`)
      }
    } catch (httpErr) {
      console.warn('⚠️ HTTP fetch warning:', httpErr.message)
    }

    // 4. Clean up test file
    console.log('Cleaning up test file from S3...')
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      })
    )
    console.log('✅ Test file cleaned up successfully!')
    console.log('🎉 Amazon S3 Storage Bucket is 100% WORKING!')
  } catch (err) {
    console.error('❌ S3 bucket test failed:', err.message)
  }
}

async function main() {
  await testDatabase()
  await testS3()
}

main()
