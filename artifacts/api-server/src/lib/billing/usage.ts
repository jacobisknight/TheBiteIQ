import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Free-tier daily AI quotas. Pro users skip these entirely.
 * A limit of 0 means the feature is Pro-only.
 */
export type AiFeature =
  | "photo"
  | "text"
  | "search"
  | "tip"
  | "coach"
  | "mealPlan"
  | "workoutPlan";

export const FREE_LIMITS: Record<AiFeature, number> = {
  photo: 3,
  text: 5,
  search: 10,
  tip: 3,
  coach: 5,
  mealPlan: 0,
  workoutPlan: 0,
};

interface UsageRecord {
  day: string;
  counts: Partial<Record<AiFeature, number>>;
}

const ROOT = path.resolve(process.cwd(), ".data", "ai-usage");

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function fileFor(userId: string): string {
  return path.join(ROOT, `${userId.replace(/[^A-Za-z0-9_-]/g, "_")}.json`);
}

async function read(userId: string): Promise<UsageRecord> {
  try {
    const rec = JSON.parse(
      await fs.readFile(fileFor(userId), "utf8"),
    ) as UsageRecord;
    if (rec.day === today()) return rec;
  } catch {
    /* no record yet */
  }
  return { day: today(), counts: {} };
}

async function write(userId: string, rec: UsageRecord): Promise<void> {
  await fs.mkdir(ROOT, { recursive: true });
  await fs.writeFile(fileFor(userId), JSON.stringify(rec), "utf8");
}

export async function getUsage(
  userId: string,
): Promise<Partial<Record<AiFeature, number>>> {
  return (await read(userId)).counts;
}

/**
 * Atomically-enough (single process) checks and consumes one unit of the
 * free quota. Returns false when the user is out of free uses today.
 */
export async function tryConsume(
  userId: string,
  feature: AiFeature,
): Promise<boolean> {
  const rec = await read(userId);
  const used = rec.counts[feature] ?? 0;
  if (used >= FREE_LIMITS[feature]) return false;
  rec.counts[feature] = used + 1;
  await write(userId, rec);
  return true;
}

/** Give a unit back when the AI call itself failed. */
export async function refund(userId: string, feature: AiFeature): Promise<void> {
  const rec = await read(userId);
  const used = rec.counts[feature] ?? 0;
  if (used > 0) {
    rec.counts[feature] = used - 1;
    await write(userId, rec);
  }
}

export async function clearUsage(userId: string): Promise<void> {
  try {
    await fs.unlink(fileFor(userId));
  } catch {
    /* noop */
  }
}
