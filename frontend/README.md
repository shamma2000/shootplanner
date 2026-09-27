# ShootPlanner frontend

TanStack Start frontend for ShootPlanner.

## Run locally

The FastAPI backend should be running on port `8000` first.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

The required environment variable is:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Open `http://localhost:3000`.

## Validate

```powershell
npx tsc --noEmit
npm run lint
npm run build
```

## Amplify build

```powershell
npm run build:amplify
```

This creates `.amplify-hosting/` with static assets, the TanStack Start SSR
compute bundle, and the Amplify deployment manifest. The repository-level
`amplify.yml` runs this command in AWS Amplify Hosting.
