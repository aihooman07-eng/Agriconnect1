import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { farmers, farms } from "@schema";
import { requireCoordinator } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { sendFarmRejectedEmail } from "@/lib/email";

const moderateSchema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("approve"),
  }),
  z.object({
    decision: z.literal("reject"),
    rejectionReason: z.string().trim().min(1).max(4000),
  }),
]);

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const coordinator = await requireCoordinator();
  if (!coordinator) {
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

  const parsed = moderateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const db = getDb();

  const rows = await db
    .select({
      farm: farms,
      farmerEmail: farmers.email,
    })
    .from(farms)
    .innerJoin(farmers, eq(farms.farmerId, farmers.id))
    .where(eq(farms.id, uuid.data))
    .limit(1);

  const hit = rows[0];
  if (!hit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const decision = parsed.data;
  if (decision.decision === "approve") {
    await db
      .update(farms)
      .set({
        status: "live",
        rejectReason: null,
        updatedAt: new Date(),
      })
      .where(eq(farms.id, uuid.data));
  } else {
    await db
      .update(farms)
      .set({
        status: "rejected",
        rejectReason: decision.rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(farms.id, uuid.data));

    await sendFarmRejectedEmail(hit.farmerEmail, hit.farm.name, decision.rejectionReason);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
