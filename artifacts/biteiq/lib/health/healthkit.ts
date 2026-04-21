import { Platform } from "react-native";

import type { HealthKitIngest } from "./types";

interface HealthKitModule {
  initHealthKit: (
    permissions: unknown,
    cb: (err: string | null) => void,
  ) => void;
  Constants: {
    Permissions: Record<string, string>;
  };
  getStepCount: (opts: object, cb: (e: string | null, r: { value: number }) => void) => void;
  getActiveEnergyBurned: (
    opts: object,
    cb: (e: string | null, r: Array<{ value: number }>) => void,
  ) => void;
  getRestingHeartRate: (
    opts: object,
    cb: (e: string | null, r: { value: number }) => void,
  ) => void;
  getHeartRateVariabilitySamples: (
    opts: object,
    cb: (e: string | null, r: Array<{ value: number }>) => void,
  ) => void;
  getSleepSamples: (
    opts: object,
    cb: (
      e: string | null,
      r: Array<{ startDate: string; endDate: string; value: string }>,
    ) => void,
  ) => void;
  getLatestWeight: (
    opts: object,
    cb: (e: string | null, r: { value: number }) => void,
  ) => void;
}

let cachedModule: HealthKitModule | null = null;
let initAttempted = false;
let initOk = false;

export function isHealthKitAvailable(): boolean {
  if (Platform.OS !== "ios") return false;
  if (cachedModule) return true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("react-native-health");
    cachedModule = (mod?.default ?? mod) as HealthKitModule;
    return Boolean(cachedModule);
  } catch {
    return false;
  }
}

export async function requestHealthKitPermissions(): Promise<boolean> {
  if (!isHealthKitAvailable() || !cachedModule) return false;
  const P = cachedModule.Constants.Permissions;
  const permissions = {
    permissions: {
      read: [
        P.Steps,
        P.ActiveEnergyBurned,
        P.RestingHeartRate,
        P.HeartRateVariability,
        P.SleepAnalysis,
        P.Weight,
      ],
      write: [],
    },
  };
  return new Promise((resolve) => {
    cachedModule!.initHealthKit(permissions, (err) => {
      initAttempted = true;
      initOk = !err;
      resolve(!err);
    });
  });
}

function startOfDay(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function call<T>(fn: (cb: (e: string | null, r: T) => void) => void): Promise<T | null> {
  return new Promise((resolve) => {
    try {
      fn((err, value) => {
        if (err) resolve(null);
        else resolve(value);
      });
    } catch {
      resolve(null);
    }
  });
}

export async function readSnapshot(): Promise<HealthKitIngest | null> {
  if (!isHealthKitAvailable() || !cachedModule) return null;
  if (!initAttempted) await requestHealthKitPermissions();
  if (!initOk) return null;

  const today = { date: startOfDay() };
  const yesterday = {
    startDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    endDate: new Date().toISOString(),
  };

  const [steps, active, resting, hrvArr, sleepArr, weight] = await Promise.all([
    call<{ value: number }>((cb) => cachedModule!.getStepCount(today, cb)),
    call<Array<{ value: number }>>((cb) =>
      cachedModule!.getActiveEnergyBurned(yesterday, cb),
    ),
    call<{ value: number }>((cb) => cachedModule!.getRestingHeartRate(today, cb)),
    call<Array<{ value: number }>>((cb) =>
      cachedModule!.getHeartRateVariabilitySamples(yesterday, cb),
    ),
    call<Array<{ startDate: string; endDate: string; value: string }>>((cb) =>
      cachedModule!.getSleepSamples(yesterday, cb),
    ),
    call<{ value: number }>((cb) => cachedModule!.getLatestWeight({}, cb)),
  ]);

  const activeSum = Array.isArray(active)
    ? Math.round(active.reduce((s, a) => s + (a?.value || 0), 0))
    : undefined;

  const hrvAvg = Array.isArray(hrvArr) && hrvArr.length
    ? hrvArr.reduce((s, h) => s + (h?.value || 0), 0) / hrvArr.length
    : undefined;

  let sleepMin: number | undefined;
  if (Array.isArray(sleepArr) && sleepArr.length) {
    const total = sleepArr
      .filter((s) => /asleep|inbed/i.test(s.value))
      .reduce(
        (sum, s) =>
          sum +
          (new Date(s.endDate).getTime() - new Date(s.startDate).getTime()),
        0,
      );
    sleepMin = total > 0 ? Math.round(total / 60000) : undefined;
  }

  return {
    steps: steps?.value ? Math.round(steps.value) : undefined,
    activeCalories: activeSum,
    restingHeartRate: resting?.value ? Math.round(resting.value) : undefined,
    hrv: hrvAvg,
    sleepMinutes: sleepMin,
    weightKg: weight?.value || undefined,
  };
}
