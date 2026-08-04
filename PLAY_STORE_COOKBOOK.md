# HandyGo Android / Play Store Runbook

Mirrors the UmaMeats Play pipeline for the three HandyGo Expo apps.

| App | Package | EAS project |
|-----|---------|-------------|
| Tenant | `com.handygo.tenant` | https://expo.dev/accounts/jaw_ari/projects/handygo-tenant-mobile |
| Handyman | `com.handygo.technician` | https://expo.dev/accounts/jaw_ari/projects/handygo-handyman-mobile |
| Admin | `com.handygo.management` | https://expo.dev/accounts/jaw_ari/projects/handygo-admin-mobile |

iOS sibling: [`TESTFLIGHT_COOKBOOK.md`](./TESTFLIGHT_COOKBOOK.md).

## Interim (no Play org yet)

Until Play Console + `GOOGLE_SERVICE_ACCOUNT_KEY` exist:

1. Push to `main` → `.github/workflows/eas-android-preview.yml` builds an APK.
2. Install from Expo builds page for that project.
3. Or locally: `npm run build:android:preview`.

## Target (after Play exists)

| Path | Trigger | Workflow |
|------|---------|----------|
| Play Internal | push `main` | `eas-play-internal.yml` |
| Production draft | tag `v*` | `release-android.yml` |
| Promote | manual | `submit-play.yml` |

## Secrets (per GitHub repo)

- `EXPO_TOKEN`
- `GOOGLE_SERVICE_ACCOUNT_KEY` (base64 JSON) — when Play is ready
- `GOOGLE_SERVICES_JSON_BASE64` — FCM
- `SENTRY_AUTH_TOKEN` — optional

## API URL

Default (until `api.handygo.ae` DNS/ACM live):

```
EXPO_PUBLIC_API_BASE_URL=https://handygo.vercel.app/backend/api/v1
```

Set on EAS environments (`eas env:create`) for preview + production.
