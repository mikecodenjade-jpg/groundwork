import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen flex flex-col px-6 py-16" style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}>
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
        <Link href="/" className="text-xs font-semibold tracking-[0.3em] uppercase" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
          Build My Groundwork
        </Link>
        <h1 className="text-4xl font-bold uppercase" style={{ fontFamily: "var(--font-oswald)" }}>Contact</h1>
        <p className="text-sm leading-relaxed" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
          Have questions or feedback? Reach out and we will get back to you.
        </p>
      </div>
    </main>
  );
}
