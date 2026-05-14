/*
 * ATADA — Pricing page inside SwipeLayout
 * Employer-only plans. Workers use the platform 100% free.
 */

import { motion } from "framer-motion";
import { Check, Building2, Rocket, Crown, Users } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useSwipeLayout } from "@/components/SwipeLayout";
import { useAuth } from "@/contexts/AuthContext";
import { createCheckout } from "@/lib/api";
import { toast } from "sonner";

const PLANS = [
  {
    id: "employer_starter",
    name: "Starter",
    price: "199",
    period: "/post",
    icon: Building2,
    features: ["Single job posting (30 days)", "Up to 50 matched candidates", "Applicant management", "Basic analytics"],
    cta: "Post a Job",
  },
  {
    id: "employer_pro",
    name: "Pro",
    price: "999",
    period: "/mo",
    icon: Rocket,
    popular: true,
    features: ["Unlimited job posts", "AI candidate matching", "Full analytics dashboard", "Applicant management", "Priority support"],
    cta: "Start Pro",
  },
  {
    id: "employer_enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    icon: Crown,
    features: ["Everything in Pro", "ATS integration", "Dedicated account manager", "Bulk posting (50+ jobs)", "API access"],
    cta: "Contact Sales",
    isContact: true,
  },
];

export function PricingSwipePage() {
  const { goPrev } = useSwipeLayout();
  const [, setLocation] = useLocation();
  const { user, authenticated } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (plan: typeof PLANS[0]) => {
    if (plan.isContact) { toast("Contact us at hello@atada.co.il"); return; }
    if (!authenticated) { setLocation("/auth"); return; }
    setLoadingPlan(plan.id);
    try {
      const { url } = await createCheckout(plan.id);
      if (url) window.location.href = url;
    } catch (err: any) { toast.error(err.message || "Checkout failed"); }
    setLoadingPlan(null);
  };

  return (
    <div className="w-full h-full bg-[#F7F7F7] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#ECECEC] flex-shrink-0">
        <button onClick={goPrev} className="text-[11px] font-medium text-[#505050] border border-[#D8D8D8] px-2.5 py-1.5 rounded-lg hover:border-[#0A0A0A] transition-colors" style={{ fontFamily: "'DM Mono', monospace" }}>
          ← Apps
        </button>
        <div className="flex items-center gap-2">
          <Crown size={14} className="text-[#808080]" />
          <span className="label-sm" style={{ fontFamily: "'DM Mono', monospace" }}>Pricing</span>
        </div>
        <div className="w-16" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-3">
            <h1 className="text-[24px] font-bold text-[#0A0A0A] mb-1" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em" }}>
              Hire smarter, faster
            </h1>
            <p className="text-[12px] text-[#808080]">Post jobs and find pre-matched candidates.</p>
          </div>

          <div className="flex items-center justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-[#ECECEC]">
              <Users size={12} className="text-[#808080]" />
              <span className="text-[11px] text-[#505050]">100% free for job seekers — always.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PLANS.map((plan, i) => {
              const Icon = plan.icon;
              const isCurrent = user?.plan === plan.id;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`atada-card p-4 flex flex-col ${plan.popular ? "border-[#0A0A0A] border-2 relative" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-[#0A0A0A] text-white text-[8px] font-bold rounded-full" style={{ fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>
                      POPULAR
                    </div>
                  )}
                  <Icon size={18} className="text-[#808080] mb-2" />
                  <h3 className="text-[15px] font-bold text-[#0A0A0A] mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-0.5 mb-3">
                    {plan.price === "Custom" ? (
                      <span className="text-[20px] font-bold text-[#0A0A0A]">Custom</span>
                    ) : (
                      <>
                        <span className="text-[24px] font-bold text-[#0A0A0A]" style={{ fontFamily: "'DM Mono', monospace" }}>₪{plan.price}</span>
                        <span className="text-[11px] text-[#808080]">{plan.period}</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 mb-4 flex-1">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-start gap-1.5">
                        <Check size={12} className="text-[#0A0A0A] mt-0.5 flex-shrink-0" />
                        <span className="text-[11px] text-[#505050]">{f}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => !isCurrent && handleCheckout(plan)}
                    disabled={isCurrent || loadingPlan === plan.id}
                    className={`btn-pill w-full h-9 text-[12px] ${isCurrent ? "btn-pill-outline opacity-60" : "btn-pill-solid"}`}
                  >
                    {loadingPlan === plan.id ? "..." : isCurrent ? "Current" : plan.cta}
                  </button>
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-[9px] text-[#B8B8B8] mt-4" style={{ fontFamily: "'DM Mono', monospace" }}>
            Job seekers always use Atada for free, in compliance with Israeli employment law.
          </p>
        </div>
      </div>
    </div>
  );
}
