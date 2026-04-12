import { PlaceDetails, PlaceReview } from "../types";

const PLACE_NAME = "Sushi Toyo Takapuna";
const PLACE_ADDRESS = "55 Hurstmere Road, Takapuna, Auckland 0622, New Zealand";
const PLACE_MAPS_URL =
  "https://www.google.com/maps/place/Sushi+Toyo+Takapuna/@-36.790342,174.7733968,17z";

const PLACE_SEARCH_QUERY = "Sushi Toyo Takapuna, Takapuna, Auckland";

// Places API (New) — single endpoint, single request
// Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
const PLACES_API_BASE_URL = "https://places.googleapis.com/v1";

// Only the fields we actually use. Keeping the mask narrow reduces billing cost.
const FIELD_MASK = [
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.reviews",
].join(",");

const MOCK_REVIEWS: PlaceReview[] = [
  {
    authorName: "Sarah Mitchell",
    rating: 5,
    text: "Absolutely incredible sushi! The salmon nigiri melts in your mouth and the staff are so welcoming. Best Japanese restaurant in Takapuna by a mile.",
    relativeTimeDescription: "2 weeks ago",
    profilePhotoUrl: undefined,
  },
  {
    authorName: "James Tran",
    rating: 5,
    text: "Been coming here for years and it never disappoints. The omakase is outstanding value and the chefs clearly take pride in their craft. Highly recommend booking ahead.",
    relativeTimeDescription: "1 month ago",
    profilePhotoUrl: undefined,
  },
  {
    authorName: "Olivia Chen",
    rating: 4,
    text: "Really fresh fish and lovely atmosphere. The ramen is also surprisingly good. Only reason for 4 stars is the wait time on busy Friday nights — worth it though!",
    relativeTimeDescription: "3 weeks ago",
    profilePhotoUrl: undefined,
  },
  {
    authorName: "Michael Parata",
    rating: 5,
    text: "Took my partner here for a birthday dinner and we were blown away. The presentation is beautiful and the flavours are authentic. Will definitely be back.",
    relativeTimeDescription: "2 months ago",
    profilePhotoUrl: undefined,
  },
  {
    authorName: "Emma Johnson",
    rating: 4,
    text: "Consistently great quality. The dragon roll and the spicy tuna hand rolls are my go-to orders. Service is always friendly and efficient.",
    relativeTimeDescription: "1 week ago",
    profilePhotoUrl: undefined,
  },
];

const MOCK_PLACE_DETAILS: PlaceDetails = {
  name: PLACE_NAME,
  address: PLACE_ADDRESS,
  rating: 4.5,
  totalReviews: 287,
  reviews: MOCK_REVIEWS,
  mapsUrl: PLACE_MAPS_URL,
};

// ── Places API (New) response types ──────────────────────────────────────────

type PlacesApiReview = {
  relativePublishTimeDescription: string;
  rating: number;
  text?: { text: string };
  authorAttribution?: {
    displayName: string;
    photoUri?: string;
  };
};

type PlacesApiPlace = {
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: PlacesApiReview[];
};

type PlacesApiResponse = {
  places?: PlacesApiPlace[];
  error?: { message: string; status: string };
};

// ─────────────────────────────────────────────────────────────────────────────

export class LocationService {
  private readonly mapsApiKey: string;

  constructor(mapsApiKey: string) {
    this.mapsApiKey = mapsApiKey;
  }

  async getPlaceDetails(): Promise<PlaceDetails> {
    if (this.mapsApiKey) {
      return this.fetchFromPlacesApi();
    }
    return this.getMockPlaceDetails();
  }

  getMockPlaceDetails(): PlaceDetails {
    return MOCK_PLACE_DETAILS;
  }

  // Uses the Places API (New) Text Search endpoint.
  // Requires "Places API (New)" enabled on the Google Cloud project.
  // Billing must also be enabled on the project even within the free tier.
  private async fetchFromPlacesApi(): Promise<PlaceDetails> {
    const response = await fetch(`${PLACES_API_BASE_URL}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.mapsApiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({ textQuery: PLACE_SEARCH_QUERY }),
    });

    if (!response.ok) {
      throw new Error(`Places API (New) request failed with HTTP ${response.status}`);
    }

    const json = (await response.json()) as PlacesApiResponse;

    if (json.error) {
      throw new Error(
        `Places API (New) returned error: ${json.error.status} — ${json.error.message}`
      );
    }

    const place = json.places?.[0];
    if (!place) {
      throw new Error("Places API (New) returned no results for the search query");
    }

    return {
      name: place.displayName?.text ?? PLACE_NAME,
      address: place.formattedAddress ?? PLACE_ADDRESS,
      rating: place.rating ?? 0,
      totalReviews: place.userRatingCount ?? 0,
      mapsUrl: place.googleMapsUri ?? PLACE_MAPS_URL,
      reviews: (place.reviews ?? []).map((r) => ({
        authorName: r.authorAttribution?.displayName ?? "Anonymous",
        rating: r.rating,
        text: r.text?.text ?? "",
        relativeTimeDescription: r.relativePublishTimeDescription,
        profilePhotoUrl: r.authorAttribution?.photoUri,
      })),
    };
  }
}
