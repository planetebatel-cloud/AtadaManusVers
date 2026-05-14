/*
 * ATADA — Page 1: Match / Discovery
 * Fetches real jobs from backend API + SSE chat
 * Desktop: 34/33/33 split (avatar / chat / cards)
 * Mobile: Drawer-based chat
 */

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { AvatarPanel } from "@/components/AvatarPanel";
import { ChatMessageItem, InputBar } from "@/components/ChatPanel";
import { JobCardStack } from "@/components/JobCard";
import { useSwipeLayout } from "@/components/SwipeLayout";
import { mockUser, mockJobs, apiJobToJob } from "@/lib/data";
import type { ChatMessage, Job } from "@/lib/data";
import { getJobs, getJobFeed, swipeJob, streamChat, isAuthenticated } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function DiscoveryPage() {
  const { goNext } = useSwipeLayout();
  const { user, authenticated } = useAuth();
  const [appliedCount, setAppliedCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "m_init",
      role: "ai",
      content: "Hey! I'm your Atada AI assistant. Tell me what kind of job you're looking for.",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch jobs from API — personalized feed for authed users
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiJobs = authenticated
          ? await getJobFeed(30)
          : await getJobs(0, 30);
        if (!cancelled) {
          setJobs(apiJobs.map(apiJobToJob));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setJobs(mockJobs);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [authenticated]);

  const handleApply = useCallback((job: Job) => {
    setAppliedCount(c => c + 1);
    toast(`Applied to ${job.title}`, {
      description: `${job.company} · ${job.location}`,
    });

    // Record swipe in backend
    if (isAuthenticated()) {
      swipeJob(job.id, "apply").catch(() => {});
    }

    // AI response
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          id: `ai_${Date.now()}`,
          role: "ai" as const,
          content: `Great choice! ${job.company} typically responds within 24h. Want me to find similar roles?`,
          timestamp: new Date(),
        }]);
        setIsTyping(false);
      }, 1000);
    }, 400);
  }, []);

  const handleSkip = useCallback((_job: Job) => {
    if (isAuthenticated()) {
      swipeJob(_job.id, "skip").catch(() => {});
    }
  }, []);

  const handleSend = useCallback(async (content: string) => {
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      let aiContent = "";
      const aiMsgId = `ai_${Date.now()}`;

      for await (const chunk of streamChat(content)) {
        if (chunk.type === "text_chunk" && chunk.content) {
          aiContent += chunk.content;
          // Update message progressively
          setChatMessages(prev => {
            const existing = prev.find(m => m.id === aiMsgId);
            if (existing) {
              return prev.map(m => m.id === aiMsgId ? { ...m, content: aiContent } : m);
            }
            return [...prev, {
              id: aiMsgId,
              role: "ai" as const,
              content: aiContent,
              timestamp: new Date(),
            }];
          });
          setIsTyping(false);
        }
        if (chunk.type === "done") break;
      }

      if (!aiContent) {
        setChatMessages(prev => [...prev, {
          id: aiMsgId,
          role: "ai" as const,
          content: "I'm here to help you find the perfect job. Tell me more about what you're looking for!",
          timestamp: new Date(),
        }]);
        setIsTyping(false);
      }
    } catch {
      setChatMessages(prev => [...prev, {
        id: `ai_err_${Date.now()}`,
        role: "ai" as const,
        content: "Sorry, I had trouble connecting. Please try again.",
        timestamp: new Date(),
      }]);
      setIsTyping(false);
    }
  }, []);

  return (
    <div className="w-full h-full bg-[#F7F7F7] flex flex-col">

      {/* ── Mobile header ────────────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#ECECEC]">
        <span
          className="label-sm"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          ATADA
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="p-1.5 hover:bg-[#FAFAFA] rounded-lg transition-colors"
          >
            {mobileDrawerOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <button
            onClick={goNext}
            className="text-[11px] font-medium text-[#505050] border border-[#D8D8D8] px-2.5 py-1.5 rounded-lg hover:border-[#0A0A0A] transition-colors"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Feed →
          </button>
        </div>
      </div>

      {/* ── Desktop: three-column layout ──────────────────────────────── */}
      <div className="hidden md:flex flex-1 overflow-hidden gap-4 p-4">

        {/* LEFT: Avatar panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0, duration: 0.35 }}
          className="flex-shrink-0 rounded-xl border border-[#ECECEC] overflow-hidden bg-white"
          style={{ width: "clamp(240px, 28%, 300px)", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}
        >
          <AvatarPanel
            user={mockUser}
            matchCount={jobs.length}
            appliedCount={appliedCount}
          />
        </motion.div>

        {/* MIDDLE: AI Chat block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className="flex-1 rounded-xl border border-[#ECECEC] overflow-hidden bg-white flex flex-col"
          style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#ECECEC] flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-[#FAFAFA] to-white">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full bg-[#0A0A0A] flex items-center justify-center"
                style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}
              >
                <span className="text-white text-[8px] font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>AI</span>
              </div>
              <span
                className="label-sm"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                AI Assistant
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4" style={{ minHeight: 0 }}>
            <AnimatePresence initial={false}>
              {chatMessages.map((msg, i) => (
                <ChatMessageItem key={msg.id} message={msg} index={i} />
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 mb-3"
                >
                  <div
                    className="w-6 h-6 rounded-full bg-[#0A0A0A] flex items-center justify-center flex-shrink-0"
                    style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}
                  >
                    <span className="text-white text-[8px] font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>AI</span>
                  </div>
                  <div className="chat-bubble-ai flex items-center gap-1 py-2">
                    {[0, 1, 2].map(j => (
                      <motion.div
                        key={j}
                        className="w-1.5 h-1.5 rounded-full bg-[#808080]"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: j * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input */}
          <InputBar onSend={handleSend} placeholder="Ask AI..." />
        </motion.div>

        {/* RIGHT: Job card block */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.16, duration: 0.35 }}
          className="flex-1 rounded-xl border border-[#ECECEC] overflow-hidden bg-white flex flex-col p-5"
          style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}
        >
          {/* Header */}
          <div className="mb-4 pb-4 border-b border-[#ECECEC]">
            <div className="flex items-center justify-between">
              <span
                className="label-sm"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                Job Match
              </span>
              <span
                className="text-[11px] text-[#B8B8B8]"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                Swipe to decide
              </span>
            </div>
          </div>

          {/* Cards */}
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <span className="label-xs">Loading jobs...</span>
              </div>
            ) : (
              <JobCardStack
                jobs={jobs}
                onApply={handleApply}
                onSkip={handleSkip}
              />
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Mobile: stacked layout ───────────────────────────────────── */}
      <div className="md:hidden flex-1 flex flex-col overflow-hidden relative">

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#F7F7F7]">
          <div className="rounded-xl border border-[#ECECEC] overflow-hidden bg-white p-5" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
            <div className="mb-4 pb-4 border-b border-[#ECECEC]">
              <span
                className="label-sm"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                Job Match
              </span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <span className="label-xs">Loading jobs...</span>
              </div>
            ) : (
              <JobCardStack
                jobs={jobs}
                onApply={handleApply}
                onSkip={handleSkip}
              />
            )}
          </div>
        </div>

        {/* Chat drawer */}
        <AnimatePresence>
          {mobileDrawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileDrawerOpen(false)}
                className="absolute inset-0 bg-black/40 z-40"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl border-t border-[#ECECEC]"
                style={{ height: "70vh", maxHeight: "70vh", boxShadow: "0 -4px 12px rgba(0,0,0,0.08)" }}
              >
                <div className="flex flex-col h-full">
                  <div className="px-4 py-3 border-b border-[#ECECEC] flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#0A0A0A] flex items-center justify-center" style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
                        <span className="text-white text-[7px] font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>AI</span>
                      </div>
                      <span className="label-sm" style={{ fontFamily: "'DM Mono', monospace" }}>AI Assistant</span>
                    </div>
                    <button onClick={() => setMobileDrawerOpen(false)} className="p-1 hover:bg-[#FAFAFA] rounded-lg transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-3" style={{ minHeight: 0 }}>
                    <AnimatePresence initial={false}>
                      {chatMessages.map((msg, i) => (
                        <ChatMessageItem key={msg.id} message={msg} index={i} />
                      ))}
                    </AnimatePresence>
                  </div>
                  <InputBar onSend={handleSend} placeholder="Ask AI..." />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
