"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import CrisisScreen from "@/components/CrisisScreen";

type EmailPrefs = {
  weekly_digest: boolean;
  tips_content: boolean;
  challenge_updates: boolean;
};

const DEFAULT_EMAIL_PREFS: EmailPrefs = {
  weekly_digest: true,
  tips_content: true,
  challenge_updates: true,
};

const ROLES = [
  "Superintendent",
  "Foreman",
  "Project Manager",
  "Project Engineer",
  "Vice President",
  "Operations",
  "Other",
];

export default function SettingsPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [jobsiteMode, setJobsiteMode] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [emailPrefs, setEmailPrefs] = useState<EmailPrefs>(DEFAULT_EMAIL_PREFS);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savedEmail, setSavedEmail] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setJobsiteMode(localStorage.getItem("jobsite_mode") === "true");
  }, []);

  function toggleJobsiteMode() {
    const next = !jobsiteMode;
    setJobsiteMode(next);
    localStorage.setItem("jobsite_mode", String(next));
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }
      setEmail(user.email ?? null);

      const { data } = await supabase
        .from("user_profiles")
        .select("full_name, role, company")
        .eq("id", user.id)
        .single();

      if (data) {
        setFullName(data.full_name ?? "");
        setRole(data.role ?? "");
        setCompany(data.company ?? "");
      }

      const { data: ep } = await supabase
        .from("email_preferences")
        .select("weekly_digest, tips_content, challenge_updates")
        .eq("user_id", user.id)
        .single();

      if (ep) {
        setEmailPrefs({
          weekly_digest: ep.weekly_digest ?? true,
          tips_content: ep.tips_content ?? true,
          challenge_updates: ep.challenge_updates ?? true,
        });
      }

      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_profiles").upsert({
      id: user.id,
      full_name: fullName.trim(),
      role,
      company: company.trim(),
    });

    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleSaveEmailPrefs() {
    setSavingEmail(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("email_preferences").upsert({ user_id: user.id, ...emailPrefs });
    setSavingEmail(false);
    setSavedEmail(true);
    setTimeout(() => setSavedEmail(false), 2500);
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    const { error } = await supabase.rpc("delete_user_account");
    if (error) {
      setDeleting(false);
      setShowDeleteModal(false);
      return;
    }
    await supabase.auth.signOut();
    router.push("/");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-10 pb-28">

        {/* Header */}
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
              Account
            </p>
            <h1
              className="text-4xl font-bold uppercase leading-none"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Settings
            </h1>
          </div>
        </header>

        {/* Profile card */}
        <section
          className="px-7 py-6 flex flex-col gap-5"
          style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
        >
          <div className="flex items-center justify-between">
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Profile
            </p>
            {!editing && !loading && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-semibold uppercase tracking-widest px-4 py-1.5 transition-opacity hover:opacity-70"
                style={{ border: "1px solid #252525", color: "#9A9A9A", fontFamily: "var(--font-inter)", borderRadius: "8px" }}
              >
                Edit
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse"
                  style={{ backgroundColor: "#1A1A1A" }}
                />
              ))}
            </div>
          ) : editing ? (
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label
                  className="text-xs uppercase tracking-widest"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]"
                  style={{ backgroundColor: "#161616", border: "1px solid #252525", color: "#E8E2D8", borderRadius: "8px", fontFamily: "var(--font-inter)" }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  className="text-xs uppercase tracking-widest"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C45B28] appearance-none"
                  style={{
                    backgroundColor: "#161616",
                    border: "1px solid #252525",
                    color: role ? "#E8E2D8" : "#9A9A9A",
                    borderRadius: "8px",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  <option value="">Select role</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r} style={{ backgroundColor: "#161616", color: "#E8E2D8" }}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label
                  className="text-xs uppercase tracking-widest"
                  style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                >
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C45B28]"
                  style={{ backgroundColor: "#161616", border: "1px solid #252525", color: "#E8E2D8", borderRadius: "8px", fontFamily: "var(--font-inter)" }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#C45B28", color: "#0A0A0A", fontFamily: "var(--font-inter)", fontWeight: 600, borderRadius: "8px", minHeight: "48px" }}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-6 py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-70"
                  style={{ border: "1px solid #252525", color: "#9A9A9A", fontFamily: "var(--font-inter)", borderRadius: "8px" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-3">
              {saved && (
                <p className="text-xs" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
                  ✓ Profile updated
                </p>
              )}
              {[
                { label: "Name", val: fullName || "—" },
                { label: "Role", val: role || "—" },
                { label: "Company", val: company || "—" },
                { label: "Email", val: email || "—" },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-baseline gap-4">
                  <span
                    className="text-xs uppercase tracking-widest w-20 flex-shrink-0"
                    style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                  >
                    {label}
                  </span>
                  <span className="text-sm" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Interests */}
        <section className="flex flex-col gap-4">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Training
          </p>
          <Link
            href="/onboarding/interests"
            className="flex items-center justify-between px-6 py-4 transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
          >
            <span
              className="text-sm font-bold uppercase tracking-wide"
              style={{ fontFamily: "var(--font-inter)", fontWeight: 600, color: "#E8E2D8" }}
            >
              Update Training Interests
            </span>
            <span style={{ color: "#C45B28" }}>›</span>
          </Link>
        </section>

        {/* Notifications */}
        <section className="flex flex-col gap-4">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Notifications
          </p>
          <Link
            href="/dashboard/settings/notifications"
            className="flex items-center justify-between px-6 py-4 transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
          >
            <span
              className="text-sm font-bold uppercase tracking-wide"
              style={{ fontFamily: "var(--font-inter)", fontWeight: 600, color: "#E8E2D8" }}
            >
              Notification Preferences
            </span>
            <span style={{ color: "#C45B28" }}>›</span>
          </Link>
        </section>

        {/* Email Preferences */}
        <section className="flex flex-col gap-4">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Email Preferences
          </p>
          <div
            className="flex flex-col"
            style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px", overflow: "hidden" }}
          >
            {(
              [
                { key: "weekly_digest" as const, label: "Weekly Digest", desc: "Progress summaries and weekly highlights" },
                { key: "tips_content" as const, label: "Tips & Training Content", desc: "New articles, drills, and resources" },
                { key: "challenge_updates" as const, label: "Challenge & Crew Updates", desc: "Milestones, completions, and crew activity" },
              ] as const
            ).map(({ key, label, desc }, i) => (
              <div key={key}>
                {i > 0 && <div style={{ borderTop: "1px solid #252525" }} />}
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex flex-col gap-0.5 pr-4">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}
                    >
                      {label}
                    </span>
                    <span className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                      {desc}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailPrefs((p) => ({ ...p, [key]: !p[key] }))}
                    className="relative shrink-0 transition-colors duration-200"
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: emailPrefs[key] ? "#C45B28" : "#252525",
                    }}
                    aria-label={`Toggle ${label}`}
                  >
                    <div
                      className="absolute top-1 w-4 h-4 rounded-full transition-all duration-200"
                      style={{
                        backgroundColor: emailPrefs[key] ? "#0A0A0A" : "#9A9A9A",
                        left: emailPrefs[key] ? 24 : 4,
                      }}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleSaveEmailPrefs}
            disabled={savingEmail}
            className="w-full py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#C45B28", color: "#0A0A0A", borderRadius: "8px", fontFamily: "var(--font-inter)", fontWeight: 700, minHeight: "48px" }}
          >
            {savingEmail ? "Saving..." : savedEmail ? "✓ Saved" : "Save Email Preferences"}
          </button>
        </section>

        {/* Jobsite Mode */}
        <section className="flex flex-col gap-4">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Display
          </p>
          <div
            className="flex items-center justify-between px-6 py-5"
            style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}
          >
            <div className="flex flex-col gap-1">
              <span
                className="text-sm font-bold uppercase tracking-wide"
                style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
              >
                Jobsite Mode
              </span>
              <span className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                Larger text, minimal UI, big buttons. Built for sunlight.
              </span>
            </div>
            <button
              onClick={toggleJobsiteMode}
              className="relative shrink-0 transition-all duration-200"
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                backgroundColor: jobsiteMode ? "#C45B28" : "#252525",
                border: `1px solid ${jobsiteMode ? "#C45B28" : "#333"}`,
              }}
              aria-label="Toggle Jobsite Mode"
            >
              <span
                className="absolute top-0.5 transition-all duration-200"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  backgroundColor: "#E8E2D8",
                  left: jobsiteMode ? 23 : 3,
                }}
              />
            </button>
          </div>
          {jobsiteMode && (
            <p className="text-xs px-1" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
              Active — workout pages will show larger text and a simplified layout.
            </p>
          )}
        </section>

        {/* Crisis Support */}
        <section className="flex flex-col gap-4">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Crisis Support
          </p>
          <div
            className="flex flex-col gap-3 px-6 py-5"
            style={{ backgroundColor: "#1A0808", border: "2px solid #5A1A1A", borderRadius: "12px" }}
          >
            <p
              className="text-sm"
              style={{ fontFamily: "var(--font-inter)", color: "#9A9A9A", lineHeight: 1.6 }}
            >
              If you or someone you know is in crisis, reach out immediately.
              These resources are free, confidential, and available 24/7.
            </p>
            <button
              onClick={() => setShowCrisis(true)}
              className="w-full flex items-center justify-center gap-3 font-bold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 15,
                fontWeight: 700,
                backgroundColor: "#DC2626",
                color: "#fff",
                borderRadius: "10px",
                border: "none",
                minHeight: "60px",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18} aria-hidden>
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              SOS — Crisis Resources
            </button>
          </div>
        </section>

        {/* Delete Account */}
        <section className="flex flex-col gap-3">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#9A3A3A", fontFamily: "var(--font-inter)" }}
          >
            Danger Zone
          </p>
          <div
            className="flex flex-col gap-3 px-6 py-5"
            style={{ backgroundColor: "#1A0808", border: "1px solid #5A1A1A", borderRadius: "12px" }}
          >
            <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)", lineHeight: 1.6 }}>
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#DC2626", color: "#fff", borderRadius: "8px", fontFamily: "var(--font-inter)", fontWeight: 700, minHeight: "48px" }}
            >
              Delete Account
            </button>
          </div>
        </section>

        {/* Sign Out */}
        <section>
          <button
            onClick={handleSignOut}
            className="w-full py-4 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-70"
            style={{ border: "1px solid #252525", color: "#9A9A9A", fontFamily: "var(--font-inter)", borderRadius: "8px", minHeight: "48px" }}
          >
            Sign Out
          </button>
        </section>

      </div>
      <BottomNav />
      {showCrisis && <CrisisScreen onDismiss={() => setShowCrisis(false)} />}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
        >
          <div
            className="w-full max-w-sm flex flex-col gap-5 px-7 py-8"
            style={{ backgroundColor: "#161616", border: "1px solid #5A1A1A", borderRadius: "16px" }}
          >
            <div className="flex flex-col gap-2">
              <h2
                className="text-xl font-bold uppercase"
                style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
              >
                Delete Account
              </h2>
              <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)", lineHeight: 1.6 }}>
                This will permanently delete your account, all training data, and cannot be recovered. Type{" "}
                <span style={{ color: "#DC2626", fontWeight: 700 }}>DELETE</span> to confirm.
              </p>
            </div>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-600"
              style={{ backgroundColor: "#0A0A0A", border: "1px solid #5A1A1A", color: "#E8E2D8", borderRadius: "8px", fontFamily: "var(--font-inter)" }}
            />
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || deleting}
                className="flex-1 py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-30"
                style={{ backgroundColor: "#DC2626", color: "#fff", borderRadius: "8px", fontFamily: "var(--font-inter)", fontWeight: 700 }}
              >
                {deleting ? "Deleting..." : "Delete Forever"}
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                className="px-5 py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-70"
                style={{ border: "1px solid #252525", color: "#9A9A9A", borderRadius: "8px", fontFamily: "var(--font-inter)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
