/*
 * ATADA — Onboarding Flow
 * 3 static intro slides + a 4th interactive "try it" slide where the user
 * makes a real swipe on a sample job card. Completes onboarding on either
 * Apply or Skip — gets them practising the gesture before the real feed.
 */

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Briefcase, MessageSquare, Sparkles, Hand } from "lucide-react";
import { useState } from "react";
import { JobCard } from "@/components/JobCard";
import type { Job } from "@/lib/data";

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

// Sample card shown on the interactive slide. Hardcoded so onboarding works
// even before the user signs in / before the feed loads.
const SAMPLE_JOB: Job = {
  id: "onboarding-sample",
  title: "Frontend Developer",
  company: "Wix",
  location: "Tel Aviv",
  distance: "2.4 km",
  travelTime: "18 min",
  salary: "₪40-50/h",
  type: "contract",
  tags: ["React", "TypeScript", "Tailwind"],
  reachable: true,
  matchScore: 94,
  postedAt: "2h ago",
  description:
    "Build high-performance UI components for a SaaS platform used by 200M+ websites. Work closely with the design system team.",
  imageUrl:
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=300&fit=crop",
  driveMinutes: 18,
  transitMinutes: 24,
  distanceKm: 2.4,
};

function markComplete() {
  localStorage.setItem("atada_onboarded", "true");
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const totalSteps = SLIDES.length + 1; // +1 for the interactive slide

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      markComplete();
      onComplete();
    }
  };

  const handleSkip = () => {
    markComplete();
    onComplete();
  };

  const handleSampleAction = () => {
    markComplete();
    onComplete();
  };

  const isLastStaticSlide = step === SLIDES.length - 1;
  const isInteractiveSlide = step === SLIDES.length;
  const currentSlide = step < SLIDES.length ? SLIDES[step] : null;
  const Icon = currentSlide?.icon;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-6">
      <div className={`w-full ${isInteractiveSlide ? "max-w-[420px]" : "max-w-[360px]"}`}>
        <AnimatePresence mode="wait">
          {isInteractiveSlide ? (
            <motion.div
              key="interactive"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-h-[90vh] overflow-y-auto"
            >
              {/* Inline hint bar that stays visible even if the modal viewport
                  is short — replaces the previous heading-on-top layout which
                  scrolled off-screen on phones in landscape mode. */}
              <div className="sticky top-0 z-10 mb-3 bg-white/95 backdrop-blur pb-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-[#0A0A0A] text-white rounded-lg">
                  <Hand size={14} className="flex-shrink-0" />
                  <span className="text-[12px] font-medium flex-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Try it: swipe the card, or tap <strong>Apply</strong> / <strong>Skip</strong>
                  </span>
                </div>
              </div>
              <JobCard
                job={SAMPLE_JOB}
                onApply={handleSampleAction}
                onSkip={handleSampleAction}
                isActive
              />
            </motion.div>
          ) : (
            currentSlide && Icon && (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
                className="text-center"
              >
                <div
                  className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#0A0A0A] flex items-center justify-center"
                  style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
                >
                  <Icon size={28} className="text-white" />
                </div>
                <h2
                  className="text-[24px] font-bold text-[#0A0A0A] mb-2"
                  style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em" }}
                >
                  {currentSlide.title}
                </h2>
                <p
                  className="text-[14px] text-[#808080] leading-relaxed"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {currentSlide.description}
                </p>
              </motion.div>
            )
          )}
        </AnimatePresence>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-8 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-[#0A0A0A]" : "w-1.5 bg-[#D8D8D8]"
              }`}
            />
          ))}
        </div>

        {/* Buttons — hidden during interactive slide so the user actually swipes */}
        {!isInteractiveSlide && (
          <div className="flex flex-col gap-2">
            <button onClick={handleNext} className="btn-pill btn-pill-solid w-full h-11 gap-2">
              {isLastStaticSlide ? "Try it now" : "Next"}
              <ArrowRight size={14} />
            </button>
            <button
              onClick={handleSkip}
              className="text-[12px] text-[#B8B8B8] hover:text-[#808080] transition-colors py-2"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Skip intro
            </button>
          </div>
        )}

        {isInteractiveSlide && (
          <button
            onClick={handleSkip}
            className="block mx-auto text-[12px] text-[#B8B8B8] hover:text-[#808080] transition-colors py-2"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Skip — I'll figure it out
          </button>
        )}
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
