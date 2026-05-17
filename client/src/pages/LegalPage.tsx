/*
 * ATADA — Privacy Policy + Terms of Service
 * Two routes share the same shell: /privacy and /terms.
 * Content is short and practical — covers Israeli Privacy Protection Law
 * disclosure requirements at MVP fidelity. Replace with lawyer-vetted text
 * before commercial launch.
 */

import { motion } from "framer-motion";
import { Link } from "wouter";

interface LegalPageProps {
  doc: "privacy" | "terms";
}

const CONTENT = {
  privacy: {
    title: "Privacy Policy",
    updated: "2026-05-18",
    sections: [
      {
        h: "1. What we collect",
        p: "Phone number (for sign-in via SMS code), name, email and location " +
           "(if you provide them in your profile), CV content you choose to upload, " +
           "and a record of the jobs you swipe on / save / apply to. We also collect " +
           "basic technical telemetry (IP, user-agent, device type) to keep the " +
           "service running and to detect abuse.",
      },
      {
        h: "2. Why we collect it",
        p: "To match you with jobs (skills + location are inputs to the ranking model), " +
           "to deliver SMS codes to you (your phone), to let employers contact you " +
           "about applications you submitted, and to comply with Israeli law where " +
           "applicable.",
      },
      {
        h: "3. Who we share it with",
        p: "Only employers whose jobs you explicitly apply to see your application " +
           "and CV. Anonymous aggregate stats (e.g. 'X candidates applied to this " +
           "job last week') may be shown publicly. We never sell your data.",
      },
      {
        h: "4. Where it lives",
        p: "On servers operated by Render (United States) and a database operated " +
           "by Neon (United States). SMS delivery is handled by Twilio. Payment " +
           "processing (employer side) is handled by Stripe.",
      },
      {
        h: "5. Your rights (Israeli DPA / Privacy Protection Law 1981)",
        p: "You can request a copy of your data, ask us to correct it, or ask us " +
           "to delete it entirely. Email husidhaisanov@gmail.com from the address " +
           "associated with your account and we'll respond within 30 days.",
      },
      {
        h: "6. Cookies",
        p: "We store a JWT token in localStorage to keep you signed in. No third-" +
           "party analytics or advertising cookies.",
      },
      {
        h: "7. Children",
        p: "Atada is not intended for users under 16. We do not knowingly collect " +
           "data from minors.",
      },
      {
        h: "8. Changes",
        p: "We'll post any material change to this page and update the date below.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "2026-05-18",
    sections: [
      {
        h: "1. What Atada is",
        p: "A two-sided marketplace connecting job seekers in Israel with " +
           "employers. We do not employ anyone — we just introduce candidates " +
           "to companies.",
      },
      {
        h: "2. Free for job seekers, always",
        p: "Israeli law (Employment Service Law, 5719-1959) prohibits charging " +
           "job seekers for employment matching services. Job seekers will never " +
           "be asked to pay for any feature. Employers pay per job post or via " +
           "subscription.",
      },
      {
        h: "3. Accuracy",
        p: "You agree the information you provide (CV, skills, contact info) is " +
           "true. Employers agree job postings reflect actual openings. We may " +
           "remove accounts or postings we believe to be fake.",
      },
      {
        h: "4. Acceptable use",
        p: "No spam, scraping, automated mass-applying, harassment, or attempts " +
           "to defeat rate limits / CAPTCHAs. We may suspend accounts that " +
           "violate these rules at our sole discretion.",
      },
      {
        h: "5. No employment guarantee",
        p: "We do not guarantee you will receive a job offer or that an employer " +
           "will respond to your application. Match scores are advisory.",
      },
      {
        h: "6. Liability",
        p: "Atada is provided as-is. To the maximum extent permitted by law we " +
           "are not liable for indirect damages arising from use of the service, " +
           "including disputes between candidates and employers after introduction.",
      },
      {
        h: "7. Termination",
        p: "You can close your account at any time by emailing the address in " +
           "the privacy policy. We may terminate accounts for breach of these " +
           "terms.",
      },
      {
        h: "8. Governing law",
        p: "These terms are governed by the laws of the State of Israel. Disputes " +
           "are subject to the exclusive jurisdiction of the courts of Tel Aviv.",
      },
    ],
  },
};

export default function LegalPage({ doc }: LegalPageProps) {
  const c = CONTENT[doc];
  const otherLink = doc === "privacy"
    ? { href: "/terms", label: "Read Terms of Service →" }
    : { href: "/privacy", label: "Read Privacy Policy →" };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F7F7F7]"
    >
      <div className="max-w-[720px] mx-auto px-5 py-10">
        <h1
          className="text-[32px] font-bold text-[#0A0A0A] mb-1"
          style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em" }}
        >
          {c.title}
        </h1>
        <p className="text-[12px] text-[#808080] mb-8" style={{ fontFamily: "'DM Mono', monospace" }}>
          Last updated: {c.updated}
        </p>

        <div className="flex flex-col gap-6">
          {c.sections.map((s) => (
            <section key={s.h}>
              <h2
                className="text-[16px] font-semibold text-[#0A0A0A] mb-2"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {s.h}
              </h2>
              <p
                className="text-[14px] text-[#303030] leading-relaxed"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {s.p}
              </p>
            </section>
          ))}
        </div>

        <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#ECECEC]">
          <Link
            href={otherLink.href}
            className="text-[13px] text-[#0A0A0A] hover:underline"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {otherLink.label}
          </Link>
          <Link
            href="/"
            className="text-[13px] text-[#808080] hover:text-[#0A0A0A] transition-colors"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            ← Back to feed
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
