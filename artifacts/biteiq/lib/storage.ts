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

export const STORAGE_KEYS = {
  user: "biteiq.user.v1",
  meals: "biteiq.meals.v1",
  weights: "biteiq.weights.v1",
  streak: "biteiq.streak.v1",
  coachMessages: "biteiq.coach.messages.v1",
  mealPlan: "biteiq.coach.mealplan.v1",
  workoutPlan: "biteiq.coach.workoutplan.v1",
};

export function makeId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}
