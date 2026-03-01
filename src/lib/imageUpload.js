const UPLOAD_API          = process.env.NEXT_PUBLIC_UPLOAD_IMAGE_API
const UPLOADED_IMAGE_URL  = process.env.NEXT_PUBLIC_UPLOADED_IMAGE_URL

// Convert a File object to a base64 data-URL string
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)   // "data:image/png;base64,..."
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export const uploadProductImage = async (file) => {
  try {
    const base64 = await toBase64(file)

    const response = await fetch(UPLOAD_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64 }),
    })

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`)
    }

    const data = await response.json()

    if (data.image_url) {
      return {
        success: true,
        url: `${UPLOADED_IMAGE_URL}/${data.image_url}`,
        fileName: data.image_url,
      }
    }

    return {
      success: false,
      error: data.error || 'Upload failed',
    }

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
    const failed     = results.filter((r) => !r.success)

    return {
      success: successful.length > 0,
      urls:    successful.map((r) => r.url),
      errors:  failed.map((r) => r.error),
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
