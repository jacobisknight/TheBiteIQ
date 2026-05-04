# BiteIQ

Native Expo/React Native nutrition tracking app with a dark teal-charcoal theme and coral accents.

## Artifacts

- **biteiq** (`artifacts/biteiq`) — Expo mobile app (preview path `/mobile`)
- **biteiq-web** (`artifacts/biteiq-web`) — React/Vite marketing + legal site at `/` (Privacy, Terms, Support, Delete account) — used for App Store submission URLs; user owns `biteiq.tech`
- **api-server** (`artifacts/api-server`) — Express API with OpenAI-powered AI endpoints
- **mockup-sandbox** — default canvas/design artifact (unused)

## Features

- 5-step onboarding (name/age/sex → height/weight → activity → goal → plan preview)
- Auto-calculated daily calorie + macro targets via Mifflin-St Jeor + TDEE
- Goals: lose / maintain / gain / GLP-1 mode (higher protein, gentler deficit)
- Home dashboard: calorie ring, protein/carb/fat bars, AI coaching tip, today's meals
- Three logging methods:
  - Photo scan (camera or library → OpenAI vision → detected items)
  - Voice/text describe → AI parses into structured items
  - Search foods → AI returns variants with macros
- Diary: per-day view grouped by meal type, prev/next day navigation
- Progress: streak counter, 7-day calorie trend, weight chart + logging
- Profile: editable details, live target preview, GLP-1 toggle, reset data, in-app account deletion (DELETE /api/account → Clerk user deletion + health-token cleanup), cm/in + kg/lbs unit toggles
- AI Health Coach (`/coach`): chat with context-aware assistant, personalized meal plans, and weekly workout plans (tabs on one screen, prominent card on Home)

## Tech stack

- Expo Router + React Native 0.81 (Expo SDK 54), Inter fonts
- `react-native-svg` for calorie ring / weight chart
- AsyncStorage for persistence (user, meals, weights)
- Express 5 API server with OpenAI SDK (model `gpt-5.2`)
- OpenAI via Replit AI Integrations proxy — env vars `AI_INTEGRATIONS_OPENAI_BASE_URL` / `AI_INTEGRATIONS_OPENAI_API_KEY`

## Backend AI routes (`/api/ai/*`)

- `POST /recognize-food` — image base64 → food items
- `POST /parse-text` — description → food items
- `POST /search-food` — query → food variants
- `POST /coaching-tip` — profile+totals → short coach message

## Backend account routes (`/api/account`)

- `DELETE /account` — auth-required; deletes the Clerk user, then best-effort wipes health-token storage. Returns `{ ok: true }` on success or `{ error: "deletion_failed" }` (502) if the Clerk delete fails (no data is touched in that case so the user can retry).
