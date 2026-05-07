import SearchInput from "@/components/admin/SearchInput";

// Filters bar for the orders page. Just a search input now — payment-method
// chips were removed at the user's request; payment is still surfaced as
// a column in the table.
export default function OrdersFilters({ query }: { query: string }) {
  return (
    <div className="flex justify-end">
      <SearchInput defaultValue={query} />
    </div>
  );
}
