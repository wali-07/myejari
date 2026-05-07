import {
  reviews as fallbackReviews,
  additionalReviews as fallbackAdditional,
  allReviews as fallbackAll,
  REVIEW_AGGREGATE as fallbackAggregate,
  type Review,
} from "./reviews";

interface PlacesReview {
  author_name: string;
  rating: number;
  relative_time_description: string;
  time: number;
  text: string;
}

interface PlacesResult {
  reviews?: PlacesReview[];
  rating?: number;
  user_ratings_total?: number;
}

interface ReviewBundle {
  /** The hand-picked reviews shown visually on the page. */
  reviews: Review[];
  /** Reviews beyond the visible four — emitted in JSON-LD and sr-only HTML. */
  additionalReviews: Review[];
  /** Combined list (reviews + additionalReviews) for JSON-LD review markup. */
  allReviews: Review[];
  aggregate: { rating: number; count: number };
  source: "google-places" | "fallback";
}

function shortenName(full: string): string {
  const cleaned = full.trim().replace(/\s+/g, " ");
  if (!cleaned) return "Anonymous";
  const parts = cleaned.split(" ");
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() ?? "";
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

/**
 * Fetch reviews from Google Places API with 24h ISR cache.
 * Falls back to hardcoded reviews if env vars missing or fetch fails.
 *
 * Required env vars (server-side, NOT NEXT_PUBLIC_):
 *   - GOOGLE_PLACES_API_KEY  — Google Cloud key with Places API enabled
 *   - GOOGLE_PLACES_PLACE_ID — Place ID for MyEjari (find via
 *     https://developers.google.com/maps/documentation/places/web-service/place-id)
 *
 * Note: the Places Details endpoint returns at most 5 reviews per call.
 */
export async function getReviews(): Promise<ReviewBundle> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACES_PLACE_ID;

  if (!apiKey || !placeId) {
    return {
      reviews: fallbackReviews,
      additionalReviews: fallbackAdditional,
      allReviews: fallbackAll,
      aggregate: fallbackAggregate,
      source: "fallback",
    };
  }

  try {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/details/json"
    );
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("fields", "reviews,rating,user_ratings_total");
    url.searchParams.set("reviews_sort", "newest");
    url.searchParams.set("language", "en");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 }, // 24h ISR
    });
    if (!res.ok) throw new Error(`Places API HTTP ${res.status}`);

    const data: { status: string; result?: PlacesResult; error_message?: string } =
      await res.json();
    if (data.status !== "OK") {
      throw new Error(
        `Places API status: ${data.status} ${data.error_message ?? ""}`
      );
    }

    const result = data.result ?? {};
    const apiReviews: Review[] = (result.reviews ?? []).map((r) => ({
      name: shortenName(r.author_name),
      rating: r.rating,
      date: r.relative_time_description,
      datePublished: new Date(r.time * 1000).toISOString().slice(0, 10),
      text: r.text,
    }));

    // Places Details returns at most 5 reviews; we always emit the full
    // hand-curated list in JSON-LD / sr-only so crawlers see every review.
    const visible = apiReviews.length > 0 ? apiReviews : fallbackReviews;
    return {
      reviews: visible,
      additionalReviews: fallbackAdditional,
      allReviews: fallbackAll,
      aggregate: {
        rating: result.rating ?? fallbackAggregate.rating,
        count: result.user_ratings_total ?? fallbackAggregate.count,
      },
      source: "google-places",
    };
  } catch (err) {
    console.error("[google-reviews] fetch failed, using fallback:", err);
    return {
      reviews: fallbackReviews,
      additionalReviews: fallbackAdditional,
      allReviews: fallbackAll,
      aggregate: fallbackAggregate,
      source: "fallback",
    };
  }
}
