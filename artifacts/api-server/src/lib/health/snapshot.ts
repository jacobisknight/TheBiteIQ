import * as Whoop from "./whoop";
import * as Oura from "./oura";
import { readUserRecord } from "./tokenStore";

export interface NormalizedSnapshot {
  steps?: number;
  activeCalories?: number;
  restingHeartRate?: number;
  hrv?: number;
  sleepMinutes?: number;
  sleepScore?: number;
  recovery?: number;
  readiness?: number;
  strain?: number;
  sources: {
    healthkit?: { lastSyncAt?: number };
    whoop?: { lastSyncAt?: number; recovery?: number; strain?: number };
    oura?: { lastSyncAt?: number; readiness?: number; sleepScore?: number };
  };
  generatedAt: number;
}

function pick<T>(...vals: Array<T | undefined>): T | undefined {
  for (const v of vals) {
    if (v != null && !Number.isNaN(v as unknown as number)) return v;
  }
  return undefined;
}

export async function buildSnapshot(userId: string): Promise<NormalizedSnapshot> {
  const rec = await readUserRecord(userId);
  const hk = rec.healthkit?.snapshot;

  const [whoop, oura] = await Promise.all([
    Whoop.isConfigured() && rec.whoop
      ? Whoop.fetchSnapshot(userId).catch(() => null)
      : Promise.resolve(null),
    Oura.isConfigured() && rec.oura
      ? Oura.fetchSnapshot(userId).catch(() => null)
      : Promise.resolve(null),
  ]);

  return {
    steps: pick(hk?.steps, oura?.steps),
    activeCalories: pick(
      hk?.activeCalories,
      oura?.activeCalories,
      whoop?.caloriesBurned,
    ),
    restingHeartRate: pick(
      whoop?.restingHeartRate,
      oura?.restingHeartRate,
      hk?.restingHeartRate,
    ),
    hrv: pick(whoop?.hrv, oura?.hrv, hk?.hrv),
    sleepMinutes: pick(whoop?.sleepMinutes, oura?.sleepMinutes, hk?.sleepMinutes),
    sleepScore: pick(oura?.sleepScore, whoop?.sleepPerformance),
    recovery: whoop?.recovery,
    readiness: oura?.readiness,
    strain: whoop?.strain,
    sources: {
      healthkit: rec.healthkit
        ? { lastSyncAt: rec.healthkit.lastSyncAt }
        : undefined,
      whoop: whoop
        ? { lastSyncAt: whoop.lastSyncAt, recovery: whoop.recovery, strain: whoop.strain }
        : rec.whoop
          ? { lastSyncAt: rec.whoop.lastSyncAt }
          : undefined,
      oura: oura
        ? { lastSyncAt: oura.lastSyncAt, readiness: oura.readiness, sleepScore: oura.sleepScore }
        : rec.oura
          ? { lastSyncAt: rec.oura.lastSyncAt }
          : undefined,
    },
    generatedAt: Date.now(),
  };
}
