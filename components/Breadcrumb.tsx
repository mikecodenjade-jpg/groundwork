"use client";

import Link from "next/link";

type Crumb = { label: string; href?: string };

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <span
                className="text-xs"
                style={{ color: "#555", fontFamily: "var(--font-inter)" }}
              >
                &rsaquo;
              </span>
            )}
            {isLast || !item.href ? (
              <span
                className="text-xs"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-xs transition-opacity hover:opacity-70"
                style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
