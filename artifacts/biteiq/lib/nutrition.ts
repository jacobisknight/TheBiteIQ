import type {
  ActivityLevel,
  DailyTotals,
  Goal,
  MealEntry,
  Sex,
  UserProfile,
} from "@/types";

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calcBMR(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  // Mifflin-St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

export function calcTDEE(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_FACTOR[activity]);
}

export interface MacroPlan {
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export function calcMacros(
  tdee: number,
  goal: Goal,
  weightKg: number,
  glp1Mode: boolean,
): MacroPlan {
  let calories = tdee;
  if (goal === "lose") calories = tdee - 500;
  if (goal === "gain") calories = tdee + 350;
  if (goal === "glp1") calories = Math.round(tdee * 0.78);

  // Clamp calorie floor BEFORE allocating macros so targets stay consistent
  const dailyCalories = Math.max(1200, Math.round(calories));

  // GLP-1 boosts protein further to preserve lean mass
  const proteinPerKg = glp1Mode || goal === "glp1" ? 2.0 : goal === "lose" ? 1.8 : 1.6;
  const proteinG = Math.round(weightKg * proteinPerKg);
  const proteinCals = proteinG * 4;

  const fatCals = Math.round(dailyCalories * 0.28);
  const fatG = Math.round(fatCals / 9);

  const carbCals = Math.max(0, dailyCalories - proteinCals - fatCals);
  const carbsG = Math.round(carbCals / 4);

  return {
    dailyCalories,
    proteinG,
    carbsG,
    fatG,
  };
}

export function buildPlan(p: {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  glp1Mode: boolean;
}): MacroPlan {
  const bmr = calcBMR(p.sex, p.weightKg, p.heightCm, p.age);
  const tdee = calcTDEE(bmr, p.activity);
  return calcMacros(tdee, p.goal, p.weightKg, p.glp1Mode);
}

export function todayKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function sumMeals(meals: MealEntry[]): DailyTotals {
  return meals.reduce<DailyTotals>(
    (acc, m) => {
      for (const it of m.items) {
        acc.calories += it.calories;
        acc.protein += it.protein;
        acc.carbs += it.carbs;
        acc.fat += it.fat;
        acc.fiber += it.fiber ?? 0;
        acc.sugar += it.sugar ?? 0;
        acc.saturatedFat += it.saturatedFat ?? 0;
        acc.sodium += it.sodium ?? 0;
      }
      return acc;
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      saturatedFat: 0,
      sodium: 0,
    },
  );
}

export function profileSummaryForAI(user: UserProfile, totals: DailyTotals): string {
  return `User: ${user.sex}, age ${user.age}, ${user.heightCm}cm, ${user.weightKg}kg, activity ${user.activity}, goal ${user.goal}${user.glp1Mode ? " (GLP-1)" : ""}.
Targets: ${user.dailyCalories} kcal, ${user.proteinG}g P, ${user.carbsG}g C, ${user.fatG}g F.
Today so far: ${Math.round(totals.calories)} kcal, ${Math.round(totals.protein)}g P, ${Math.round(totals.carbs)}g C, ${Math.round(totals.fat)}g F, ${Math.round(totals.fiber)}g fiber, ${Math.round(totals.sugar)}g sugar, ${Math.round(totals.saturatedFat)}g sat fat, ${Math.round(totals.sodium)}mg sodium.`;
}
