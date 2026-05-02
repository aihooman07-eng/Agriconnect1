import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { farms } from "@schema";
import { getDb } from "@/lib/db";
import { MALKANGIRI_BOX } from "@/lib/malkangiri";

export type DiscoveryFilters = {
  dairy?: boolean;
  crops?: boolean;
  poultry?: boolean;
  organic?: boolean;
  schoolFriendly?: boolean;
  visitorLat?: number;
  visitorLng?: number;
};

export async function fetchLiveDiscoveryFarms(filters: DiscoveryFilters) {
  const db = getDb();

  const whereParts = [
    eq(farms.status, "live"),
    gte(farms.latitude, MALKANGIRI_BOX.latMin),
    lte(farms.latitude, MALKANGIRI_BOX.latMax),
    gte(farms.longitude, MALKANGIRI_BOX.lngMin),
    lte(farms.longitude, MALKANGIRI_BOX.lngMax),
  ];

  if (filters.dairy) whereParts.push(eq(farms.dairy, true));
  if (filters.crops) whereParts.push(eq(farms.crops, true));
  if (filters.poultry) whereParts.push(eq(farms.poultry, true));
  if (filters.organic) whereParts.push(eq(farms.organic, true));
  if (filters.schoolFriendly) whereParts.push(eq(farms.schoolFriendly, true));

  const baseWhere = and(...whereParts);

  if (
    Number.isFinite(filters.visitorLat) &&
    Number.isFinite(filters.visitorLng)
  ) {
    const visitorLat = filters.visitorLat!;
    const visitorLng = filters.visitorLng!;

    return await db
      .select({
        id: farms.id,
        name: farms.name,
        shortDescription: farms.shortDescription,
        latitude: farms.latitude,
        longitude: farms.longitude,
        dairy: farms.dairy,
        crops: farms.crops,
        poultry: farms.poultry,
        organic: farms.organic,
        schoolFriendly: farms.schoolFriendly,
      })
      .from(farms)
      .where(baseWhere)
      .orderBy(
        asc(
          sql`(${farms.latitude} - ${visitorLat}) * (${farms.latitude} - ${visitorLat}) + (${farms.longitude} - ${visitorLng}) * (${farms.longitude} - ${visitorLng})`,
        ),
      );
  }

  return await db
    .select({
      id: farms.id,
      name: farms.name,
      shortDescription: farms.shortDescription,
      latitude: farms.latitude,
      longitude: farms.longitude,
      dairy: farms.dairy,
      crops: farms.crops,
      poultry: farms.poultry,
      organic: farms.organic,
      schoolFriendly: farms.schoolFriendly,
    })
    .from(farms)
    .where(baseWhere)
    .orderBy(asc(farms.name));
}
