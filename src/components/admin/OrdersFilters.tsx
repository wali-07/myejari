import SearchInput from "@/components/admin/SearchInput";

interface Props {
  query: string;
}

// Search bar row. Full-width on mobile, fixed-width and right-aligned on
// desktop. Date filtering lives above the summary cards now.
export default function OrdersFilters({ query }: Props) {
  return (
    <div className="flex">
      <div className="w-full sm:ml-auto sm:w-72">
        <SearchInput defaultValue={query} fullWidth />
      </div>
    </div>
  );
}
