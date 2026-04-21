export type HealthProvider = "healthkit" | "whoop" | "oura";

export interface ProviderStatus {
  configured: boolean;
  connected: boolean;
  lastSyncAt?: number;
}

export interface ConnectionsState {
  healthkit: ProviderStatus;
  whoop: ProviderStatus;
  oura: ProviderStatus;
}

export interface HealthSnapshot {
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

export interface HealthKitIngest {
  steps?: number;
  activeCalories?: number;
  restingHeartRate?: number;
  hrv?: number;
  sleepMinutes?: number;
  sleepEfficiency?: number;
  weightKg?: number;
}
