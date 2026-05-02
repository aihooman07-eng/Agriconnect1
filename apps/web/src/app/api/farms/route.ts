import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { farms } from "@schema";
import { getSessionPrincipal } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fetchLiveDiscoveryFarms } from "@/lib/live-farms";

const createFarmSchema = z.object({
  name: z.string().min(1).max(200),
  shortDescription: z.string().min(1).max(500),
  story: z.string().min(1).max(8000),
  latitude: z.number().finite().gte(-90).lte(90),
  longitude: z.number().finite().gte(-180).lte(180),
  dairy: z.boolean().optional().default(false),
  crops: z.boolean().optional().default(false),
  poultry: z.boolean().optional().default(false),
  organic: z.boolean().optional().default(false),
  schoolFriendly: z.boolean().optional().default(false),
  primaryImageUrl: z.string().url().max(2000).optional().nullable(),
  visitorNotes: z.string().max(2000).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const visitorLat = Number(searchParams.get("lat"));
  const visitorLng = Number(searchParams.get("lng"));

  const dairy = searchParams.get("dairy");
  const crops = searchParams.get("crops");
  const poultry = searchParams.get("poultry");
  const organic = searchParams.get("organic");
  const schoolFriendly = searchParams.get("schoolFriendly");

  const rows = await fetchLiveDiscoveryFarms({
    dairy: dairy === "1",
    crops: crops === "1",
    poultry: poultry === "1",
    organic: organic === "1",
    schoolFriendly: schoolFriendly === "1",
    visitorLat,
    visitorLng,
  });

  return NextResponse.json({ farms: rows }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const principal = await getSessionPrincipal();
  if (!principal || principal.kind !== "farmer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createFarmSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid farm payload" }, { status: 400 });
  }

  const data = parsed.data;
  const db = getDb();

  const [row] = await db
    .insert(farms)
    .values({
      farmerId: principal.farmerId,
      status: "pending",
      name: data.name,
      shortDescription: data.shortDescription,
      story: data.story,
      latitude: data.latitude,
      longitude: data.longitude,
      dairy: data.dairy,
      crops: data.crops,
      poultry: data.poultry,
      organic: data.organic,
      schoolFriendly: data.schoolFriendly,
      primaryImageUrl: data.primaryImageUrl ?? undefined,
      visitorNotes: data.visitorNotes ?? undefined,
    })
    .returning({ id: farms.id });

  return NextResponse.json({ farm: row }, { status: 201 });
}
