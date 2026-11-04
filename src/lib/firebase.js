import { initializeApp, getApps, getApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported as isMessagingSupported } from 'firebase/messaging'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics'

// Production Firebase Configuration for MartZona
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDbZC6BzYCxpE697lvI_f9PZarsUi21T3w",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "martzona-ab93a.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "martzona-ab93a",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "martzona-ab93a.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "469654137216",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:469654137216:web:7111c08bd58e3a964bf965",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-ED09TC80WL"
}

// Initialize or reuse Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

// Initialize Analytics (Safe for SSR / client-side only)
let analytics = null
if (typeof window !== 'undefined') {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app)
    }
  }).catch(() => {})
}

// Analytics helper
export const getFirebaseAnalytics = async () => {
  if (typeof window !== 'undefined') {
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
  if (typeof window !== 'undefined') {
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
  if (typeof window !== 'undefined') {
    const supported = await isMessagingSupported().catch(() => false)
    if (supported) {
      return getMessaging(app)
    }
  }
  return null
}

export { app, analytics, firebaseConfig, signInWithPopup, getAnalytics }
