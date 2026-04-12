import { Request, Response } from "express";
import { config } from "../config";
import { NearbyRestaurantsService } from "../services/nearbyRestaurants";
import { ApiResponse, NearbyRestaurant } from "../types";

export async function getNearbyRestaurants(
  _req: Request,
  res: Response<ApiResponse<NearbyRestaurant[]>>
): Promise<void> {
  try {
    const service = new NearbyRestaurantsService(config.googleMaps.apiKey);
    const restaurants = await service.getNearbyRestaurantsWithoutWebsite();
    res.json({ success: true, data: restaurants });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Nearby restaurants fetch error:", message);
    res.status(500).json({ success: false, error: "Failed to load nearby restaurants" });
  }
}
