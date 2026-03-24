"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

const ROLES = [
  "Superintendent",
  "Foreman",
  "Project Manager",
  "Project Engineer",
  "Vice President",
  "Operations",
  "Other",
];

export default function SettingsPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [jobsiteMode, setJobsiteMode] = useState(false);

  useEffect(() => {
    setJobsiteMode(localStorage.getItem("jobsite_mode") === "true");
  }, []);

  function toggleJobsiteMode() {
    const next = !jobsiteMode;
    setJobsiteMode(next);
    localStorage.setItem("jobsite_mode", String(next));
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }
      setEmail(user.email ?? null);

      const { data } = await supabase
        .from("user_profiles")
        .select("full_name, role, company")
        .eq("id", user.id)
        .single();

      if (data) {
        setFullName(data.full_name ?? "");
        setRole(data.role ?? "");
        setCompany(data.company ?? "");
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_profiles").upsert({
      id: user.id,
      full_name: fullName.trim(),
      role,
      company: company.trim(),
    });

    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-10 pb-28">

        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "8px" }}
            aria-label="Back to dashboard"
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
              Account
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Settings
            </h1>
          </div>
        </header>

        {/* Profile card */}
        <section
          className="px-7 py-6 flex flex-col gap-5"
          style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
        >
          <div className="flex items-center justify-between">
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Profile
            </p>
            {!editing && !loading && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-semibold uppercase tracking-widest px-4 py-1.5 transition-opacity hover:opacity-70"
                style={{ border: "1px solid #252525", color: "#9A9A9A", fontFamily: "var(--font-inter)", borderRadius: "8px" }}
              >
                Edit
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse"
                  style={{ backgroundColor: "#1A1A1A" }}
                />
              ))}
            </div>
          ) : editing ? (
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label
                  className="text-xs uppercase tracking-widest"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]"
                  style={{ backgroundColor: "#161616", border: "1px solid #252525", color: "#E8E2D8", borderRadius: "8px", fontFamily: "var(--font-inter)" }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  className="text-xs uppercase tracking-widest"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C45B28] appearance-none"
                  style={{
                    backgroundColor: "#161616",
                    border: "1px solid #252525",
                    color: role ? "#E8E2D8" : "#9A9A9A",
                    borderRadius: "8px",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  <option value="">Select role</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r} style={{ backgroundColor: "#161616", color: "#E8E2D8" }}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label
                  className="text-xs uppercase tracking-widest"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]"
                  style={{ backgroundColor: "#161616", border: "1px solid #252525", color: "#E8E2D8", borderRadius: "8px", fontFamily: "var(--font-inter)" }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#C45B28", color: "#0A0A0A", fontFamily: "var(--font-inter)", fontWeight: 600, borderRadius: "8px", minHeight: "48px" }}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-6 py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-70"
                  style={{ border: "1px solid #252525", color: "#9A9A9A", fontFamily: "var(--font-inter)", borderRadius: "8px" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-3">
              {saved && (
                <p className="text-xs" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
                  ✓ Profile updated
                </p>
              )}
              {[
                { label: "Name", val: fullName || "—" },
                { label: "Role", val: role || "—" },
                { label: "Company", val: company || "—" },
                { label: "Email", val: email || "—" },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-baseline gap-4">
                  <span
                    className="text-xs uppercase tracking-widest w-20 flex-shrink-0"
                    style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                  >
                    {label}
                  </span>
                  <span className="text-sm" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Interests */}
        <section className="flex flex-col gap-4">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Training
          </p>
          <Link
            href="/onboarding/interests"
            className="flex items-center justify-between px-6 py-4 transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
          >
            <span
              className="text-sm font-bold uppercase tracking-wide"
              style={{ fontFamily: "var(--font-inter)", fontWeight: 600, color: "#E8E2D8" }}
            >
              Update Training Interests
            </span>
            <span style={{ color: "#C45B28" }}>›</span>
          </Link>
        </section>

        {/* Notifications */}
        <section className="flex flex-col gap-4">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Notifications
          </p>
          <Link
            href="/dashboard/settings/notifications"
            className="flex items-center justify-between px-6 py-4 transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
          >
            <span
              className="text-sm font-bold uppercase tracking-wide"
              style={{ fontFamily: "var(--font-inter)", fontWeight: 600, color: "#E8E2D8" }}
            >
              Notification Preferences
            </span>
            <span style={{ color: "#C45B28" }}>›</span>
          </Link>
        </section>

        {/* Jobsite Mode */}
        <section className="flex flex-col gap-4">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Display
          </p>
          <div
            className="flex items-center justify-between px-6 py-5"
            style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
          >
            <div className="flex flex-col gap-1">
              <span
                className="text-sm font-bold uppercase tracking-wide"
                style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
              >
                Jobsite Mode
              </span>
              <span className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                Larger text, minimal UI, big buttons. Built for sunlight.
              </span>
            </div>
            <button
              onClick={toggleJobsiteMode}
              className="relative shrink-0 transition-all duration-200"
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                backgroundColor: jobsiteMode ? "#C45B28" : "#252525",
                border: `1px solid ${jobsiteMode ? "#C45B28" : "#333"}`,
              }}
              aria-label="Toggle Jobsite Mode"
            >
              <span
                className="absolute top-0.5 transition-all duration-200"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  backgroundColor: "#E8E2D8",
                  left: jobsiteMode ? 23 : 3,
                }}
              />
            </button>
          </div>
          {jobsiteMode && (
            <p className="text-xs px-1" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Active — workout pages will show larger text and a simplified layout.
            </p>
          )}
        </section>

        {/* Sign Out */}
        <section>
          <button
            onClick={handleSignOut}
            className="w-full py-4 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-70"
            style={{ border: "1px solid #252525", color: "#9A9A9A", fontFamily: "var(--font-inter)", borderRadius: "8px", minHeight: "48px" }}
          >
            Sign Out
          </button>
        </section>

      </div>
      <BottomNav />
    </main>
  );
}
