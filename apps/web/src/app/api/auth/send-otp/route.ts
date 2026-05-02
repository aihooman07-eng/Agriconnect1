import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { emailOtps } from "@schema";
import { OTP_TTL_MS } from "@/lib/constants";
import { sendFarmerLoginOtpEmail } from "@/lib/email";
import { getDb } from "@/lib/db";
import { hashOtp, randomSixDigitCode } from "@/lib/otp";
import { clientIpFromHeaders, slidingWindowHit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email().max(320),
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
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const ip = clientIpFromHeaders(req.headers);

  const ipHit = slidingWindowHit(`otp:ip:${ip}`, 60, 60 * 60 * 1000);
  if (!ipHit.ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const emailHit = slidingWindowHit(`otp:mail:${email}`, 10, 60 * 60 * 1000);
  if (!emailHit.ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const code = randomSixDigitCode();
  const db = getDb();

  // One-time login link style: newest replaces prior unused codes for the same inbox.
  await db.delete(emailOtps).where(eq(emailOtps.email, email));

  await db.insert(emailOtps).values({
    email,
    codeHash: hashOtp(code, otpPepper),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  await sendFarmerLoginOtpEmail(email, code);

  return NextResponse.json({ ok: true }, { status: 200 });
}
