import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";

import { getProStatus } from "../lib/billing/entitlements";
import {
  FREE_LIMITS,
  refund,
  tryConsume,
  type AiFeature,
} from "../lib/billing/usage";

/**
 * Gate for every /api/ai/* route:
 *  1. Caller must be a signed-in Clerk user (401 otherwise). This closes the
 *     hole where anyone could call the OpenAI-backed endpoints anonymously.
 *  2. Pro users pass straight through.
 *  3. Free users consume one unit of today's quota, or get
 *     402 { error: "upgrade_required" } so the app can show the paywall.
 * If the handler ends in a 5xx, the free unit is refunded.
 */
export function aiAccess(feature: AiFeature) {
  return async (req: Request, res: Response, next: NextFunction) => {
    let userId: string | null | undefined;
    try {
      userId = getAuth(req)?.userId;
    } catch {
      userId = null;
    }
    if (!userId) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const { pro } = await getProStatus(userId);
    if (pro) {
      next();
      return;
    }

    if (!(await tryConsume(userId, feature))) {
      res.status(402).json({
        error: "upgrade_required",
        feature,
        limit: FREE_LIMITS[feature],
      });
      return;
    }

    const uid = userId;
    res.on("finish", () => {
      if (res.statusCode >= 500) void refund(uid, feature);
    });
    next();
  };
}
