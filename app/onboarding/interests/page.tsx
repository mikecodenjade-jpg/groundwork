"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const INTERESTS = [
  "Running",
  "Weightlifting",
  "Bodybuilding",
  "Hybrid / Functional",
  "Calisthenics",
  "Mobility & Recovery",
  "Rucking",
  "Bodyweight",
  "Nutrition",
  "Yoga",
  "Swimming",
  "Sport-Specific Training",
];

export default function InterestsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleInterest(interest: string) {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  }

  async function handleContinue() {
    setSaving(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expired. Please sign in again.");
      setSaving(false);
      return;
    }

    const { error: dbError } = await supabase
      .from("user_profiles")
      .upsert({ id: user.id, interests: selected });

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="w-full max-w-xl flex flex-col gap-8">

        {/* Header */}
        <div>
          <p
            className="text-xs font-semibold tracking-[0.3em] uppercase mb-3"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Build My Groundwork
          </p>
          <h1
            className="text-4xl font-bold uppercase mb-2"
            style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
          >
            What are you into?
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
          >
            Pick everything that interests you. You can change this anytime.
          </p>
        </div>

        {/* Interest grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {INTERESTS.map((interest) => {
            const active = selected.includes(interest);
            return (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className="px-4 py-4 text-sm font-bold uppercase tracking-wide text-left transition-all duration-150 active:scale-[0.97]"
                style={{
                  fontFamily: "var(--font-inter)",
                  fontWeight: 600,
                  backgroundColor: active ? "#1A0E09" : "#161616",
                  color: active ? "#E8E2D8" : "#9A9A9A",
                  border: `1px solid ${active ? "#C45B28" : "#252525"}`,
                  borderRadius: "8px",
                }}
              >
                {interest}
              </button>
            );
          })}
        </div>

        {/* Selection count */}
        <p
          className="text-xs"
          style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
        >
          {selected.length === 0
            ? "Nothing selected yet — pick at least one."
            : `${selected.length} selected`}
        </p>

        {error && (
          <p
            className="text-sm px-4 py-3 border-l-4"
            style={{
              borderColor: "#C45B28",
              backgroundColor: "#1A0E09",
              color: "#E8E2D8",
              fontFamily: "var(--font-inter)",
            }}
          >
            {error}
          </p>
        )}

        {/* Continue */}
        <button
          onClick={handleContinue}
          disabled={selected.length === 0 || saving}
          className="w-full py-4 text-base font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-30"
          style={{
            fontFamily: "var(--font-inter)",
            fontWeight: 600,
            backgroundColor: "#C45B28",
            color: "#0A0A0A",
            borderRadius: "8px",
          }}
        >
          {saving ? "Saving..." : "Continue"}
        </button>

      </div>
    </main>
  );
}
