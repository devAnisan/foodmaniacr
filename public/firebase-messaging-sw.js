importScripts('https://www.gstatic.com/firebasejs/12.12.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.12.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyAVa3rTeQlMYUNSapSVCPB14FaVqBjIXTc",
  authDomain: "foodmania.cr",
  projectId: "foodmania-c5b76",
  storageBucket: "foodmania-c5b76.firebasestorage.app",
  messagingSenderId: "344119940642",
  appId: "1:344119940642:web:cea70136f077e865c25c7b",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {}
  self.registration.showNotification(title || 'Foodmania CR', {
    body: body || '',
    icon: '/logoFoodmania1.PNG',
  })
})
