import { eq } from "drizzle-orm";
import { farmers, farms } from "@schema";
import { getDb } from "@/lib/db";
import type { PendingFarmCard } from "./moderation-row";
import { ModerationFarmCard } from "./moderation-row";

export default async function CoordinatorQueuePage() {
  const db = getDb();

  const rows = await db
    .select({
      farm: farms,
      farmerEmail: farmers.email,
    })
    .from(farms)
    .innerJoin(farmers, eq(farms.farmerId, farmers.id))
    .where(eq(farms.status, "pending"));

  const cards: PendingFarmCard[] = rows.map((r) => ({
    id: r.farm.id,
    name: r.farm.name,
    farmerEmail: r.farmerEmail,
    latitude: r.farm.latitude,
    longitude: r.farm.longitude,
    dairy: r.farm.dairy,
    crops: r.farm.crops,
    poultry: r.farm.poultry,
    organic: r.farm.organic,
    schoolFriendly: r.farm.schoolFriendly,
  }));

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold text-emerald-950">Moderation queue</h1>
        <p className="text-sm text-neutral-700">
          Approved listings instantly appear under Discover while rejected hosts receive coordinator notes via email.
        </p>
      </header>

      {cards.length === 0 ? (
        <p className="text-sm text-neutral-700">Nothing pending.</p>
      ) : (
        <ul className="grid gap-4">
          {cards.map((c) => (
            <ModerationFarmCard key={c.id} farm={c} />
          ))}
        </ul>
      )}
    </div>
  );
}
