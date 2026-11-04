// Service Worker for Firebase Cloud Messaging in browser / PWA
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js')

const params = new URL(self.location.href).searchParams
const apiKey = params.get('apiKey')
const projectId = params.get('projectId')
const messagingSenderId = params.get('messagingSenderId')
const appId = params.get('appId')

if (apiKey && projectId) {
  firebase.initializeApp({
    apiKey: apiKey,
    authDomain: `${projectId}.firebaseapp.com`,
    projectId: projectId,
    storageBucket: `${projectId}.firebasestorage.app`,
    messagingSenderId: messagingSenderId,
    appId: appId,
  })

  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload)
    const notificationTitle = payload.notification?.title || 'MartZona Update'
    const notificationOptions = {
      body: payload.notification?.body || 'Your order status has changed.',
      icon: '/logo.png',
      badge: '/logo.png',
      data: payload.data,
    }

    self.registration.showNotification(notificationTitle, notificationOptions)
  })
}
