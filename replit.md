# BiteIQ

Native Expo/React Native nutrition tracking app with a dark teal-charcoal theme and coral accents.

## Artifacts

- **biteiq** (`artifacts/biteiq`) — Expo mobile app (preview path `/`)
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
- Profile: editable details, live target preview, GLP-1 toggle, reset data

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
