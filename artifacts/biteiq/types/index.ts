export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type Goal = "lose" | "maintain" | "gain" | "glp1";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface UserProfile {
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  glp1Mode: boolean;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  createdAt: number;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  servingDescription?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  loggedAt: number;
  source: "photo" | "voice" | "search" | "manual";
  items: FoodItem[];
  note?: string;
}

export interface WeightEntry {
  id: string;
  date: string;
  weightKg: number;
  loggedAt: number;
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
