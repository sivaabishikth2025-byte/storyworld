# Deploy STORYWORLD to Firebase App Hosting

STORYWORLD is a **Next.js full-stack app** (API routes, auth, AWS/Marble integrations). Use **Firebase App Hosting**, not classic static Hosting.

## Prerequisites

1. Firebase project on the **Blaze** plan
2. [Firebase CLI](https://firebase.google.com/docs/cli): `npm i -g firebase-tools`
3. Login: `firebase login`

## One-time setup

```bash
# Link project (copy .firebaserc.example → .firebaserc first)
firebase use YOUR_FIREBASE_PROJECT_ID

# Create App Hosting secrets (you will be prompted for values)
firebase apphosting:secrets:set AUTH_SECRET
firebase apphosting:secrets:set WLT_API_KEY

# AWS credentials for Nova Reel (if not using workload identity)
# Set these in Google Cloud Secret Manager and reference in apphosting.yaml
```

Add AWS env vars to `apphosting.yaml` as secrets if you use Nova Reel in production:

```yaml
  - variable: AWS_ACCESS_KEY_ID
    secret: AWS_ACCESS_KEY_ID
  - variable: AWS_SECRET_ACCESS_KEY
    secret: AWS_SECRET_ACCESS_KEY
  - variable: AWS_REGION
    value: us-east-1
```

## Deploy

```bash
npm run build   # verify locally first
firebase deploy
```

## Auth on Firebase

- Local dev: accounts stored in `data/users.json`
- Firebase: accounts stored in **Firestore** collection `storyworld_users` (auto when `GOOGLE_CLOUD_PROJECT` is set or `STORYWORLD_AUTH_STORE=firestore`)

## Images

World thumbnails are proxied through `/api/world/asset?kind=thumb` so they load reliably in Chrome and on Firebase (no cross-origin Marble CDN blocking).

## Local dev

```bash
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 (or the port shown in terminal).
