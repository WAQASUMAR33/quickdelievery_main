import { initializeApp, getApps, getApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCTYv79PliKT8Kw8hvebzENiI3b4aYfIXw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "quickdelievery-a86be.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "quickdelievery-a86be",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "quickdelievery-a86be.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "307023567388",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:307023567388:web:ca357d12b4763c15cf9dd9",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-8KSMCK5B4Z"
}

// Initialize or reuse Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

// Messaging helper (client-side only)
export const getClientMessaging = async () => {
  if (typeof window !== 'undefined') {
    const supported = await isSupported()
    if (supported) {
      return getMessaging(app)
    }
  }
  return null
}

export { app, firebaseConfig }
