/**
 * BiteIQ Pro entitlement lookup via the RevenueCat REST API.
 *
 * The app identifies RevenueCat customers by their Clerk user id
 * (Purchases.logIn(clerkUserId)), so the server can look a user up by the
 * same id it gets from Clerk auth.
 *
 * Env:
 *   REVENUECAT_SECRET_KEY      – RevenueCat secret API key (sk_...). Server only.
 *   REVENUECAT_ENTITLEMENT_ID  – entitlement identifier, default "pro".
 *   BITEIQ_PRO_USER_IDS        – optional comma-separated Clerk ids that are
 *                                always Pro (founder / App Review demo account).
 */

const RC_BASE = "https://api.revenuecat.com/v1";
const CACHE_MS = 5 * 60 * 1000;

interface CacheEntry {
  pro: boolean;
  expiresAt: string | null;
  checkedAt: number;
}

const cache = new Map<string, CacheEntry>();

function entitlementId(): string {
  return process.env["REVENUECAT_ENTITLEMENT_ID"] || "pro";
}

function comped(userId: string): boolean {
  const list = (process.env["BITEIQ_PRO_USER_IDS"] || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.includes(userId);
}

export interface ProStatus {
  pro: boolean;
  expiresAt: string | null;
}

export async function getProStatus(
  userId: string,
  opts: { fresh?: boolean } = {},
): Promise<ProStatus> {
  if (comped(userId)) return { pro: true, expiresAt: null };

  const hit = cache.get(userId);
  if (!opts.fresh && hit && Date.now() - hit.checkedAt < CACHE_MS) {
    return { pro: hit.pro, expiresAt: hit.expiresAt };
  }

  const key = process.env["REVENUECAT_SECRET_KEY"];
  if (!key) return { pro: false, expiresAt: null };

  try {
    const res = await fetch(
      `${RC_BASE}/subscribers/${encodeURIComponent(userId)}`,
      { headers: { Authorization: `Bearer ${key}` } },
    );
    if (!res.ok) throw new Error(`revenuecat ${res.status}`);
    const body = (await res.json()) as {
      subscriber?: {
        entitlements?: Record<string, { expires_date?: string | null }>;
      };
    };
    const ent = body.subscriber?.entitlements?.[entitlementId()];
    const expiresAt = ent?.expires_date ?? null;
    // Lifetime entitlements have a null expires_date.
    const pro = !!ent && (expiresAt === null || Date.parse(expiresAt) > Date.now());
    cache.set(userId, { pro, expiresAt, checkedAt: Date.now() });
    return { pro, expiresAt };
  } catch {
    // On a RevenueCat outage, keep the last known answer instead of locking
    // paying users out.
    if (hit) return { pro: hit.pro, expiresAt: hit.expiresAt };
    return { pro: false, expiresAt: null };
  }
}

export function forgetProStatus(userId: string): void {
  cache.delete(userId);
}
