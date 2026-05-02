import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessions } from "@schema";
import { SESSION_COOKIE } from "@/lib/constants";
import { getDb } from "@/lib/db";
import { hashSessionToken } from "@/lib/otp";

export async function POST() {
  const cookieJar = await cookies();
  const raw = cookieJar.get(SESSION_COOKIE)?.value;
  cookieJar.delete(SESSION_COOKIE);

  if (raw?.trim()) {
    const db = getDb();
    const tokenHash = hashSessionToken(raw);
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
