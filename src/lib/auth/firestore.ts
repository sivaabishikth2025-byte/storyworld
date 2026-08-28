import { getApps, initializeApp, type App } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import type { StoredUser } from "./types"

const USERS_COLLECTION = "storyworld_users"

let app: App | null = null

function cloudProjectId() {
  return process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || null
}

export function firestoreEnabled() {
  return process.env.STORYWORLD_AUTH_STORE === "firestore" || Boolean(cloudProjectId())
}

function getApp() {
  if (app) return app
  if (!firestoreEnabled()) throw new Error("Firestore auth store is not enabled")
  app = getApps()[0] || initializeApp({ projectId: cloudProjectId() || undefined })
  return app
}

function db() {
  return getFirestore(getApp())
}

export async function firestoreFindUserByEmail(email: string) {
  const snap = await db().collection(USERS_COLLECTION).where("email", "==", email.toLowerCase()).limit(1).get()
  if (snap.empty) return null
  return snap.docs[0].data() as StoredUser
}

export async function firestoreCreateUser(user: StoredUser) {
  const existing = await firestoreFindUserByEmail(user.email)
  if (existing) throw new Error("An account with this email already exists.")
  await db().collection(USERS_COLLECTION).doc(user.id).set(user)
  return user
}
