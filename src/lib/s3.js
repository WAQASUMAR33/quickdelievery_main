import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

function cleanEnv(val) {
  return String(val || '')
    .trim()
    .replace(/^["']|["']$/g, '')
}

const region = cleanEnv(process.env.AWS_REGION) || 'us-east-1'
const accessKeyId = cleanEnv(process.env.AWS_ACCESS_KEY_ID)
const secretAccessKey = cleanEnv(process.env.AWS_SECRET_ACCESS_KEY)
const bucketName = cleanEnv(process.env.AWS_S3_BUCKET_NAME)
const customDomain = cleanEnv(process.env.AWS_S3_CUSTOM_DOMAIN)

let s3ClientInstance = null

export function getS3Client() {
  if (!s3ClientInstance) {
    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'AWS credentials missing. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file.'
      )
    }
    s3ClientInstance = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  }
  return s3ClientInstance
}

export function formatS3Url(key) {
  if (!key) return ''
  if (/^https?:\/\//i.test(key)) return key

  const cleanKey = key.replace(/^\/+/, '')
  if (customDomain) {
    const domain = customDomain.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
    return `https://${domain}/${cleanKey}`
  }

  // Standard AWS S3 URL format
  if (region === 'us-east-1') {
    return `https://${bucketName}.s3.amazonaws.com/${cleanKey}`
  }
  return `https://${bucketName}.s3.${region}.amazonaws.com/${cleanKey}`
}

/**
 * Upload a binary Buffer or Uint8Array to AWS S3
 */
export async function uploadBufferToS3(buffer, { fileName, contentType = 'image/jpeg', folder = 'uploads' } = {}) {
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME is not configured in .env')
  }

  const s3 = getS3Client()
  const safeName = (fileName || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`)
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
  
  const key = folder ? `${folder.replace(/^\/+|\/+$/g, '')}/${Date.now()}-${safeName}` : `${Date.now()}-${safeName}`

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  })

  await s3.send(command)

  const publicUrl = formatS3Url(key)

  return {
    success: true,
    key,
    url: publicUrl,
  }
}

/**
 * Delete an object from AWS S3
 */
export async function deleteObjectFromS3(keyOrUrl) {
  if (!bucketName || !keyOrUrl) return { success: false, error: 'Missing bucket or key' }

  try {
    const s3 = getS3Client()
    let key = keyOrUrl
    if (/^https?:\/\//i.test(keyOrUrl)) {
      try {
        const urlObj = new URL(keyOrUrl)
        key = decodeURIComponent(urlObj.pathname.replace(/^\/+/, ''))
      } catch {
        // fallback
      }
    }

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })

    await s3.send(command)
    return { success: true }
  } catch (err) {
    console.error('Failed to delete S3 object:', err)
    return { success: false, error: err.message }
  }
}
