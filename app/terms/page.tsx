import Link from "next/link";

const S = { color: "#9A9A9A", fontFamily: "var(--font-inter)" } as const;
const H2 = "text-xl font-bold uppercase mt-8 mb-3";
const P = "text-sm leading-relaxed mb-4";
const UL = "text-sm leading-relaxed mb-4 list-disc pl-5 flex flex-col gap-1.5";

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-xs mb-10" style={S}>Last updated: March 22, 2026</p>

        <p className={P} style={S}>
          These Terms of Service (&quot;Terms&quot;) govern your use of the Build My Groundwork website and application (&quot;Service&quot;) operated by Build My Groundwork (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
        </p>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>1. Acceptance of Terms</h2>
        <p className={P} style={S}>
          By accessing or using Build My Groundwork, you confirm that you are at least 18 years of age and agree to comply with these Terms. We reserve the right to update these Terms at any time. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms.
        </p>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>2. Account Responsibilities</h2>
        <p className={P} style={S}>You are responsible for:</p>
        <ul className={UL} style={S}>
          <li>Providing accurate and complete information when creating your account.</li>
          <li>Maintaining the confidentiality of your login credentials.</li>
          <li>All activity that occurs under your account.</li>
          <li>Notifying us immediately at support@buildmygroundwork.com if you suspect unauthorized access to your account.</li>
        </ul>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>3. Acceptable Use</h2>
        <p className={P} style={S}>You agree not to:</p>
        <ul className={UL} style={S}>
          <li>Use the Service for any unlawful purpose or in violation of any applicable laws.</li>
          <li>Attempt to gain unauthorized access to our systems, other user accounts, or data.</li>
          <li>Upload or transmit malicious code, viruses, or harmful content.</li>
          <li>Scrape, crawl, or harvest data from the Service without written permission.</li>
          <li>Impersonate another person or misrepresent your affiliation with any entity.</li>
          <li>Use the AI Coach feature to generate content that is harmful, abusive, or illegal.</li>
        </ul>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>4. User Content</h2>
        <p className={P} style={S}>
          You retain ownership of all content you submit to the Service, including journal entries, mood check-ins, workout logs, and other personal data. By using the Service, you grant us a limited license to store, process, and display your content solely for the purpose of providing the Service to you. We will never use your personal content for advertising or sell it to third parties.
        </p>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>5. Intellectual Property</h2>
        <p className={P} style={S}>
          The Build My Groundwork name, logo, design, workout programming, UI components, and all original content are the intellectual property of Build My Groundwork and are protected by applicable copyright, trademark, and intellectual property laws. You may not copy, reproduce, distribute, or create derivative works from our Service without explicit written permission.
        </p>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>6. Health and Fitness Disclaimer</h2>
        <p className={P} style={S}>
          Build My Groundwork provides general fitness, wellness, and lifestyle content. The Service is <strong style={{ color: "#E8E2D8" }}>not a substitute for professional medical advice, diagnosis, or treatment</strong>. Always consult a qualified healthcare provider before starting any exercise program, especially if you have existing health conditions or injuries. The AI Coach feature provides general guidance only and is not a licensed counselor, therapist, or medical professional. Use all features at your own risk.
        </p>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>7. Limitation of Liability</h2>
        <p className={P} style={S}>
          To the maximum extent permitted by law, Build My Groundwork and its owners, officers, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service. This includes, but is not limited to, personal injury, property damage, data loss, or any damages related to reliance on information provided through the Service. Our total liability for any claim arising from your use of the Service shall not exceed the amount you paid to us in the twelve (12) months preceding the claim, or $100, whichever is greater.
        </p>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>8. Termination</h2>
        <p className={P} style={S}>
          We reserve the right to suspend or terminate your account at any time, with or without notice, for conduct that we determine violates these Terms or is harmful to other users, us, or third parties. You may also delete your account at any time by contacting support@buildmygroundwork.com. Upon termination, your right to use the Service ceases immediately. We may delete your data in accordance with our Privacy Policy.
        </p>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>9. Governing Law</h2>
        <p className={P} style={S}>
          These Terms shall be governed by and construed in accordance with the laws of the State of Texas, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the state and federal courts located in Dallas County, Texas.
        </p>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>10. Severability</h2>
        <p className={P} style={S}>
          If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect.
        </p>

        <h2 className={H2} style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}>11. Contact</h2>
        <p className={P} style={S}>
          If you have questions about these Terms of Service, contact us at <strong style={{ color: "#E8E2D8" }}>support@buildmygroundwork.com</strong>.
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
