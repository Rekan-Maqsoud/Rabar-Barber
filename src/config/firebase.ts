import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
// import { getAnalytics } from "firebase/analytics"; // Analytics is not supported in Expo Go by default without extra setup

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBMgGKzuSM8c164D3n9FCesAs8wuBWV9cA",
  authDomain: "rabar-barber.firebaseapp.com",
  databaseURL: "https://rabar-barber-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "rabar-barber",
  storageBucket: "rabar-barber.firebasestorage.app",
  messagingSenderId: "775038906420",
  appId: "1:775038906420:web:3980e9f2abc86a5f135a61",
  measurementId: "G-MVP8FWX1RR"
};

export const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const db = getDatabase(app);
