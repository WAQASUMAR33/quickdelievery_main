export async function POST(request) {
  try {
    const body = await request.json()
    const { image } = body

    if (!image) {
      return Response.json({ success: false, error: 'No image provided' }, { status: 400 })
    }

    const uploadApi = process.env.NEXT_PUBLIC_UPLOAD_IMAGE_API
    if (!uploadApi) {
      return Response.json({ success: false, error: 'Upload API not configured' }, { status: 500 })
    }

    const res = await fetch(uploadApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image }),
    })

    if (!res.ok) {
      return Response.json({ success: false, error: `Upload server returned ${res.status}` }, { status: 502 })
    }

    const data = await res.json()

    if (data.image_url) {
      const baseUrl = process.env.NEXT_PUBLIC_UPLOADED_IMAGE_URL || ''
      return Response.json({
        success: true,
        image_url: data.image_url,
        url: `${baseUrl}/${data.image_url}`,
      })
    }

    return Response.json({ success: false, error: data.error || 'Upload failed' }, { status: 500 })

  } catch (error) {
    console.error('Image upload proxy error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
