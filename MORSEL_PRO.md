# BiteIQ Pro — subscription setup

This branch (`morsel-pro-paywall`) adds a paid tier and closes an open-cost hole in the API.

## What changed

**Security fix (ship this even before pricing is decided).** Before this branch, every
`/api/ai/*` endpoint answered anyone on the internet, signed in or not, and each call spent
OpenAI credit. Every AI route now requires a signed-in Clerk user (`401` otherwise).

**Free vs Pro.** Free users get a daily AI allowance; Pro is unlimited.

| Feature | Free per day | Pro |
|---|---|---|
| Photo scan | 3 | Unlimited |
| Voice / text log | 5 | Unlimited |
| Food search | 10 | Unlimited |
| Coaching tip (Home) | 3 | Unlimited |
| AI coach messages | 5 | Unlimited |
| Meal plan | — (Pro only) | Unlimited |
| Workout plan | — (Pro only) | Unlimited |

Limits live in `artifacts/api-server/src/lib/billing/usage.ts` (`FREE_LIMITS`).
When a free user hits a limit the server returns `402 upgrade_required` and the app opens the paywall.
Failed AI calls (5xx) refund the use.

**Files**
- API: `src/middlewares/aiAccess.ts`, `src/lib/billing/{entitlements,usage}.ts`, `src/routes/billing.ts` (`GET /api/billing/status`), account deletion also clears usage.
- App: `lib/billing/purchases.ts` (RevenueCat, customer id = Clerk user id), `hooks/usePro.ts`, `app/paywall.tsx`, Pro row on Profile, auth token now sent with AI calls, paywall-aware error handling in photo/voice/coach/insight screens.
- New dependency: `react-native-purchases` (works in EAS builds; not in Expo Go).

## Setup checklist

1. **App Store Connect → BiteIQ → Subscriptions**: create group "BiteIQ Pro" with two auto-renewing products:
   - `biteiq_pro_monthly` — suggested $9.99/month, 7-day free trial
   - `biteiq_pro_annual` — suggested $59.99/year, 7-day free trial
   Fill in display name, description, review screenshot (screenshot of the paywall), and sign the Paid Apps agreement + banking/tax in Business if not done.
2. **App Store Connect → Users and Access → Integrations → In-App Purchase**: generate an In-App Purchase key (.p8) for RevenueCat. Also copy the App-Specific Shared Secret.
3. **RevenueCat (free up to $2.5k/mo revenue)**: create project → add iOS app `tech.biteiq.app` → upload the .p8 key → import both products → create entitlement **`pro`** attached to both → create the default Offering with `$rc_monthly` and `$rc_annual` packages.
4. **Keys**
   - Replit secret on the API deployment: `REVENUECAT_SECRET_KEY` = RevenueCat secret key (`sk_...`).
   - Optional: `BITEIQ_PRO_USER_IDS` = comma-separated Clerk user ids that are always Pro (your account, App Review demo account).
   - EAS env for the app build: `npx eas env:create --environment production --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value appl_xxx --visibility plaintext`
5. Redeploy the API, then `npx eas build --platform ios --profile production` and `npx eas submit --platform ios --latest`.
6. In App Store Connect, attach both subscriptions to the new version before submitting for review. Test purchases on TestFlight use the sandbox automatically.

## Notes
- Usage counters are stored in `.data/ai-usage/` like the health tokens. On an Autoscale deployment the disk resets on redeploy, which only ever gives users extra free uses. Move to the Postgres DB if that matters.
- Update the Terms page with subscription terms (auto-renewal, cancellation) before review — Apple checks for it under Guideline 3.1.2.
