export const runtime = 'nodejs'

import { normalizePhpUploadJson } from '@/lib/uploadImageResolve'

function cleanEnv(val) {
  return String(val || '')
    .trim()
    .replace(/^["']|["']$/g, '')
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { image } = body

    if (!image || typeof image !== 'string') {
      return Response.json({ success: false, error: 'No image provided' }, { status: 400 })
    }

    const uploadApi = cleanEnv(process.env.UPLOAD_IMAGE_API || process.env.NEXT_PUBLIC_UPLOAD_IMAGE_API)
    if (!uploadApi) {
      return Response.json(
        {
          success: false,
          error: 'Upload API not configured (set UPLOAD_IMAGE_API or NEXT_PUBLIC_UPLOAD_IMAGE_API)',
        },
        { status: 500 }
      )
    }

    const imageBaseUrl = cleanEnv(
      process.env.UPLOADED_IMAGE_BASE_URL || process.env.NEXT_PUBLIC_UPLOADED_IMAGE_URL
    )

    let res
    try {
      res = await fetch(uploadApi, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({ image }),
      })
    } catch (fetchErr) {
      const code = fetchErr.cause?.code || fetchErr.cause?.syscall
      const detail = fetchErr.cause?.message ? ` ${fetchErr.cause.message}` : ''
      return Response.json(
        {
          success: false,
          error: `Cannot reach upload server: ${fetchErr.message}${code ? ` [${code}]` : ''}${detail}`,
          hint:
            'The browser uploads directly when possible (bypass). If both fail, check VPN/antivirus/firewall or PHP URL.',
        },
        { status: 502 }
      )
    }

    const text = await res.text()

    if (!res.ok) {
      console.error('Upload server HTTP', res.status, text.slice(0, 500))
      return Response.json(
        {
          success: false,
          error: `Upload server returned ${res.status}. ${text.slice(0, 120).replace(/\s+/g, ' ')}`,
        },
        { status: 502 }
      )
    }

    let data
    try {
      data = JSON.parse(text)
    } catch {
      console.error('Upload server non-JSON response:', text.slice(0, 500))
      return Response.json({ success: false, error: `Upload server error: ${text.slice(0, 200)}` }, { status: 502 })
    }

    const normalized = normalizePhpUploadJson(data, imageBaseUrl)
    if (!normalized.ok) {
      return Response.json(
        {
          success: false,
          error: normalized.error,
          debug:
            process.env.NODE_ENV === 'development' && typeof data === 'object' && data
              ? { keys: Object.keys(data) }
              : undefined,
        },
        { status: 502 }
      )
    }

    return Response.json({
      success: true,
      image_url: normalized.image_url,
      url: normalized.url,
    })

  } catch (error) {
    console.error('Image upload proxy error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
