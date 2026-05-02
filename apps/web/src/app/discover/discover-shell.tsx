"use client";

import dynamic from "next/dynamic";

import type { DiscoverMapFarm } from "@/components/discover-map";

const DiscoverMapLazy = dynamic(
  () =>
    import("@/components/discover-map").then((m) => ({ default: m.DiscoverMap })),
  { ssr: false },
);

export function DiscoverShell(props: {
  farms: DiscoverMapFarm[];
  initialCenter: { lng: number; lat: number };
}) {
  return (
    <div className="mt-10">
      <DiscoverMapLazy farms={props.farms} initialCenter={props.initialCenter} />
    </div>
  );
}
