export const runtime = 'nodejs'

import { uploadBufferToS3, deleteObjectFromS3 } from '@/lib/s3'

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
      const contentType = file.type || 'image/jpeg'

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
    }

    // JSON body (base64 image)
    const body = await request.json()
    const { image, fileName: customFileName, folder = 'uploads' } = body

    if (!image || typeof image !== 'string') {
      return Response.json({ success: false, error: 'No image provided' }, { status: 400 })
    }

    const { contentType, buffer } = parseBase64(image)
    
    // Derive extension from mime type if available
    let ext = 'jpg'
    if (contentType.includes('png')) ext = 'png'
    else if (contentType.includes('webp')) ext = 'webp'
    else if (contentType.includes('gif')) ext = 'gif'
    else if (contentType.includes('svg')) ext = 'svg'

    const fileName = customFileName || `upload.${ext}`

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
  } catch (error) {
    console.error('AWS S3 Image upload error:', error)
    
    // Friendly error message for missing credentials
    if (error.message?.includes('AWS credentials missing') || error.message?.includes('AWS_S3_BUCKET_NAME')) {
      return Response.json(
        {
          success: false,
          error: error.message,
          hint: 'Please update AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME in .env',
        },
        { status: 500 }
      )
    }

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

    const result = await deleteObjectFromS3(key)
    return Response.json(result)
  } catch (error) {
    console.error('AWS S3 Image delete error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
