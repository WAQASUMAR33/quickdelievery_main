import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Verification API is working',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        DATABASE_URL: !!process.env.DATABASE_URL
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
