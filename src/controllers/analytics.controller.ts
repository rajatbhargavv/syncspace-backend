import { Request, Response } from "express";
import { getSpaceAnalytics } from "../services/analytics.service.js";
import AppError from "../utils/AppError.js";

export async function handleGetSpaceAnalytics(req: Request, res: Response) {
  const spaceId = req.params.id as string;
  const userId = req.user?.id;
  if (!spaceId) {
    throw new AppError("Space ID is required", 400);
  }
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const range = (req.query.range as string) || "7d";
  if (range !== "7d" && range !== "30d" && range !== "90d") {
    throw new AppError("Range must be one of: '7d', '30d', '90d'", 400);
  }

  const analytics = await getSpaceAnalytics(spaceId, userId, range);
  return res.status(200).json({
    message: "Space analytics fetched successfully",
    analytics,
  });
}
