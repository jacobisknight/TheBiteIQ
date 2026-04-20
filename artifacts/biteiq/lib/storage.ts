import AsyncStorage from "@react-native-async-storage/async-storage";

export async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function saveJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeKey(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export interface StorageKeys {
  user: string;
  meals: string;
  weights: string;
  streak: string;
  coachMessages: string;
  mealPlan: string;
  workoutPlan: string;
}

export function buildStorageKeys(userId: string | null | undefined): StorageKeys {
  const scope = userId ? `u.${userId}` : "anon";
  const prefix = `biteiq.${scope}`;
  return {
    user: `${prefix}.user.v1`,
    meals: `${prefix}.meals.v1`,
    weights: `${prefix}.weights.v1`,
    streak: `${prefix}.streak.v1`,
    coachMessages: `${prefix}.coach.messages.v1`,
    mealPlan: `${prefix}.coach.mealplan.v1`,
    workoutPlan: `${prefix}.coach.workoutplan.v1`,
  };
}

export function makeId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}
