"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CrewPost {
  id: string;
  user_id: string;
  content: string;
  post_type: "text" | "achievement" | "challenge_join" | "badge_earned";
  metadata: Record<string, unknown> | null;
  created_at: string;
  likes_count: number;
}

interface UserProfile {
  id: string;
  full_name: string;
}

interface RecentBadge {
  id: string;
  user_id: string;
  badge_slug: string;
  earned_at: string;
  user_profiles?: { full_name: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const AVATAR_COLORS = [
  "#C45B28", "#2A6A4A", "#4A6FA5", "#8B5CF6",
  "#D97706", "#DC2626", "#059669", "#7C3AED",
  "#DB2777", "#2563EB", "#CA8A04", "#9333EA",
];

function avatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

// ─── Post type badges ────────────────────────────────────────────────────────

const POST_TYPE_BADGES: Record<string, { label: string; bg: string; color: string } | null> = {
  text: null,
  achievement: { label: "Achievement", bg: "#3A2A00", color: "#F5C542" },
  challenge_join: { label: "Joined Challenge", bg: "#0A2A3A", color: "#5B9BD5" },
  badge_earned: { label: "Badge Earned", bg: "#2A1200", color: "#C45B28" },
};

// ─── Icons ───────────────────────────────────────────────────────────────────

function HeartIcon({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} width={16} height={16}>
      <path
        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" width={14} height={14}>
      <path d="M6 6V16H14V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 6H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 4H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" width={12} height={12}>
      <path d="M8 1l2.12 4.3 4.74.69-3.43 3.34.81 4.72L8 11.77l-4.24 2.23.81-4.72L1.14 5.94l4.74-.69L8 1z" />
    </svg>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CrewWallPage() {
  const [posts, setPosts] = useState<CrewPost[]>([]);
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [recentBadges, setRecentBadges] = useState<RecentBadge[]>([]);

  const MAX_CHARS = 280;

  // ── Load data ──────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    // Try joined query first
    const { data: joinedPosts, error: joinError } = await supabase
      .from("crew_posts")
      .select("*, user_profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(50);

    let loadedPosts: CrewPost[] = [];
    const profileMap = new Map<string, string>();

    if (!joinError && joinedPosts && joinedPosts.length > 0) {
      loadedPosts = joinedPosts.map((p: Record<string, unknown>) => {
        const profile = p.user_profiles as { full_name: string } | null;
        if (profile && typeof p.user_id === "string") {
          profileMap.set(p.user_id, profile.full_name);
        }
        return {
          id: p.id as string,
          user_id: p.user_id as string,
          content: p.content as string,
          post_type: (p.post_type as CrewPost["post_type"]) || "text",
          metadata: (p.metadata as Record<string, unknown>) ?? null,
          created_at: p.created_at as string,
          likes_count: (p.likes_count as number) || 0,
        };
      });
    } else {
      // Fallback: load separately
      const { data: rawPosts } = await supabase
        .from("crew_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      loadedPosts = (rawPosts ?? []) as CrewPost[];

      if (loadedPosts.length > 0) {
        const userIds = [...new Set(loadedPosts.map((p) => p.user_id))];
        const { data: profileRows } = await supabase
          .from("user_profiles")
          .select("id, full_name")
          .in("id", userIds);

        for (const row of (profileRows ?? []) as UserProfile[]) {
          profileMap.set(row.id, row.full_name);
        }
      }
    }

    setPosts(loadedPosts);
    setProfiles(profileMap);

    // Load recent badges
    const { data: badgeData, error: badgeError } = await supabase
      .from("badges")
      .select("*, user_profiles(full_name)")
      .order("earned_at", { ascending: false })
      .limit(6);

    if (!badgeError && badgeData) {
      setRecentBadges(badgeData as RecentBadge[]);
    } else {
      // Fallback without join
      const { data: rawBadges } = await supabase
        .from("badges")
        .select("*")
        .order("earned_at", { ascending: false })
        .limit(6);
      if (rawBadges) {
        setRecentBadges(rawBadges as RecentBadge[]);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Create post ────────────────────────────────────────────────────────────

  async function handlePost() {
    if (!currentUserId || !newPostContent.trim() || newPostContent.length > MAX_CHARS) return;
    setPosting(true);

    const newPost: Omit<CrewPost, "id"> = {
      user_id: currentUserId,
      content: newPostContent.trim(),
      post_type: "text",
      metadata: null,
      created_at: new Date().toISOString(),
      likes_count: 0,
    };

    const { data, error } = await supabase
      .from("crew_posts")
      .insert(newPost)
      .select()
      .single();

    if (!error && data) {
      setPosts((prev) => [data as CrewPost, ...prev]);
      setNewPostContent("");
    }

    setPosting(false);
  }

  // ── Like post ──────────────────────────────────────────────────────────────

  async function handleLike(postId: string) {
    if (likedPosts.has(postId)) return;

    // Optimistic update
    setLikedPosts((prev) => new Set(prev).add(postId));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p
      )
    );

    const post = posts.find((p) => p.id === postId);
    if (post) {
      await supabase
        .from("crew_posts")
        .update({ likes_count: post.likes_count + 1 })
        .eq("id", postId);
    }
  }

  // ── Delete post ────────────────────────────────────────────────────────────

  async function handleDelete(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    await supabase.from("crew_posts").delete().eq("id", postId);
  }

  // ── Get profile name ──────────────────────────────────────────────────────

  function getName(userId: string): string {
    return profiles.get(userId) || "Crew Member";
  }

  // ── Badge name helper ─────────────────────────────────────────────────────

  function badgeDisplayName(slug: string): string {
    return slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  function getBadgeUserName(badge: RecentBadge): string {
    if (badge.user_profiles?.full_name) return badge.user_profiles.full_name;
    return profiles.get(badge.user_id) || "Someone";
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const charCount = newPostContent.length;
  const overLimit = charCount > MAX_CHARS;
  const canPost = newPostContent.trim().length > 0 && !overLimit && !posting;

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-8 pb-28">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "8px" }}
            aria-label="Back to dashboard"
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
              Community
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Crew Wall
            </h1>
          </div>
        </header>

        {/* ── Post Composer ───────────────────────────────────────────────── */}
        <section
          className="flex flex-col gap-3 p-5"
          style={{
            backgroundColor: "#161616",
            border: "1px solid #252525",
            borderRadius: "12px",
          }}
        >
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="What's on your mind? Share a win, a grind, or a goal..."
            rows={3}
            className="w-full resize-none text-sm leading-relaxed outline-none placeholder:opacity-40"
            style={{
              backgroundColor: "transparent",
              color: "#E8E2D8",
              fontFamily: "var(--font-inter)",
              border: "none",
            }}
          />
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-medium"
              style={{
                color: overLimit ? "#DC2626" : "#9A9A9A",
                fontFamily: "var(--font-inter)",
              }}
            >
              {charCount}/{MAX_CHARS}
            </span>
            <button
              onClick={handlePost}
              disabled={!canPost}
              className="font-bold uppercase tracking-widest text-xs px-6 transition-opacity"
              style={{
                backgroundColor: canPost ? "#C45B28" : "#252525",
                color: canPost ? "#0A0A0A" : "#9A9A9A",
                borderRadius: "8px",
                minHeight: "48px",
                border: "none",
                cursor: canPost ? "pointer" : "not-allowed",
                fontFamily: "var(--font-inter)",
                opacity: posting ? 0.6 : 1,
              }}
            >
              {posting ? "Posting..." : "Post to Crew"}
            </button>
          </div>
        </section>

        {/* ── Feed ────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse p-5"
                style={{
                  backgroundColor: "#161616",
                  border: "1px solid #1E1E1E",
                  borderRadius: "12px",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full"
                    style={{ backgroundColor: "#252525" }}
                  />
                  <div className="flex flex-col gap-2">
                    <div
                      className="h-3 rounded"
                      style={{ backgroundColor: "#252525", width: "100px" }}
                    />
                    <div
                      className="h-2 rounded"
                      style={{ backgroundColor: "#1E1E1E", width: "60px" }}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div
                    className="h-3 rounded"
                    style={{ backgroundColor: "#1E1E1E", width: "90%" }}
                  />
                  <div
                    className="h-3 rounded"
                    style={{ backgroundColor: "#1E1E1E", width: "70%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          /* ── Empty state ──────────────────────────────────────────────── */
          <div
            className="flex flex-col items-center gap-4 py-16 px-6 text-center"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #252525",
              borderRadius: "12px",
            }}
          >
            <div
              className="w-14 h-14 flex items-center justify-center rounded-full"
              style={{ backgroundColor: "#1A1200", border: "1px solid #2A1A00" }}
            >
              <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
                <path
                  d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                  stroke="#C45B28"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="7" r="4" stroke="#C45B28" strokeWidth="2" />
                <path
                  d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                  stroke="#C45B28"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p
              className="text-lg font-bold uppercase"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              No Posts Yet
            </p>
            <p
              className="text-sm max-w-xs"
              style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
            >
              Be the first to post. Share a win, drop some knowledge, or just
              let the crew know you showed up today.
            </p>
          </div>
        ) : (
          /* ── Post cards ───────────────────────────────────────────────── */
          <div className="flex flex-col gap-4">
            {posts.map((post) => {
              const name = getName(post.user_id);
              const badge = POST_TYPE_BADGES[post.post_type];
              const liked = likedPosts.has(post.id);
              const isOwn = post.user_id === currentUserId;

              return (
                <article
                  key={post.id}
                  className="p-5 flex flex-col gap-3"
                  style={{
                    backgroundColor: "#161616",
                    border: "1px solid #252525",
                    borderRadius: "12px",
                  }}
                >
                  {/* Top row: avatar + meta */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        backgroundColor: avatarColor(post.user_id),
                        color: "#0A0A0A",
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {initials(name)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span
                        className="text-sm font-bold truncate"
                        style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
                      >
                        {name}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                      >
                        {timeAgo(post.created_at)}
                      </span>
                    </div>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="ml-auto p-2 transition-opacity hover:opacity-70"
                        style={{ color: "#9A9A9A", background: "none", border: "none", cursor: "pointer" }}
                        aria-label="Delete post"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>

                  {/* Post type badge */}
                  {badge && (
                    <div className="flex">
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: badge.bg,
                          color: badge.color,
                          fontFamily: "var(--font-inter)",
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
                  >
                    {post.content}
                  </p>

                  {/* Bottom row: like */}
                  <div
                    className="flex items-center pt-2 mt-1"
                    style={{ borderTop: "1px solid #1E1E1E" }}
                  >
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1.5 text-xs transition-colors"
                      style={{
                        color: liked ? "#DC2626" : "#9A9A9A",
                        background: "none",
                        border: "none",
                        cursor: liked ? "default" : "pointer",
                        fontFamily: "var(--font-inter)",
                      }}
                      disabled={liked}
                    >
                      <HeartIcon filled={liked} />
                      <span className="font-medium">{post.likes_count}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ── Recent Achievements ─────────────────────────────────────────── */}
        {recentBadges.length > 0 && (
          <section className="flex flex-col gap-4">
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Recent Achievements
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
              {recentBadges.map((badge) => (
                <div
                  key={badge.id ?? badge.badge_slug + badge.user_id}
                  className="flex items-center gap-2 px-3 py-2 shrink-0"
                  style={{
                    backgroundColor: "#161616",
                    border: "1px solid #252525",
                    borderRadius: "20px",
                  }}
                >
                  <span style={{ color: "#C45B28" }}>
                    <StarIcon />
                  </span>
                  <span
                    className="text-xs whitespace-nowrap"
                    style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
                  >
                    <span className="font-bold">{getBadgeUserName(badge)}</span>
                    {" earned "}
                    <span className="font-semibold" style={{ color: "#C45B28" }}>
                      {badgeDisplayName(badge.badge_slug)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
      <BottomNav />
    </main>
  );
}
