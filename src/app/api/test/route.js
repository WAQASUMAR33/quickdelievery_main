import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Verification API is working',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: !!process.env.DATABASE_URL,
        googleAuth: {
          apiKeyConfigured: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'Not configured in env',
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not configured in env',
          appIdConfigured: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          endpoint: '/api/auth/google',
          status: (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) ? 'READY' : 'INCOMPLETE'
        },
        googleMaps: {
          clientKeyConfigured: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          serverKeyConfigured: !!process.env.GOOGLE_GEOCODING_API_KEY
        }
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
