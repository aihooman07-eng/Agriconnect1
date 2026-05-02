import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { farms } from "@schema";
import { getSessionPrincipal } from "@/lib/auth";
import { tryGetDb } from "@/lib/db";
import { InquiryForm } from "./inquiry-form";

export const runtime = "nodejs";

type PageProps = { params: Promise<{ id: string }> };

export default async function FarmDetailPage(props: PageProps) {
  const { id } = await props.params;

  const db = tryGetDb();
  const principal = await getSessionPrincipal();

  if (!db) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-xl font-semibold text-emerald-950">Database not configured</h1>
        <p className="mt-2 text-sm text-neutral-700">
          This preview cannot load farm profiles until <code className="rounded bg-neutral-100 px-1">DATABASE_URL</code>{" "}
          is set in the deployment environment (e.g. Vercel project settings).
        </p>
        <Link href="/discover" className="mt-6 inline-flex text-emerald-800 underline">
          Back to Discover
        </Link>
      </div>
    );
  }

  const [row] = await db.select().from(farms).where(eq(farms.id, id)).limit(1);

  if (!row) notFound();

  const isOwner = principal?.kind === "farmer" && principal.farmerId === row.farmerId;
  const isCoordinator = principal?.kind === "coordinator";

  const canShowPublicListing = row.status === "live" || isOwner || isCoordinator;

  if (!canShowPublicListing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-xl font-semibold text-emerald-950">Listing not visible</h1>
        <p className="mt-2 text-sm text-neutral-700">
          Host profiles only appear publicly after coordinator review goes live.
        </p>
        <Link href="/discover" className="mt-6 inline-flex text-emerald-800 underline">
          Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-8 px-4 py-10">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold text-emerald-950">{row.name}</h1>
          <span
            className={
              row.status === "live"
                ? "rounded-full bg-emerald-950 px-3 py-1 text-xs font-semibold text-emerald-50"
                : row.status === "pending"
                  ? "rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-950"
                  : "rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-950"
            }
          >
            {row.status === "live"
              ? "Live listing"
              : row.status === "pending"
                ? "Pending coordinator review"
                : "Returned for edits"}
          </span>
        </div>
        <p className="text-sm text-neutral-700">{row.shortDescription}</p>
        {!isCoordinator && row.status !== "live" && (
          <p className="text-sm text-neutral-900">
            <strong>Note:</strong> This listing is pending review ({row.status}), so visitor inquiry is
            disabled until it becomes live.
          </p>
        )}
      </div>

      <div className="grid gap-3 rounded-xl border border-emerald-950/15 bg-emerald-50/40 p-6">
        <h2 className="text-lg font-semibold text-emerald-950">About this farm</h2>
        <p className="whitespace-pre-wrap text-sm text-neutral-800">{row.story}</p>

        <div className="mt-4 grid gap-2 text-sm text-neutral-900">
          <div>
            <strong>Location (approx.)</strong>: {row.latitude.toFixed(5)}, {row.longitude.toFixed(5)}
          </div>
          <div>
            <strong>Offerings:</strong>
            <ul className="mt-1 list-disc pl-5">
              {row.dairy && <li>Dairy</li>}
              {row.crops && <li>Crops / horticulture visits</li>}
              {row.poultry && <li>Poultry</li>}
              {row.organic && <li>Organic practices</li>}
              {row.schoolFriendly && <li>School-friendly visits</li>}
              {!row.dairy && !row.crops && !row.poultry && !row.organic && (
                <li>General immersion / community focus</li>
              )}
            </ul>
          </div>
          {row.visitorNotes?.trim()?.length ? (
            <div>
              <strong>Notes for visitors</strong>: {row.visitorNotes}
            </div>
          ) : null}
          {row.primaryImageUrl?.trim()?.length ? (
            <div>
              <strong>Photo:</strong>{" "}
              <a href={row.primaryImageUrl} className="underline" target="_blank" rel="noreferrer">
                {row.primaryImageUrl}
              </a>
            </div>
          ) : null}
        </div>
      </div>

      {row.status === "live" ? (
        <InquiryForm farmId={row.id} />
      ) : null}

      <Link href="/discover" className="text-sm text-emerald-800 underline">
        Back to Discover
      </Link>
    </div>
  );
}
