import { NextResponse } from 'next/server'
import { getShoppableVideos, createShoppableVideo } from '@/lib/socialCommerce'

export async function GET() {
  try {
    const videos = await getShoppableVideos()
    return NextResponse.json({ success: true, videos })
  } catch (error) {
    console.error('Fetch shoppable videos error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { title, videoUrl, thumbnailUrl, vendorId, taggedProductIds } = body

    if (!title || !videoUrl || !vendorId) {
      return NextResponse.json(
        { error: 'title, videoUrl, and vendorId are required' },
        { status: 400 }
      )
    }

    const video = await createShoppableVideo({
      title,
      videoUrl,
      thumbnailUrl,
      vendorId,
      taggedProductIds,
    })

    return NextResponse.json({ success: true, video })
  } catch (error) {
    console.error('Create shoppable video error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
