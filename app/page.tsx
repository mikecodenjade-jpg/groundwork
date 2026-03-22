"use client";

import Link from "next/link";
import { useState, useRef } from "react";

// ─── Phone frame mock ─────────────────────────────────────────────────────────

function PhoneFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col rounded-[2rem] overflow-hidden flex-shrink-0 w-[200px]"
      style={{
        backgroundColor: "#0D0D0D",
        border: "1px solid #2A2A2A",
        boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
      }}
    >
      {/* Phone chrome */}
      <div className="flex items-center justify-center pt-4 pb-2 px-6" style={{ backgroundColor: "#111111" }}>
        <div className="w-16 h-1 rounded-full" style={{ backgroundColor: "#2A2A2A" }} />
      </div>
      {/* Screen */}
      <div className="flex flex-col flex-1 px-4 py-4 gap-3" style={{ backgroundColor: "#0D0D0D" }}>
        <p
          className="text-[10px] font-semibold tracking-[0.2em] uppercase"
          style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
        >
          Build My Groundwork
        </p>
        <p
          className="text-sm font-bold uppercase leading-tight"
          style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
        >
          {title}
        </p>
        {children}
      </div>
      {/* Home bar */}
      <div className="flex items-center justify-center pb-4 pt-2" style={{ backgroundColor: "#111111" }}>
        <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "#2A2A2A" }} />
      </div>
    </div>
  );
}

function MockBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: "#1E1E1E" }}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function MockCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2.5 rounded" style={{ backgroundColor: "#141414", border: "1px solid #1E1E1E" }}>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const howRef = useRef<HTMLElement>(null);

  function scrollToHow() {
    howRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <main style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }} className="flex flex-col min-h-screen">

      {/* ── 1. HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-32 min-h-screen">

        {/* Top nav */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-6 z-20">
          <p
            className="text-xs font-semibold tracking-[0.3em] uppercase"
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
          >
            Build My Groundwork
          </p>
          <Link
            href="/login"
            className="text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-70"
            style={{ color: "#7A7268", fontFamily: "var(--font-oswald)" }}
          >
            Sign In
          </Link>
        </div>

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Accent line */}
        <div className="w-12 h-0.5 mb-8" style={{ backgroundColor: "#C45B28" }} />

        <p
          className="text-xs font-semibold tracking-[0.3em] uppercase mb-6"
          style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
        >
          For Superintendents · Foremen · Project Managers
        </p>

        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold uppercase leading-[1.05] mb-6 max-w-4xl"
          style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
        >
          You build everything
          <br />
          for everyone else.
          <br />
          <span style={{ color: "#C45B28" }}>Who&apos;s building you?</span>
        </h1>

        <p className="text-base sm:text-lg max-w-xl mb-10 leading-relaxed" style={{ color: "#7A7268" }}>
          The all-in-one wellness platform built specifically for construction leaders.
          Fitness. Mental health. Leadership.{" "}
          <span style={{ color: "#A09890" }}>One app. Ten minutes a day.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/login"
            className="px-10 py-4 text-sm font-bold uppercase tracking-widest transition-all duration-150 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: "#C45B28", color: "#0A0A0A", fontFamily: "var(--font-oswald)" }}
          >
            Start Free
          </Link>
          <button
            onClick={scrollToHow}
            className="px-10 py-4 text-sm font-bold uppercase tracking-widest transition-all duration-150 hover:opacity-70 active:scale-95"
            style={{
              border: "1px solid #2A2A2A",
              color: "#7A7268",
              fontFamily: "var(--font-oswald)",
              backgroundColor: "transparent",
            }}
          >
            See How It Works
          </button>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 flex flex-col items-center gap-2 opacity-30">
          <div className="w-px h-8" style={{ backgroundColor: "#E8E2D8" }} />
        </div>
      </section>

      {/* ── 2. HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section ref={howRef} className="px-6 py-24" style={{ borderTop: "1px solid #1A1A1A" }}>
        <div className="max-w-4xl mx-auto">
          <p
            className="text-xs font-semibold tracking-[0.3em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
          >
            How It Works
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold uppercase mb-16 max-w-xl leading-tight"
            style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
          >
            Three moments. That&apos;s all it takes.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-0">
            {[
              {
                step: "01",
                title: "Start Your Day",
                time: "5 min — Before the site",
                body: "Quick workout, mindset set, fuel plan. Before the first phone call, before the crew shows up, before everything.",
              },
              {
                step: "02",
                title: "Jobsite Resets",
                time: "2 min — In your truck",
                body: "Stress tools, breathing, quick resets between the chaos. Use it on a break, between meetings, anywhere.",
              },
              {
                step: "03",
                title: "End-of-Day Shutdown",
                time: "3 min — After the gate closes",
                body: "Journal, gratitude, leave the job at the job. Show up at home like you mean it.",
              },
            ].map(({ step, title, time, body }, i) => (
              <div
                key={step}
                className="flex flex-col gap-4 px-8 py-10 relative"
                style={{
                  borderTop: "1px solid #1E1E1E",
                  borderLeft: i > 0 ? "1px solid #1E1E1E" : undefined,
                }}
              >
                <span
                  className="text-5xl font-bold leading-none"
                  style={{ fontFamily: "var(--font-oswald)", color: "#1E1E1E" }}
                >
                  {step}
                </span>
                <div>
                  <h3
                    className="text-xl font-bold uppercase mb-1"
                    style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                  >
                    {title}
                  </h3>
                  <p className="text-xs mb-3" style={{ color: "#C45B28", fontFamily: "var(--font-oswald)", letterSpacing: "0.1em" }}>
                    {time}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "#7A7268" }}>
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. PRODUCT PREVIEW ───────────────────────────────────────────────── */}
      <section className="px-6 py-24 overflow-hidden" style={{ borderTop: "1px solid #1A1A1A", backgroundColor: "#050505" }}>
        <div className="max-w-4xl mx-auto">
          <p
            className="text-xs font-semibold tracking-[0.3em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
          >
            Inside the App
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold uppercase mb-16 leading-tight"
            style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
          >
            Every tool you need.<br />Nothing you don&apos;t.
          </h2>

          {/* Phone frames row */}
          <div className="flex gap-5 overflow-x-auto pb-6 -mx-6 px-6 snap-x snap-mandatory md:justify-center md:overflow-visible">

            {/* Dashboard */}
            <div className="snap-start flex-shrink-0">
              <PhoneFrame title="Good Morning, Mike.">
                <p className="text-[9px]" style={{ color: "#5A5248" }}>Superintendent · Acme Construction</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-oswald)", color: "#C45B28" }}>7</span>
                  <div>
                    <p className="text-[9px] font-bold uppercase" style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>Day Streak</p>
                    <p className="text-[8px]" style={{ color: "#5A5248" }}>7 consecutive days</p>
                  </div>
                </div>
                <p className="text-[8px] font-semibold tracking-widest uppercase mt-2 mb-1.5" style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}>Choose Your Pillar</p>
                {["Body", "Mind", "Heart", "Lead"].map((p) => (
                  <MockCard key={p}>
                    <p className="text-[10px] font-bold uppercase" style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>{p}</p>
                  </MockCard>
                ))}
              </PhoneFrame>
            </div>

            {/* Body */}
            <div className="snap-start flex-shrink-0">
              <PhoneFrame title="Body">
                <p className="text-[8px] font-semibold tracking-widest uppercase mb-1" style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}>How much time?</p>
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {["15 min", "30 min", "45 min", "1 hr"].map((t, i) => (
                    <span
                      key={t}
                      className="text-[8px] font-bold uppercase px-2 py-1"
                      style={{
                        fontFamily: "var(--font-oswald)",
                        backgroundColor: i === 1 ? "#C45B28" : "#141414",
                        color: i === 1 ? "#0A0A0A" : "#7A7268",
                        border: `1px solid ${i === 1 ? "#C45B28" : "#2A2A2A"}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                {["Running", "Weightlifting", "Calisthenics", "Rucking"].map((d) => (
                  <MockCard key={d}>
                    <p className="text-[10px] font-bold uppercase" style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>{d}</p>
                  </MockCard>
                ))}
              </PhoneFrame>
            </div>

            {/* Mind */}
            <div className="snap-start flex-shrink-0">
              <PhoneFrame title="Mind">
                <p className="text-[8px] font-semibold tracking-widest uppercase mb-2" style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}>Daily Check-In</p>
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {["Low", "Rough", "Mid", "Good", "High"].map((m, i) => {
                    const colors = ["#5A4A4A", "#7A5A28", "#5A5248", "#4A6A4A", "#2A5A3A"];
                    return (
                      <span
                        key={m}
                        className="text-[8px] font-bold uppercase px-2 py-1"
                        style={{ fontFamily: "var(--font-oswald)", backgroundColor: colors[i], color: "#E8E2D8" }}
                      >
                        {m}
                      </span>
                    );
                  })}
                </div>
                <p className="text-[8px] font-semibold tracking-widest uppercase mb-1.5" style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}>Stress Tools</p>
                {["Box Breathing", "5-Minute Reset", "Shutdown Ritual"].map((t) => (
                  <MockCard key={t}>
                    <p className="text-[10px] font-bold uppercase" style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>{t}</p>
                  </MockCard>
                ))}
              </PhoneFrame>
            </div>

            {/* Heart */}
            <div className="snap-start flex-shrink-0">
              <PhoneFrame title="Heart">
                <p className="text-[8px] font-semibold tracking-widest uppercase mb-1" style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}>Daily Journal</p>
                <div
                  className="w-full h-14 rounded px-2 py-2 mb-3"
                  style={{ backgroundColor: "#141414", border: "1px solid #1E1E1E" }}
                >
                  <p className="text-[8px] leading-relaxed" style={{ color: "#3A3530" }}>
                    What&apos;s on your mind today...
                  </p>
                </div>
                <p className="text-[8px] font-semibold tracking-widest uppercase mb-1.5" style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}>Gratitude</p>
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="w-full h-6 rounded mb-1.5"
                    style={{ backgroundColor: "#141414", border: "1px solid #1E1E1E" }}
                  />
                ))}
                <button
                  className="w-full py-1.5 text-[9px] font-bold uppercase tracking-widest mt-1"
                  style={{ backgroundColor: "#C45B28", color: "#0A0A0A", fontFamily: "var(--font-oswald)" }}
                >
                  Save Entry
                </button>
              </PhoneFrame>
            </div>

          </div>

          <p className="text-xs text-center mt-8" style={{ color: "#3A3530" }}>
            Scroll to see more →
          </p>
        </div>
      </section>

      {/* ── 4. BUILT FOR THE JOBSITE ─────────────────────────────────────────── */}
      <section className="px-6 py-24" style={{ borderTop: "1px solid #1A1A1A" }}>
        <div className="max-w-4xl mx-auto">
          <div className="max-w-2xl">
            <p
              className="text-xs font-semibold tracking-[0.3em] uppercase mb-4"
              style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
            >
              Built Different
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold uppercase mb-12 leading-tight"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Built for guys who measure their day in minutes, not hours.
            </h2>
            <div className="flex flex-col gap-6">
              {[
                {
                  lead: "No gym required.",
                  body: "Train in your truck, hotel, or garage. Every workout fits where you actually are.",
                },
                {
                  lead: "No therapy-speak.",
                  body: "Real tools for real stress. Built around what a superintendent's day actually looks like.",
                },
                {
                  lead: "No fluff.",
                  body: "Everything earns its place or gets cut. If it doesn't help you perform, it's not in the app.",
                },
              ].map(({ lead, body }) => (
                <div key={lead} className="flex gap-5 items-start">
                  <div className="w-1 h-12 flex-shrink-0 mt-0.5" style={{ backgroundColor: "#C45B28" }} />
                  <div>
                    <p
                      className="text-lg font-bold uppercase mb-1"
                      style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                    >
                      {lead}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "#7A7268" }}>
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. THE NUMBERS ───────────────────────────────────────────────────── */}
      <section className="px-6 py-24" style={{ borderTop: "1px solid #1A1A1A", backgroundColor: "#050505" }}>
        <div className="max-w-4xl mx-auto">
          <p
            className="text-xs font-semibold tracking-[0.3em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
          >
            The Reality
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold uppercase mb-14 leading-tight max-w-lg"
            style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
          >
            The industry has a problem nobody&apos;s talking about.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                stat: "4×",
                copy: "Construction workers are 4× more likely to die by suicide than the national average.",
              },
              {
                stat: "83%",
                copy: "of construction workers report significant mental health struggles on the job.",
              },
              {
                stat: "50+",
                copy: "hours a week. The average super has zero recovery plan for what that does to a body and a mind.",
              },
            ].map(({ stat, copy }) => (
              <div
                key={stat}
                className="flex flex-col gap-4 px-8 py-10"
                style={{ backgroundColor: "#0D0D0D", border: "1px solid #1E1E1E" }}
              >
                <span
                  className="text-5xl font-bold leading-none"
                  style={{ fontFamily: "var(--font-oswald)", color: "#C45B28" }}
                >
                  {stat}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: "#7A7268" }}>
                  {copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. BUILT BY SOMEONE WHO GETS IT ──────────────────────────────────── */}
      <section className="px-6 py-24" style={{ borderTop: "1px solid #1A1A1A" }}>
        <div className="max-w-4xl mx-auto">
          <div className="max-w-2xl">
            <p
              className="text-xs font-semibold tracking-[0.3em] uppercase mb-4"
              style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
            >
              The Origin
            </p>
            <div className="w-12 h-0.5 mb-8" style={{ backgroundColor: "#1E1E1E" }} />
            <blockquote
              className="text-xl sm:text-2xl font-bold uppercase leading-snug mb-8"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              &ldquo;Built by a superintendent with 7 years in the field. Not by a tech company guessing what you need.&rdquo;
            </blockquote>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "#7A7268" }}>
              This started because the industry keeps losing good people — to burnout, to addiction, to worse —
              and nobody&apos;s building anything real to stop it.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#7A7268" }}>
              Groundwork isn&apos;t a wellness app built for an office. It&apos;s built for the job.
              For the 5am start. The brutal week. The drive home where you don&apos;t know how to turn it off.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7. EARLY ACCESS ──────────────────────────────────────────────────── */}
      <section
        className="px-6 py-28"
        style={{ borderTop: "1px solid #1A1A1A", backgroundColor: "#050505" }}
      >
        <div className="max-w-xl mx-auto text-center flex flex-col items-center">
          <div className="w-12 h-0.5 mb-8" style={{ backgroundColor: "#C45B28" }} />
          <p
            className="text-xs font-semibold tracking-[0.3em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
          >
            Founding Member Access
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold uppercase mb-4 leading-tight"
            style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
          >
            Limited to the first 100.
          </h2>
          <p className="text-sm mb-2 leading-relaxed" style={{ color: "#7A7268" }}>
            Free during beta. No credit card. Just access to every tool we build, and your voice in what comes next.
          </p>
          <p className="text-xs mb-10" style={{ color: "#5A5248" }}>
            Open to Superintendents, Foremen, and Project Managers only.
          </p>

          {submitted ? (
            <div className="w-full py-6 flex flex-col items-center gap-2">
              <p
                className="text-xl font-bold uppercase"
                style={{ fontFamily: "var(--font-oswald)", color: "#C45B28" }}
              >
                You&apos;re in.
              </p>
              <p className="text-sm" style={{ color: "#7A7268" }}>
                We&apos;ll be in touch before launch.
              </p>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="w-full flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]"
                style={{
                  backgroundColor: "#141414",
                  border: "1px solid #2A2A2A",
                  color: "#E8E2D8",
                }}
              />
              <button
                type="submit"
                className="px-8 py-4 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-95 whitespace-nowrap"
                style={{
                  backgroundColor: "#C45B28",
                  color: "#0A0A0A",
                  fontFamily: "var(--font-oswald)",
                }}
              >
                Claim My Spot
              </button>
            </form>
          )}

          <p className="text-xs mt-6" style={{ color: "#3A3530" }}>
            Or{" "}
            <Link
              href="/login"
              className="underline transition-opacity hover:opacity-70"
              style={{ color: "#7A7268" }}
            >
              sign up now and start using the app today
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── 8. FOOTER ────────────────────────────────────────────────────────── */}
      <footer
        className="px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{ borderTop: "1px solid #1A1A1A" }}
      >
        <p
          className="text-xs font-semibold tracking-[0.2em] uppercase"
          style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
        >
          Build My Groundwork
        </p>
        <p className="text-xs" style={{ color: "#3A3530" }}>
          © {new Date().getFullYear()} Groundwork. All rights reserved.
        </p>
        <Link
          href="/login"
          className="text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-70"
          style={{ color: "#5A5248", fontFamily: "var(--font-oswald)" }}
        >
          Sign In
        </Link>
      </footer>

    </main>
  );
}
