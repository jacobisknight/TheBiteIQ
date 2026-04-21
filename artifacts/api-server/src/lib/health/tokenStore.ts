import { promises as fs } from "node:fs";
import path from "node:path";

export type Provider = "whoop" | "oura" | "healthkit";

export interface ProviderTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string;
  connectedAt: number;
  lastSyncAt?: number;
}

export interface UserHealthRecord {
  whoop?: ProviderTokens;
  oura?: ProviderTokens;
  healthkit?: {
    connectedAt: number;
    lastSyncAt?: number;
    snapshot?: HealthKitSnapshot;
  };
}

export interface HealthKitSnapshot {
  steps?: number;
  activeCalories?: number;
  restingHeartRate?: number;
  hrv?: number;
  sleepMinutes?: number;
  sleepEfficiency?: number;
  weightKg?: number;
  recordedAt: number;
}

const ROOT = path.resolve(process.cwd(), ".data", "health-tokens");

async function ensureDir(): Promise<void> {
  await fs.mkdir(ROOT, { recursive: true });
}

function safeId(userId: string): string {
  return userId.replace(/[^A-Za-z0-9_-]/g, "_");
}

function fileFor(userId: string): string {
  return path.join(ROOT, `${safeId(userId)}.json`);
}

export async function readUserRecord(userId: string): Promise<UserHealthRecord> {
  await ensureDir();
  try {
    const raw = await fs.readFile(fileFor(userId), "utf8");
    return JSON.parse(raw) as UserHealthRecord;
  } catch {
    return {};
  }
}

export async function writeUserRecord(
  userId: string,
  record: UserHealthRecord,
): Promise<void> {
  await ensureDir();
  await fs.writeFile(fileFor(userId), JSON.stringify(record, null, 2), "utf8");
}

export async function setProviderTokens(
  userId: string,
  provider: "whoop" | "oura",
  tokens: ProviderTokens,
): Promise<void> {
  const rec = await readUserRecord(userId);
  rec[provider] = tokens;
  await writeUserRecord(userId, rec);
}

export async function clearProvider(
  userId: string,
  provider: Provider,
): Promise<void> {
  const rec = await readUserRecord(userId);
  delete rec[provider];
  await writeUserRecord(userId, rec);
}

export async function clearAll(userId: string): Promise<void> {
  await ensureDir();
  try {
    await fs.unlink(fileFor(userId));
  } catch {
    /* noop */
  }
}

export async function setHealthKit(
  userId: string,
  snapshot: HealthKitSnapshot,
): Promise<void> {
  const rec = await readUserRecord(userId);
  const prev = rec.healthkit;
  rec.healthkit = {
    connectedAt: prev?.connectedAt ?? Date.now(),
    lastSyncAt: Date.now(),
    snapshot,
  };
  await writeUserRecord(userId, rec);
}

export async function touchSync(
  userId: string,
  provider: "whoop" | "oura",
): Promise<void> {
  const rec = await readUserRecord(userId);
  if (rec[provider]) {
    rec[provider]!.lastSyncAt = Date.now();
    await writeUserRecord(userId, rec);
  }
}
