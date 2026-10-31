// Convert a File object to a base64 data-URL string
export const fileToBase64DataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

/**
 * Client-side image compression to prevent 413 Payload Too Large errors
 * on serverless platforms (e.g. AWS Amplify / Lambda 4.5MB ceiling).
 */
export const compressImageFile = async (file, { maxWidth = 1200, maxHeight = 1200, quality = 0.85 } = {}) => {
  if (typeof window === 'undefined' || !file || !file.type || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file
  }
  // If file is already under 400KB, keep as-is
  if (file.size <= 400 * 1024) return file

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        let { width, height } = img
        if (width <= maxWidth && height <= maxHeight && file.size <= 800 * 1024) {
          resolve(file)
          return
        }
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }
            const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(compressed)
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => resolve(file)
      img.src = e.target.result
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

/**
 * Uploads a base64 image data string to the backend upload API
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
    console.error('Error uploading image:', error)
    return { success: false, error: error.message || 'Network error during upload' }
  }
}

/**
 * Uploads a File object directly to the backend API
 */
export const uploadProductImage = async (file, folder = 'uploads') => {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Auto-compress high-resolution camera / phone images client-side
    let uploadFile = file
    try {
      uploadFile = await compressImageFile(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.82 })
    } catch (compressErr) {
      console.warn('Image auto-compression skipped:', compressErr)
    }

    // Try FormData upload first for efficiency with larger files
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
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
    const base64 = await fileToBase64DataUrl(uploadFile)
    return await uploadBase64Image(base64, uploadFile.name || file.name, folder)
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
    console.error('Error uploading multiple images:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Deletes an image via the backend API
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
    console.error('Error deleting image:', err)
    return { success: false, error: err.message }
  }
}
