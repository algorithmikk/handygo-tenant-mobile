# HandyGo iOS / TestFlight Runbook

Same dual-track model as UmaMeats customer/driver.

| App | Bundle ID | EAS project ID |
|-----|-----------|----------------|
| Tenant | `com.handygo.tenant` | `2867d6a4-f618-42b2-9f3e-95e7681198fd` |
| Handyman | `com.handygo.technician` | `c197aaa3-719b-416c-8183-04b226706df5` |
| Admin | `com.handygo.management` | `4066da7b-fdc3-4367-9965-ad7859e9fb0f` |

## Beta (soak)

Push to `main` → `eas-testflight.yml` → EAS iOS production profile → TestFlight.

Requires GitHub secrets:

- `EXPO_TOKEN`
- `ASC_API_KEY_BASE64`
- `ASC_DEMO_PASSWORD` (reviewer demo password)

Vars: `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_APP_ID` (create ASC app records first), `APPLE_TEAM_ID` (`NM4ZT8W7HH`).

Until ASC App IDs exist, iOS submit steps stay blocked — create apps in App Store Connect for each bundle ID, then put the numeric App ID into `eas.json` → `submit.production.ios.ascAppId` and GitHub `ASC_APP_ID`.

## Production

1. Tag `vX.Y.Z` → `release.yml` (metadata + production build upload)
2. Manual `submit-for-review.yml` after binary finishes processing

## Local

```bash
cd handygo-tenant-mobile   # or handyman / admin
npm ci
npm run verify
npm run build:testflight
```

## Demo accounts (pilot)

| Role | Email | Password |
|------|-------|----------|
| Tenant | `tenant@pilot.handygo.ae` | `PilotTenant123!` |
| Handyman | `handyman@pilot.handygo.ae` | `PilotHandy123!` |
| Admin | `admin@pilot.handygo.ae` | `PilotAdmin123!` |
