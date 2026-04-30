/** Shared helpers: PHP uploadImage.php returns filenames or URLs; normalize to absolute URL. */

export function trimSlash(s) {
  return String(s || '').replace(/\/+$/, '')
}

export function joinBaseAndPath(base, path) {
  const b = trimSlash(base)
  const p = String(path || '').replace(/^\/+/, '')
  if (!b) return p ? `/${p}` : ''
  return `${b}/${p}`
}

export function resolvePublicImageUrl(data, baseUrlRaw) {
  const baseUrl = trimSlash(baseUrlRaw)
  const errMsg = typeof data?.message === 'string' ? data.message : ''
  const err = data?.error || errMsg || null

  const pickString = (...keys) => {
    for (const k of keys) {
      const v = data?.[k]
      if (typeof v === 'string' && v.trim()) return v.trim()
      if (data?.data && typeof data.data[k] === 'string' && data.data[k].trim())
        return data.data[k].trim()
    }
    return null
  }

  const full = pickString('url', 'imageUrl', 'file_url', 'fileUrl')
  if (full && /^https?:\/\//i.test(full)) return { url: full, relative: null, err }

  const relative = pickString('image_url', 'filename', 'file', 'path', 'name')
  if (relative && /^https?:\/\//i.test(relative)) return { url: relative, relative, err }

  if (relative && baseUrl) {
    return { url: joinBaseAndPath(baseUrl, relative), relative, err }
  }

  if (relative) {
    return { url: relative.startsWith('/') ? relative : `/${relative}`, relative, err }
  }

  return { url: null, relative: null, err: err || 'Upload server did not return an image URL' }
}

export function normalizePhpUploadJson(data, imageBaseUrl) {
  if (data.success === false || data.success === 'false' || data.success === 0) {
    return {
      ok: false,
      error: data.error || data.message || 'Upload rejected by server',
    }
  }

  if (data.error && !data.image_url && !data.url && !data.filename) {
    return { ok: false, error: String(data.error) }
  }

  const { url, relative, err } = resolvePublicImageUrl(data, imageBaseUrl)
  if (!url) return { ok: false, error: err || 'Could not resolve image URL' }

  return {
    ok: true,
    url,
    image_url: relative || url,
  }
}
