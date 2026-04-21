export type LengthUnit = "cm" | "in" | "ft_in";
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

export function cmToFtIn(cm: number): { ft: number; inches: number } {
  const totalIn = Math.round(cmToIn(cm));
  const ft = Math.floor(totalIn / 12);
  const inches = totalIn - ft * 12;
  return { ft, inches };
}

export function ftInToCm(ft: number, inches: number): number {
  const totalIn = (Number.isFinite(ft) ? ft : 0) * 12 + (Number.isFinite(inches) ? inches : 0);
  return totalIn > 0 ? inToCm(totalIn) : 0;
}

export function displayHeight(cm: number, unit: LengthUnit): string {
  if (unit === "cm") return String(Math.round(cm));
  if (unit === "in") return cmToIn(cm).toFixed(1);
  const { ft, inches } = cmToFtIn(cm);
  return `${ft}'${inches}"`;
}

export function displayWeight(kg: number, unit: WeightUnit): string {
  if (unit === "kg") return kg.toFixed(1);
  return kgToLbs(kg).toFixed(1);
}

export function parseHeight(value: string, unit: LengthUnit): number {
  if (unit === "ft_in") {
    // Accept "5'10", "5 10", "5'10\"", "5-10", or just "5" (= 5 ft)
    const cleaned = value.replace(/["”]/g, "").replace(/[-_]/g, " ").trim();
    const match = cleaned.match(/^(\d+)\s*(?:'|\s)\s*(\d+(?:\.\d+)?)?$/) ?? cleaned.match(/^(\d+)$/);
    if (!match) return 0;
    const ft = parseInt(match[1] ?? "0", 10);
    const inches = match[2] ? parseFloat(match[2]) : 0;
    if (!Number.isFinite(ft) || ft < 0) return 0;
    return ftInToCm(ft, inches);
  }
  const n = parseFloat(value.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return unit === "cm" ? n : inToCm(n);
}

export function parseWeight(value: string, unit: WeightUnit): number {
  const n = parseFloat(value.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return unit === "kg" ? n : lbsToKg(n);
}
