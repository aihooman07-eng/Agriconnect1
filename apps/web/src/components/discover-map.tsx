"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

export type DiscoverMapFarm = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export function DiscoverMap(props: {
  farms: DiscoverMapFarm[];
  initialCenter: { lng: number; lat: number };
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const centerLat = props.initialCenter.lat;
  const centerLng = props.initialCenter.lng;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

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
    queueMicrotask(() => map.resize());

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [centerLat, centerLng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const farm of props.farms) {
      const markerEl = document.createElement("button");
      markerEl.type = "button";
      markerEl.style.width = "12px";
      markerEl.style.height = "12px";
      markerEl.style.borderRadius = "999px";
      markerEl.style.background = "#047857";
      markerEl.style.border = "2px solid #ecfdf5";
      markerEl.title = farm.name;

      const marker = new maplibregl.Marker({ element: markerEl })
        .setLngLat([farm.longitude, farm.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 12 }).setHTML(`<div class="font-medium">${farm.name}</div>`),
        )
        .addTo(map);
      markersRef.current.push(marker);
    }

    queueMicrotask(() => map.resize());
  }, [props.farms]);

  return <div ref={containerRef} className="h-[420px] w-full rounded-lg border border-emerald-950/15" />;
}
