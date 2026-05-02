import Link from "next/link";

import type { DiscoverMapFarm } from "@/components/discover-map";
import { isDatabaseConfigured } from "@/lib/db";
import { fetchLiveDiscoveryFarms } from "@/lib/live-farms";
import { malkangiriCenter } from "@/lib/malkangiri";
import { DiscoverShell } from "./discover-shell";

export const metadata = {
  title: "Discover farms — AgriConnect Malkangiri",
};

type SearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

function readFlag(params: Record<string, string | string[] | undefined>, key: string) {
  const v = params[key];
  if (Array.isArray(v)) return v.includes("1");
  return v === "1";
}

export default async function DiscoverPage(props: { searchParams?: SearchParams }) {
  const sp = (props.searchParams && "then" in props.searchParams
    ? await props.searchParams
    : props.searchParams) ?? {};

  const dairy = readFlag(sp, "dairy");
  const crops = readFlag(sp, "crops");
  const poultry = readFlag(sp, "poultry");
  const organic = readFlag(sp, "organic");
  const schoolFriendly = readFlag(sp, "schoolFriendly");

  const dbOk = isDatabaseConfigured();

  const farms = await fetchLiveDiscoveryFarms({
    dairy,
    crops,
    poultry,
    organic,
    schoolFriendly,
  });

  const center = malkangiriCenter();
  const farmsForMap: DiscoverMapFarm[] = farms.map((f) => ({
    id: f.id,
    name: f.name,
    latitude: f.latitude,
    longitude: f.longitude,
  }));

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10">
      {!dbOk ? (
        <aside className="rounded-xl border border-amber-900/30 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Database is not connected (<code className="rounded bg-amber-100 px-1">DATABASE_URL</code> missing on this
          deployment). Listing discovery and enquiries need Postgres — add env vars on Vercel and redeploy.
        </aside>
      ) : null}
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold text-emerald-950">Discover host farms</h1>
        <p className="text-sm text-neutral-700">
          Malkangiri-first browse list. Guided discovery filters help you narrow down crops, dairy,
          poultry, and school-friendly farms.
        </p>
      </header>

      <form
        action="/discover"
        method="get"
        className="flex flex-wrap items-center gap-4 rounded-xl border border-emerald-950/10 bg-white p-5"
      >
        <span className="text-sm font-medium text-neutral-900">Filters</span>
        {(
          [
            ["dairy", "Dairy"],
            ["crops", "Crop experiences"],
            ["poultry", "Poultry"],
            ["organic", "Organic-led"],
            ["schoolFriendly", "School-friendly"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-neutral-800">
            <input type="checkbox" name={key} value="1" defaultChecked={readFlag(sp, key)} />
            {label}
          </label>
        ))}
        <button
          type="submit"
          className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-medium text-white"
        >
          Apply
        </button>
        <Link className="text-sm underline" href="/discover">
          Clear
        </Link>
      </form>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold text-emerald-950">Live listings</h2>
        {farms.length === 0 ? (
          <p className="text-sm text-neutral-700">
            {dbOk
              ? "No live farms match these filters yet — try clearing filters, or coordinate with a moderator to approve listings."
              : "Farm directory is unavailable until DATABASE_URL is configured."}
          </p>
        ) : (
          <ul className="grid gap-3">
            {farms.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/farms/${f.id}`}
                  className="block rounded-xl border border-emerald-950/10 bg-white p-4 hover:border-emerald-800/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-semibold text-emerald-950">{f.name}</div>
                    <div className="text-xs text-neutral-600">{f.latitude.toFixed(3)}, {f.longitude.toFixed(3)}</div>
                  </div>
                  <p className="mt-2 text-sm text-neutral-700">{f.shortDescription}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DiscoverShell farms={farmsForMap} initialCenter={{ lng: center.lng, lat: center.lat }} />
      <p className="text-xs text-neutral-600">
        Map attribution: OpenStreetMap contributors. Please use OSM tiles responsibly.
      </p>
    </div>
  );
}
