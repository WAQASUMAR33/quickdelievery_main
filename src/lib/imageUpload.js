// Convert a File object to a base64 data-URL string
export const fileToBase64DataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

/**
 * Uploads a base64 image data string to the backend S3 upload API
 */
export const uploadBase64Image = async (base64Image, fileName = null, folder = 'uploads') => {
  try {
    if (!base64Image || typeof base64Image !== 'string') {
      return { success: false, error: 'No image data provided' }
    }

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        fileName,
        folder,
      }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Upload failed with status ${response.status}`,
        hint: data.hint,
      }
    }

    if (data.success && data.url) {
      return {
        success: true,
        url: data.url,
        fileName: data.fileName || data.key || data.url,
        image_url: data.image_url || data.url,
      }
    }

    return {
      success: false,
      error: data.error || 'Upload failed: Server did not return a valid URL',
    }
  } catch (error) {
    console.error('Error uploading image to S3:', error)
    return { success: false, error: error.message || 'Network error during upload' }
  }
}

/**
 * Uploads a File object directly to Amazon S3 via the backend API
 */
export const uploadProductImage = async (file, folder = 'uploads') => {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Try FormData upload first for efficiency with larger files
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok && data.success && data.url) {
        return {
          success: true,
          url: data.url,
          fileName: data.fileName || data.key || data.url,
          image_url: data.image_url || data.url,
        }
      }
    } catch {
      // Fallback to base64 if FormData fails
    }

    // Fallback: convert to base64 data URL
    const base64 = await fileToBase64DataUrl(file)
    return await uploadBase64Image(base64, file.name, folder)
  } catch (error) {
    console.error('Error in uploadProductImage:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Uploads multiple File objects in parallel
 */
export const uploadMultipleImages = async (files, folder = 'uploads') => {
  try {
    if (!files || files.length === 0) {
      throw new Error('No files provided')
    }

    const results = await Promise.all(
      Array.from(files).map((file) => uploadProductImage(file, folder))
    )

    const successful = results.filter((r) => r.success)
    const failed = results.filter((r) => !r.success)

    return {
      success: successful.length > 0,
      urls: successful.map((r) => r.url),
      errors: failed.map((r) => r.error),
    }
  } catch (error) {
    console.error('Error uploading multiple images to S3:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Deletes an image from Amazon S3
 */
export const deleteProductImage = async (fileNameOrUrl) => {
  try {
    if (!fileNameOrUrl) return { success: false, error: 'No file specified' }

    const response = await fetch(`/api/upload-image?key=${encodeURIComponent(fileNameOrUrl)}`, {
      method: 'DELETE',
    })
    const data = await response.json().catch(() => ({}))
    return data
  } catch (err) {
    console.error('Error deleting image from S3:', err)
    return { success: false, error: err.message }
  }
}
