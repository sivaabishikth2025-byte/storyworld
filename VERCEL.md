# Deploy STORYWORLD on Vercel

## Quick deploy

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. Framework preset: **Next.js** (auto-detected)
4. Add environment variables:

| Variable | Required |
|----------|----------|
| `AUTH_SECRET` | Yes — long random string |
| `WLT_API_KEY` | Yes — Marble API key |
| `AWS_ACCESS_KEY_ID` | For Nova Reel |
| `AWS_SECRET_ACCESS_KEY` | For Nova Reel |
| `AWS_REGION` | `us-east-1` |

5. Deploy

## CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

## Notes

- Auth uses `data/users.json` locally; on Vercel use `STORYWORLD_AUTH_STORE=firestore` with a Firebase/GCP project, or switch to a hosted DB later.
- Featured hero uses an interactive Three.js globe (no external thumbnail images).
- API routes need Vercel **Pro** or sufficient function timeout for Nova/Marble jobs (up to 300s on Pro).
