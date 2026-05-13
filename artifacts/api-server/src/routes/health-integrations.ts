import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";

import * as Whoop from "../lib/health/whoop";
import * as Oura from "../lib/health/oura";
import {
  clearAll,
  clearProvider,
  readUserRecord,
  setHealthKit,
  setProviderTokens,
  type HealthKitSnapshot,
  type Provider,
} from "../lib/health/tokenStore";
import { signState, verifyState } from "../lib/health/oauthState";
import { buildSnapshot } from "../lib/health/snapshot";

const router: IRouter = Router();

function authedUserId(req: Request, res: Response): string | null {
  let uid: string | null | undefined;
  try {
    uid = getAuth(req)?.userId;
  } catch (err) {
    // Malformed/invalid JWTs can throw inside Clerk's decoder; treat them
    // as unauthenticated rather than letting them surface as 500s.
    req.log?.warn({ err, url: req.url }, "clerk getAuth threw");
    uid = null;
  }
  if (!uid) {
    res.status(401).json({ error: "unauthorized" });
    return null;
  }
  return uid;
}

function publicBaseUrl(req: Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = req.headers.host;
  return `${proto}://${host}`;
}

function redirectUriFor(req: Request, provider: "whoop" | "oura"): string {
  return `${publicBaseUrl(req)}/api/health/callback/${provider}`;
}

router.get("/health/connections", async (req: Request, res: Response) => {
  const userId = authedUserId(req, res);
  if (!userId) return;
  const rec = await readUserRecord(userId);
  res.json({
    healthkit: {
      configured: true,
      connected: Boolean(rec.healthkit),
      lastSyncAt: rec.healthkit?.lastSyncAt,
    },
    whoop: {
      configured: Whoop.isConfigured(),
      connected: Boolean(rec.whoop),
      lastSyncAt: rec.whoop?.lastSyncAt,
    },
    oura: {
      configured: Oura.isConfigured(),
      connected: Boolean(rec.oura),
      lastSyncAt: rec.oura?.lastSyncAt,
    },
  });
});

router.get("/health/snapshot", async (req: Request, res: Response) => {
  const userId = authedUserId(req, res);
  if (!userId) return;
  try {
    const snapshot = await buildSnapshot(userId);
    res.json(snapshot);
  } catch (err) {
    req.log?.error({ err }, "health snapshot failed");
    res.status(500).json({ error: "snapshot failed" });
  }
});

router.post("/health/connect/:provider", async (req: Request, res: Response) => {
  const userId = authedUserId(req, res);
  if (!userId) return;
  const provider = req.params.provider as "whoop" | "oura";
  if (provider !== "whoop" && provider !== "oura") {
    res.status(400).json({ error: "unknown provider" });
    return;
  }
  const mod = provider === "whoop" ? Whoop : Oura;
  if (!mod.isConfigured()) {
    res.status(503).json({ error: "provider_not_configured", provider });
    return;
  }
  const state = signState({ userId, provider });
  const authUrl = mod.buildAuthorizeUrl(state, redirectUriFor(req, provider));
  res.json({ authUrl });
});

router.get("/health/callback/:provider", async (req: Request, res: Response) => {
  const provider = req.params.provider as "whoop" | "oura";
  const code = typeof req.query["code"] === "string" ? req.query["code"] : "";
  const state = typeof req.query["state"] === "string" ? req.query["state"] : "";

  if (provider !== "whoop" && provider !== "oura") {
    res.status(400).send(failHtml("Unknown provider"));
    return;
  }
  const payload = verifyState(state);
  if (!payload || payload.provider !== provider) {
    res.status(400).send(failHtml("Invalid or expired state"));
    return;
  }
  if (!code) {
    res.status(400).send(failHtml("Missing code"));
    return;
  }

  try {
    const mod = provider === "whoop" ? Whoop : Oura;
    const tokens = await mod.exchangeCode(code, redirectUriFor(req, provider));
    await setProviderTokens(payload.userId, provider, tokens);
    res.status(200).send(successHtml(provider));
  } catch (err) {
    req.log?.error({ err }, "health callback failed");
    res.status(500).send(failHtml("Connection failed"));
  }
});

router.post("/health/disconnect/:provider", async (req: Request, res: Response) => {
  const userId = authedUserId(req, res);
  if (!userId) return;
  const provider = req.params.provider as Provider;
  if (!["whoop", "oura", "healthkit"].includes(provider)) {
    res.status(400).json({ error: "unknown provider" });
    return;
  }
  await clearProvider(userId, provider);
  res.json({ ok: true });
});

router.post("/health/healthkit/ingest", async (req: Request, res: Response) => {
  const userId = authedUserId(req, res);
  if (!userId) return;
  const body = req.body as Partial<HealthKitSnapshot> | undefined;
  const num = (v: unknown): number | undefined => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
    return undefined;
  };
  const snapshot: HealthKitSnapshot = {
    steps: num(body?.steps),
    activeCalories: num(body?.activeCalories),
    restingHeartRate: num(body?.restingHeartRate),
    hrv: num(body?.hrv),
    sleepMinutes: num(body?.sleepMinutes),
    sleepEfficiency: num(body?.sleepEfficiency),
    weightKg: num(body?.weightKg),
    recordedAt: Date.now(),
  };
  await setHealthKit(userId, snapshot);
  res.json({ ok: true });
});

router.post("/health/cleanup", async (req: Request, res: Response) => {
  const userId = authedUserId(req, res);
  if (!userId) return;
  await clearAll(userId);
  res.json({ ok: true });
});

function successHtml(provider: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Connected</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;background:#0E1718;color:#fff;
display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center}
.card{background:#162122;border:1px solid #25393B;border-radius:24px;padding:36px;max-width:380px}
h1{margin:0 0 12px;font-size:22px}p{margin:0;color:#9AA9AB;font-size:14px;line-height:1.5}
.dot{width:48px;height:48px;border-radius:24px;background:#FF6B57;margin:0 auto 18px;
display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px}</style></head>
<body><div class="card"><div class="dot">✓</div>
<h1>${provider[0]!.toUpperCase() + provider.slice(1)} connected</h1>
<p>You can close this window and return to BiteIQ.</p></div>
<script>setTimeout(()=>{try{window.close()}catch(e){}},800)</script></body></html>`;
}
function failHtml(message: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Failed</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;background:#0E1718;color:#fff;
display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center}
.card{background:#162122;border:1px solid #25393B;border-radius:24px;padding:36px;max-width:380px}
h1{margin:0 0 12px;font-size:22px}p{margin:0;color:#9AA9AB;font-size:14px;line-height:1.5}
</style></head><body><div class="card"><h1>Connection failed</h1>
<p>${message}</p></div></body></html>`;
}

export default router;
