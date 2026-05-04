import { Platform } from "react-native";

import type { HealthKitIngest } from "./types";

type Healthkit = typeof import("@kingstinct/react-native-healthkit");

let cachedModule: Healthkit | null = null;
let moduleLoadAttempted = false;
let permissionsRequested = false;

const READ_QUANTITY_TYPES = [
  "HKQuantityTypeIdentifierStepCount",
  "HKQuantityTypeIdentifierActiveEnergyBurned",
  "HKQuantityTypeIdentifierRestingHeartRate",
  "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
  "HKQuantityTypeIdentifierBodyMass",
] as const;

const READ_CATEGORY_TYPES = ["HKCategoryTypeIdentifierSleepAnalysis"] as const;

const PERMISSION_TIMEOUT_MS = 10_000;

// CategoryValueSleepAnalysis numeric values that count as "asleep":
//   1 = asleep / asleepUnspecified, 3 = asleepCore, 4 = asleepDeep, 5 = asleepREM
const ASLEEP_VALUES = new Set<number>([1, 3, 4, 5]);

function loadModule(): Healthkit | null {
  if (cachedModule) return cachedModule;
  if (moduleLoadAttempted) return null;
  moduleLoadAttempted = true;
  if (Platform.OS !== "ios") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@kingstinct/react-native-healthkit") as Healthkit;
    cachedModule = mod;
    return mod;
  } catch (err) {
    console.warn("[healthkit] native module not available", err);
    return null;
  }
}

export function isHealthKitAvailable(): boolean {
  if (Platform.OS !== "ios") return false;
  const mod = loadModule();
  if (!mod) return false;
  try {
    return mod.isHealthDataAvailable();
  } catch (err) {
    console.warn("[healthkit] isHealthDataAvailable threw", err);
    return false;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("healthkit_request_timeout")),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export async function requestHealthKitPermissions(): Promise<boolean> {
  const mod = loadModule();
  if (!mod) return false;
  const ok = await withTimeout(
    mod.requestAuthorization({
      toRead: [...READ_QUANTITY_TYPES, ...READ_CATEGORY_TYPES],
    }),
    PERMISSION_TIMEOUT_MS,
  );
  permissionsRequested = true;
  return ok;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function safeRead<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.warn("[healthkit] sample read failed", err);
    return null;
  }
}

export async function readSnapshot(): Promise<HealthKitIngest | null> {
  const mod = loadModule();
  if (!mod) return null;

  if (!permissionsRequested) {
    try {
      await requestHealthKitPermissions();
    } catch (err) {
      console.warn("[healthkit] readSnapshot permission request failed", err);
      return null;
    }
  }

  const now = new Date();
  const todayStart = startOfToday();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [stepsStat, activeStat, restingSamples, hrvSamples, sleepSamples, weight] =
    await Promise.all([
      safeRead(() =>
        mod.queryStatisticsForQuantity(
          "HKQuantityTypeIdentifierStepCount",
          ["cumulativeSum"],
          { filter: { date: { startDate: todayStart, endDate: now } } },
        ),
      ),
      safeRead(() =>
        mod.queryStatisticsForQuantity(
          "HKQuantityTypeIdentifierActiveEnergyBurned",
          ["cumulativeSum"],
          { filter: { date: { startDate: todayStart, endDate: now } } },
        ),
      ),
      safeRead(() =>
        mod.queryQuantitySamples("HKQuantityTypeIdentifierRestingHeartRate", {
          filter: { date: { startDate: yesterday, endDate: now } },
          limit: 1,
          ascending: false,
        }),
      ),
      safeRead(() =>
        mod.queryQuantitySamples(
          "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
          {
            filter: { date: { startDate: yesterday, endDate: now } },
            limit: -1,
          },
        ),
      ),
      safeRead(() =>
        mod.queryCategorySamples("HKCategoryTypeIdentifierSleepAnalysis", {
          filter: { date: { startDate: yesterday, endDate: now } },
          limit: -1,
        }),
      ),
      safeRead(() =>
        mod.getMostRecentQuantitySample("HKQuantityTypeIdentifierBodyMass"),
      ),
    ]);

  const stepsRaw = stepsStat?.sumQuantity?.quantity;
  const steps =
    typeof stepsRaw === "number" && stepsRaw > 0
      ? Math.round(stepsRaw)
      : undefined;

  const activeRaw = activeStat?.sumQuantity?.quantity;
  const activeCalories =
    typeof activeRaw === "number" && activeRaw > 0
      ? Math.round(activeRaw)
      : undefined;

  const restingRaw = restingSamples?.[0]?.quantity;
  const restingHeartRate =
    typeof restingRaw === "number" && restingRaw > 0
      ? Math.round(restingRaw)
      : undefined;

  const hrv =
    hrvSamples && hrvSamples.length > 0
      ? hrvSamples.reduce((sum, h) => sum + (h.quantity ?? 0), 0) /
        hrvSamples.length
      : undefined;

  let sleepMinutes: number | undefined;
  if (sleepSamples && sleepSamples.length > 0) {
    const totalMs = sleepSamples
      .filter((s) => ASLEEP_VALUES.has(Number(s.value)))
      .reduce((sum, s) => {
        const start =
          s.startDate instanceof Date
            ? s.startDate.getTime()
            : new Date(s.startDate as unknown as string).getTime();
        const end =
          s.endDate instanceof Date
            ? s.endDate.getTime()
            : new Date(s.endDate as unknown as string).getTime();
        return sum + (end - start);
      }, 0);
    sleepMinutes = totalMs > 0 ? Math.round(totalMs / 60_000) : undefined;
  }

  const weightKg =
    typeof weight?.quantity === "number" && weight.quantity > 0
      ? weight.quantity
      : undefined;

  return {
    steps,
    activeCalories,
    restingHeartRate,
    hrv,
    sleepMinutes,
    weightKg,
  };
}
