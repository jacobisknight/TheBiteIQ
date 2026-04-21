import type {
  ConnectionsState,
  HealthKitIngest,
  HealthProvider,
  HealthSnapshot,
} from "./types";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;

function baseUrl(): string {
  if (!DOMAIN) throw new Error("EXPO_PUBLIC_DOMAIN not set");
  return `https://${DOMAIN}/api`;
}

type TokenGetter = () => Promise<string | null>;

async function authedFetch(
  getToken: TokenGetter,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return fetch(`${baseUrl()}${path}`, { ...init, headers });
}

export async function getConnections(getToken: TokenGetter): Promise<ConnectionsState> {
  const res = await authedFetch(getToken, "/health/connections");
  if (!res.ok) throw new Error(`connections ${res.status}`);
  return (await res.json()) as ConnectionsState;
}

export async function getSnapshot(getToken: TokenGetter): Promise<HealthSnapshot> {
  const res = await authedFetch(getToken, "/health/snapshot");
  if (!res.ok) throw new Error(`snapshot ${res.status}`);
  return (await res.json()) as HealthSnapshot;
}

export async function startConnect(
  getToken: TokenGetter,
  provider: "whoop" | "oura",
): Promise<{ authUrl: string }> {
  const res = await authedFetch(getToken, `/health/connect/${provider}`, {
    method: "POST",
  });
  if (res.status === 503) {
    throw new Error("provider_not_configured");
  }
  if (!res.ok) throw new Error(`connect ${res.status}`);
  return (await res.json()) as { authUrl: string };
}

export async function disconnect(
  getToken: TokenGetter,
  provider: HealthProvider,
): Promise<void> {
  const res = await authedFetch(getToken, `/health/disconnect/${provider}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`disconnect ${res.status}`);
}

export async function ingestHealthKit(
  getToken: TokenGetter,
  payload: HealthKitIngest,
): Promise<void> {
  const res = await authedFetch(getToken, "/health/healthkit/ingest", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`ingest ${res.status}`);
}

export async function cleanupAll(getToken: TokenGetter): Promise<void> {
  try {
    await authedFetch(getToken, "/health/cleanup", { method: "POST" });
  } catch {
    /* best-effort */
  }
}
