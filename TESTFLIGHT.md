# BiteIQ → TestFlight Deployment Guide

This is the runbook to get BiteIQ from Replit onto your iPhone via TestFlight. Follow it top to bottom in the Replit shell.

## What you need before you start

- **Apple Developer Program account** ($99/year) — confirmed yes
- **Expo account** (free, at expo.dev) — confirmed yes
- **Bundle identifier**: `tech.biteiq.app` (already set in `app.json`)
- **An iPhone** to install the build on
- **The API + marketing site already deployed** — the iOS build is hard-coded to talk to `https://biteiq.tech/api`. Steps below make sure that's live.

---

## Phase 1 — Deploy the API + marketing site

Your mobile app calls `https://biteiq.tech/api/...` for AI features. That URL must work before TestFlight testers can use the app.

1. **Publish the project** from the Replit chat (use the "Suggest publish" prompt that already appeared, or click the Deploy button in the workspace). Choose **Reserved VM** or **Autoscale**.
2. **Add `biteiq.tech` as a custom domain** on the deployment in Replit's Deployments panel → Custom domains. Replit will give you DNS records (an A record + a TXT verification record) to add at your registrar.
3. **Update DNS** at your registrar to point `biteiq.tech` (and `www.biteiq.tech`) at Replit. Wait until `https://biteiq.tech/` loads the marketing site and `https://biteiq.tech/api/healthz` returns 200.

> **Don't skip this.** If you build the iOS app while the domain is still un-pointed, the app will install but every AI feature will hang.

---

## Phase 2 — One-time EAS setup

Run these in the Replit shell (not in a workflow). You only do this once per project.

```bash
cd artifacts/biteiq

# 1. Log in to Expo (browser flow — paste the auth code it gives you)
npx eas login

# 2. Initialize the EAS project (links this folder to a project on expo.dev)
#    Pick "Yes" when asked to create a new project, accept the slug "biteiq".
npx eas init

# 3. Verify your config is healthy
npx eas build:configure --platform ios
```

If `eas init` warns that the slug is taken on your account, it will prompt for a different one — accept its suggestion or pick `biteiq-app`.

---

## Phase 3 — First iOS build

```bash
cd artifacts/biteiq
npx eas build --platform ios --profile production
```

What happens:

1. EAS asks for your **Apple Developer account credentials** (Apple ID + password, then a 2FA code from your trusted device). It uses these to register your app, create a distribution certificate, and create a provisioning profile. EAS stores credentials in your Expo account, so you only do this once.
2. It also prompts to register the bundle identifier `tech.biteiq.app` with Apple. Accept.
3. It uploads the source to Expo's build farm and builds. **This takes 15–25 minutes.** You'll see a URL like `https://expo.dev/accounts/<you>/projects/biteiq/builds/<id>` that streams the build log.
4. When done, you'll get a `.ipa` file URL.

> **Apple may also ask you to enable HealthKit capability** for the bundle ID, since `app.json` declares the HealthKit entitlement. If the build fails citing HealthKit:
> - Go to https://developer.apple.com → Certificates, IDs & Profiles → Identifiers → tech.biteiq.app → Capabilities → enable HealthKit → Save
> - Re-run the build.

---

## Phase 4 — Submit to TestFlight

```bash
cd artifacts/biteiq
npx eas submit --platform ios --latest
```

What happens:

1. The first time, EAS will ask you to either log in to App Store Connect or supply an **App Store Connect API key** (preferred — generate one at https://appstoreconnect.apple.com → Users and Access → Keys → Generate). Save the `.p8` file securely.
2. EAS uploads the `.ipa` to App Store Connect.
3. Apple's processing takes 5–15 minutes. You'll get an email when the build is "Ready to Test".

---

## Phase 5 — Install on your iPhone

1. Open https://appstoreconnect.apple.com → My Apps → BiteIQ → TestFlight tab.
2. Add yourself as an **Internal Tester**: TestFlight tab → Internal Testing → click the `+` next to "Testers" → add your Apple ID email.
3. On your iPhone, install the **TestFlight** app from the App Store (if you don't already have it).
4. Open TestFlight → you should see BiteIQ available → tap **Install**.
5. Open BiteIQ on your phone, sign up, run through onboarding.

---

## Phase 6 — App Store screenshots

Once you have BiteIQ on your iPhone:

1. Open each screen you want to feature (Home, Coach, Diary, Progress, Profile, Log meal flow).
2. Press **side button + volume up** to take a screenshot.
3. AirDrop to your Mac (or email yourself).
4. In App Store Connect → BiteIQ → App Store tab → iPhone screenshots, drag in the PNGs.

Apple requires **6.9" iPhone screenshots** (1290 × 2796 px) which is exactly what an iPhone 15/16 Pro Max produces natively. If you take them on a smaller iPhone, you'll need 6.5" (1284 × 2778) instead.

> If you don't yet own a Pro Max, take them on whatever iPhone you have and Apple will accept them as the "6.5" set" (or 5.5" for older devices). You can always re-upload later.

---

## Things that will probably trip you up

- **Build fails with "No team selected"** — run `npx eas credentials` and pick your Apple team explicitly.
- **HealthKit capability error** — see the note in Phase 3.
- **Clerk says "production keys required"** — for App Store release (not TestFlight), you should switch to a Clerk production instance. For TestFlight beta the dev keys work, but tap-through limits apply. To switch: create a production instance at clerk.com → copy the new `pk_live_*` publishable key → in this repo set the `CLERK_PUBLISHABLE_KEY` secret to the new value → rebuild.
- **App opens to a sign-in screen but Google Sign-In doesn't work** — Google OAuth needs the production Clerk instance configured with the iOS bundle identifier `tech.biteiq.app`. Email/password sign-in works regardless.
- **App installs but AI features hang** — `https://biteiq.tech/api/...` is not reachable. Check DNS and the deployment's health.

---

## Quick reference: the actual commands

```bash
# One-time
cd artifacts/biteiq
npx eas login
npx eas init

# Every release
npx eas build --platform ios --profile production
npx eas submit --platform ios --latest

# Bump version for next release
# Edit app.json → expo.version (e.g. "1.0.1") then re-build.
# Build numbers auto-increment because eas.json has autoIncrement: true.
```
