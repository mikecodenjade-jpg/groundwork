"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

const TIME_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
];

const PILLARS = [
  {
    title: "Body",
    href: "/dashboard/body",
    desc: "Strength, recovery, and physical readiness for the demands of the field.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width={40} height={40}>
        {/* Dumbbell */}
        <rect x="2" y="16" width="6" height="8" rx="1" fill="currentColor" />
        <rect x="8" y="18" width="4" height="4" rx="0.5" fill="currentColor" />
        <rect x="12" y="19" width="16" height="2" fill="currentColor" />
        <rect x="28" y="18" width="4" height="4" rx="0.5" fill="currentColor" />
        <rect x="32" y="16" width="6" height="8" rx="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Mind",
    href: "/dashboard/mind",
    desc: "Mental clarity, stress management, and focus under pressure.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width={40} height={40}>
        {/* Abstract brain: two lobes */}
        <path
          d="M20 8C14 8 9 12.5 9 18c0 3 1.5 5.5 4 7v5h14v-5c2.5-1.5 4-4 4-7 0-5.5-5-10-11-10z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <line x1="20" y1="10" x2="20" y2="30" stroke="currentColor" strokeWidth="1.5" />
        <path d="M20 15 C17 15 14 17 14 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M20 21 C23 21 26 19 26 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  {
    title: "Heart",
    href: "/dashboard/heart",
    desc: "Relationships, purpose, and the resilience to show up whole.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width={40} height={40}>
        <path
          d="M20 34 C20 34 6 25 6 15.5 C6 11 9.5 8 13.5 8 C16.5 8 19 9.5 20 11 C21 9.5 23.5 8 26.5 8 C30.5 8 34 11 34 15.5 C34 25 20 34 20 34Z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Lead",
    href: "/dashboard/lead",
    desc: "Culture, communication, and the skills that make crews into teams.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width={40} height={40}>
        {/* Compass */}
        <circle cx="20" cy="20" r="13" stroke="currentColor" strokeWidth="2" />
        <polygon points="20,9 23,20 20,17 17,20" fill="currentColor" />
        <polygon points="20,31 17,20 20,23 23,20" fill="currentColor" opacity="0.4" />
        <circle cx="20" cy="20" r="2" fill="currentColor" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto mb-16">
        <p
          className="text-xs font-semibold tracking-[0.3em] uppercase"
          style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
        >
          Build My Groundwork
        </p>
        <button
          onClick={handleSignOut}
          className="text-xs font-semibold uppercase tracking-widest px-5 py-2 transition-opacity hover:opacity-60"
          style={{
            color: "#7A7268",
            border: "1px solid #2A2A2A",
            fontFamily: "var(--font-oswald)",
          }}
        >
          Sign Out
        </button>
      </header>

      <div className="max-w-5xl w-full mx-auto flex flex-col gap-16 pb-24">

        {/* Greeting */}
        <section>
          <h1
            className="text-5xl md:text-6xl font-bold uppercase leading-tight"
            style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
          >
            Good Morning.
          </h1>
          {email && (
            <p className="mt-3 text-sm" style={{ color: "#7A7268" }}>
              Signed in as{" "}
              <span style={{ color: "#A09890" }}>{email}</span>
            </p>
          )}
        </section>

        {/* Time selector */}
        <section>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-5"
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
          >
            How much time do you have?
          </p>
          <div className="flex flex-wrap gap-3">
            {TIME_OPTIONS.map(({ label, value }) => {
              const active = selectedTime === value;
              return (
                <button
                  key={value}
                  onClick={() => setSelectedTime(value)}
                  className="px-8 py-3 text-sm font-bold uppercase tracking-widest transition-all duration-150 active:scale-95"
                  style={{
                    fontFamily: "var(--font-oswald)",
                    backgroundColor: active ? "#C45B28" : "#141414",
                    color: active ? "#0A0A0A" : "#E8E2D8",
                    border: `1px solid ${active ? "#C45B28" : "#2A2A2A"}`,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Pillar cards */}
        <section>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-5"
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
          >
            Choose Your Pillar
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PILLARS.map((pillar) => (
              <PillarCard key={pillar.title} {...pillar} />
            ))}
          </div>
        </section>

      </div>
      <BottomNav />
    </main>
  );
}

function PillarCard({
  icon,
  title,
  desc,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      className="p-8 flex flex-col gap-5 transition-all duration-150 active:scale-[0.98]"
      style={{
        backgroundColor: hovered ? "#161616" : "#111111",
        border: `1px solid ${hovered ? "#C45B28" : "#1E1E1E"}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ color: "#C45B28" }}>{icon}</span>
      <div>
        <h2
          className="text-2xl font-bold uppercase tracking-wide mb-2"
          style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
        >
          {title}
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "#7A7268" }}>
          {desc}
        </p>
      </div>
    </Link>
  );
}
