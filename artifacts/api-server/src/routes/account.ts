import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";

import { clearAll as clearHealthForUser } from "../lib/health/tokenStore";

const router: IRouter = Router();

router.delete("/account", async (req: Request, res: Response) => {
  let userId: string | null | undefined;
  try {
    userId = getAuth(req)?.userId;
  } catch (err) {
    req.log?.warn({ err }, "clerk getAuth threw on /account");
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  try {
    await clerkClient.users.deleteUser(userId);
  } catch (err) {
    req.log?.error({ err, userId }, "clerk user deletion failed");
    res.status(502).json({ error: "deletion_failed" });
    return;
  }

  try {
    await clearHealthForUser(userId);
  } catch (err) {
    req.log?.warn(
      { err, userId },
      "health token cleanup after account deletion failed",
    );
  }

  res.json({ ok: true });
});

export default router;
