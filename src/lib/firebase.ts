import { getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let firebaseApp: FirebaseApp | null = null
let firestore: Firestore | null = null

export function hasFirebaseConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  )
}

export function getFirebaseApp() {
  if (!hasFirebaseConfig()) {
    return null
  }

  if (!firebaseApp) {
    firebaseApp = getApps()[0] ?? initializeApp(firebaseConfig)
  }

  return firebaseApp
}

export function getDb() {
  const app = getFirebaseApp()

  if (!app) {
    return null
  }

  if (!firestore) {
    firestore = getFirestore(app)
  }

  return firestore
}
