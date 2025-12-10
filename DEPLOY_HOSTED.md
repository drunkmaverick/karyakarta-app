## Deploying to Vercel (hosted)

These steps assume a hosted deployment (not `next export`). The app has many `app/api/*` routes that require a server runtime, so use the standard Vercel build (no static export).

### 1) Prereqs
- Node 18+ in Vercel project settings.
- Framework: **Next.js** (detected automatically).
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `.next`

### 2) Required environment variables
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `FIREBASE_PROJECT_ID`
- `GCLOUD_PROJECT`

Payments (optional — only if enabling payments):
- `RAZORPAY_KEY_ID_TEST`
- `RAZORPAY_KEY_SECRET_TEST`
- `NEXT_PUBLIC_RAZORPAY_KEY_TEST`
- `RAZORPAY_WEBHOOK_SECRET_TEST`

Sentry (optional if used in your project):
- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`

### 3) Recommended Vercel project settings
- **Node version**: 18 or 20
- **Build Command**: `npm run build`
- **Install Command**: `npm ci`
- **Output**: `.next`
- **Serverless Functions**: leave enabled (needed for `app/api/*`).

### 4) Deployment steps
1. `npm ci`
2. `npm run build`
3. Connect the repo to Vercel and set the environment variables above in the Vercel dashboard.
4. Deploy via Vercel (Git integration or `vercel --prod`).

### 5) Verification checklist (after deploy)
- Hit the deployed URL homepage and confirm it renders.
- Exercise auth: login/signup flows with test credentials.
- Call a sample API route (e.g., `GET /api/ping`) from the browser or curl and confirm 200 OK.
- Trigger a booking flow and a payouts flow in the hosted environment.
- Confirm push/notification test endpoint responds (if enabled).

### 6) Local preview (optional)
- Use `vercel dev` to run the Vercel emulation locally with the same env vars before pushing.

### Notes
- Do **not** run `next export` for hosted deploys; the API routes require the server runtime.
- If you later point Capacitor to the hosted app, set `server.url` in `capacitor.config.ts` to the deployed URL and rebuild/sync native projects.


