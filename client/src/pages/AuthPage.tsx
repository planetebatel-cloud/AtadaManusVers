/*
 * ATADA — Auth Page
 * Two-step: phone number → OTP code verification
 * After success: redirect to home (or onboarding if new user)
 */

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Phone, Shield, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { sendOTP, verifyOTP, peekDemoOTP } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Step = "phone" | "otp";

const DEMO_PHONES = {
  worker: "+972501234567",
  employer: "+972509876543",
};

export default function AuthPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+972");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<"worker" | "employer" | null>(null);
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setLoading(true);
    try {
      const sent = await sendOTP(phone);
      setStep("otp");
      if (sent.demo) {
        // Auto-fill the demo code so visitors can log in without a phone
        try {
          const peeked = await peekDemoOTP(phone);
          setOtp(peeked.code);
          toast.success(`Demo code auto-filled: ${peeked.code}`);
        } catch {
          toast.success("Code sent! Check your phone.");
        }
      } else {
        toast.success("Code sent! Check your phone.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send code");
    }
    setLoading(false);
  };

  const handleDemoLogin = async (role: "worker" | "employer") => {
    const demoPhone = DEMO_PHONES[role];
    setDemoLoading(role);
    try {
      await sendOTP(demoPhone);
      const peeked = await peekDemoOTP(demoPhone);
      const data = await verifyOTP(demoPhone, peeked.code);
      await login(data.access_token, data.refresh_token);
      toast.success(`Logged in as demo ${role}`);
      setLocation(role === "employer" ? "/employer" : "/");
    } catch (err: any) {
      toast.error(err.message || "Demo login failed");
    }
    setDemoLoading(null);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const data = await verifyOTP(phone, otp);
      await login(data.access_token, data.refresh_token);
      toast.success("Welcome to Atada!");
      setLocation("/");
    } catch (err: any) {
      toast.error(err.message || "Invalid code. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px]"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#0A0A0A]" />
            <span
              className="text-[14px] font-medium tracking-[0.1em] uppercase"
              style={{ fontFamily: "'DM Mono', monospace", color: "#0A0A0A" }}
            >
              ATADA
            </span>
          </div>
          <h1
            className="text-[28px] font-bold text-[#0A0A0A] mb-1"
            style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em" }}
          >
            Find your next job
          </h1>
          <p className="text-[13px] text-[#808080]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            AI-powered job matching for Israel
          </p>
        </div>

        {/* One-click demo */}
        <div className="atada-card p-4 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-[#0A0A0A]" />
            <span className="label-sm">Try the demo — no phone needed</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin("worker")}
              disabled={demoLoading !== null}
              className="btn-pill btn-pill-solid h-10 text-[12px] disabled:opacity-50"
            >
              {demoLoading === "worker" ? "Loading..." : "Worker demo"}
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("employer")}
              disabled={demoLoading !== null}
              className="btn-pill btn-pill-outline h-10 text-[12px] disabled:opacity-50"
            >
              {demoLoading === "employer" ? "Loading..." : "Employer demo"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-[#ECECEC]" />
          <span className="text-[10px] text-[#B8B8B8] uppercase tracking-[0.15em]"
                style={{ fontFamily: "'DM Mono', monospace" }}>
            or use your phone
          </span>
          <div className="flex-1 h-px bg-[#ECECEC]" />
        </div>

        {/* Card */}
        <div className="atada-card p-6">
          <AnimatePresence mode="wait">
            {step === "phone" ? (
              <motion.form
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSendOTP}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Phone size={16} className="text-[#808080]" />
                  <span className="label-sm">Phone Number</span>
                </div>

                <input
                  type="tel"
                  className="atada-input mb-4 text-[16px]"
                  placeholder="+972501234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus
                />

                <p className="text-[11px] text-[#B8B8B8] mb-4" style={{ fontFamily: "'DM Mono', monospace" }}>
                  We'll send a 6-digit code to verify your number.
                </p>

                <button
                  type="submit"
                  disabled={loading || phone.length < 10}
                  className="btn-pill btn-pill-solid w-full h-11 gap-2 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Code"}
                  {!loading && <ArrowRight size={14} />}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerifyOTP}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={16} className="text-[#808080]" />
                  <span className="label-sm">Verification Code</span>
                </div>

                <p className="text-[12px] text-[#808080] mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Enter the 6-digit code sent to <strong>{phone}</strong>
                </p>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="atada-input mb-4 text-center text-[24px] tracking-[0.3em]"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoFocus
                />

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="btn-pill btn-pill-solid w-full h-11 gap-2 disabled:opacity-50 mb-3"
                >
                  {loading ? "Verifying..." : "Verify & Login"}
                  {!loading && <ArrowRight size={14} />}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep("phone"); setOtp(""); }}
                  className="btn-pill btn-pill-outline w-full h-10 text-[12px]"
                >
                  Change number
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-[10px] text-[#B8B8B8] mt-4 text-center"
           style={{ fontFamily: "'DM Mono', monospace" }}>
          Demo numbers: +972501234567 · +972509876543
        </p>
      </motion.div>
    </div>
  );
}
