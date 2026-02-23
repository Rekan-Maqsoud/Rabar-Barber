/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/12.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.9.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBMgGKzuSM8c164D3n9FCesAs8wuBWV9cA',
  authDomain: 'rabar-barber.firebaseapp.com',
  databaseURL: 'https://rabar-barber-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'rabar-barber',
  storageBucket: 'rabar-barber.firebasestorage.app',
  messagingSenderId: '775038906420',
  appId: '1:775038906420:web:3980e9f2abc86a5f135a61',
  measurementId: 'G-MVP8FWX1RR',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Queue Update';
  const body = payload.notification?.body || 'There is a new queue update.';

  self.registration.showNotification(title, {
    body,
    icon: '/favicon.png',
  });
});
