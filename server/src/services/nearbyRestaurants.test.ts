import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NearbyRestaurantsService } from "./nearbyRestaurants";
import { cache } from "../lib/cache";

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildNearbyApiResponse(places: unknown[] = []) {
  return {
    ok: true,
    json: async () => ({ places }),
  };
}

function buildPlace(overrides: Record<string, unknown> = {}) {
  return {
    displayName: { text: "Test Restaurant" },
    formattedAddress: "Teststraat 1, Amsterdam, Netherlands",
    googleMapsUri: "https://maps.google.com/?cid=test",
    editorialSummary: { text: "A great test restaurant." },
    ...overrides,
  };
}

// ── getMockRestaurants ────────────────────────────────────────────────────────

describe("NearbyRestaurantsService.getMockRestaurants", () => {
  it("getMockRestaurants_ShouldReturnNonEmptyList_WhenCalled", () => {
    const service = new NearbyRestaurantsService("");
    const result = service.getMockRestaurants();
    expect(result.length).toBeGreaterThan(0);
  });

  it("getMockRestaurants_ShouldReturnRestaurantsWithNames_WhenCalled", () => {
    const service = new NearbyRestaurantsService("");
    const result = service.getMockRestaurants();
    for (const r of result) {
      expect(r.name).toBeTruthy();
    }
  });

  it("getMockRestaurants_ShouldReturnRestaurantsWithValidMapsUrls_WhenCalled", () => {
    const service = new NearbyRestaurantsService("");
    const result = service.getMockRestaurants();
    for (const r of result) {
      expect(r.mapsUrl).toMatch(/^https?:\/\//);
    }
  });
});

// ── getNearbyRestaurantsWithoutWebsite ────────────────────────────────────────

describe("NearbyRestaurantsService.getNearbyRestaurantsWithoutWebsite", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    cache.invalidate("nearby-restaurants-no-website");
  });

  afterEach(() => {
    cache.invalidate("nearby-restaurants-no-website");
  });

  it("getNearbyRestaurantsWithoutWebsite_ShouldReturnMockData_WhenNoApiKeyProvided", async () => {
    const service = new NearbyRestaurantsService("");
    const result = await service.getNearbyRestaurantsWithoutWebsite();
    expect(result.length).toBeGreaterThan(0);
    for (const r of result) {
      expect(r.name).toBeTruthy();
      expect(r.mapsUrl).toMatch(/^https?:\/\//);
    }
  });

  it("getNearbyRestaurantsWithoutWebsite_ShouldReturnOnlyPlacesWithoutWebsite_WhenApiRespondsSuccessfully", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      buildNearbyApiResponse([
        buildPlace({ websiteUri: undefined }),
        buildPlace({ displayName: { text: "Restaurant With Website" }, websiteUri: "https://example.com" }),
        buildPlace({ displayName: { text: "Another No-Website Place" }, websiteUri: undefined }),
      ])
    );
    vi.stubGlobal("fetch", mockFetch);

    const service = new NearbyRestaurantsService("test-api-key");
    const result = await service.getNearbyRestaurantsWithoutWebsite();

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).not.toContain("Restaurant With Website");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://places.googleapis.com/v1/places:searchNearby",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Goog-Api-Key": "test-api-key",
          "X-Goog-FieldMask": expect.stringContaining("places.websiteUri"),
        }),
        body: expect.stringContaining('"rankPreference":"DISTANCE"'),
      })
    );
  });

  it("getNearbyRestaurantsWithoutWebsite_ShouldReturnCachedData_WhenCacheIsWarm", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      buildNearbyApiResponse([buildPlace({ websiteUri: undefined })])
    );
    vi.stubGlobal("fetch", mockFetch);

    const service = new NearbyRestaurantsService("test-api-key");

    await service.getNearbyRestaurantsWithoutWebsite();
    await service.getNearbyRestaurantsWithoutWebsite();

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("getNearbyRestaurantsWithoutWebsite_ShouldUseEditorialSummaryAsDescription_WhenAvailable", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      buildNearbyApiResponse([
        buildPlace({
          websiteUri: undefined,
          editorialSummary: { text: "Cosy neighbourhood bistro." },
        }),
      ])
    );
    vi.stubGlobal("fetch", mockFetch);

    const service = new NearbyRestaurantsService("test-api-key");
    const result = await service.getNearbyRestaurantsWithoutWebsite();

    expect(result[0].description).toBe("Cosy neighbourhood bistro.");
  });

  it("getNearbyRestaurantsWithoutWebsite_ShouldFallbackToAddressAsDescription_WhenEditorialSummaryMissing", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      buildNearbyApiResponse([
        buildPlace({
          websiteUri: undefined,
          editorialSummary: undefined,
          formattedAddress: "Keizersgracht 123, Amsterdam",
        }),
      ])
    );
    vi.stubGlobal("fetch", mockFetch);

    const service = new NearbyRestaurantsService("test-api-key");
    const result = await service.getNearbyRestaurantsWithoutWebsite();

    expect(result[0].description).toBe("Keizersgracht 123, Amsterdam");
  });

  it("getNearbyRestaurantsWithoutWebsite_ShouldThrowError_WhenApiRequestFails", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 403 });
    vi.stubGlobal("fetch", mockFetch);

    const service = new NearbyRestaurantsService("test-api-key");
    await expect(service.getNearbyRestaurantsWithoutWebsite()).rejects.toThrow("HTTP 403");
  });

  it("getNearbyRestaurantsWithoutWebsite_ShouldThrowError_WhenApiReturnsErrorObject", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        error: { status: "REQUEST_DENIED", message: "API not authorized." },
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const service = new NearbyRestaurantsService("test-api-key");
    await expect(service.getNearbyRestaurantsWithoutWebsite()).rejects.toThrow("REQUEST_DENIED");
  });

  it("getNearbyRestaurantsWithoutWebsite_ShouldReturnEmptyList_WhenAllPlacesHaveWebsites", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      buildNearbyApiResponse([
        buildPlace({ websiteUri: "https://a.com" }),
        buildPlace({ websiteUri: "https://b.com" }),
      ])
    );
    vi.stubGlobal("fetch", mockFetch);

    const service = new NearbyRestaurantsService("test-api-key");
    const result = await service.getNearbyRestaurantsWithoutWebsite();

    expect(result).toHaveLength(0);
  });
});
