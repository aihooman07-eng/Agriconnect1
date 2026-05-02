import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { farms, inquiries } from "@schema";
import { requireFarmer } from "@/lib/auth";
import { getDb } from "@/lib/db";

export default async function FarmerDashboardPage() {
  const farmer = await requireFarmer();
  if (!farmer) {
    throw new Error("Unexpected unauthenticated farmer page render.");
  }

  const db = getDb();
  const myFarms = await db
    .select()
    .from(farms)
    .where(eq(farms.farmerId, farmer.farmerId))
    .orderBy(desc(farms.updatedAt));

  const farmIds = myFarms.map((f) => f.id);
  const inbox =
    farmIds.length === 0
      ? []
      : await db
          .select({
            inquiry: inquiries,
            farmName: farms.name,
          })
          .from(inquiries)
          .innerJoin(farms, eq(inquiries.farmId, farms.id))
          .where(inArray(farms.id, farmIds))
          .orderBy(desc(inquiries.createdAt));

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold text-emerald-950">Farmer portal</h1>
        <p className="text-sm text-neutral-700">
          Your listings stay <strong>pending</strong> until an AgriConnect coordinator approves them. Edits submit a
          fresh review.
        </p>
      </header>

      <section className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-emerald-950">Your farm listings</h2>
          <Link
            className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-semibold text-white"
            href="/farmer/onboarding"
          >
            New listing wizard
          </Link>
        </div>

        {myFarms.length === 0 ? (
          <p className="text-sm text-neutral-700">No drafts yet — start by creating your listing.</p>
        ) : (
          <ul className="grid gap-3">
            {myFarms.map((f) => (
              <li key={f.id} className="rounded-xl border border-emerald-950/10 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-semibold text-emerald-950">{f.name}</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-700">{f.status}</div>
                </div>
                {f.status === "rejected" && f.rejectReason ? (
                  <p className="mt-3 text-sm text-rose-900">
                    <strong>Coordinator note:</strong> {f.rejectReason}
                  </p>
                ) : null}
                <p className="mt-2 text-sm text-neutral-700">{f.shortDescription}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <Link className="text-emerald-800 underline" href={`/farms/${f.id}`}>
                    Preview profile
                  </Link>
                  <Link className="text-emerald-800 underline" href={`/farmer/onboarding?edit=${f.id}`}>
                    Edit & resubmit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-xl font-semibold text-emerald-950">Visitor inquiries inbox</h2>
        {inbox.length === 0 ? (
          <p className="text-sm text-neutral-700">Guest inquiries arrive here after email notification.</p>
        ) : (
          <ul className="grid gap-3">
            {inbox.map((row) => (
              <li key={row.inquiry.id} className="rounded-xl border border-emerald-950/10 bg-emerald-50/40 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-emerald-950">{row.farmName}</div>
                  <div className="text-xs text-neutral-700">
                    {row.inquiry.createdAt
                      ? new Date(row.inquiry.createdAt).toLocaleString()
                      : "—"}
                  </div>
                </div>
                <div className="mt-2 text-sm text-neutral-900">{row.inquiry.visitorMessage}</div>
                <div className="mt-3 text-xs text-neutral-700">
                  <div>
                    Visitor:{" "}
                    <a className="underline" href={`mailto:${row.inquiry.visitorEmail}`}>
                      {row.inquiry.visitorEmail}
                    </a>
                  </div>
                  {row.inquiry.isSchool ? <div>School inquiry</div> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
