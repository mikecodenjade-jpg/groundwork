"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  content_type: string;
  duration_minutes: number;
  difficulty: string;
  instructor: string | null;
  thumbnail_url: string | null;
  content_url: string | null;
  tags: string[] | null;
}

type CategoryTab = "all" | "safety" | "leadership" | "nutrition" | "education";

const CATEGORY_TABS: { key: CategoryTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "safety", label: "Safety" },
  { key: "leadership", label: "Leadership" },
  { key: "nutrition", label: "Nutrition" },
  { key: "education", label: "Education" },
];

const CATEGORY_COLORS: Record<string, string> = {
  safety: "#C45B28",
  leadership: "#1E3A5F",
  nutrition: "#2A6A4A",
  education: "#5A3A78",
};

const CONTENT_TYPE_ICONS: Record<string, string> = {
  audio: "\uD83C\uDFA7",
  video: "\uD83D\uDCF9",
  article: "\uD83D\uDCD6",
  guided: "\uD83E\uDDD8",
};

const CONTENT_TYPE_CTA: Record<string, string> = {
  audio: "Listen",
  video: "Watch",
  article: "Read",
  guided: "Start",
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ContentLibraryPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CategoryTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("content_library")
        .select("*")
        .in("category", ["safety", "leadership", "nutrition", "education"])
        .order("title");

      setContent(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filteredContent =
    activeTab === "all" ? content : content.filter((c) => c.category === activeTab);

  // Featured: first item with a thumbnail_url, or just the first item
  const featured =
    content.find((c) => c.thumbnail_url) ?? (content.length > 0 ? content[0] : null);

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10 pb-28"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-12">
        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A" }}
            aria-label="Back"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path
                d="M13 4L7 10L13 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <div>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Learn
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Content Library
            </h1>
          </div>
        </header>

        {loading ? (
          <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
            Loading...
          </p>
        ) : (
          <>
            {/* Featured Section */}
            {featured && (
              <section
                style={{
                  border: `1px solid ${CATEGORY_COLORS[featured.category] ?? "#252525"}`,
                  backgroundColor: "#161616",
                  borderRadius: "12px",
                }}
              >
                <div
                  className="px-8 py-6"
                  style={{ borderBottom: "1px solid #252525" }}
                >
                  <p
                    className="text-xs font-semibold tracking-[0.25em] uppercase mb-1"
                    style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
                  >
                    Featured
                  </p>
                </div>
                <div className="px-8 py-6 flex flex-col gap-4">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 self-start"
                    style={{
                      color: CATEGORY_COLORS[featured.category] ?? "#9A9A9A",
                      border: `1px solid ${CATEGORY_COLORS[featured.category] ?? "#252525"}`,
                      borderRadius: "6px",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    {featured.category}
                  </span>
                  <h2
                    className="text-xl font-bold uppercase"
                    style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                  >
                    {featured.title}
                  </h2>
                  <p
                    className="text-sm leading-relaxed line-clamp-3"
                    style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                  >
                    {featured.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
                      {CONTENT_TYPE_ICONS[featured.content_type]}{" "}
                      {featured.content_type} &middot; {featured.duration_minutes} min
                    </span>
                  </div>
                  {featured.content_url ? (
                    <a
                      href={featured.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: "#C45B28",
                        color: "#E8E2D8",
                        borderRadius: "8px",
                        height: "56px",
                        fontFamily: "var(--font-inter)",
                      }}
                      className="w-full font-bold uppercase tracking-widest text-sm transition-all duration-150 active:scale-[0.99] hover:opacity-90 flex items-center justify-center"
                    >
                      {CONTENT_TYPE_CTA[featured.content_type] ?? "Open"} Now
                    </a>
                  ) : (
                    <div
                      className="w-full flex items-center justify-center text-sm font-bold uppercase tracking-widest"
                      style={{
                        backgroundColor: "#0A0A0A",
                        color: "#9A9A9A",
                        border: "1px solid #252525",
                        borderRadius: "8px",
                        height: "56px",
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      Content Coming Soon
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Category Tabs */}
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="text-xs font-bold uppercase tracking-widest px-4 py-2 transition-all duration-150"
                  style={{
                    fontFamily: "var(--font-inter)",
                    backgroundColor: activeTab === tab.key ? "#C45B28" : "#0A0A0A",
                    color: activeTab === tab.key ? "#E8E2D8" : "#9A9A9A",
                    border: `1px solid ${activeTab === tab.key ? "#C45B28" : "#252525"}`,
                    borderRadius: "8px",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Cards */}
            {filteredContent.length === 0 ? (
              <p
                className="text-sm py-8 text-center"
                style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
              >
                Content coming soon for this category.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredContent.map((item) => {
                  const categoryColor = CATEGORY_COLORS[item.category] ?? "#9A9A9A";
                  const isExpanded = expandedId === item.id;

                  return (
                    <div
                      key={item.id}
                      style={{
                        border: "1px solid #252525",
                        backgroundColor: "#161616",
                        borderRadius: "12px",
                      }}
                    >
                      <div className="px-8 py-6 flex flex-col gap-3">
                        {/* Top row: badges + duration */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5"
                            style={{
                              color: categoryColor,
                              border: `1px solid ${categoryColor}`,
                              borderRadius: "6px",
                              fontFamily: "var(--font-inter)",
                            }}
                          >
                            {item.category}
                          </span>
                          <span
                            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5"
                            style={{
                              color: "#9A9A9A",
                              border: "1px solid #252525",
                              borderRadius: "6px",
                              fontFamily: "var(--font-inter)",
                            }}
                          >
                            {CONTENT_TYPE_ICONS[item.content_type]} {item.content_type}
                          </span>
                          <span
                            className="text-xs ml-auto"
                            style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                          >
                            {item.duration_minutes} min
                          </span>
                        </div>

                        {/* Title */}
                        <h3
                          className="text-xl font-bold uppercase"
                          style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
                        >
                          {item.title}
                        </h3>

                        {/* Description */}
                        <p
                          className="text-sm leading-relaxed line-clamp-2"
                          style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                        >
                          {item.description}
                        </p>

                        {/* Difficulty + Tags */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5"
                            style={{
                              color: "#9A9A9A",
                              border: "1px solid #252525",
                              borderRadius: "6px",
                              fontFamily: "var(--font-inter)",
                            }}
                          >
                            {item.difficulty}
                          </span>
                          {item.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] uppercase tracking-widest px-2 py-0.5"
                              style={{
                                color: "#9A9A9A",
                                fontFamily: "var(--font-inter)",
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* CTA */}
                        {item.content_url ? (
                          <a
                            href={item.content_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              backgroundColor: "#C45B28",
                              color: "#E8E2D8",
                              borderRadius: "8px",
                              height: "56px",
                              fontFamily: "var(--font-inter)",
                            }}
                            className="w-full font-bold uppercase tracking-widest text-sm transition-all duration-150 active:scale-[0.99] hover:opacity-90 flex items-center justify-center"
                          >
                            {CONTENT_TYPE_CTA[item.content_type] ?? "Open"}
                          </a>
                        ) : (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            style={{
                              backgroundColor: "#0A0A0A",
                              color: "#E8E2D8",
                              border: "1px solid #252525",
                              borderRadius: "8px",
                              height: "56px",
                              fontFamily: "var(--font-inter)",
                            }}
                            className="w-full font-bold uppercase tracking-widest text-sm transition-all duration-150 active:scale-[0.99] hover:opacity-80"
                          >
                            {CONTENT_TYPE_CTA[item.content_type] ?? "Open"}
                          </button>
                        )}

                        {/* Inline "coming soon" for items without content_url */}
                        {!item.content_url && isExpanded && (
                          <div
                            className="flex items-center justify-center py-6"
                            style={{
                              backgroundColor: "#0A0A0A",
                              border: "1px solid #252525",
                              borderRadius: "8px",
                            }}
                          >
                            <p
                              className="text-sm"
                              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                            >
                              Content coming soon.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
