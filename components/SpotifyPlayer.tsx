"use client";

import { useState } from "react";

type PlaylistInfo = { name: string; id: string };

const PLAYLISTS: Record<string, PlaylistInfo> = {
  lifting:    { name: "Beast Mode",      id: "37i9dQZF1DX76Wlfdnj7AP" },
  running:    { name: "Run Wild",        id: "37i9dQZF1DWUVpAXiEPK8P" },
  hiit:       { name: "Power Workout",   id: "37i9dQZF1DX70RN3TfnE9m" },
  stretching: { name: "Peaceful Piano",  id: "37i9dQZF1DX4sWSpwq3LiO" },
  default:    { name: "Workout",         id: "37i9dQZF1DX70RN3TfnE9m" },
};

/** Map category slugs / program workoutCategory values to a playlist key */
function resolve(category?: string): PlaylistInfo {
  if (!category) return PLAYLISTS.default;
  const c = category.toLowerCase();
  if (c.includes("run") || c.includes("cardio")) return PLAYLISTS.running;
  if (c.includes("hiit") || c.includes("interval")) return PLAYLISTS.hiit;
  if (c.includes("stretch") || c.includes("cool") || c.includes("yoga") || c.includes("mobility"))
    return PLAYLISTS.stretching;
  if (
    c.includes("lift") ||
    c.includes("strength") ||
    c.includes("push") ||
    c.includes("pull") ||
    c.includes("upper") ||
    c.includes("lower") ||
    c.includes("chest") ||
    c.includes("back") ||
    c.includes("legs")
  )
    return PLAYLISTS.lifting;
  return PLAYLISTS.default;
}

export default function SpotifyPlayer({ category }: { category?: string }) {
  const [open, setOpen] = useState(false);
  const playlist = resolve(category);

  return (
    <div
      className="fixed left-0 right-0 z-40"
      style={{ bottom: 70 }}
    >
      {/* Collapsed bar */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 w-full px-5 py-3"
          style={{
            backgroundColor: "#161616",
            borderTop: "1px solid #252525",
            borderBottom: "1px solid #252525",
          }}
        >
          {/* Music icon */}
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path
              d="M9 18V5l12-2v13"
              stroke="#C45B28"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="6" cy="18" r="3" stroke="#C45B28" strokeWidth="2" />
            <circle cx="18" cy="16" r="3" stroke="#C45B28" strokeWidth="2" />
          </svg>
          <span
            className="text-sm"
            style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
          >
            Tap for workout music
          </span>
        </button>
      )}

      {/* Expanded player */}
      {open && (
        <div
          style={{
            backgroundColor: "#161616",
            borderTop: "1px solid #252525",
            borderRadius: "12px 12px 0 0",
          }}
        >
          {/* Header row */}
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-between w-full px-5 py-3"
          >
            <div className="flex items-center gap-3">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path
                  d="M9 18V5l12-2v13"
                  stroke="#C45B28"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="6" cy="18" r="3" stroke="#C45B28" strokeWidth="2" />
                <circle cx="18" cy="16" r="3" stroke="#C45B28" strokeWidth="2" />
              </svg>
              <span
                className="text-sm font-semibold"
                style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
              >
                {playlist.name}
              </span>
            </div>
            <svg
              width={14} height={14} viewBox="0 0 20 20" fill="none"
              style={{ color: "#555" }}
            >
              <path d="M5 13L10 8L15 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Spotify embed */}
          <div className="px-4 pb-4">
            <iframe
              src={`https://open.spotify.com/embed/playlist/${playlist.id}?theme=0`}
              width="100%"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ borderRadius: "8px" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
