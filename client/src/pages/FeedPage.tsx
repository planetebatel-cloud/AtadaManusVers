/*
 * ATADA — Page 2: Detail / Chat / Feed
 * Fetches real jobs from backend API
 * Desktop: 50/50 split (AI chat + Job feed)
 * Mobile: Drawer-based chat
 */

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { JobFeed } from "@/components/JobFeed";
import { useSwipeLayout } from "@/components/SwipeLayout";
import { mockJobs, apiJobToJob } from "@/lib/data";
import type { Job } from "@/lib/data";
import { getJobs } from "@/lib/api";

export function FeedPage() {
  const { goPrev, goNext } = useSwipeLayout();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiJobs = await getJobs(0, 50);
        if (!cancelled) setJobs(apiJobs.map(apiJobToJob));
      } catch {
        if (!cancelled) setJobs(mockJobs);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="w-full h-full bg-[#F7F7F7] flex flex-col">

      {/* ── Mobile header ────────────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#ECECEC]">
        <button
          onClick={goPrev}
          className="text-[11px] font-medium text-[#505050] border border-[#D8D8D8] px-2.5 py-1.5 rounded-lg hover:border-[#0A0A0A] transition-colors"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          ← Match
        </button>
        <span
          className="label-sm"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          ATADA
        </span>
        <button
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          className="p-1.5 hover:bg-[#FAFAFA] rounded-lg transition-colors"
        >
          {mobileDrawerOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* ── Desktop: two-column layout ───────────────────────────────── */}
      <div className="hidden md:flex flex-1 overflow-hidden gap-4 p-4">

        {/* LEFT: Full AI chat block */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0, duration: 0.35 }}
          className="flex-1 rounded-xl border border-[#ECECEC] overflow-hidden bg-white flex flex-col"
          style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}
        >
          <div className="px-5 py-4 border-b border-[#ECECEC] flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-[#FAFAFA] to-white">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#0A0A0A] flex items-center justify-center" style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
                <span className="text-white text-[8px] font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>AI</span>
              </div>
              <span className="label-sm" style={{ fontFamily: "'DM Mono', monospace" }}>AI Assistant</span>
            </div>
            <button
              onClick={goPrev}
              className="text-[11px] text-[#808080] hover:text-[#0A0A0A] transition-colors"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              ← Match
            </button>
          </div>
          <ChatPanel className="flex-1 overflow-hidden" compact />
        </motion.div>

        {/* RIGHT: Job feed block */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className="flex-1 rounded-xl border border-[#ECECEC] overflow-hidden bg-white flex flex-col"
          style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}
        >
          <JobFeed jobs={jobs.length > 0 ? jobs : mockJobs} className="flex-1" />
        </motion.div>
      </div>

      {/* ── Mobile: drawer-based layout ──────────────────────────────── */}
      <div className="md:hidden flex-1 overflow-hidden relative">
        <div className="h-full bg-white overflow-hidden flex flex-col p-4">
          <div className="rounded-xl border border-[#ECECEC] overflow-hidden bg-white flex flex-col h-full" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
            <JobFeed jobs={jobs.length > 0 ? jobs : mockJobs} className="flex-1" />
          </div>
        </div>

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
                style={{ height: "75vh", maxHeight: "75vh", boxShadow: "0 -4px 12px rgba(0,0,0,0.08)" }}
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
                  <ChatPanel className="flex-1 overflow-hidden" />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
