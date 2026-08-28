import { firestoreCreateUser, firestoreEnabled, firestoreFindUserByEmail } from "./firestore"
import { hashPassword } from "./session"
import type { StoredUser } from "./types"
import { createFileUser, findFileUserByEmail } from "./usersFile"

export type { StoredUser } from "./types"

export async function findUserByEmail(email: string) {
  if (firestoreEnabled()) return firestoreFindUserByEmail(email)
  return findFileUserByEmail(email)
}

export async function createUser(input: { email: string; name: string; password: string }) {
  const user: StoredUser = {
    id: crypto.randomUUID(),
    email: input.email.toLowerCase().trim(),
    name: input.name.trim(),
    passwordHash: hashPassword(input.password),
    createdAt: Date.now(),
  }
  if (firestoreEnabled()) return firestoreCreateUser(user)
  return createFileUser(user)
}
