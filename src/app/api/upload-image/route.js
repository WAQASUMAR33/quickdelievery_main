export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { image } = body

    if (!image) {
      return Response.json({ success: false, error: 'No image provided' }, { status: 400 })
    }

    const uploadApi = (process.env.NEXT_PUBLIC_UPLOAD_IMAGE_API || '').trim()
    if (!uploadApi) {
      return Response.json({ success: false, error: 'Upload API not configured' }, { status: 500 })
    }

    let res
    try {
      res = await fetch(uploadApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
    } catch (fetchErr) {
      return Response.json({ success: false, error: `Cannot reach upload server: ${fetchErr.message}` }, { status: 502 })
    }

    const text = await res.text()

    let data
    try {
      data = JSON.parse(text)
    } catch {
      console.error('Upload server non-JSON response:', text.slice(0, 500))
      return Response.json({ success: false, error: `Upload server error: ${text.slice(0, 200)}` }, { status: 502 })
    }

    if (data.image_url) {
      const baseUrl = (process.env.NEXT_PUBLIC_UPLOADED_IMAGE_URL || '').trim()
      return Response.json({
        success: true,
        image_url: data.image_url,
        url: `${baseUrl}/${data.image_url}`,
      })
    }

    return Response.json({ success: false, error: data.error || 'Upload server did not return image_url' }, { status: 500 })

  } catch (error) {
    console.error('Image upload proxy error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
