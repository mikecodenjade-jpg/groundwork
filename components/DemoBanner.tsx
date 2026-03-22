"use client";

import Link from "next/link";

export default function DemoBanner() {
  return (
    <div
      className="w-full flex items-center justify-center gap-3 px-6 py-3 text-center flex-wrap"
      style={{
        backgroundColor: "#1A0E09",
        borderBottom: "1px solid #C45B28",
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#A09890", fontFamily: "var(--font-oswald)" }}>
        You&apos;re viewing a demo.
      </p>
      <Link
        href="/login"
        className="text-xs font-bold uppercase tracking-widest underline transition-opacity hover:opacity-70"
        style={{ color: "#C45B28", fontFamily: "var(--font-oswald)" }}
      >
        Sign up to save your progress →
      </Link>
    </div>
  );
}
