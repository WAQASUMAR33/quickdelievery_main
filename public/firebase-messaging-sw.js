// Service Worker for Firebase Cloud Messaging in browser / PWA
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyCTYv79PliKT8Kw8hvebzENiI3b4aYfIXw",
  authDomain: "quickdelievery-a86be.firebaseapp.com",
  projectId: "quickdelievery-a86be",
  storageBucket: "quickdelievery-a86be.firebasestorage.app",
  messagingSenderId: "307023567388",
  appId: "1:307023567388:web:ca357d12b4763c15cf9dd9",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload)
  const notificationTitle = payload.notification?.title || 'Quick Delivery Update'
  const notificationOptions = {
    body: payload.notification?.body || 'Your order status has changed.',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data,
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})
