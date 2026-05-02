import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { coordinators, farmers, sessions } from "@schema";
import { SESSION_COOKIE } from "./constants";
import { tryGetDb } from "./db";
import { hashSessionToken } from "./otp";

async function lookupSession(rawToken: string | undefined) {
  if (!rawToken?.trim()) return null;

  const db = tryGetDb();
  if (!db) return null;

  const tokenHash = hashSessionToken(rawToken);
  const rows = await db
    .select({
      expiresAt: sessions.expiresAt,
      farmerEmail: farmers.email,
      farmerId: farmers.id,
      coordinatorEmail: coordinators.email,
      coordinatorId: coordinators.id,
    })
    .from(sessions)
    .leftJoin(farmers, eq(sessions.farmerId, farmers.id))
    .leftJoin(coordinators, eq(sessions.coordinatorId, coordinators.id))
    .where(
      and(gt(sessions.expiresAt, new Date()), eq(sessions.tokenHash, tokenHash)),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  if (row.coordinatorId) {
    return {
      kind: "coordinator" as const,
      coordinatorId: row.coordinatorId,
      email: row.coordinatorEmail!,
    };
  }

  if (row.farmerId) {
    return {
      kind: "farmer" as const,
      farmerId: row.farmerId,
      email: row.farmerEmail!,
    };
  }

  return null;
}

export async function getSessionPrincipal() {
  const cookieJar = await cookies();
  const token = cookieJar.get(SESSION_COOKIE)?.value;
  return lookupSession(token);
}

export async function requireFarmer() {
  const s = await getSessionPrincipal();
  if (!s || s.kind !== "farmer") {
    return null;
  }
  return s;
}

export async function requireCoordinator() {
  const s = await getSessionPrincipal();
  if (!s || s.kind !== "coordinator") {
    return null;
  }
  return s;
}
