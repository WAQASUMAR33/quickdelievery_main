import { normalizePhpUploadJson } from '@/lib/uploadImageResolve'

// Convert a File object to a base64 data-URL string
export const fileToBase64DataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

function cleanEnv(val) {
  return String(val ?? '')
    .trim()
    .replace(/^["']|["']$/g, '')
}

/**
 * Calls uploadImage.php with JSON body. Used in the browser directly (PHP allows CORS)
 * when NEXT_PUBLIC_UPLOAD_IMAGE_API is an absolute URL — avoids Node fetch issues on some networks.
 */
async function postPhpUpload(base64Image) {
  const uploadApi = cleanEnv(process.env.NEXT_PUBLIC_UPLOAD_IMAGE_API)

  const imageBaseUrl = cleanEnv(process.env.NEXT_PUBLIC_UPLOADED_IMAGE_URL)

  if (!uploadApi || !/^https?:\/\//i.test(uploadApi)) return null

  const response = await fetch(uploadApi, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ image: base64Image }),
  })

  const text = await response.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return {
      success: false,
      error: response.ok ? 'Invalid JSON from upload server' : text.slice(0, 160),
    }
  }

  if (!response.ok) {
    return {
      success: false,
      error:
        (typeof data?.error === 'string' && data.error) ||
        `Upload failed (HTTP ${response.status})`,
    }
  }

  const normalized = normalizePhpUploadJson(data, imageBaseUrl)
  if (!normalized.ok) {
    return { success: false, error: normalized.error }
  }

  return {
    success: true,
    url: normalized.url,
    fileName: normalized.image_url,
  }
}

async function postViaNextProxy(base64Image) {
  const response = await fetch('/api/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    return {
      success: false,
      error: data.error || `Upload proxy failed (${response.status})`,
    }
  }

  if (data.success && data.url) {
    return {
      success: true,
      url: data.url,
      fileName: data.image_url,
    }
  }

  return {
    success: false,
    error: data.error || 'Upload failed',
  }
}

/**
 * Sends base64 to uploadImage.php. In the browser, calls PHP directly first (same TLS stack as Chrome);
 * falls back to the Next.js `/api/upload-image` proxy if that path is not used or throws.
 */
export const uploadBase64Image = async (base64Image) => {
  try {
    if (!base64Image || typeof base64Image !== 'string') {
      return { success: false, error: 'No image data' }
    }

    if (typeof window !== 'undefined') {
      try {
        const direct = await postPhpUpload(base64Image)
        if (direct !== null) {
          return direct
        }
      } catch (e) {
        console.warn('Direct PHP upload failed, using Next proxy:', e.message)
      }
    }

    return await postViaNextProxy(base64Image)
  } catch (error) {
    console.error('Error uploading image:', error)
    return { success: false, error: error.message }
  }
}

export const uploadProductImage = async (file) => {
  try {
    const base64 = await fileToBase64DataUrl(file)
    return uploadBase64Image(base64)
  } catch (error) {
    console.error('Error uploading image:', error)
    return { success: false, error: error.message }
  }
}

export const uploadMultipleImages = async (files) => {
  try {
    if (!files || files.length === 0) {
      throw new Error('No files provided')
    }

    const results = await Promise.all(
      Array.from(files).map((file) => uploadProductImage(file))
    )

    const successful = results.filter((r) => r.success)
    const failed = results.filter((r) => !r.success)

    return {
      success: successful.length > 0,
      urls: successful.map((r) => r.url),
      errors: failed.map((r) => r.error),
    }
  } catch (error) {
    console.error('Error uploading multiple images:', error)
    return { success: false, error: error.message }
  }
}

export const deleteProductImage = async (fileName) => {
  console.warn('Delete image not supported on external server for:', fileName)
  return { success: true }
}
