import crypto from "node:crypto";

const SECRET = process.env["SESSION_SECRET"];
if (!SECRET || SECRET.length < 16) {
  throw new Error(
    "SESSION_SECRET environment variable is required (min 16 chars) " +
      "to sign OAuth state for health integrations.",
  );
}
const SIGNING_SECRET: string = SECRET;

export interface StatePayload {
  userId: string;
  provider: "whoop" | "oura";
  nonce: string;
  ts: number;
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

export function signState(payload: Omit<StatePayload, "nonce" | "ts">): string {
  const full: StatePayload = {
    ...payload,
    nonce: crypto.randomBytes(8).toString("hex"),
    ts: Date.now(),
  };
  const body = b64url(Buffer.from(JSON.stringify(full), "utf8"));
  const mac = b64url(
    crypto.createHmac("sha256", SIGNING_SECRET).update(body).digest(),
  );
  return `${body}.${mac}`;
}

export function verifyState(state: string): StatePayload | null {
  const parts = state.split(".");
  if (parts.length !== 2) return null;
  const [body, mac] = parts as [string, string];
  const expected = b64url(
    crypto.createHmac("sha256", SIGNING_SECRET).update(body).digest(),
  );
  if (
    expected.length !== mac.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(mac))
  ) {
    return null;
  }
  try {
    const parsed = JSON.parse(fromB64url(body).toString("utf8")) as StatePayload;
    if (Date.now() - parsed.ts > 1000 * 60 * 15) return null;
    return parsed;
  } catch {
    return null;
  }
}
