import { initializeApp, getApps, getApp } from 'firebase/app'
import { getMessaging, isSupported as isMessagingSupported } from 'firebase/messaging'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics'

// Production Firebase Configuration for MartZona (strictly loaded from .env)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize or reuse Firebase App
const app = getApps().length > 0 
  ? getApp() 
  : (firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null)

// Initialize Analytics (SSR-safe browser check)
let analytics = null
if (typeof window !== 'undefined' && app) {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app)
    }
  }).catch(() => {})
}

// Analytics helper
export const getFirebaseAnalytics = async () => {
  if (typeof window !== 'undefined' && app) {
    if (analytics) return analytics
    const supported = await isAnalyticsSupported().catch(() => false)
    if (supported) {
      analytics = getAnalytics(app)
      return analytics
    }
  }
  return null
}

// Auth helper
export const getFirebaseAuth = () => {
  if (typeof window !== 'undefined' && app) {
    return getAuth(app)
  }
  return null
}

export const getGoogleAuthProvider = () => {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return provider
}

// Messaging helper (client-side only)
export const getClientMessaging = async () => {
  if (typeof window !== 'undefined' && app) {
    const supported = await isMessagingSupported().catch(() => false)
    if (supported) {
      return getMessaging(app)
    }
  }
  return null
}

export { app, analytics, firebaseConfig, signInWithPopup, getAnalytics }
