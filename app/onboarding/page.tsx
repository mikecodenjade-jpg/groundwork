"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function OnboardingPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expired. Please sign in again.");
      setSaving(false);
      return;
    }

    const { error: dbError } = await supabase.from("user_profiles").upsert({
      id: user.id,
      full_name: fullName.trim(),
      role,
      company: company.trim(),
    });

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="w-full max-w-md">
        <p
          className="text-center text-xs font-semibold tracking-[0.3em] uppercase mb-3"
          style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
        >
          Build My Groundwork
        </p>
        <h1
          className="text-center text-3xl md:text-4xl font-bold uppercase mb-3"
          style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
        >
          Let&apos;s get your profile set up.
        </h1>
        <p className="text-center text-sm mb-10" style={{ color: "#7A7268" }}>
          Takes 30 seconds. Helps us build the right tools for you.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="fullName"
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#7A7268" }}
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Mike Johnson"
              className="px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]"
              style={{
                backgroundColor: "#141414",
                border: "1px solid #2A2A2A",
                color: "#E8E2D8",
              }}
            />
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="role"
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#7A7268" }}
            >
              Role
            </label>
            <select
              id="role"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C45B28] appearance-none"
              style={{
                backgroundColor: "#141414",
                border: "1px solid #2A2A2A",
                color: role ? "#E8E2D8" : "#5A5248",
              }}
            >
              <option value="" disabled>Select your role</option>
              {ROLES.map((r) => (
                <option key={r} value={r} style={{ backgroundColor: "#141414", color: "#E8E2D8" }}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Company */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="company"
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#7A7268" }}
            >
              Company
            </label>
            <input
              id="company"
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Construction"
              className="px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]"
              style={{
                backgroundColor: "#141414",
                border: "1px solid #2A2A2A",
                color: "#E8E2D8",
              }}
            />
          </div>

          {error && (
            <p
              className="text-sm px-4 py-3 border-l-4"
              style={{
                borderColor: "#C45B28",
                backgroundColor: "#1A0E09",
                color: "#E8E2D8",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 py-4 text-base font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: "#C45B28",
              color: "#0A0A0A",
              fontFamily: "var(--font-oswald)",
            }}
          >
            {saving ? "Saving..." : "Let's Build"}
          </button>
        </form>
      </div>
    </main>
  );
}
