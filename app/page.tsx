import type { Metadata } from "next";
import Link from "next/link";
import AuthRedirect from "@/components/AuthRedirect";

export const metadata: Metadata = {
  title: "Build My Groundwork — Wellness for Construction Professionals",
  description:
    "A daily 10-minute system built for construction leaders. Fitness, stress tools, and leadership — programmed around a jobsite schedule, not a gym schedule.",
  openGraph: {
    title: "Build My Groundwork — Wellness for Construction Professionals",
    description:
      "A daily 10-minute system built for construction leaders. Fitness, stress tools, and leadership — programmed around a jobsite schedule, not a gym schedule.",
    url: "https://buildmygroundwork.com",
    siteName: "Build My Groundwork",
    type: "website",
  },
};

// ─── Pillar Card ──────────────────────────────────────────────────────────────

function PillarCard({
  label,
  tagline,
  icon,
}: {
  label: string;
  tagline: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: "#111827",
        border: "1px solid #1f2937",
        borderRadius: "12px",
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ color: "#f97316" }}>{icon}</div>
      <p
        style={{
          fontFamily: "var(--font-oswald)",
          fontSize: "18px",
          fontWeight: 700,
          color: "#f9fafb",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          lineHeight: 1,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: "14px",
          color: "#9ca3af",
          lineHeight: 1.5,
        }}
      >
        {tagline}
      </p>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BodyIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="1" y="9" width="4" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="5" y="10.5" width="2" height="3" rx="0.25" fill="currentColor" />
      <rect x="7" y="11" width="10" height="2" fill="currentColor" />
      <rect x="17" y="10.5" width="2" height="3" rx="0.25" fill="currentColor" />
      <rect x="19" y="9" width="4" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function MindIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 4C8.5 4 6 6.5 6 10C6 12 7 13.5 8.5 14.5V17H15.5V14.5C17 13.5 18 12 18 10C18 6.5 15.5 4 12 4Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
      />
      <line x1="9" y1="19" x2="15" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="21" x2="14" y2="21" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21C12 21 3 15 3 9C3 6.5 5 4.5 7.5 4.5C9.2 4.5 10.7 5.4 11.5 6.8C12.3 5.4 13.8 4.5 15.5 4.5C18 4.5 20 6.5 20 9C20 15 12 21 12 21Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
      />
    </svg>
  );
}

function LeadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 20C2 16 5 14 8 14C9.5 14 10.8 14.5 12 15.3C13.2 14.5 14.5 14 16 14C19 14 22 16 22 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FuelIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M8 3h8l1 5H7L8 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="6" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="10" x2="12" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CoachIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main style={{ backgroundColor: "#0a0f1a", color: "#f9fafb" }} className="flex flex-col min-h-screen">

      {/* Redirect authenticated users to dashboard — renders nothing visible */}
      <AuthRedirect />

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid #111827",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#f97316",
          }}
        >
          Build My Groundwork
        </span>
        <Link
          href="/login"
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#9ca3af",
          }}
        >
          Sign In
        </Link>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "80px 24px 72px",
          maxWidth: "640px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "3px",
            backgroundColor: "#f97316",
            marginBottom: "32px",
          }}
        />

        <h1
          style={{
            fontFamily: "var(--font-oswald)",
            fontSize: "clamp(42px, 10vw, 64px)",
            fontWeight: 700,
            lineHeight: 1.0,
            textTransform: "uppercase",
            color: "#f9fafb",
            marginBottom: "24px",
          }}
        >
          You run the job.
          <br />
          <span style={{ color: "#f97316" }}>Who&apos;s running your recovery?</span>
        </h1>

        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "16px",
            color: "#9ca3af",
            lineHeight: 1.65,
            marginBottom: "40px",
            maxWidth: "480px",
          }}
        >
          Groundwork is a daily 10-minute system built for construction leaders.
          Fitness, stress tools, and leadership — programmed around a jobsite schedule, not a gym schedule.
        </p>

        <Link
          href="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px 40px",
            backgroundColor: "#f97316",
            color: "#0a0f1a",
            fontFamily: "var(--font-inter)",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            borderRadius: "8px",
            minHeight: "52px",
            textDecoration: "none",
          }}
        >
          Start Day 1
        </Link>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid #111827" }} />

      {/* ── THE 6 PILLARS ───────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "72px 24px",
          maxWidth: "720px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#f97316",
            marginBottom: "12px",
          }}
        >
          What&apos;s Inside
        </p>
        <h2
          style={{
            fontFamily: "var(--font-oswald)",
            fontSize: "clamp(28px, 6vw, 40px)",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#f9fafb",
            lineHeight: 1.1,
            marginBottom: "48px",
          }}
        >
          Six pillars.<br />Everything you need. Nothing you don&apos;t.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          <PillarCard
            label="Body"
            tagline="Train in a hotel room, parking lot, or garage. Every workout fits where you actually are."
            icon={<BodyIcon />}
          />
          <PillarCard
            label="Mind"
            tagline="Box breathing, mood check-ins, and stress resets — for when the day is getting away from you."
            icon={<MindIcon />}
          />
          <PillarCard
            label="Heart"
            tagline="End the day clean. Journal, wind down, leave the job at the gate."
            icon={<HeartIcon />}
          />
          <PillarCard
            label="Lead"
            tagline="Daily prompts to be better with your crew. Not seminars. Not slideshows. Just real stuff."
            icon={<LeadIcon />}
          />
          <PillarCard
            label="Fuel"
            tagline="Simple nutrition. Protein, calories, water. Track what moves the needle, skip the rest."
            icon={<FuelIcon />}
          />
          <PillarCard
            label="Coach"
            tagline="A personal plan built around your time, goals, and what equipment you actually have."
            icon={<CoachIcon />}
          />
        </div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid #111827" }} />

      {/* ── SOCIAL PROOF / THE NUMBERS ──────────────────────────────────────── */}
      <section
        style={{
          padding: "72px 24px",
          maxWidth: "720px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#f97316",
            marginBottom: "12px",
          }}
        >
          Why It Matters
        </p>
        <h2
          style={{
            fontFamily: "var(--font-oswald)",
            fontSize: "clamp(26px, 5vw, 36px)",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#f9fafb",
            lineHeight: 1.15,
            marginBottom: "40px",
            maxWidth: "520px",
          }}
        >
          The industry has a problem nobody&apos;s talking about.
        </h2>

        {/* Headline Stat */}
        <div
          style={{
            backgroundColor: "#0d1520",
            border: "1px solid #374151",
            borderLeft: "4px solid #f97316",
            borderRadius: "8px",
            padding: "28px 28px",
            marginBottom: "32px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-oswald)",
              fontSize: "clamp(36px, 8vw, 52px)",
              fontWeight: 700,
              color: "#f97316",
              lineHeight: 1,
              marginBottom: "8px",
            }}
          >
            4×
          </p>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "15px",
              color: "#f9fafb",
              lineHeight: 1.5,
              marginBottom: "12px",
            }}
          >
            Construction has 4x the national suicide rate.
          </p>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "12px",
              color: "#6b7280",
              lineHeight: 1.4,
            }}
          >
            Source: Construction Industry Alliance for Suicide Prevention
          </p>
          {/* CIASP Logo Placeholder */}
          <div
            style={{
              marginTop: "20px",
              padding: "12px 16px",
              backgroundColor: "#111827",
              border: "1px dashed #374151",
              borderRadius: "6px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "4px",
                backgroundColor: "#1f2937",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "11px",
                color: "#4b5563",
                letterSpacing: "0.05em",
              }}
            >
              CIASP Logo
            </span>
          </div>
        </div>

        {/* User Quote Placeholders */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[
            {
              quote: "I've been in this industry 22 years. This is the first thing built for guys like me.",
              name: "Superintendent",
              company: "Commercial GC, Texas",
            },
            {
              quote: "Five minutes in the truck before the crew shows up. That's all it takes.",
              name: "Foreman",
              company: "Heavy Civil, Pacific Northwest",
            },
          ].map(({ quote, name, company }) => (
            <div
              key={name}
              style={{
                backgroundColor: "#111827",
                border: "1px solid #1f2937",
                borderRadius: "10px",
                padding: "24px",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "15px",
                  color: "#f9fafb",
                  lineHeight: 1.6,
                  marginBottom: "16px",
                  fontStyle: "italic",
                }}
              >
                &ldquo;{quote}&rdquo;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "#1f2937",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#f9fafb",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {name}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: "11px",
                      color: "#6b7280",
                    }}
                  >
                    {company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid #111827" }} />

      {/* ── ORIGIN ──────────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "64px 24px",
          maxWidth: "640px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#f97316",
            marginBottom: "12px",
          }}
        >
          The Origin
        </p>
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "15px",
            color: "#9ca3af",
            lineHeight: 1.7,
            marginBottom: "16px",
          }}
        >
          Groundwork was built by people who grew up in construction. Who watched good men and women grind themselves into the ground and call it normal.
        </p>
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "15px",
            color: "#9ca3af",
            lineHeight: 1.7,
          }}
        >
          Every tool in this app was designed on jobsites, not in boardrooms. This is the industry taking care of its own.
        </p>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid #111827" }} />

      {/* ── BOTTOM CTA ──────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "80px 24px",
          maxWidth: "540px",
          margin: "0 auto",
          width: "100%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "3px",
            backgroundColor: "#f97316",
            marginBottom: "32px",
          }}
        />
        <h2
          style={{
            fontFamily: "var(--font-oswald)",
            fontSize: "clamp(32px, 8vw, 48px)",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#f9fafb",
            lineHeight: 1.05,
            marginBottom: "16px",
          }}
        >
          Show up for yourself
          <br />
          <span style={{ color: "#f97316" }}>like you show up for the job.</span>
        </h2>
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "14px",
            color: "#9ca3af",
            lineHeight: 1.6,
            marginBottom: "40px",
            maxWidth: "360px",
          }}
        >
          Free during beta. No credit card. Built for Superintendents, Foremen, and Project Managers.
        </p>
        <Link
          href="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "18px 48px",
            backgroundColor: "#f97316",
            color: "#0a0f1a",
            fontFamily: "var(--font-inter)",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            borderRadius: "8px",
            minHeight: "56px",
            textDecoration: "none",
          }}
        >
          Start Day 1
        </Link>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid #111827",
          padding: "28px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#f97316",
            }}
          >
            Build My Groundwork
          </span>
          <div style={{ display: "flex", gap: "24px" }}>
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Contact", href: "/contact" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#4b5563",
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "11px",
            color: "#374151",
          }}
        >
          &copy; {new Date().getFullYear()} Groundwork. All rights reserved.
        </p>
      </footer>

    </main>
  );
}
