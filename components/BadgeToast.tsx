"use client";

import { useState, useEffect } from "react";

export type ToastBadge = { slug: string; title: string };

export default function BadgeToast({ badges }: { badges: ToastBadge[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  // Kick off whenever the badges list changes and has content
  useEffect(() => {
    if (badges.length === 0) return;
    setIndex(0);
    setVisible(true);
  }, [badges]);

  // Auto-dismiss each toast, then advance or stop
  useEffect(() => {
    if (!visible || badges.length === 0) return;
    const hide = setTimeout(() => setVisible(false), 3200);
    return () => clearTimeout(hide);
  }, [visible, index, badges.length]);

  useEffect(() => {
    if (visible || badges.length === 0) return;
    const advance = setTimeout(() => {
      if (index + 1 < badges.length) {
        setIndex((i) => i + 1);
        setVisible(true);
      }
    }, 350);
    return () => clearTimeout(advance);
  }, [visible, index, badges.length]);

  if (badges.length === 0 || index >= badges.length) return null;

  const badge = badges[index];

  return (
    <div
      className="fixed top-5 left-1/2 z-[60] flex items-center gap-3 px-5 py-4 transition-all duration-300"
      style={{
        transform: `translateX(-50%) translateY(${visible ? "0" : "-8px"})`,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        backgroundColor: "#161616",
        border: "1px solid #C45B28",
        borderRadius: "12px",
        boxShadow: "0 6px 28px rgba(196, 91, 40, 0.35)",
        minWidth: "240px",
      }}
    >
      {/* Trophy icon */}
      <div
        className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
        style={{ backgroundColor: "#1A0A00", border: "1px solid #3A1A00" }}
      >
        <svg viewBox="0 0 24 24" fill="none" width={18} height={18}>
          <path d="M6 3h12l-1.5 9H7.5L6 3Z" stroke="#C45B28" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9 12c0 1.66 1.34 3 3 3s3-1.34 3-3" stroke="#C45B28" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M9 21h6M12 15v6" stroke="#C45B28" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M6 3C6 3 3 4 3 7s2 4 4.5 5" stroke="#C45B28" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M18 3c0 0 3 1 3 4s-2 4-4.5 5" stroke="#C45B28" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>

      <div className="flex flex-col gap-0.5">
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
        >
          Badge Earned
        </span>
        <span
          className="text-sm font-bold"
          style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
        >
          {badge.title}
        </span>
      </div>

      {/* Count indicator for multiple badges */}
      {badges.length > 1 && (
        <span
          className="ml-auto text-[10px] font-semibold"
          style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
        >
          {index + 1}/{badges.length}
        </span>
      )}
    </div>
  );
}
