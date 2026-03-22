"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type Coord = { lat: number; lng: number };

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const STYLE = "mapbox://styles/mapbox/dark-v11";

// Dallas, TX default center
const DALLAS: [number, number] = [-96.7970, 32.7767];

console.log("[RunMap] NEXT_PUBLIC_MAPBOX_TOKEN:", MAPBOX_TOKEN ? `${MAPBOX_TOKEN.slice(0, 12)}...` : "MISSING");

export default function RunMap({
  coords,
  height = "400px",
  interactive = true,
  summary,
}: {
  coords?: Coord[];
  height?: string;
  interactive?: boolean;
  summary?: { distance: string; time: string; pace: string } | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const hasRoute = coords && coords.length >= 2;

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;

    // Prevent re-init
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: STYLE,
      center: hasRoute ? [coords[0].lng, coords[0].lat] : DALLAS,
      zoom: hasRoute ? 14 : 12,
      interactive,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      if (!hasRoute) return; // default map — just show the basemap

      // Route line
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: coords.map((c) => [c.lng, c.lat]),
          },
        },
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#C45B28",
          "line-width": 4,
          "line-opacity": 0.9,
        },
      });

      // Start marker (green)
      map.addSource("start", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [coords[0].lng, coords[0].lat],
          },
        },
      });

      map.addLayer({
        id: "start-circle",
        type: "circle",
        source: "start",
        paint: {
          "circle-radius": 7,
          "circle-color": "#4CAF50",
          "circle-stroke-color": "#2E7D32",
          "circle-stroke-width": 2,
        },
      });

      // End marker (red)
      const end = coords[coords.length - 1];
      map.addSource("end", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [end.lng, end.lat],
          },
        },
      });

      map.addLayer({
        id: "end-circle",
        type: "circle",
        source: "end",
        paint: {
          "circle-radius": 7,
          "circle-color": "#E87070",
          "circle-stroke-color": "#C62828",
          "circle-stroke-width": 2,
        },
      });

      // Fit bounds to route
      const bounds = new mapboxgl.LngLatBounds();
      coords.forEach((c) => bounds.extend([c.lng, c.lat]));
      map.fitBounds(bounds, { padding: 40, maxZoom: 16, duration: 0 });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [coords, interactive, hasRoute]);

  return (
    <div className="relative w-full overflow-hidden" style={{ height, borderRadius: "12px" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Summary overlay */}
      {summary && (
        <div
          className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-around px-4 py-3"
          style={{
            background: "linear-gradient(transparent, rgba(10,10,10,0.92) 30%)",
          }}
        >
          <OverlayStat label="Distance" value={summary.distance} />
          <OverlayStat label="Time" value={summary.time} />
          <OverlayStat label="Pace" value={summary.pace} />
        </div>
      )}
    </div>
  );
}

function OverlayStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
      >
        {label}
      </span>
      <span
        className="text-sm font-bold"
        style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
      >
        {value}
      </span>
    </div>
  );
}
