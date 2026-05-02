import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { farms } from "@schema";
import { getSessionPrincipal } from "@/lib/auth";
import { getDb } from "@/lib/db";

const patchFarmSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    shortDescription: z.string().min(1).max(500).optional(),
    story: z.string().min(1).max(8000).optional(),
    latitude: z.number().finite().gte(-90).lte(90).optional(),
    longitude: z.number().finite().gte(-180).lte(180).optional(),
    dairy: z.boolean().optional(),
    crops: z.boolean().optional(),
    poultry: z.boolean().optional(),
    organic: z.boolean().optional(),
    schoolFriendly: z.boolean().optional(),
    primaryImageUrl: z.string().url().max(2000).nullable().optional(),
    visitorNotes: z.string().max(2000).nullable().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "empty" });

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const uuid = z.string().uuid().safeParse(id);
  if (!uuid.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const db = getDb();
  const principal = await getSessionPrincipal();

  const [row] = await db
    .select()
    .from(farms)
    .where(eq(farms.id, uuid.data))
    .limit(1);

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner =
    principal?.kind === "farmer" && principal.farmerId === row.farmerId;
  const isCoordinator = principal?.kind === "coordinator";

  const isLive = row.status === "live";
  if (!isLive && !(isOwner || isCoordinator)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ farm: row }, { status: 200 });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const principal = await getSessionPrincipal();
  if (!principal || principal.kind !== "farmer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const uuid = z.string().uuid().safeParse(id);
  if (!uuid.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchFarmSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const db = getDb();

  const [existing] = await db
    .select()
    .from(farms)
    .where(
      and(eq(farms.id, uuid.data), eq(farms.farmerId, principal.farmerId)),
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const next = parsed.data;
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
    status: "pending",
    rejectReason: null,
  };

  if ("name" in next) updates.name = next.name;
  if ("shortDescription" in next) updates.shortDescription = next.shortDescription;
  if ("story" in next) updates.story = next.story;
  if ("latitude" in next) updates.latitude = next.latitude;
  if ("longitude" in next) updates.longitude = next.longitude;
  if ("dairy" in next) updates.dairy = next.dairy;
  if ("crops" in next) updates.crops = next.crops;
  if ("poultry" in next) updates.poultry = next.poultry;
  if ("organic" in next) updates.organic = next.organic;
  if ("schoolFriendly" in next) updates.schoolFriendly = next.schoolFriendly;
  if ("primaryImageUrl" in next) updates.primaryImageUrl = next.primaryImageUrl ?? null;
  if ("visitorNotes" in next) updates.visitorNotes = next.visitorNotes ?? null;

  await db
    .update(farms)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set(updates as any)
    .where(and(eq(farms.id, uuid.data), eq(farms.farmerId, principal.farmerId)));

  const [row] = await db.select().from(farms).where(eq(farms.id, uuid.data)).limit(1);

  return NextResponse.json({ farm: row }, { status: 200 });
}
