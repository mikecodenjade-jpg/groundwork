"use client";

export default function Home() {
  return (
    <main style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }} className="flex flex-col min-h-screen">

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-32 min-h-screen relative">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 40px, #C45B28 40px, #C45B28 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #C45B28 40px, #C45B28 41px)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto">
          <p
            className="text-sm font-semibold tracking-[0.25em] uppercase mb-6"
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
          >
            For Superintendents · Foremen · Project Managers
          </p>
          <h1
            className="text-5xl md:text-7xl font-bold leading-tight mb-8 uppercase"
            style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
          >
            You build everything
            <br />
            for everyone else.
            <br />
            <span style={{ color: "#C45B28" }}>Who&apos;s building you?</span>
          </h1>
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
            style={{ color: "#A09890" }}
          >
            Construction leaders carry the weight of entire projects — schedules,
            crews, budgets, and families. Build My Groundwork gives you the tools
            to carry yourself too.
          </p>
          <a
            href="#signup"
            className="inline-block px-10 py-4 text-base font-bold uppercase tracking-widest transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: "#C45B28",
              color: "#0A0A0A",
              fontFamily: "var(--font-oswald)",
              clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
            }}
          >
            Take Your Day Back
          </a>
        </div>
      </section>

      {/* Stat Cards */}
      <section className="px-6 py-20" style={{ backgroundColor: "#111111" }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-center text-sm font-semibold tracking-[0.3em] uppercase mb-12"
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
          >
            The Reality on the Jobsite
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                stat: "4×",
                label: "Higher Suicide Rate",
                desc: "Construction workers die by suicide at four times the rate of the general population — more than any other industry.",
              },
              {
                stat: "83%",
                label: "Report Mental Health Struggles",
                desc: "Over 8 in 10 construction workers say they&apos;ve experienced anxiety, depression, or burnout on the job.",
              },
              {
                stat: "50+",
                label: "Hours Per Week",
                desc: "The average construction leader works more than 50 hours a week — and most sacrifice sleep, family, and health to do it.",
              },
            ].map(({ stat, label, desc }) => (
              <div
                key={label}
                className="p-8 border-l-4 flex flex-col gap-3"
                style={{
                  borderColor: "#C45B28",
                  backgroundColor: "#161616",
                }}
              >
                <p
                  className="text-6xl font-bold"
                  style={{ fontFamily: "var(--font-oswald)", color: "#C45B28" }}
                >
                  {stat}
                </p>
                <p
                  className="text-lg font-semibold uppercase tracking-wide"
                  style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                >
                  {label}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#7A7268" }}
                  dangerouslySetInnerHTML={{ __html: desc }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillar Cards */}
      <section className="px-6 py-20" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-center text-3xl md:text-4xl font-bold uppercase mb-4"
            style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
          >
            The Four Pillars
          </h2>
          <p className="text-center text-sm mb-14" style={{ color: "#7A7268" }}>
            Every structure needs a solid foundation. So do you.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: "⚙",
                title: "Body",
                desc: "Strength, recovery, sleep, and nutrition built for the physical demands of leading on the jobsite.",
              },
              {
                icon: "◈",
                title: "Mind",
                desc: "Mental clarity, stress management, and the focus you need to make hard calls under pressure.",
              },
              {
                icon: "♦",
                title: "Heart",
                desc: "Relationships, purpose, and emotional resilience — because who you are off the job matters as much as on it.",
              },
              {
                icon: "▲",
                title: "Lead",
                desc: "The culture, communication, and leadership skills that turn a crew into a team — and a boss into a builder.",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="p-8 flex flex-col gap-4 group transition-all duration-200 hover:translate-y-[-2px]"
                style={{ backgroundColor: "#141414", border: "1px solid #222222" }}
              >
                <p className="text-3xl" style={{ color: "#C45B28" }}>{icon}</p>
                <h3
                  className="text-2xl font-bold uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#7A7268" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Email Signup */}
      <section
        id="signup"
        className="px-6 py-24 flex flex-col items-center text-center"
        style={{ backgroundColor: "#0F0F0F", borderTop: "1px solid #1E1E1E" }}
      >
        <div className="max-w-xl w-full">
          <p
            className="text-sm font-semibold tracking-[0.3em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
          >
            Early Access
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold uppercase mb-4"
            style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
          >
            Be First on the Ground
          </h2>
          <p className="text-sm mb-10 leading-relaxed" style={{ color: "#7A7268" }}>
            We&apos;re building this for the people who build everything else. Drop your
            email and we&apos;ll reach out when we&apos;re ready.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 w-full"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="your@email.com"
              required
              className="flex-1 px-5 py-4 text-sm outline-none focus:ring-2"
              style={{
                backgroundColor: "#1A1A1A",
                color: "#E8E2D8",
                border: "1px solid #2A2A2A",
                fontFamily: "var(--font-geist)",
                // @ts-expect-error ring color via style
                "--tw-ring-color": "#C45B28",
              }}
            />
            <button
              type="submit"
              className="px-8 py-4 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "#C45B28",
                color: "#0A0A0A",
                fontFamily: "var(--font-oswald)",
              }}
            >
              Let Me In
            </button>
          </form>
          <p className="text-xs mt-4" style={{ color: "#444444" }}>
            No spam. No fluff. Just the groundwork.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-8 text-center text-xs"
        style={{ backgroundColor: "#080808", color: "#3A3A3A", borderTop: "1px solid #181818" }}
      >
        © {new Date().getFullYear()} Build My Groundwork. Built for the ones who build.
      </footer>
    </main>
  );
}
