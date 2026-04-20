import type { FoodItem } from "@/types";
import { makeId } from "./storage";

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
  }));
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  assertBaseUrl();
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}): ${text.slice(0, 200)}`);
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
  const data = await postJson<{ tip: string }>("/ai/coaching-tip", payload);
  return data.tip;
}
