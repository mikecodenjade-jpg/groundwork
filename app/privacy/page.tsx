import Link from "next/link";

const S = { color: "#9A9A9A", fontFamily: "var(--font-inter)" } as const;
const H2 = "text-xl font-bold uppercase mt-8 mb-3";
const P = "text-sm leading-relaxed mb-4";
const UL = "text-sm leading-relaxed mb-4 list-disc pl-5 flex flex-col gap-1.5";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex flex-col px-6 py-16" style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}>
      <div className="w-full flex flex-col" style={{ maxWidth: 700, margin: "0 auto" }}>

        <Link
          href="/"
          className="text-xs font-semibold tracking-[0.3em] uppercase mb-10 transition-opacity hover:opacity-70"
          style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
        >
          &larr; Back to Home
        </Link>

        <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-2" style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}>
          Legal
        </p>
        <h1 className="text-4xl font-bold uppercase mb-2" style={{ fontFamily: "var(--font-oswald)" }}>
          Privacy Policy
        </h1>
        <p className="text-xs mb-10" style={S}>Last updated: March 22, 2026</p>

        <p className={P} style={S}>
          Build My Groundwork (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the buildmygroundwork.com website and application. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our platform.
        </p>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>1. Information We Collect</h2>
        <p className={P} style={S}>When you create an account and use our services, we may collect the following information:</p>
        <ul className={UL} style={S}>
          <li><strong style={{ color: "#E8E2D8" }}>Account information:</strong> Name, email address, and password.</li>
          <li><strong style={{ color: "#E8E2D8" }}>Workout logs:</strong> Exercise type, sets, reps, weight, duration, and completion timestamps.</li>
          <li><strong style={{ color: "#E8E2D8" }}>Mood check-ins:</strong> Self-reported mood ratings and notes.</li>
          <li><strong style={{ color: "#E8E2D8" }}>Journal entries:</strong> Free-text journal content you submit.</li>
          <li><strong style={{ color: "#E8E2D8" }}>Meal logs:</strong> Food items, calories, and macronutrient data you record.</li>
          <li><strong style={{ color: "#E8E2D8" }}>GPS run data:</strong> Location coordinates captured during tracked runs, used to display route maps and calculate distance.</li>
          <li><strong style={{ color: "#E8E2D8" }}>Injury reports:</strong> Body part, pain level, and injury type information you provide.</li>
          <li><strong style={{ color: "#E8E2D8" }}>Usage data:</strong> Pages visited, features used, and general interaction patterns.</li>
        </ul>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>2. How We Use Your Information</h2>
        <p className={P} style={S}>We use the information we collect to:</p>
        <ul className={UL} style={S}>
          <li>Personalize your workout recommendations, streaks, and daily plans.</li>
          <li>Track and display your progress over time (scores, streaks, workout history).</li>
          <li>Adapt workout programming based on reported injuries.</li>
          <li>Provide GPS-based run tracking and route mapping.</li>
          <li>Power the AI Coach feature to give contextual wellness guidance.</li>
          <li>Improve the platform and develop new features.</li>
        </ul>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>3. Data Storage and Security</h2>
        <p className={P} style={S}>
          Your data is stored using Supabase, a cloud database platform built on PostgreSQL. All data is encrypted at rest and in transit using industry-standard TLS encryption. Row Level Security (RLS) is enforced on all database tables, meaning users can only access their own data. We do not store passwords in plain text; authentication is handled through Supabase Auth with secure token-based sessions.
        </p>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>4. Third-Party Services</h2>
        <p className={P} style={S}>We integrate with the following third-party services:</p>
        <ul className={UL} style={S}>
          <li><strong style={{ color: "#E8E2D8" }}>Mapbox:</strong> Used to render route maps for GPS-tracked runs. Mapbox may receive location coordinates to generate map tiles. See Mapbox&#39;s privacy policy for details.</li>
          <li><strong style={{ color: "#E8E2D8" }}>Spotify:</strong> Embedded playlist players are loaded via Spotify&#39;s iframe embed. We do not access your Spotify account or listening data.</li>
          <li><strong style={{ color: "#E8E2D8" }}>OpenFoodFacts:</strong> Used for nutrition and food product lookups. Search queries may be sent to the OpenFoodFacts API.</li>
          <li><strong style={{ color: "#E8E2D8" }}>Anthropic (Claude):</strong> Powers the AI Coach feature. Conversation context is sent to Anthropic&#39;s API to generate responses. We do not use your data to train AI models.</li>
        </ul>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>5. Data Sharing</h2>
        <p className={P} style={S}>
          We do not sell, rent, or trade your personal information to third parties. We will never monetize your health, wellness, mood, or journal data. Data is only shared with the third-party services listed above to the extent required for those features to function.
        </p>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>6. Data Deletion</h2>
        <p className={P} style={S}>
          You may request deletion of your account and all associated data at any time by emailing <strong style={{ color: "#E8E2D8" }}>support@buildmygroundwork.com</strong>. Upon receiving your request, we will permanently delete your account and all personal data within 30 days. This includes workout logs, journal entries, mood check-ins, meal logs, run data, and any other information tied to your account.
        </p>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>7. Cookies and Tracking</h2>
        <p className={P} style={S}>
          We use essential cookies for authentication and session management. We do not use third-party advertising cookies or cross-site tracking pixels.
        </p>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>8. Medical Disclaimer</h2>
        <p className={P} style={S}>
          Build My Groundwork is a wellness and fitness application. It is <strong style={{ color: "#E8E2D8" }}>not a medical device and is not HIPAA-compliant</strong>. The app does not provide medical advice, diagnosis, or treatment. Mood check-ins, journal entries, and AI Coach responses are for personal wellness tracking and general guidance only. If you are experiencing a medical or mental health emergency, contact your healthcare provider or call 911 immediately.
        </p>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>9. Changes to This Policy</h2>
        <p className={P} style={S}>
          We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &quot;Last updated&quot; date. Continued use of the platform after changes constitutes acceptance of the updated policy.
        </p>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>10. Contact</h2>
        <p className={P} style={S}>
          If you have questions about this Privacy Policy or your data, contact us at <strong style={{ color: "#E8E2D8" }}>support@buildmygroundwork.com</strong>.
        </p>

        <div className="mt-12 pt-6" style={{ borderTop: "1px solid #1E1E1E" }}>
          <p className="text-xs" style={{ color: "#555", fontFamily: "var(--font-inter)" }}>
            &copy; {new Date().getFullYear()} Build My Groundwork. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
