"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

/** Keep aligned with `"maplibre-gl"` dependency in apps/web/package.json (for CSP worker URL). */
const MAPLIBRE_PACKAGE_VERSION = "5.24.0";

type MapLibWithWorkerUrl = typeof maplibregl & {
  workerUrl?: string;
};

export type DiscoverMapFarm = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function DiscoverMap(props: {
  farms: DiscoverMapFarm[];
  initialCenter: { lng: number; lat: number };
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const centerLat = props.initialCenter.lat;
  const centerLng = props.initialCenter.lng;

  const farmMarkersKey = useMemo(() => {
    return props.farms
      .map((f) => `${f.id}|${f.latitude}|${f.longitude}|${f.name}`)
      .sort()
      .join(";");
  }, [props.farms]);

  const placeMarkers = (map: maplibregl.Map, farms: DiscoverMapFarm[]) => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const farm of farms) {
      const markerEl = document.createElement("button");
      markerEl.type = "button";
      markerEl.style.width = "14px";
      markerEl.style.height = "14px";
      markerEl.style.borderRadius = "999px";
      markerEl.style.background = "#047857";
      markerEl.style.border = "2px solid #ecfdf5";
      markerEl.style.padding = "0";
      markerEl.title = farm.name;
      markerEl.onclick = () => {
        window.location.href = `/farms/${farm.id}`;
      };

      const linkLabel = escapeHtml(farm.name);
      const html = `
        <div style="padding:10px;font-size:14px;line-height:1.3">
          <a href="/farms/${farm.id}" style="font-weight:600;color:#064e3b">${linkLabel}</a>
          <div style="margin-top:6px"><a href="/farms/${farm.id}" style="font-size:12px;color:#065f46">View / enquire</a></div>
        </div>
      `.trim();

      const marker = new maplibregl.Marker({ element: markerEl })
        .setLngLat([farm.longitude, farm.latitude])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(html))
        .addTo(map);

      markersRef.current.push(marker);
    }

    queueMicrotask(() => map.resize());
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return undefined;

    const lib = maplibregl as MapLibWithWorkerUrl;
    if (!lib.workerUrl) {
      lib.workerUrl = `https://unpkg.com/maplibre-gl@${MAPLIBRE_PACKAGE_VERSION}/dist/maplibre-gl-csp-worker.js`;
    }

    const map = new maplibregl.Map({
      container,
      style: {
        version: 8,
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {
          osm: {
            type: "raster",
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
          },
        },
        layers: [{ id: "osm-tiles", type: "raster", source: "osm", minzoom: 0, maxzoom: 19 }],
      },
      center: [centerLng, centerLat],
      zoom: 8.75,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    map.once("load", () => {
      queueMicrotask(() => map.resize());
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [centerLat, centerLng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    const upsert = () => placeMarkers(map, props.farms);

    if (map.loaded()) {
      upsert();
      return undefined;
    }

    map.once("load", upsert);
    return undefined;
  }, [farmMarkersKey, props.farms]);

  return <div ref={containerRef} className="h-[420px] w-full rounded-lg border border-emerald-950/15 bg-white/40" />;
}
