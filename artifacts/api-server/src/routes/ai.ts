import { Router, type IRouter, type Request, type Response } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openaiBaseUrl = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
const openaiApiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (client) return client;
  if (!openaiBaseUrl || !openaiApiKey) {
    throw new Error("OpenAI integration not configured");
  }
  client = new OpenAI({ apiKey: openaiApiKey, baseURL: openaiBaseUrl });
  return client;
}

const MODEL = "gpt-5.2";

interface AIFood {
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

function readNum(o: Record<string, unknown>, k: string): number {
  const v = o[k];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function readOptNum(
  o: Record<string, unknown>,
  ...keys: string[]
): number | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function safeFoods(value: unknown): AIFood[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((it) => {
      if (typeof it !== "object" || it === null) return null;
      const o = it as Record<string, unknown>;
      const name = typeof o["name"] === "string" ? o["name"] : null;
      if (!name) return null;
      return {
        name,
        brand: typeof o["brand"] === "string" ? (o["brand"] as string) : undefined,
        servingDescription:
          typeof o["servingDescription"] === "string"
            ? (o["servingDescription"] as string)
            : typeof o["serving"] === "string"
              ? (o["serving"] as string)
              : undefined,
        calories: readNum(o, "calories"),
        protein: readNum(o, "protein"),
        carbs: readNum(o, "carbs"),
        fat: readNum(o, "fat"),
        fiber: readOptNum(o, "fiber"),
        sugar: readOptNum(o, "sugar"),
        saturatedFat: readOptNum(o, "saturatedFat", "satFat", "saturated_fat"),
        sodium: readOptNum(o, "sodium"),
      } as AIFood;
    })
    .filter((x): x is AIFood => x !== null);
}

async function parseFoodsFromMessages(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
): Promise<AIFood[]> {
  const completion = await getClient().chat.completions.create({
    model: MODEL,
    max_completion_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are BiteIQ, a nutrition AI. You always reply with a single JSON object: " +
          '{"items": [ { "name": string, "brand"?: string, "servingDescription": string, ' +
          '"calories": number, "protein": number, "carbs": number, "fat": number, ' +
          '"fiber": number, "sugar": number, "saturatedFat": number, "sodium": number } ]}. ' +
          "Macros (protein, carbs, fat, fiber, sugar, saturatedFat) are grams per total serving (not per 100g). " +
          "Sodium is milligrams per total serving. Always include fiber, sugar, saturatedFat, and sodium — estimate from " +
          "USDA / typical packaged data when not directly knowable; use 0 only when the food genuinely contains none. " +
          "Estimate conservatively based on common preparation. Combine sub-ingredients of a dish into one item " +
          "(e.g. 'Chicken Caesar salad'). Never include explanations.",
      },
      ...messages,
    ],
  });
  const content = completion.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content) as { items?: unknown };
    return safeFoods(parsed.items);
  } catch {
    return [];
  }
}

router.post("/ai/recognize-food", async (req: Request, res: Response) => {
  try {
    const body = req.body as { imageBase64?: string };
    if (!body?.imageBase64 || typeof body.imageBase64 !== "string") {
      res.status(400).json({ error: "imageBase64 required" });
      return;
    }
    const items = await parseFoodsFromMessages([
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Identify each food item visible on this plate and estimate macros for the depicted portion.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${body.imageBase64}`,
              detail: "low",
            },
          },
        ],
      },
    ]);
    res.json({ items });
  } catch (err) {
    req.log?.error({ err }, "recognize-food failed");
    res.status(500).json({ error: "recognition failed" });
  }
});

router.post("/ai/parse-text", async (req: Request, res: Response) => {
  try {
    const body = req.body as { text?: string };
    if (!body?.text || typeof body.text !== "string") {
      res.status(400).json({ error: "text required" });
      return;
    }
    const items = await parseFoodsFromMessages([
      {
        role: "user",
        content: `Convert this meal description into structured items with macros. Description: "${body.text.slice(0, 1000)}"`,
      },
    ]);
    res.json({ items });
  } catch (err) {
    req.log?.error({ err }, "parse-text failed");
    res.status(500).json({ error: "parsing failed" });
  }
});

router.post("/ai/search-food", async (req: Request, res: Response) => {
  try {
    const body = req.body as { query?: string };
    if (!body?.query || typeof body.query !== "string") {
      res.status(400).json({ error: "query required" });
      return;
    }
    const items = await parseFoodsFromMessages([
      {
        role: "user",
        content: `Return up to 6 common variants matching "${body.query.slice(0, 200)}". Each variant should specify a typical brand or preparation in name or brand.`,
      },
    ]);
    res.json({ items });
  } catch (err) {
    req.log?.error({ err }, "search-food failed");
    res.status(500).json({ error: "search failed" });
  }
});

router.post("/ai/coaching-tip", async (req: Request, res: Response) => {
  try {
    const body = req.body as { summary?: string; recentMeals?: string };
    if (!body?.summary) {
      res.status(400).json({ error: "summary required" });
      return;
    }
    const completion = await getClient().chat.completions.create({
      model: MODEL,
      max_completion_tokens: 240,
      messages: [
        {
          role: "system",
          content:
            "You are BiteIQ, a warm, witty, evidence-based nutrition coach. Reply with " +
            "ONE short, actionable insight (max 2 sentences, ~40 words). No emojis, no preamble. " +
            "Reference specific numbers when meaningful. If on GLP-1, prioritize protein " +
            "and gentle satiety reminders.",
        },
        {
          role: "user",
          content: `Profile + today:\n${body.summary}\n\nRecent meals:\n${body.recentMeals ?? "None"}`,
        },
      ],
    });
    const tip = completion.choices[0]?.message?.content?.trim() ??
      "Hydrate and aim for protein at your next meal.";
    res.json({ tip });
  } catch (err) {
    req.log?.error({ err }, "coaching-tip failed");
    res
      .status(200)
      .json({ tip: "Stay consistent today — every logged meal sharpens your plan." });
  }
});

interface CoachMessageIn {
  role: "user" | "assistant";
  content: string;
}

function safeMessages(value: unknown): CoachMessageIn[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((m) => {
      if (typeof m !== "object" || m === null) return null;
      const o = m as Record<string, unknown>;
      const role = o["role"];
      const content = o["content"];
      if (role !== "user" && role !== "assistant") return null;
      if (typeof content !== "string") return null;
      return { role, content: content.slice(0, 2000) } as CoachMessageIn;
    })
    .filter((x): x is CoachMessageIn => x !== null)
    .slice(-12);
}

const COACH_SYSTEM =
  "You are the BiteIQ Health Coach — a warm, evidence-based coach blending nutrition, " +
  "strength training, cardio, sleep, and habit guidance. Keep replies concise and scannable: " +
  "short paragraphs, 2–4 bullets max when listing. Reference the user's profile when relevant " +
  "(calorie/macro targets, goal, GLP-1 status). Avoid medical diagnosis; flag when a clinician " +
  "is appropriate. No emojis, no preamble. Be practical and specific.";

router.post("/ai/coach-chat", async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      profile?: string;
      history?: unknown;
      message?: string;
    };
    if (!body?.message || typeof body.message !== "string") {
      res.status(400).json({ error: "message required" });
      return;
    }
    const history = safeMessages(body.history);
    const completion = await getClient().chat.completions.create({
      model: MODEL,
      max_completion_tokens: 600,
      messages: [
        { role: "system", content: COACH_SYSTEM },
        {
          role: "system",
          content: `User profile:\n${body.profile ?? "Unknown"}`,
        },
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: "user", content: body.message.slice(0, 2000) },
      ],
    });
    const reply =
      completion.choices[0]?.message?.content?.trim() ??
      "Let's try that again — can you rephrase?";
    res.json({ reply });
  } catch (err) {
    req.log?.error({ err }, "coach-chat failed");
    res.status(500).json({ error: "chat failed" });
  }
});

router.post("/ai/meal-plan", async (req: Request, res: Response) => {
  try {
    const body = req.body as { profile?: string; preferences?: string };
    if (!body?.profile) {
      res.status(400).json({ error: "profile required" });
      return;
    }
    const completion = await getClient().chat.completions.create({
      model: MODEL,
      max_completion_tokens: 1500,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You generate realistic one-day meal plans. Reply with JSON: " +
            '{"summary": string, "meals": [ { "mealType": "breakfast"|"lunch"|"dinner"|"snack", ' +
            '"name": string, "description": string, "calories": number, "protein": number, ' +
            '"carbs": number, "fat": number, "fiber": number, "sugar": number, ' +
            '"saturatedFat": number, "sodium": number } ] }. ' +
            "All macros (protein/carbs/fat/fiber/sugar/saturatedFat) are grams per meal; sodium is mg per meal. " +
            "Always include fiber, sugar, saturatedFat, and sodium. " +
            "Hit the user's calorie target within ±8% and macro targets within ±15%. " +
            "Use simple whole-food recipes. Include 3 meals + 1 snack. No emojis.",
        },
        {
          role: "user",
          content: `Profile:\n${body.profile}\n\nPreferences: ${body.preferences ?? "none"}`,
        },
      ],
    });
    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as {
      summary?: string;
      meals?: unknown;
    };
    res.json({
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      meals: safeMealPlanMeals(parsed.meals),
    });
  } catch (err) {
    req.log?.error({ err }, "meal-plan failed");
    res.status(500).json({ error: "meal plan failed" });
  }
});

function safeMealPlanMeals(value: unknown) {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(["breakfast", "lunch", "dinner", "snack"]);
  return value
    .map((m) => {
      if (typeof m !== "object" || m === null) return null;
      const o = m as Record<string, unknown>;
      const mealType = o["mealType"];
      const name = o["name"];
      if (typeof name !== "string" || typeof mealType !== "string") return null;
      if (!allowed.has(mealType)) return null;
      return {
        mealType,
        name,
        description:
          typeof o["description"] === "string" ? (o["description"] as string) : "",
        calories: readNum(o, "calories"),
        protein: readNum(o, "protein"),
        carbs: readNum(o, "carbs"),
        fat: readNum(o, "fat"),
        fiber: readOptNum(o, "fiber"),
        sugar: readOptNum(o, "sugar"),
        saturatedFat: readOptNum(o, "saturatedFat", "satFat", "saturated_fat"),
        sodium: readOptNum(o, "sodium"),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

router.post("/ai/workout-plan", async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      profile?: string;
      daysPerWeek?: number;
      focus?: string;
    };
    if (!body?.profile) {
      res.status(400).json({ error: "profile required" });
      return;
    }
    const days = Math.min(7, Math.max(2, Number(body.daysPerWeek) || 4));
    const completion = await getClient().chat.completions.create({
      model: MODEL,
      max_completion_tokens: 1600,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You design weekly workout plans. Reply with JSON: " +
            '{"summary": string, "days": [ { "day": string, "focus": string, ' +
            '"durationMin": number, "exercises": [ { "name": string, "sets": string, "notes": string } ] } ] }. ' +
            "Balance strength, conditioning, and recovery. Include warm-up/cool-down notes. No emojis.",
        },
        {
          role: "user",
          content: `Profile:\n${body.profile}\n\nDays/week: ${days}\nFocus: ${body.focus ?? "balanced"}`,
        },
      ],
    });
    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as { summary?: string; days?: unknown };
    res.json({
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      days: safeWorkoutDays(parsed.days),
    });
  } catch (err) {
    req.log?.error({ err }, "workout-plan failed");
    res.status(500).json({ error: "workout plan failed" });
  }
});

function safeWorkoutDays(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((d) => {
      if (typeof d !== "object" || d === null) return null;
      const o = d as Record<string, unknown>;
      const day = o["day"];
      const focus = o["focus"];
      if (typeof day !== "string" || typeof focus !== "string") return null;
      const exercises = Array.isArray(o["exercises"])
        ? (o["exercises"] as unknown[])
            .map((e) => {
              if (typeof e !== "object" || e === null) return null;
              const eo = e as Record<string, unknown>;
              const name = eo["name"];
              if (typeof name !== "string") return null;
              return {
                name,
                sets: typeof eo["sets"] === "string" ? (eo["sets"] as string) : "",
                notes:
                  typeof eo["notes"] === "string" ? (eo["notes"] as string) : "",
              };
            })
            .filter((x): x is NonNullable<typeof x> => x !== null)
        : [];
      const durationMin =
        typeof o["durationMin"] === "number"
          ? (o["durationMin"] as number)
          : Number(o["durationMin"]) || 0;
      return { day, focus, durationMin, exercises };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

export default router;
