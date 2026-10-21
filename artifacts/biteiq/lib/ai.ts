import type {
  CoachMessage,
  FoodItem,
  MealPlan,
  WorkoutPlan,
} from "@/types";
import { getClerkInstance } from "@clerk/expo";
import { router } from "expo-router";

import { makeId } from "./storage";

/** Thrown when the free daily quota is used up (server returned 402). */
export class UpgradeRequiredError extends Error {
  constructor(public feature: string) {
    super("You've used today's free AI requests. Upgrade to BiteIQ Pro for unlimited access.");
    this.name = "UpgradeRequiredError";
  }
}

async function authHeader(): Promise<Record<string, string>> {
  try {
    const token = await getClerkInstance().session?.getToken();
    return token ? { authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;
const BASE_URL = DOMAIN ? `https://${DOMAIN}` : "";

function assertBaseUrl() {
  if (!BASE_URL) {
    throw new Error(
      "EXPO_PUBLIC_DOMAIN is not set. AI features require an API host.",
    );
  }
}

export interface AIRecognizedFood {
  name: string;
  brand?: string;
  servingDescription?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  saturatedFat?: number;
  sodium?: number;
}

function roundOpt(n: number | undefined): number | undefined {
  if (n == null || !Number.isFinite(n)) return undefined;
  return Math.max(0, Math.round(n));
}

function attachIds(items: AIRecognizedFood[]): FoodItem[] {
  return items.map((it) => ({
    id: makeId(),
    name: it.name,
    brand: it.brand,
    servingDescription: it.servingDescription,
    calories: Math.max(0, Math.round(it.calories)),
    protein: Math.max(0, Math.round(it.protein)),
    carbs: Math.max(0, Math.round(it.carbs)),
    fat: Math.max(0, Math.round(it.fat)),
    fiber: roundOpt(it.fiber),
    sugar: roundOpt(it.sugar),
    saturatedFat: roundOpt(it.saturatedFat),
    sodium: roundOpt(it.sodium),
  }));
}

async function postJson<T>(
  path: string,
  body: unknown,
  opts: { openPaywall?: boolean } = {},
): Promise<T> {
  assertBaseUrl();
  const url = `${BASE_URL}/api${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(
      `Network error reaching ${url}: ${e instanceof Error ? e.message : "unknown"}`,
    );
  }
  const ctype = res.headers.get("content-type") || "";
  if (res.status === 402) {
    let feature = path;
    try {
      feature = ((await res.json()) as { feature?: string }).feature ?? path;
    } catch {
      /* noop */
    }
    if (opts.openPaywall !== false) {
      router.push({ pathname: "/paywall", params: { feature } });
    }
    throw new UpgradeRequiredError(feature);
  }
  if (res.status === 401) {
    throw new Error("Your session expired. Please sign out and sign back in.");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}): ${text.slice(0, 200)}`);
  }
  if (!ctype.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Expected JSON from ${url} but got ${ctype || "no content-type"} (${res.status}). First 200 chars: ${text.slice(0, 200)}`,
    );
  }
  return (await res.json()) as T;
}

export async function recognizeFoodFromImage(base64: string): Promise<FoodItem[]> {
  const data = await postJson<{ items: AIRecognizedFood[] }>(
    "/ai/recognize-food",
    { imageBase64: base64 },
  );
  return attachIds(data.items ?? []);
}

export async function parseFoodFromText(text: string): Promise<FoodItem[]> {
  const data = await postJson<{ items: AIRecognizedFood[] }>(
    "/ai/parse-text",
    { text },
  );
  return attachIds(data.items ?? []);
}

export async function searchFood(query: string): Promise<FoodItem[]> {
  const data = await postJson<{ items: AIRecognizedFood[] }>("/ai/search-food", {
    query,
  });
  return attachIds(data.items ?? []);
}

export async function getCoachingTip(payload: {
  summary: string;
  recentMeals: string;
}): Promise<string> {
  const data = await postJson<{ tip: string }>("/ai/coaching-tip", payload, {
    openPaywall: false,
  });
  return data.tip;
}

export async function coachChat(payload: {
  profile: string;
  history: CoachMessage[];
  message: string;
}): Promise<string> {
  const data = await postJson<{ reply: string }>("/ai/coach-chat", {
    profile: payload.profile,
    history: payload.history.map((m) => ({ role: m.role, content: m.content })),
    message: payload.message,
  });
  return data.reply;
}

export async function generateMealPlan(payload: {
  profile: string;
  preferences?: string;
}): Promise<Omit<MealPlan, "createdAt">> {
  const data = await postJson<Omit<MealPlan, "createdAt">>(
    "/ai/meal-plan",
    payload,
  );
  return {
    summary: data.summary ?? "",
    meals: (data.meals ?? []).map((m) => ({
      ...m,
      calories: Math.max(0, Math.round(m.calories)),
      protein: Math.max(0, Math.round(m.protein)),
      carbs: Math.max(0, Math.round(m.carbs)),
      fat: Math.max(0, Math.round(m.fat)),
      fiber: roundOpt(m.fiber),
      sugar: roundOpt(m.sugar),
      saturatedFat: roundOpt(m.saturatedFat),
      sodium: roundOpt(m.sodium),
    })),
  };
}

export async function generateWorkoutPlan(payload: {
  profile: string;
  daysPerWeek: number;
  focus?: string;
}): Promise<Omit<WorkoutPlan, "createdAt">> {
  const data = await postJson<Omit<WorkoutPlan, "createdAt">>(
    "/ai/workout-plan",
    payload,
  );
  return {
    summary: data.summary ?? "",
    days: data.days ?? [],
  };
}
