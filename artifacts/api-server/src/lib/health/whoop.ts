import {
  readUserRecord,
  setProviderTokens,
  touchSync,
  type ProviderTokens,
} from "./tokenStore";

const AUTH_HOST = "https://api.prod.whoop.com";
const AUTHORIZE = `${AUTH_HOST}/oauth/oauth2/auth`;
const TOKEN = `${AUTH_HOST}/oauth/oauth2/token`;
const API = "https://api.prod.whoop.com/developer";

export const WHOOP_SCOPES = [
  "read:recovery",
  "read:cycles",
  "read:sleep",
  "read:profile",
  "offline",
].join(" ");

export function isConfigured(): boolean {
  return Boolean(
    process.env["WHOOP_CLIENT_ID"] && process.env["WHOOP_CLIENT_SECRET"],
  );
}

export function buildAuthorizeUrl(state: string, redirectUri: string): string {
  const u = new URL(AUTHORIZE);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", process.env["WHOOP_CLIENT_ID"] || "");
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("scope", WHOOP_SCOPES);
  u.searchParams.set("state", state);
  return u.toString();
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

async function postForm(url: string, body: Record<string, string>): Promise<TokenResponse> {
  const params = new URLSearchParams(body);
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Whoop token request failed: ${res.status} ${t}`);
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
    client_id: process.env["WHOOP_CLIENT_ID"] || "",
    client_secret: process.env["WHOOP_CLIENT_SECRET"] || "",
  });
  return toTokens(t);
}

async function refresh(refreshToken: string): Promise<ProviderTokens> {
  const t = await postForm(TOKEN, {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env["WHOOP_CLIENT_ID"] || "",
    client_secret: process.env["WHOOP_CLIENT_SECRET"] || "",
    scope: WHOOP_SCOPES,
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
  const t = rec.whoop;
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
    await setProviderTokens(userId, "whoop", merged);
    return merged.accessToken;
  } catch {
    return null;
  }
}

async function whoopGet<T>(userId: string, pathPart: string): Promise<T | null> {
  const token = await ensureFreshToken(userId);
  if (!token) return null;
  const res = await fetch(`${API}${pathPart}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export interface WhoopSnapshot {
  recovery?: number;
  hrv?: number;
  restingHeartRate?: number;
  sleepMinutes?: number;
  sleepPerformance?: number;
  strain?: number;
  caloriesBurned?: number;
  lastSyncAt?: number;
}

interface RecoveryResp {
  records?: Array<{
    score?: { recovery_score?: number; hrv_rmssd_milli?: number; resting_heart_rate?: number };
    created_at?: string;
  }>;
}
interface SleepResp {
  records?: Array<{
    score?: {
      stage_summary?: { total_in_bed_time_milli?: number };
      sleep_performance_percentage?: number;
    };
    end?: string;
  }>;
}
interface CycleResp {
  records?: Array<{
    score?: { strain?: number; kilojoule?: number };
    end?: string;
  }>;
}

export async function fetchSnapshot(userId: string): Promise<WhoopSnapshot | null> {
  const token = await ensureFreshToken(userId);
  if (!token) return null;
  const since = new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString();
  const q = `?start=${encodeURIComponent(since)}&limit=5`;
  const [rec, sleep, cycle] = await Promise.all([
    whoopGet<RecoveryResp>(userId, `/v2/recovery${q}`),
    whoopGet<SleepResp>(userId, `/v2/activity/sleep${q}`),
    whoopGet<CycleResp>(userId, `/v2/cycle${q}`),
  ]);

  const recScore = rec?.records?.[0]?.score;
  const sleepRec = sleep?.records?.[0]?.score;
  const cycleScore = cycle?.records?.[0]?.score;

  const snapshot: WhoopSnapshot = {
    recovery: recScore?.recovery_score,
    hrv: recScore?.hrv_rmssd_milli,
    restingHeartRate: recScore?.resting_heart_rate,
    sleepMinutes: sleepRec?.stage_summary?.total_in_bed_time_milli
      ? Math.round(sleepRec.stage_summary.total_in_bed_time_milli / 60000)
      : undefined,
    sleepPerformance: sleepRec?.sleep_performance_percentage,
    strain: cycleScore?.strain,
    caloriesBurned: cycleScore?.kilojoule
      ? Math.round(cycleScore.kilojoule / 4.184)
      : undefined,
    lastSyncAt: Date.now(),
  };
  await touchSync(userId, "whoop");
  return snapshot;
}
