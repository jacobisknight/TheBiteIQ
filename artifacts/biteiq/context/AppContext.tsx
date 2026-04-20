import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { buildPlan, sumMeals, todayKey } from "@/lib/nutrition";
import {
  STORAGE_KEYS,
  loadJson,
  makeId,
  saveJson,
} from "@/lib/storage";
import type {
  ActivityLevel,
  CoachMessage,
  DailyTotals,
  FoodItem,
  Goal,
  MealEntry,
  MealPlan,
  MealType,
  Sex,
  UserProfile,
  WeightEntry,
  WorkoutPlan,
} from "@/types";

interface OnboardingInput {
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  glp1Mode: boolean;
}

interface AppState {
  ready: boolean;
  user: UserProfile | null;
  meals: MealEntry[];
  weights: WeightEntry[];
  streak: number;
  todayTotals: DailyTotals;
  todayMeals: MealEntry[];

  completeOnboarding: (input: OnboardingInput) => Promise<void>;
  updateUser: (patch: Partial<OnboardingInput>) => Promise<void>;
  addMeal: (input: {
    mealType: MealType;
    items: FoodItem[];
    source: MealEntry["source"];
    note?: string;
  }) => Promise<void>;
  updateMeal: (id: string, items: FoodItem[]) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  addWeight: (weightKg: number) => Promise<void>;
  resetAll: () => Promise<void>;

  coachMessages: CoachMessage[];
  addCoachMessage: (msg: CoachMessage) => Promise<void>;
  clearCoachChat: () => Promise<void>;
  mealPlan: MealPlan | null;
  setMealPlan: (plan: MealPlan | null) => Promise<void>;
  workoutPlan: WorkoutPlan | null;
  setWorkoutPlan: (plan: WorkoutPlan | null) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [mealPlan, setMealPlanState] = useState<MealPlan | null>(null);
  const [workoutPlan, setWorkoutPlanState] = useState<WorkoutPlan | null>(null);

  useEffect(() => {
    (async () => {
      const [u, m, w, cm, mp, wp] = await Promise.all([
        loadJson<UserProfile | null>(STORAGE_KEYS.user, null),
        loadJson<MealEntry[]>(STORAGE_KEYS.meals, []),
        loadJson<WeightEntry[]>(STORAGE_KEYS.weights, []),
        loadJson<CoachMessage[]>(STORAGE_KEYS.coachMessages, []),
        loadJson<MealPlan | null>(STORAGE_KEYS.mealPlan, null),
        loadJson<WorkoutPlan | null>(STORAGE_KEYS.workoutPlan, null),
      ]);
      setUser(u);
      setMeals(m);
      setWeights(w);
      setCoachMessages(cm);
      setMealPlanState(mp);
      setWorkoutPlanState(wp);
      setReady(true);
    })();
  }, []);

  const persistMeals = useCallback(async (next: MealEntry[]) => {
    setMeals(next);
    await saveJson(STORAGE_KEYS.meals, next);
  }, []);

  const persistWeights = useCallback(async (next: WeightEntry[]) => {
    setWeights(next);
    await saveJson(STORAGE_KEYS.weights, next);
  }, []);

  const completeOnboarding = useCallback(async (input: OnboardingInput) => {
    const plan = buildPlan(input);
    const profile: UserProfile = {
      ...input,
      ...plan,
      createdAt: Date.now(),
    };
    setUser(profile);
    await saveJson(STORAGE_KEYS.user, profile);
    if (input.weightKg > 0) {
      const next: WeightEntry[] = [
        ...weights,
        {
          id: makeId(),
          date: todayKey(),
          weightKg: input.weightKg,
          loggedAt: Date.now(),
        },
      ];
      await persistWeights(next);
    }
  }, [persistWeights, weights]);

  const updateUser = useCallback(
    async (patch: Partial<OnboardingInput>) => {
      if (!user) return;
      const merged = { ...user, ...patch } as UserProfile & OnboardingInput;
      const plan = buildPlan({
        age: merged.age,
        sex: merged.sex,
        heightCm: merged.heightCm,
        weightKg: merged.weightKg,
        activity: merged.activity,
        goal: merged.goal,
        glp1Mode: merged.glp1Mode,
      });
      const next: UserProfile = { ...merged, ...plan };
      setUser(next);
      await saveJson(STORAGE_KEYS.user, next);
    },
    [user],
  );

  const addMeal = useCallback(
    async ({
      mealType,
      items,
      source,
      note,
    }: {
      mealType: MealType;
      items: FoodItem[];
      source: MealEntry["source"];
      note?: string;
    }) => {
      const entry: MealEntry = {
        id: makeId(),
        date: todayKey(),
        mealType,
        loggedAt: Date.now(),
        source,
        items,
        note,
      };
      await persistMeals([entry, ...meals]);
    },
    [meals, persistMeals],
  );

  const updateMeal = useCallback(
    async (id: string, items: FoodItem[]) => {
      const next = meals.map((m) => (m.id === id ? { ...m, items } : m));
      await persistMeals(next);
    },
    [meals, persistMeals],
  );

  const deleteMeal = useCallback(
    async (id: string) => {
      await persistMeals(meals.filter((m) => m.id !== id));
    },
    [meals, persistMeals],
  );

  const addWeight = useCallback(
    async (weightKg: number) => {
      const entry: WeightEntry = {
        id: makeId(),
        date: todayKey(),
        weightKg,
        loggedAt: Date.now(),
      };
      const next = [...weights, entry];
      await persistWeights(next);
      if (user) {
        const updated: UserProfile = { ...user, weightKg };
        const plan = buildPlan({
          age: updated.age,
          sex: updated.sex,
          heightCm: updated.heightCm,
          weightKg: updated.weightKg,
          activity: updated.activity,
          goal: updated.goal,
          glp1Mode: updated.glp1Mode,
        });
        const merged: UserProfile = { ...updated, ...plan };
        setUser(merged);
        await saveJson(STORAGE_KEYS.user, merged);
      }
    },
    [persistWeights, user, weights],
  );

  const addCoachMessage = useCallback(
    async (msg: CoachMessage) => {
      const next = [...coachMessages, msg].slice(-100);
      setCoachMessages(next);
      await saveJson(STORAGE_KEYS.coachMessages, next);
    },
    [coachMessages],
  );

  const clearCoachChat = useCallback(async () => {
    setCoachMessages([]);
    await saveJson(STORAGE_KEYS.coachMessages, []);
  }, []);

  const setMealPlan = useCallback(async (plan: MealPlan | null) => {
    setMealPlanState(plan);
    await saveJson(STORAGE_KEYS.mealPlan, plan);
  }, []);

  const setWorkoutPlan = useCallback(async (plan: WorkoutPlan | null) => {
    setWorkoutPlanState(plan);
    await saveJson(STORAGE_KEYS.workoutPlan, plan);
  }, []);

  const resetAll = useCallback(async () => {
    setUser(null);
    setMeals([]);
    setWeights([]);
    setCoachMessages([]);
    setMealPlanState(null);
    setWorkoutPlanState(null);
    await Promise.all([
      saveJson(STORAGE_KEYS.user, null),
      saveJson(STORAGE_KEYS.meals, []),
      saveJson(STORAGE_KEYS.weights, []),
      saveJson(STORAGE_KEYS.coachMessages, []),
      saveJson(STORAGE_KEYS.mealPlan, null),
      saveJson(STORAGE_KEYS.workoutPlan, null),
    ]);
  }, []);

  const today = todayKey();
  const todayMeals = useMemo(
    () => meals.filter((m) => m.date === today),
    [meals, today],
  );
  const todayTotals = useMemo(() => sumMeals(todayMeals), [todayMeals]);

  const streak = useMemo(() => {
    if (meals.length === 0) return 0;
    const datesWithMeals = new Set(meals.map((m) => m.date));
    let count = 0;
    const cursor = new Date();
    // If no meal today, start checking from yesterday so streak doesn't reset
    // before any meal logged today
    if (!datesWithMeals.has(todayKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (datesWithMeals.has(todayKey(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [meals]);

  const value: AppState = {
    ready,
    user,
    meals,
    weights,
    streak,
    todayTotals,
    todayMeals,
    completeOnboarding,
    updateUser,
    addMeal,
    updateMeal,
    deleteMeal,
    addWeight,
    resetAll,
    coachMessages,
    addCoachMessage,
    clearCoachChat,
    mealPlan,
    setMealPlan,
    workoutPlan,
    setWorkoutPlan,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
