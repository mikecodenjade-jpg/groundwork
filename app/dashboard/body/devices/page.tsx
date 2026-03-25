"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

type WearableConnection = {
  id: string;
  user_id: string;
  provider: "fitbit" | "garmin" | "google_fit";
  connected_at: string;
  last_synced_at: string | null;
  status: "active" | "disconnected";
};

const PROVIDERS: { key: WearableConnection["provider"]; label: string; description: string }[] = [
  { key: "fitbit", label: "Fitbit", description: "Steps \u00b7 Heart Rate \u00b7 Sleep" },
  { key: "garmin", label: "Garmin", description: "Steps \u00b7 Heart Rate \u00b7 Sleep" },
  { key: "google_fit", label: "Google Fit", description: "Steps \u00b7 Heart Rate \u00b7 Sleep" },
];

function providerLabel(provider: string): string {
  const found = PROVIDERS.find((p) => p.key === provider);
  return found ? found.label : provider;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return "Just now";
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export default function ConnectedDevicesPage() {
  const [connections, setConnections] = useState<WearableConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error: fetchError } = await supabase
        .from("wearable_connections")
        .select("*")
        .eq("user_id", user.id)
        .order("connected_at", { ascending: false });

      if (fetchError) {
        setError("Failed to load connected devices.");
      } else {
        setConnections(data ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleConnect(provider: WearableConnection["provider"]) {
    setError(null);
    setConnectingProvider(provider);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setConnectingProvider(null); return; }

      const res = await fetch(
        `https://kmnqpargwdxtozknswzk.supabase.co/functions/v1/wearable-auth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ provider, user_id: user.id, action: "connect" }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to start connection.");
      }

      const data = await res.json();
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to connect device.");
    }
    setConnectingProvider(null);
  }

  async function handleDisconnect(connection: WearableConnection) {
    setError(null);
    setDisconnectingId(connection.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setDisconnectingId(null); return; }

      const res = await fetch(
        `https://kmnqpargwdxtozknswzk.supabase.co/functions/v1/wearable-auth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ provider: connection.provider, user_id: user.id, action: "disconnect" }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to disconnect device.");
      }

      setConnections((prev) => prev.filter((c) => c.id !== connection.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to disconnect device.");
    }
    setDisconnectingId(null);
  }

  async function handleSync(connection: WearableConnection) {
    setError(null);
    setSyncingId(connection.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSyncingId(null); return; }

      const res = await fetch(
        `https://kmnqpargwdxtozknswzk.supabase.co/functions/v1/wearable-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ user_id: user.id, provider: connection.provider }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to sync device.");
      }

      const data = await res.json();
      setConnections((prev) =>
        prev.map((c) =>
          c.id === connection.id ? { ...c, last_synced_at: data.synced_at ?? new Date().toISOString() } : c
        )
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sync device.");
    }
    setSyncingId(null);
  }

  const connectedProviders = new Set(connections.map((c) => c.provider));

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-10 pb-28">

        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard/body"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "8px" }}
            aria-label="Back to body"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path
                d="M13 4L7 10L13 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <div>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Body
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Connected Devices
            </h1>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div
            className="px-5 py-3 text-sm"
            style={{
              backgroundColor: "#5A1A1A",
              border: "1px solid #7A2A2A",
              borderRadius: "10px",
              color: "#E87070",
              fontFamily: "var(--font-inter)",
            }}
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse"
                style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
              />
            ))}
          </div>
        ) : (
          <>
            {/* Section 1: Your Devices */}
            <section className="flex flex-col gap-4">
              <h2
                className="text-lg font-bold uppercase"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
              >
                Your Devices
              </h2>

              {connections.length === 0 ? (
                <div
                  className="px-6 py-8 flex flex-col items-center text-center gap-2"
                  style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
                >
                  <p
                    className="text-base font-bold uppercase"
                    style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                  >
                    No devices connected yet.
                  </p>
                  <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                    Connect a wearable and your data shows up automatically. Less typing, more doing.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {connections.map((conn) => (
                    <div
                      key={conn.id}
                      className="px-6 py-5"
                      style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3
                          className="text-base font-bold uppercase leading-tight"
                          style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                        >
                          {providerLabel(conn.provider)}
                        </h3>
                        <span
                          className="text-xs font-semibold uppercase tracking-widest px-2.5 py-0.5"
                          style={{
                            backgroundColor: conn.status === "active" ? "#2A6A4A" : "#5A1A1A",
                            color: conn.status === "active" ? "#6FE8A0" : "#E87070",
                            borderRadius: "6px",
                            fontFamily: "var(--font-inter)",
                          }}
                        >
                          {conn.status === "active" ? "Active" : "Disconnected"}
                        </span>
                      </div>
                      <p className="text-xs mb-4" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                        Last synced: {relativeTime(conn.last_synced_at)}
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleSync(conn)}
                          disabled={syncingId === conn.id}
                          className="px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-50"
                          style={{
                            backgroundColor: "#C45B28",
                            color: "#0A0A0A",
                            borderRadius: "8px",
                            fontFamily: "var(--font-inter)",
                            border: "none",
                            cursor: syncingId === conn.id ? "not-allowed" : "pointer",
                          }}
                        >
                          {syncingId === conn.id ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                              </svg>
                              Syncing...
                            </span>
                          ) : (
                            "Sync Now"
                          )}
                        </button>
                        <button
                          onClick={() => handleDisconnect(conn)}
                          disabled={disconnectingId === conn.id}
                          className="px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-50"
                          style={{
                            backgroundColor: "transparent",
                            color: "#9A9A9A",
                            borderRadius: "8px",
                            fontFamily: "var(--font-inter)",
                            border: "1px solid #252525",
                            cursor: disconnectingId === conn.id ? "not-allowed" : "pointer",
                          }}
                        >
                          {disconnectingId === conn.id ? "Disconnecting..." : "Disconnect"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section 2: Connect a Device */}
            <section className="flex flex-col gap-4">
              <h2
                className="text-lg font-bold uppercase"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
              >
                Connect a Device
              </h2>

              <div className="flex flex-col gap-3">
                {PROVIDERS.map((provider) => {
                  const isConnected = connectedProviders.has(provider.key);
                  const isConnecting = connectingProvider === provider.key;

                  return (
                    <div
                      key={provider.key}
                      className="px-6 py-5"
                      style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className="text-base font-bold uppercase leading-tight"
                          style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                        >
                          {provider.label}
                        </h3>
                        {isConnected && (
                          <span
                            className="text-xs font-semibold uppercase tracking-widest px-2.5 py-0.5"
                            style={{
                              backgroundColor: "#2A6A4A",
                              color: "#6FE8A0",
                              borderRadius: "6px",
                              fontFamily: "var(--font-inter)",
                            }}
                          >
                            Connected
                          </span>
                        )}
                      </div>
                      <p className="text-xs mb-4" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                        {provider.description}
                      </p>
                      {!isConnected && (
                        <button
                          onClick={() => handleConnect(provider.key)}
                          disabled={isConnecting}
                          className="px-5 py-2.5 text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-50"
                          style={{
                            backgroundColor: "#C45B28",
                            color: "#0A0A0A",
                            borderRadius: "8px",
                            fontFamily: "var(--font-inter)",
                            border: "none",
                            cursor: isConnecting ? "not-allowed" : "pointer",
                          }}
                        >
                          {isConnecting ? "Connecting..." : "Connect"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

      </div>
      <BottomNav />
    </main>
  );
}
