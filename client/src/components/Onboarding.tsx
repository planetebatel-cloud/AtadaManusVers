/*
 * ATADA — Onboarding Flow
 * 3-slide intro + profile setup on first visit.
 * Shows once, then sets localStorage flag.
 */

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Briefcase, MessageSquare, Sparkles } from "lucide-react";
import { useState } from "react";

interface OnboardingProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    icon: Briefcase,
    title: "Swipe to apply",
    description: "Browse jobs like cards. Swipe right or tap Apply — it's that simple.",
  },
  {
    icon: Sparkles,
    title: "AI matches you",
    description: "Our AI scores each job based on your skills, location, and preferences.",
  },
  {
    icon: MessageSquare,
    title: "Chat with AI",
    description: "Ask questions, get salary insights, and find your perfect match faster.",
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < SLIDES.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem("atada_onboarded", "true");
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem("atada_onboarded", "true");
    onComplete();
  };

  const slide = SLIDES[step];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-[360px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="text-center"
          >
            {/* Icon */}
            <div
              className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#0A0A0A] flex items-center justify-center"
              style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
            >
              <Icon size={28} className="text-white" />
            </div>

            {/* Text */}
            <h2
              className="text-[24px] font-bold text-[#0A0A0A] mb-2"
              style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em" }}
            >
              {slide.title}
            </h2>
            <p
              className="text-[14px] text-[#808080] leading-relaxed"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-8 mb-6">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-[#0A0A0A]" : "w-1.5 bg-[#D8D8D8]"
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button onClick={handleNext} className="btn-pill btn-pill-solid w-full h-11 gap-2">
            {step < SLIDES.length - 1 ? "Next" : "Get Started"}
            <ArrowRight size={14} />
          </button>
          {step < SLIDES.length - 1 && (
            <button
              onClick={handleSkip}
              className="text-[12px] text-[#B8B8B8] hover:text-[#808080] transition-colors py-2"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Skip intro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("atada_onboarded")
  );
  return {
    showOnboarding,
    completeOnboarding: () => setShowOnboarding(false),
  };
}
