/*
 * ATADA — Applications page inside SwipeLayout
 */

import { motion } from "framer-motion";
import { Briefcase, Clock, CheckCircle, XCircle, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useSwipeLayout } from "@/components/SwipeLayout";
import { getMyApplications, getJob, isAuthenticated } from "@/lib/api";
import type { ApplicationData, JobData } from "@/lib/api";
import { useLocation } from "wouter";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  applied: { label: "Applied", color: "#808080", icon: Clock },
  reviewed: { label: "Reviewed", color: "#505050", icon: CheckCircle },
  interview: { label: "Interview", color: "#0A0A0A", icon: Star },
  offer: { label: "Offer!", color: "#0A0A0A", icon: CheckCircle },
  rejected: { label: "Rejected", color: "#B8B8B8", icon: XCircle },
};

interface AppWithJob extends ApplicationData { job?: JobData; }

export function ApplicationsSwipePage() {
  const { goPrev, goNext } = useSwipeLayout();
  const [, setLocation] = useLocation();
  const [apps, setApps] = useState<AppWithJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { setLoading(false); return; }
    (async () => {
      try {
        const data = await getMyApplications();
        const enriched = await Promise.all(
          data.map(async (app) => {
            try { const job = await getJob(app.job_id); return { ...app, job }; }
            catch { return app; }
          })
        );
        setApps(enriched);
      } catch { setApps([]); }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="w-full h-full bg-[#F7F7F7] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#ECECEC] flex-shrink-0">
        <button onClick={goPrev} className="text-[11px] font-medium text-[#505050] border border-[#D8D8D8] px-2.5 py-1.5 rounded-lg hover:border-[#0A0A0A] transition-colors" style={{ fontFamily: "'DM Mono', monospace" }}>
          ← Resume
        </button>
        <div className="flex items-center gap-2">
          <Briefcase size={14} className="text-[#808080]" />
          <span className="label-sm" style={{ fontFamily: "'DM Mono', monospace" }}>Applications</span>
        </div>
        <button onClick={goNext} className="text-[11px] font-medium text-[#505050] border border-[#D8D8D8] px-2.5 py-1.5 rounded-lg hover:border-[#0A0A0A] transition-colors" style={{ fontFamily: "'DM Mono', monospace" }}>
          Pricing →
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-[600px] mx-auto">
          {!isAuthenticated() ? (
            <div className="atada-card p-8 text-center">
              <Briefcase size={32} className="text-[#D8D8D8] mx-auto mb-3" />
              <p className="text-[14px] font-medium text-[#505050]">Log in to see your applications</p>
              <button onClick={() => setLocation("/auth")} className="btn-pill btn-pill-solid mt-4 gap-1.5">Log In</button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-16"><span className="label-xs">Loading...</span></div>
          ) : apps.length === 0 ? (
            <div className="atada-card p-8 text-center">
              <Briefcase size={32} className="text-[#D8D8D8] mx-auto mb-3" />
              <p className="text-[14px] font-medium text-[#505050]">No applications yet</p>
              <p className="text-[12px] text-[#B8B8B8] mt-1">Swipe right on jobs to start applying!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between mb-2">
                <span className="label-xs">{apps.length} applications</span>
              </div>
              {apps.map((app, i) => {
                const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;
                const StatusIcon = status.icon;
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="atada-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[14px] font-semibold text-[#0A0A0A] truncate">{app.job?.title || "Job"}</h3>
                        <p className="text-[12px] text-[#808080] truncate">{app.job?.company || ""} · {app.job?.location || ""}</p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border" style={{ borderColor: status.color }}>
                        <StatusIcon size={12} style={{ color: status.color }} />
                        <span className="text-[10px] font-medium" style={{ color: status.color, fontFamily: "'DM Mono', monospace" }}>{status.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[#B8B8B8]" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {app.match_score && <span>Match: {app.match_score}%</span>}
                      <span>{new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
