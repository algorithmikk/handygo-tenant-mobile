# HandyGo Tenant Mobile

Expo (SDK 54) app for property tenants — create and track maintenance requests.

## Setup

```bash
cp .env.example .env
npm ci
npx expo start
```

API default: `https://handygo.vercel.app/backend/api/v1` (Vercel → ALB proxy).

## Pilot login

`tenant@pilot.handygo.ae` / `PilotTenant123!`

## Verify & CI

```bash
npm run verify
```

GitHub Actions: CI gate, TestFlight, Android preview APK, Play/release workflows (see `HandyGo/mobile/*_COOKBOOK.md`).

EAS project: `2867d6a4-f618-42b2-9f3e-95e7681198fd`
