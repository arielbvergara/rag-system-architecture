import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

// ── Hoist mock refs ───────────────────────────────────────────────────────────
const { mockGetPlaceDetails, mockConfig } = vi.hoisted(() => ({
  mockGetPlaceDetails: vi.fn(),
  mockConfig: {
    googleMaps: { apiKey: "" },
  },
}));

vi.mock("../services/location", () => ({
  LocationService: vi.fn().mockImplementation(function (
    this: { getPlaceDetails: typeof mockGetPlaceDetails }
  ) {
    this.getPlaceDetails = mockGetPlaceDetails;
  }),
}));

vi.mock("../config", () => ({ config: mockConfig }));

import { getLocationDetails } from "./location";

function buildRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

const MOCK_PLACE_DETAILS = {
  name: "Sushi Toyo Takapuna",
  address: "55 Hurstmere Road, Takapuna, Auckland 0622, New Zealand",
  rating: 4.5,
  totalReviews: 287,
  reviews: [],
  mapsUrl: "https://www.google.com/maps/place/Sushi+Toyo+Takapuna",
};

describe("location controller — getLocationDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getLocationDetails_ShouldReturn200WithPlaceDetails_WhenServiceSucceeds", async () => {
    mockGetPlaceDetails.mockResolvedValueOnce(MOCK_PLACE_DETAILS);
    const req = {} as Request;
    const res = buildRes();

    await getLocationDetails(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: MOCK_PLACE_DETAILS,
    });
  });

  it("getLocationDetails_ShouldReturn500_WhenServiceThrows", async () => {
    mockGetPlaceDetails.mockRejectedValueOnce(new Error("Places API unavailable"));
    const req = {} as Request;
    const res = buildRes();

    await getLocationDetails(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Failed to load location details",
    });
  });

  it("getLocationDetails_ShouldReturn500WithGenericMessage_WhenNonErrorThrown", async () => {
    mockGetPlaceDetails.mockRejectedValueOnce("unexpected failure");
    const req = {} as Request;
    const res = buildRes();

    await getLocationDetails(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Failed to load location details",
    });
  });
});
