import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { farmers, farms, inquiries } from "@schema";
import { tryGetDb } from "@/lib/db";
import {
  sendFarmerNewInquiryEmail,
  sendVisitorInquiryConfirmation,
} from "@/lib/email";
import { clientIpFromHeaders, slidingWindowHit } from "@/lib/rate-limit";

const inquirySchema = z
  .object({
    farmId: z.string().uuid(),
    visitorName: z.string().trim().min(1).max(200),
    visitorEmail: z.string().email().max(320),
    visitorPhone: z.string().trim().max(40).optional().nullable(),
    visitorMessage: z.string().trim().min(1).max(4000),
    isSchool: z.boolean(),
    institutionName: z.string().trim().max(240).optional().nullable(),
    studentCount: z.number().int().min(0).max(2000).optional().nullable(),
    ageRange: z.string().trim().max(120).optional().nullable(),
    adultCount: z.number().int().min(0).max(200).optional().nullable(),
    learningThemes: z.string().trim().max(600).optional().nullable(),
    preferredDates: z.string().trim().max(600).optional().nullable(),
    companyWebsite: z.string().max(120).optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.companyWebsite?.trim()?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "bot",
      });
    }
    if (v.isSchool) {
      if (!v.institutionName?.trim()?.length) {
        ctx.addIssue({
          path: ["institutionName"],
          code: z.ZodIssueCode.custom,
          message: "School visits need an institution name.",
        });
      }
    }
  });

export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers);
  const hit = slidingWindowHit(`inq:ip:${ip}`, 60, 60 * 60 * 1000);
  if (!hit.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = inquirySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid inquiry" }, { status: 400 });
  }

  const data = parsed.data;

  const emailHit = slidingWindowHit(`inq:email:${data.visitorEmail.toLowerCase()}`, 40, 24 * 60 * 60 * 1000);
  if (!emailHit.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const db = tryGetDb();
  if (!db) {
    return NextResponse.json(
      { error: "Database unavailable — configure DATABASE_URL" },
      { status: 503 },
    );
  }

  const farmRows = await db
    .select({
      farm: farms,
      farmerEmail: farmers.email,
    })
    .from(farms)
    .innerJoin(farmers, eq(farms.farmerId, farmers.id))
    .where(eq(farms.id, data.farmId))
    .limit(1);

  const farmHit = farmRows[0];
  if (!farmHit || farmHit.farm.status !== "live") {
    return NextResponse.json({ error: "Farm not accepting inquiries right now." }, { status: 404 });
  }

  const [inq] = await db
    .insert(inquiries)
    .values({
      farmId: data.farmId,
      visitorName: data.visitorName,
      visitorEmail: data.visitorEmail.trim().toLowerCase(),
      visitorPhone: data.visitorPhone?.trim() ?? null,
      visitorMessage: data.visitorMessage,
      isSchool: data.isSchool,
      institutionName: data.institutionName?.trim() ?? null,
      studentCount: data.studentCount ?? null,
      ageRange: data.ageRange?.trim() ?? null,
      adultCount: data.adultCount ?? null,
      learningThemes: data.learningThemes?.trim() ?? null,
      preferredDates: data.preferredDates?.trim() ?? null,
    })
    .returning({ id: inquiries.id });

  const summaryLines = [
    `Visitor: ${data.visitorName}`,
    `School visit: ${data.isSchool ? "yes" : "no"}`,
    data.isSchool
      ? [
          data.institutionName ? `School: ${data.institutionName}` : null,
          data.studentCount != null ? `Students: ${data.studentCount}` : null,
          data.ageRange ? `Age range: ${data.ageRange}` : null,
          data.adultCount != null ? `Adults: ${data.adultCount}` : null,
          data.learningThemes ? `Themes: ${data.learningThemes}` : null,
        ]
          .filter(Boolean)
          .join("\n")
      : null,
    data.preferredDates ? `Dates: ${data.preferredDates}` : null,
    "",
    data.visitorMessage,
  ]
    .filter(Boolean)
    .join("\n");

  await Promise.all([
    sendFarmerNewInquiryEmail({
      to: farmHit.farmerEmail,
      farmName: farmHit.farm.name,
      viewerEmail: data.visitorEmail.trim().toLowerCase(),
      summary: summaryLines,
    }),
    sendVisitorInquiryConfirmation(
      data.visitorEmail.trim().toLowerCase(),
      farmHit.farm.name,
    ),
  ]);

  return NextResponse.json({ inquiryId: inq?.id }, { status: 201 });
}
