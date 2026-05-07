import SearchInput from "@/components/admin/SearchInput";

interface Props {
  query: string;
  /** Slot for the date picker, rendered to the right of the search bar. */
  rightSlot?: React.ReactNode;
}

// Filters row for the orders page: search + date picker side-by-side.
export default function OrdersFilters({ query, rightSlot }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <SearchInput defaultValue={query} />
      {rightSlot}
    </div>
  );
}
