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
}

function safeFoods(value: unknown): AIFood[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((it) => {
      if (typeof it !== "object" || it === null) return null;
      const o = it as Record<string, unknown>;
      const name = typeof o["name"] === "string" ? o["name"] : null;
      if (!name) return null;
      const num = (k: string): number => {
        const v = o[k];
        if (typeof v === "number" && Number.isFinite(v)) return v;
        if (typeof v === "string") {
          const n = Number(v);
          if (Number.isFinite(n)) return n;
        }
        return 0;
      };
      return {
        name,
        brand: typeof o["brand"] === "string" ? (o["brand"] as string) : undefined,
        servingDescription:
          typeof o["servingDescription"] === "string"
            ? (o["servingDescription"] as string)
            : typeof o["serving"] === "string"
              ? (o["serving"] as string)
              : undefined,
        calories: num("calories"),
        protein: num("protein"),
        carbs: num("carbs"),
        fat: num("fat"),
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
          '"calories": number, "protein": number, "carbs": number, "fat": number } ]}. ' +
          "All macros are grams per total serving (not per 100g). Estimate conservatively " +
          "based on common preparation. Combine sub-ingredients of a dish into one item " +
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

export default router;
