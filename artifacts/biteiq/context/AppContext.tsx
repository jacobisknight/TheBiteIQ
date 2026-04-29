import { useAuth, useUser } from "@clerk/expo";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { buildDemoBundle, isDemoEmail } from "@/lib/demoData";
import {
  cleanupAll as cleanupHealthApi,
  getConnections as fetchConnections,
  getSnapshot as fetchHealthSnapshot,
  ingestHealthKit,
} from "@/lib/health/api";
import { isHealthKitAvailable, readSnapshot as readHealthKit } from "@/lib/health/healthkit";
import type { ConnectionsState, HealthSnapshot } from "@/lib/health/types";
import { buildPlan, sumMeals, todayKey } from "@/lib/nutrition";
import {
  buildStorageKeys,
  loadJson,
  makeId,
  saveJson,
  type StorageKeys,
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

  healthSnapshot: HealthSnapshot | null;
  healthConnections: ConnectionsState | null;
  refreshHealth: () => Promise<void>;
  syncHealthKit: () => Promise<void>;
  cleanupHealthOnSignOut: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded: authLoaded, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const userEmail =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    null;
  const tokenGetter = useCallback(() => getToken(), [getToken]);
  const [healthSnapshot, setHealthSnapshot] = useState<HealthSnapshot | null>(null);
  const [healthConnections, setHealthConnections] = useState<ConnectionsState | null>(null);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [mealPlan, setMealPlanState] = useState<MealPlan | null>(null);
  const [workoutPlan, setWorkoutPlanState] = useState<WorkoutPlan | null>(null);

  const keysRef = useRef<StorageKeys>(buildStorageKeys(null));

  useEffect(() => {
    if (!authLoaded) return;
    const nextKeys = buildStorageKeys(userId ?? null);
    keysRef.current = nextKeys;
    setReady(false);
    setUser(null);
    setMeals([]);
    setWeights([]);
    setCoachMessages([]);
    setMealPlanState(null);
    setWorkoutPlanState(null);
    setHealthSnapshot(null);
    setHealthConnections(null);
    let cancelled = false;
    (async () => {
      const [u, m, w, cm, mp, wp] = await Promise.all([
        loadJson<UserProfile | null>(nextKeys.user, null),
        loadJson<MealEntry[]>(nextKeys.meals, []),
        loadJson<WeightEntry[]>(nextKeys.weights, []),
        loadJson<CoachMessage[]>(nextKeys.coachMessages, []),
        loadJson<MealPlan | null>(nextKeys.mealPlan, null),
        loadJson<WorkoutPlan | null>(nextKeys.workoutPlan, null),
      ]);
      if (cancelled) return;

      // First-time seed for the App Store demo account so reviewers (and our
      // own marketing screenshots) land on a populated dashboard instead of
      // an empty zero-state. Only fires when the demo email signs in AND no
      // profile exists yet, so a real user never gets surprise data and the
      // reviewer can still interact normally on subsequent loads.
      if (!u && userId && isDemoEmail(userEmail)) {
        const bundle = buildDemoBundle();
        await Promise.all([
          saveJson(nextKeys.user, bundle.user),
          saveJson(nextKeys.meals, bundle.meals),
          saveJson(nextKeys.weights, bundle.weights),
          saveJson(nextKeys.coachMessages, bundle.coachMessages),
          saveJson(nextKeys.mealPlan, bundle.mealPlan),
          saveJson(nextKeys.workoutPlan, bundle.workoutPlan),
        ]);
        if (cancelled) return;
        setUser(bundle.user);
        setMeals(bundle.meals);
        setWeights(bundle.weights);
        setCoachMessages(bundle.coachMessages);
        setMealPlanState(bundle.mealPlan);
        setWorkoutPlanState(bundle.workoutPlan);
        setReady(true);
        return;
      }

      setUser(u);
      setMeals(m);
      setWeights(w);
      setCoachMessages(cm);
      setMealPlanState(mp);
      setWorkoutPlanState(wp);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoaded, userId, userEmail]);

  const persistMeals = useCallback(async (next: MealEntry[]) => {
    setMeals(next);
    await saveJson(keysRef.current.meals, next);
  }, []);

  const persistWeights = useCallback(async (next: WeightEntry[]) => {
    setWeights(next);
    await saveJson(keysRef.current.weights, next);
  }, []);

  const completeOnboarding = useCallback(async (input: OnboardingInput) => {
    const plan = buildPlan(input);
    const profile: UserProfile = {
      ...input,
      ...plan,
      createdAt: Date.now(),
    };
    setUser(profile);
    await saveJson(keysRef.current.user, profile);
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
      await saveJson(keysRef.current.user, next);
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
        await saveJson(keysRef.current.user, merged);
      }
    },
    [persistWeights, user, weights],
  );

  const addCoachMessage = useCallback(
    async (msg: CoachMessage) => {
      const next = [...coachMessages, msg].slice(-100);
      setCoachMessages(next);
      await saveJson(keysRef.current.coachMessages, next);
    },
    [coachMessages],
  );

  const clearCoachChat = useCallback(async () => {
    setCoachMessages([]);
    await saveJson(keysRef.current.coachMessages, []);
  }, []);

  const setMealPlan = useCallback(async (plan: MealPlan | null) => {
    setMealPlanState(plan);
    await saveJson(keysRef.current.mealPlan, plan);
  }, []);

  const setWorkoutPlan = useCallback(async (plan: WorkoutPlan | null) => {
    setWorkoutPlanState(plan);
    await saveJson(keysRef.current.workoutPlan, plan);
  }, []);

  const resetAll = useCallback(async () => {
    setUser(null);
    setMeals([]);
    setWeights([]);
    setCoachMessages([]);
    setMealPlanState(null);
    setWorkoutPlanState(null);
    setHealthSnapshot(null);
    setHealthConnections(null);
    await Promise.all([
      saveJson(keysRef.current.user, null),
      saveJson(keysRef.current.meals, []),
      saveJson(keysRef.current.weights, []),
      saveJson(keysRef.current.coachMessages, []),
      saveJson(keysRef.current.mealPlan, null),
      saveJson(keysRef.current.workoutPlan, null),
    ]);
    if (userId) {
      await cleanupHealthApi(tokenGetter);
    }
  }, [tokenGetter, userId]);

  const refreshHealth = useCallback(async () => {
    if (!userId) return;
    try {
      const [conn, snap] = await Promise.all([
        fetchConnections(tokenGetter),
        fetchHealthSnapshot(tokenGetter),
      ]);
      setHealthConnections(conn);
      setHealthSnapshot(snap);
    } catch {
      /* best-effort */
    }
  }, [tokenGetter, userId]);

  const syncHealthKit = useCallback(async () => {
    if (!userId || !isHealthKitAvailable()) return;
    try {
      const data = await readHealthKit();
      if (!data) return;
      await ingestHealthKit(tokenGetter, data);
      await refreshHealth();
    } catch {
      /* best-effort */
    }
  }, [refreshHealth, tokenGetter, userId]);

  useEffect(() => {
    if (!ready || !userId) return;
    void refreshHealth();
    void syncHealthKit();
  }, [ready, userId, refreshHealth, syncHealthKit]);

  const cleanupHealthOnSignOut = useCallback(async () => {
    if (!userId) return;
    try {
      await cleanupHealthApi(tokenGetter);
    } catch {
      /* best-effort */
    }
    setHealthSnapshot(null);
    setHealthConnections(null);
  }, [tokenGetter, userId]);

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
    healthSnapshot,
    healthConnections,
    refreshHealth,
    syncHealthKit,
    cleanupHealthOnSignOut,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
