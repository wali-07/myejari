import ActivitiesTable from "@/components/admin/ActivitiesTable";
import { aggregateActivities } from "@/lib/admin/activities";
import { readActivityNotes } from "@/lib/admin/activities-store";
import { getAllOrders } from "@/lib/admin/orders-store";

export const dynamic = "force-dynamic";

export default async function AdminSpecsPage() {
  const [orders, notes] = await Promise.all([
    getAllOrders(),
    readActivityNotes(),
  ]);
  const activities = aggregateActivities(orders, notes);

  return (
    <div className="space-y-5 sm:space-y-7">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Specs
        </h1>
        <p className="mt-1 text-sm text-gray">
          Business activities placed across all orders, with the office
          types they ended up using. Notes per activity build into our own
          internal reference of what works.
        </p>
      </header>

      <ActivitiesTable activities={activities} />
    </div>
  );
}
