import type { HealthSnapshot } from "./types";

export function hasAnyMetric(s: HealthSnapshot | null | undefined): boolean {
  if (!s) return false;
  return (
    s.steps != null ||
    s.activeCalories != null ||
    s.recovery != null ||
    s.readiness != null ||
    s.sleepMinutes != null ||
    s.hrv != null ||
    s.restingHeartRate != null
  );
}

export function formatSleep(min?: number): string {
  if (!min) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}

export function snapshotSummary(s: HealthSnapshot | null | undefined): string {
  if (!hasAnyMetric(s) || !s) return "No wearable data linked.";
  const parts: string[] = [];
  if (s.steps != null) parts.push(`Steps: ${Math.round(s.steps)}`);
  if (s.activeCalories != null)
    parts.push(`Active kcal: ${Math.round(s.activeCalories)}`);
  if (s.recovery != null) parts.push(`Whoop recovery: ${Math.round(s.recovery)}%`);
  if (s.readiness != null) parts.push(`Oura readiness: ${Math.round(s.readiness)}`);
  if (s.sleepMinutes != null) parts.push(`Sleep: ${formatSleep(s.sleepMinutes)}`);
  if (s.hrv != null) parts.push(`HRV: ${Math.round(s.hrv)} ms`);
  if (s.restingHeartRate != null)
    parts.push(`RHR: ${Math.round(s.restingHeartRate)} bpm`);
  return parts.join(" · ");
}

export function lastSyncLabel(ts?: number): string {
  if (!ts) return "Never";
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
