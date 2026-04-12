import { Request, Response } from "express";
import { config } from "../config";
import { LocationService } from "../services/location";
import { ApiResponse, PlaceDetails } from "../types";

export async function getLocationDetails(
  _req: Request,
  res: Response<ApiResponse<PlaceDetails>>
): Promise<void> {
  try {
    const locationService = new LocationService(config.googleMaps.apiKey);
    const details = await locationService.getPlaceDetails();
    res.json({ success: true, data: details });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Location fetch error:", message);
    res.status(500).json({ success: false, error: "Failed to load location details" });
  }
}
