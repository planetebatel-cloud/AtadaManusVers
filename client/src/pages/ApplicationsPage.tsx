/*
 * ATADA — Applications Tracking Page
 * Shows user's applied jobs with status badges.
 */

import { motion } from "framer-motion";
import { Briefcase, Clock, CheckCircle, XCircle, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { getMyApplications, getJob } from "@/lib/api";
import type { ApplicationData, JobData } from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  applied: { label: "Applied", color: "#808080", icon: Clock },
  reviewed: { label: "Reviewed", color: "#505050", icon: CheckCircle },
  interview: { label: "Interview", color: "#0A0A0A", icon: Star },
  offer: { label: "Offer!", color: "#0A0A0A", icon: CheckCircle },
  rejected: { label: "Rejected", color: "#B8B8B8", icon: XCircle },
};

interface AppWithJob extends ApplicationData {
  job?: JobData;
}

export default function ApplicationsPage() {
  const [, setLocation] = useLocation();
  const [apps, setApps] = useState<AppWithJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyApplications();
        // Fetch job details for each application
        const enriched = await Promise.all(
          data.map(async (app) => {
            try {
              const job = await getJob(app.job_id);
              return { ...app, job };
            } catch {
              return app;
            }
          })
        );
        setApps(enriched);
      } catch {
        setApps([]);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F7F7F7]"
    >
      <div className="max-w-[600px] mx-auto p-4 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase size={16} className="text-[#808080]" />
          <span className="label-sm">My Applications</span>
          <span className="ml-auto text-[11px] text-[#B8B8B8]" style={{ fontFamily: "'DM Mono', monospace" }}>
            {apps.length} total
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="label-xs">Loading...</span>
          </div>
        ) : apps.length === 0 ? (
          <div className="atada-card p-8 text-center">
            <Briefcase size={32} className="text-[#D8D8D8] mx-auto mb-3" />
            <p className="text-[14px] font-medium text-[#505050]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              No applications yet
            </p>
            <p className="text-[12px] text-[#B8B8B8] mt-1">Start swiping to apply for jobs!</p>
            <button onClick={() => setLocation("/")} className="btn-pill btn-pill-solid mt-4 gap-1.5">
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {apps.map((app, i) => {
              const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;
              const StatusIcon = status.icon;
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="atada-card p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-semibold text-[#0A0A0A] truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {app.job?.title || "Job"}
                      </h3>
                      <p className="text-[12px] text-[#808080] truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {app.job?.company || ""} · {app.job?.location || ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border" style={{ borderColor: status.color }}>
                      <StatusIcon size={12} style={{ color: status.color }} />
                      <span className="text-[10px] font-medium" style={{ color: status.color, fontFamily: "'DM Mono', monospace" }}>
                        {status.label}
                      </span>
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
    </motion.div>
  );
}
