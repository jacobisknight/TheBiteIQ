import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";

import { forgetProStatus, getProStatus } from "../lib/billing/entitlements";
import { FREE_LIMITS, getUsage } from "../lib/billing/usage";

const router: IRouter = Router();

function userIdOf(req: Request): string | null {
  try {
    return getAuth(req)?.userId ?? null;
  } catch {
    return null;
  }
}

/** GET /api/billing/status – Pro flag plus today's free usage. */
router.get("/billing/status", async (req: Request, res: Response) => {
  const userId = userIdOf(req);
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const fresh = req.query["fresh"] === "1";
  if (fresh) forgetProStatus(userId);
  const status = await getProStatus(userId, { fresh });
  res.json({ ...status, usage: await getUsage(userId), limits: FREE_LIMITS });
});

export default router;
