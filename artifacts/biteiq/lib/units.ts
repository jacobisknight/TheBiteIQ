export type LengthUnit = "cm" | "in";
export type WeightUnit = "kg" | "lbs";

const IN_PER_CM = 1 / 2.54;
const LBS_PER_KG = 2.2046226218;

export function cmToIn(cm: number): number {
  return cm * IN_PER_CM;
}
export function inToCm(inches: number): number {
  return inches / IN_PER_CM;
}
export function kgToLbs(kg: number): number {
  return kg * LBS_PER_KG;
}
export function lbsToKg(lbs: number): number {
  return lbs / LBS_PER_KG;
}

export function displayHeight(cm: number, unit: LengthUnit): string {
  if (unit === "cm") return String(Math.round(cm));
  return (cmToIn(cm)).toFixed(1);
}

export function displayWeight(kg: number, unit: WeightUnit): string {
  if (unit === "kg") return kg.toFixed(1);
  return kgToLbs(kg).toFixed(1);
}

export function parseHeight(value: string, unit: LengthUnit): number {
  const n = parseFloat(value.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return unit === "cm" ? n : inToCm(n);
}

export function parseWeight(value: string, unit: WeightUnit): number {
  const n = parseFloat(value.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return unit === "kg" ? n : lbsToKg(n);
}
