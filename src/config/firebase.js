import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxZFIQyPFbA54wfII9NPmoPmj_1AfP4UY",
  authDomain: "sanatan-dharma-f1ee1.firebaseapp.com",
  projectId: "sanatan-dharma-f1ee1",
  storageBucket: "sanatan-dharma-f1ee1.firebasestorage.app",
  messagingSenderId: "661974501172",
  appId: "1:661974501172:web:9476f5de576b4ee6a8c761",
  measurementId: "G-VQFRSEPZY3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
const db = getFirestore(app);
const storage = getStorage(app);

// Analytics is only supported in certain environments (like web)
let analytics;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export { app, auth, db, storage, analytics };
