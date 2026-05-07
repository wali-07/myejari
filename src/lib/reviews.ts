export interface Review {
  name: string;
  rating: number;
  date: string;
  /** ISO 8601 date for structured data */
  datePublished: string;
  text: string;
}

// To replace placeholders with your real Google reviews:
//   1. Open your Google Business Profile reviews:
//      https://www.google.com/search?q=myejari#lrd=0x6cb438293005b18d:0x3b57f75a8136dd1c,1
//   2. Copy reviewer first name + last initial, the date label ("2 weeks ago"),
//      and the review text into the array below.
//   3. Update REVIEW_AGGREGATE.rating and .count to match the live page.
// (Google does not allow static fetching of review text; an API key + Places
//  API is required for automated pulls. For a small site, manual paste is
//  usually simpler and gives you editorial control over which reviews surface.)

// `reviews` = the four hand-picked testimonials shown in the visible UI.
// `additionalReviews` = the rest of the live Google reviews — emitted in
// JSON-LD and as crawler-accessible (sr-only) text so search engines and AI
// crawlers can index every review even though only four render visually.
export const reviews: Review[] = [
  {
    name: "Pascale M.",
    rating: 5,
    date: "11 months ago",
    datePublished: "2025-06-15",
    text: "I had a smooth and efficient experience. The staff was professional, helpful, and quick to process my request. They explained the steps clearly and made sure all my documents were in order. The whole process took less time than expected, and I appreciated the organized and welcoming environment. Highly recommended for anyone needing to register or renew their Ejari!",
  },
  {
    name: "Sam S.",
    rating: 5,
    date: "a year ago",
    datePublished: "2025-05-10",
    text: "I had an excellent experience with MyEjari — they provided the quickest and most professional support I've encountered. My company Ejari was processed seamlessly, and I received the official document promptly after completing the payment. The entire process was smooth, efficient, and hassle-free. Highly recommend their services if you're looking for speed and reliability!",
  },
  {
    name: "Ashly R.",
    rating: 5,
    date: "a year ago",
    datePublished: "2025-05-05",
    text: "Working with MyEjari was an incredibly smooth experience. They secured the best Ejari rates available on the market, and their team was consistently proactive, reliable, and true to their word. Exactly the kind of service you want — efficient, transparent, and professional. Highly recommended!",
  },
  {
    name: "Nassib S.",
    rating: 5,
    date: "a year ago",
    datePublished: "2025-04-28",
    text: "Working with MyEjari was seamless. They got me the best Ejari rates on the market. The team is proactive and delivers what is agreed on. As a business owner this is exactly what is needed. Highly recommended!",
  },
];

export const additionalReviews: Review[] = [
  {
    name: "Chris H.",
    rating: 5,
    date: "5 months ago",
    datePublished: "2025-12-07",
    text: "Very comfortable dealing with MyEjari. The team is very cooperative, quick and helpful. Appreciate the support!",
  },
  {
    name: "Chris D.",
    rating: 5,
    date: "a year ago",
    datePublished: "2025-05-07",
    text: "The MyEjari team was very helpful and responsive. They answered all of my questions and also messaged the next day as promised at the time we had arranged. The payment and transaction process was easy and I received the certificate.",
  },
  {
    name: "Osama A.",
    rating: 5,
    date: "11 months ago",
    datePublished: "2025-06-07",
    text: "Great service! Very professional, quick and supportive. Highly recommend reaching out for all your commercial leasing/ejari needs.",
  },
  {
    name: "The Furrys",
    rating: 5,
    date: "10 months ago",
    datePublished: "2025-07-07",
    text: "Okay guys, this is what we call professionalism. Their service was very fast, quite affordable and genuine. Will def use them again.",
  },
  {
    name: "Varun T.",
    rating: 5,
    date: "2 months ago",
    datePublished: "2026-03-07",
    text: "Great! Was smooth and good coms.",
  },
  {
    name: "Muhammad A.",
    rating: 5,
    date: "7 months ago",
    datePublished: "2025-10-07",
    text: "Excellent Service – Fast, Reliable, and Professional!",
  },
  {
    name: "Ifeanyi I.",
    rating: 5,
    date: "a year ago",
    datePublished: "2025-05-07",
    text: "Fantastic customer service, always professional and helpful. They've been patient and responsive to all my requests.",
  },
  {
    name: "Hassan K.",
    rating: 5,
    date: "11 months ago",
    datePublished: "2025-06-07",
    text: "Great response and absolutely suggested. I also found out that you have the greatest support after sale, really appreciate it.",
  },
  {
    name: "Abesinghe W.",
    rating: 5,
    date: "a year ago",
    datePublished: "2025-05-07",
    text: "Issued license with minutes time. Very reasonable prices for Ejari. Great service.",
  },
  {
    name: "Glassco International",
    rating: 5,
    date: "6 months ago",
    datePublished: "2025-11-07",
    text: "Very efficient and cost effective solutions.",
  },
  {
    name: "Dalal H.",
    rating: 5,
    date: "a year ago",
    datePublished: "2025-05-07",
    text: "Service is super fast and straightforward! They offer the lowest price out there!",
  },
  {
    name: "Jarrah A.",
    rating: 5,
    date: "5 months ago",
    datePublished: "2025-12-07",
    text: "Excellent customer service.",
  },
  {
    name: "T R.",
    rating: 5,
    date: "10 months ago",
    datePublished: "2025-07-07",
    text: "These guys were fast efficient and got everything done in matter of minutes.",
  },
  {
    name: "O A.",
    rating: 5,
    date: "a year ago",
    datePublished: "2025-05-07",
    text: "Nice and easy.",
  },
  {
    name: "Offplan Dubai",
    rating: 5,
    date: "2 days ago",
    datePublished: "2026-05-05",
    text: "Fast and very good priced, very much recommended!",
  },
  {
    name: "Khan W.",
    rating: 5,
    date: "6 days ago",
    datePublished: "2026-05-01",
    text: "In the beginning, I wasn't sure about this company, but after I tried their service, I changed my mind and now say they are amazing. Good price, quick response, immediate Ejari.",
  },
  {
    name: "Tarek A.",
    rating: 5,
    date: "11 months ago",
    datePublished: "2025-06-07",
    text: "Excellent and fast service, the staff are professional and cooperative, and I recommend dealing with them to easily register or renew my lease.",
  },
];

// Combined list — featured first, then the rest. Used for JSON-LD review markup
// and the sr-only crawler block.
export const allReviews: Review[] = [...reviews, ...additionalReviews];

// Live Google rating: 5.0 stars across all reviews on the Business Profile.
export const REVIEW_AGGREGATE = {
  rating: 5.0,
  count: allReviews.length,
};

// Direct link to MyEjari's Google reviews panel
export const GOOGLE_REVIEWS_URL =
  "https://www.google.com/search?q=myejari#lrd=0x6cb438293005b18d:0x3b57f75a8136dd1c,1,,,,";
