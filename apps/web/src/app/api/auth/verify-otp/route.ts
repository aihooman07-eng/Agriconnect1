import { and, eq, gt, isNull } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { coordinators, emailOtps, farmers, sessions } from "@schema";
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/constants";
import { tryGetDb } from "@/lib/db";
import { hashOtp, hashSessionToken, newSessionToken } from "@/lib/otp";
import { slidingWindowHit, clientIpFromHeaders } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email().max(320),
  code: z.string().regex(/^[0-9]{6}$/),
});

export async function POST(req: NextRequest) {
  const otpPepper = process.env.OTP_PEPPER;
  if (!otpPepper?.trim()) {
    return NextResponse.json(
      { error: "Server misconfigured: OTP_PEPPER missing" },
      { status: 500 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const ip = clientIpFromHeaders(req.headers);
  const ipHit = slidingWindowHit(`otp-verify:ip:${ip}`, 80, 60 * 60 * 1000);
  if (!ipHit.ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const submitted = parsed.data.code;
  const expectedHash = hashOtp(submitted, otpPepper);

  const db = tryGetDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable — configure DATABASE_URL" }, { status: 503 });
  }

  const otpRow = (
    await db
      .select({ id: emailOtps.id })
      .from(emailOtps)
      .where(
        and(
          eq(emailOtps.email, email),
          isNull(emailOtps.consumedAt),
          gt(emailOtps.expiresAt, new Date()),
          eq(emailOtps.codeHash, expectedHash),
        ),
      )
      .limit(1)
  )[0];

  if (!otpRow) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }

  await db
    .update(emailOtps)
    .set({ consumedAt: new Date() })
    .where(eq(emailOtps.id, otpRow.id));

  const coordinator = await db
    .select({ id: coordinators.id })
    .from(coordinators)
    .where(eq(coordinators.email, email))
    .limit(1);

  const plainToken = newSessionToken();
  const tokenHash = hashSessionToken(plainToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  if (coordinator[0]) {
    await db.insert(sessions).values({
      coordinatorId: coordinator[0]!.id,
      tokenHash,
      expiresAt,
    });
  } else {
    const insertedFarmer = await db
      .insert(farmers)
      .values({ email })
      .onConflictDoNothing({ target: farmers.email })
      .returning({ id: farmers.id });

    let farmerId = insertedFarmer[0]?.id;

    if (!farmerId) {
      const existing = await db
        .select({ id: farmers.id })
        .from(farmers)
        .where(eq(farmers.email, email))
        .limit(1);
      farmerId = existing[0]!.id;
    }

    await db.insert(sessions).values({
      farmerId,
      tokenHash,
      expiresAt,
    });
  }

  const cookieJar = await cookies();
  cookieJar.set(SESSION_COOKIE, plainToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  const role = coordinator[0] ? "coordinator" : "farmer";
  return NextResponse.json({ ok: true, role }, { status: 200 });
}
