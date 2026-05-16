/*
 * ATADA — Pricing Page
 * Employer-only plans. Workers use the platform 100% free.
 * Israeli law prohibits charging job seekers for employment services.
 */

import { motion } from "framer-motion";
import { Check, Building2, Rocket, Crown, Users } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { createCheckout } from "@/lib/api";
import { toast } from "sonner";

const EMPLOYER_PLANS = [
  {
    id: "employer_starter",
    name: "Starter",
    price: "199",
    period: "/post",
    icon: Building2,
    features: [
      "Single job posting (30 days)",
      "Up to 50 matched candidates",
      "Applicant status management",
      "Basic analytics",
    ],
    cta: "Post a Job",
  },
  {
    id: "employer_pro",
    name: "Pro",
    price: "999",
    period: "/mo",
    icon: Rocket,
    popular: true,
    features: [
      "Unlimited job posts",
      "AI candidate matching",
      "Full analytics dashboard",
      "Applicant management tools",
      "Priority support",
      "Candidate search & filters",
    ],
    cta: "Start Pro",
  },
  {
    id: "employer_enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    icon: Crown,
    features: [
      "Everything in Pro",
      "ATS integration",
      "Dedicated account manager",
      "Bulk posting (50+ jobs)",
      "Custom branding",
      "API access",
    ],
    cta: "Contact Sales",
    isContact: true,
  },
];

export default function PricingPage() {
  const [, setLocation] = useLocation();
  const { user, authenticated } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    if (!authenticated) {
      setLocation("/auth");
      return;
    }
    setLoadingPlan(planId);
    try {
      const { url } = await createCheckout(planId);
      if (url) window.location.href = url;
    } catch (err: any) {
      toast.error(err.message || "Checkout failed");
    }
    setLoadingPlan(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F7F7F7]">
      <div className="max-w-[900px] mx-auto p-6">
        {/* Hero */}
        <div className="text-center mb-4">
          <h1 className="text-[28px] font-bold text-[#0A0A0A] mb-2" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em" }}>
            Hire smarter, faster
          </h1>
          <p className="text-[13px] text-[#808080]">
            Post jobs, find pre-matched candidates, and manage applications — all in one place.
          </p>
        </div>

        {/* Free for workers badge */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[#ECECEC]" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <Users size={14} className="text-[#808080]" />
            <span className="text-[12px] text-[#505050]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              100% free for job seekers — always.
            </span>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {EMPLOYER_PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const isCurrent = user?.plan === plan.id;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`atada-card p-5 flex flex-col ${plan.popular ? "border-[#0A0A0A] border-2 relative" : ""}`}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#0A0A0A] text-white text-[9px] font-bold rounded-full"
                    style={{ fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}
                  >
                    MOST POPULAR
                  </div>
                )}

                <Icon size={20} className="text-[#808080] mb-3" />

                <h3 className="text-[16px] font-bold text-[#0A0A0A] mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {plan.name}
                </h3>

                <div className="flex items-baseline gap-0.5 mb-4">
                  {plan.price === "Custom" ? (
                    <span className="text-[24px] font-bold text-[#0A0A0A]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Custom</span>
                  ) : (
                    <>
                      <span className="text-[28px] font-bold text-[#0A0A0A]" style={{ fontFamily: "'DM Mono', monospace" }}>
                        ₪{plan.price}
                      </span>
                      <span className="text-[12px] text-[#808080]">{plan.period}</span>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-2 mb-5 flex-1">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2">
                      <Check size={13} className="text-[#0A0A0A] mt-0.5 flex-shrink-0" />
                      <span className="text-[12px] text-[#505050]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (plan.isContact) {
                      toast("Contact us at hello@atada.co.il");
                    } else if (!isCurrent) {
                      handleCheckout(plan.id);
                    }
                  }}
                  disabled={isCurrent || loadingPlan === plan.id}
                  className={`btn-pill w-full h-10 ${isCurrent ? "btn-pill-outline opacity-60" : "btn-pill-solid"}`}
                >
                  {loadingPlan === plan.id ? "Loading..." : isCurrent ? "Current Plan" : plan.cta}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Legal note */}
        <p className="text-center text-[10px] text-[#B8B8B8] mt-6" style={{ fontFamily: "'DM Mono', monospace" }}>
          Job seekers always use Atada for free, in compliance with Israeli employment law.
        </p>
      </div>
    </motion.div>
  );
}
