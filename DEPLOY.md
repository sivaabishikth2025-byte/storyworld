# Deploy STORYWORLD

## Live (AWS Amplify — needs GitHub connect)

App created: `d10q1463022u77`  
Console: https://us-east-1.console.aws.amazon.com/amplify/apps/d10q1463022u77/overview

1. Open console → **Host web app** → Connect **GitHub** → select `storyworld` → branch `master`
2. Build uses `amplify.yml` automatically
3. Env vars already set: `WLT_API_KEY`, `AUTH_SECRET`, `NODE_ENV`

## Fastest: Vercel (1 click)

Repo is public: https://github.com/sivaabishikth2025-byte/storyworld

**Import:** https://vercel.com/new/clone?repository-url=https://github.com/sivaabishikth2025-byte/storyworld

Add env vars: `AUTH_SECRET`, `WLT_API_KEY`, AWS keys for Nova Reel.

## Docker / App Runner

```bash
docker build -t storyworld .
docker run -p 3000:3000 --env-file .env.local storyworld
```
