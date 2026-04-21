import {
  readUserRecord,
  setProviderTokens,
  touchSync,
  type ProviderTokens,
} from "./tokenStore";

const AUTHORIZE = "https://cloud.ouraring.com/oauth/authorize";
const TOKEN = "https://api.ouraring.com/oauth/token";
const API = "https://api.ouraring.com/v2/usercollection";

export const OURA_SCOPES = [
  "daily",
  "heartrate",
  "personal",
  "session",
  "workout",
].join(" ");

export function isConfigured(): boolean {
  return Boolean(
    process.env["OURA_CLIENT_ID"] && process.env["OURA_CLIENT_SECRET"],
  );
}

export function buildAuthorizeUrl(state: string, redirectUri: string): string {
  const u = new URL(AUTHORIZE);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", process.env["OURA_CLIENT_ID"] || "");
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("scope", OURA_SCOPES);
  u.searchParams.set("state", state);
  return u.toString();
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

async function postForm(url: string, body: Record<string, string>): Promise<TokenResponse> {
  const auth = Buffer.from(
    `${process.env["OURA_CLIENT_ID"] || ""}:${process.env["OURA_CLIENT_SECRET"] || ""}`,
  ).toString("base64");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: `Basic ${auth}`,
    },
    body: new URLSearchParams(body).toString(),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Oura token request failed: ${res.status} ${t}`);
  }
  return (await res.json()) as TokenResponse;
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<ProviderTokens> {
  const t = await postForm(TOKEN, {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  return toTokens(t);
}

async function refresh(refreshToken: string): Promise<ProviderTokens> {
  const t = await postForm(TOKEN, {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  return toTokens(t);
}

function toTokens(t: TokenResponse): ProviderTokens {
  return {
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    expiresAt: t.expires_in ? Date.now() + t.expires_in * 1000 - 60_000 : undefined,
    scope: t.scope,
    connectedAt: Date.now(),
  };
}

async function ensureFreshToken(userId: string): Promise<string | null> {
  const rec = await readUserRecord(userId);
  const t = rec.oura;
  if (!t) return null;
  if (!t.expiresAt || t.expiresAt > Date.now()) return t.accessToken;
  if (!t.refreshToken) return t.accessToken;
  try {
    const next = await refresh(t.refreshToken);
    const merged: ProviderTokens = {
      ...t,
      accessToken: next.accessToken,
      refreshToken: next.refreshToken ?? t.refreshToken,
      expiresAt: next.expiresAt,
      scope: next.scope ?? t.scope,
    };
    await setProviderTokens(userId, "oura", merged);
    return merged.accessToken;
  } catch {
    return null;
  }
}

async function ouraGet<T>(userId: string, pathPart: string): Promise<T | null> {
  const token = await ensureFreshToken(userId);
  if (!token) return null;
  const res = await fetch(`${API}${pathPart}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export interface OuraSnapshot {
  readiness?: number;
  hrv?: number;
  restingHeartRate?: number;
  sleepScore?: number;
  sleepMinutes?: number;
  steps?: number;
  activeCalories?: number;
  lastSyncAt?: number;
}

interface ReadinessResp {
  data?: Array<{ score?: number; contributors?: { hrv_balance?: number; resting_heart_rate?: number } }>;
}
interface SleepResp {
  data?: Array<{ score?: number; total_sleep_duration?: number; average_heart_rate?: number; average_hrv?: number }>;
}
interface ActivityResp {
  data?: Array<{ steps?: number; active_calories?: number }>;
}

export async function fetchSnapshot(userId: string): Promise<OuraSnapshot | null> {
  const token = await ensureFreshToken(userId);
  if (!token) return null;
  const today = new Date();
  const start = new Date(today.getTime() - 1000 * 60 * 60 * 24 * 2);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const q = `?start_date=${fmt(start)}&end_date=${fmt(today)}`;

  const [readiness, sleep, activity] = await Promise.all([
    ouraGet<ReadinessResp>(userId, `/daily_readiness${q}`),
    ouraGet<SleepResp>(userId, `/daily_sleep${q}`),
    ouraGet<ActivityResp>(userId, `/daily_activity${q}`),
  ]);

  const r = readiness?.data?.slice(-1)[0];
  const s = sleep?.data?.slice(-1)[0];
  const a = activity?.data?.slice(-1)[0];

  const snapshot: OuraSnapshot = {
    readiness: r?.score,
    hrv: s?.average_hrv,
    restingHeartRate: s?.average_heart_rate,
    sleepScore: s?.score,
    sleepMinutes: s?.total_sleep_duration ? Math.round(s.total_sleep_duration / 60) : undefined,
    steps: a?.steps,
    activeCalories: a?.active_calories,
    lastSyncAt: Date.now(),
  };
  await touchSync(userId, "oura");
  return snapshot;
}
