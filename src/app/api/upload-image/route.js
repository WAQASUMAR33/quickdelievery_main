export const runtime = 'nodejs'

import fs from 'fs/promises'
import path from 'path'

function parseBase64(base64Str) {
  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
  if (matches && matches.length === 3) {
    return {
      contentType: matches[1],
      buffer: Buffer.from(matches[2], 'base64'),
    }
  }
  // If raw base64 without prefix
  return {
    contentType: 'image/jpeg',
    buffer: Buffer.from(base64Str, 'base64'),
  }
}

async function saveFileLocally(buffer, fileName = 'upload.jpg', folder = 'uploads') {
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '') || 'uploads'
  const uploadsDir = path.join(process.cwd(), 'public', cleanFolder)
  await fs.mkdir(uploadsDir, { recursive: true })

  const ext = path.extname(fileName) || '.jpg'
  const baseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()
  const uniqueName = `${Date.now()}-${baseName}${ext}`
  const filePath = path.join(uploadsDir, uniqueName)

  await fs.writeFile(filePath, buffer)
  const publicUrl = `/${cleanFolder}/${uniqueName}`

  return {
    success: true,
    url: publicUrl,
    image_url: publicUrl,
    fileName: uniqueName,
    key: `${cleanFolder}/${uniqueName}`,
  }
}

export async function POST(request) {
  try {
    const contentTypeHeader = request.headers.get('content-type') || ''
    
    // Check if multipart/form-data
    if (contentTypeHeader.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') || formData.get('image')
      const folder = formData.get('folder') || 'uploads'

      if (!file || typeof file === 'string') {
        return Response.json({ success: false, error: 'No file provided in form data' }, { status: 400 })
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const fileName = file.name || 'upload.jpg'

      // Check if S3 credentials are fully configured
      const hasS3 = Boolean(
        (process.env.ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID) &&
        (process.env.SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY) &&
        (process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME)
      )

      if (hasS3) {
        try {
          const { uploadBufferToS3 } = await import('@/lib/s3')
          const result = await uploadBufferToS3(buffer, {
            fileName,
            contentType: file.type || 'image/jpeg',
            folder,
          })
          return Response.json({
            success: true,
            url: result.url,
            image_url: result.url,
            fileName: result.key,
            key: result.key,
          })
        } catch (s3Err) {
          console.warn('S3 upload failed, falling back to local storage:', s3Err.message)
        }
      }

      // Default high-performance local storage
      const result = await saveFileLocally(buffer, fileName, folder)
      return Response.json(result)
    }

    // JSON body (base64 image)
    const body = await request.json()
    const { image, fileName: customFileName, folder = 'uploads' } = body

    if (!image || typeof image !== 'string') {
      return Response.json({ success: false, error: 'No image provided' }, { status: 400 })
    }

    const { contentType, buffer } = parseBase64(image)
    
    let ext = 'jpg'
    if (contentType.includes('png')) ext = 'png'
    else if (contentType.includes('webp')) ext = 'webp'
    else if (contentType.includes('gif')) ext = 'gif'
    else if (contentType.includes('svg')) ext = 'svg'

    const fileName = customFileName || `upload.${ext}`

    const hasS3 = Boolean(
      (process.env.ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID) &&
      (process.env.SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY) &&
      (process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME)
    )

    if (hasS3) {
      try {
        const { uploadBufferToS3 } = await import('@/lib/s3')
        const result = await uploadBufferToS3(buffer, {
          fileName,
          contentType,
          folder,
        })
        return Response.json({
          success: true,
          url: result.url,
          image_url: result.url,
          fileName: result.key,
          key: result.key,
        })
      } catch (s3Err) {
        console.warn('S3 upload failed, falling back to local storage:', s3Err.message)
      }
    }

    // Default local storage
    const result = await saveFileLocally(buffer, fileName, folder)
    return Response.json(result)
  } catch (error) {
    console.error('Image upload error:', error)
    return Response.json({ success: false, error: error.message || 'Image upload failed' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key') || searchParams.get('file')

    if (!key) {
      return Response.json({ success: false, error: 'No key provided' }, { status: 400 })
    }

    // Check if it is a local upload
    const cleanKey = key.replace(/^\/+/, '')
    const localPath = path.join(process.cwd(), 'public', cleanKey)
    try {
      await fs.unlink(localPath)
      return Response.json({ success: true, message: 'Local image deleted' })
    } catch {
      // File may not exist locally or could be S3
    }

    // Try S3 if configured
    if (
      (process.env.ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID) &&
      (process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME)
    ) {
      const { deleteObjectFromS3 } = await import('@/lib/s3')
      const result = await deleteObjectFromS3(key)
      return Response.json(result)
    }

    return Response.json({ success: true, message: 'Delete completed' })
  } catch (error) {
    console.error('Image delete error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
