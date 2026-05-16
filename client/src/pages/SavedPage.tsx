/*
 * ATADA — Saved Jobs Page
 * Lists everything the worker bookmarked. Empty state nudges them to the feed.
 */

import { motion } from "framer-motion";
import { Bookmark, Briefcase } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getSavedJobs, unsaveJob, swipeJob, type JobData } from "@/lib/api";
import { apiJobToJob } from "@/lib/data";
import type { Job } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { JobDetailModal } from "@/components/JobDetailModal";

export default function SavedPage() {
  const [, setLocation] = useLocation();
  const { authenticated, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailJob, setDetailJob] = useState<Job | null>(null);

  const load = useCallback(async () => {
    if (!authenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getSavedJobs();
      setJobs(list.map((j: JobData) => apiJobToJob(j)));
    } catch {
      setJobs([]);
    }
    setLoading(false);
  }, [authenticated]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const handleUnsave = useCallback(async (jobId: string) => {
    setJobs(prev => prev.filter(j => j.id !== jobId));
    try {
      await unsaveJob(jobId);
      toast("Removed from saved", { duration: 1500 });
    } catch {
      toast.error("Couldn't unsave — reverting");
      load();
    }
  }, [load]);

  const handleApply = useCallback(async (job: Job) => {
    try {
      await swipeJob(job.id, "apply");
      toast.success(`Applied to ${job.title}`, {
        description: `${job.company} · ${job.location}`,
        action: { label: "View", onClick: () => setLocation("/applications") },
      });
      // Apply also unsaves — keeps the saved list focused on pending decisions.
      handleUnsave(job.id);
    } catch {
      toast.error("Couldn't apply");
    }
  }, [setLocation, handleUnsave]);

  if (!authLoading && !authenticated) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-8">
        <div className="atada-card p-8 text-center max-w-[400px]">
          <Bookmark size={32} className="text-[#D8D8D8] mx-auto mb-3" />
          <p className="text-[16px] font-semibold text-[#0A0A0A] mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Sign in to save jobs
          </p>
          <p className="text-[12px] text-[#808080] mb-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Bookmark jobs to revisit later — your saved list syncs across devices.
          </p>
          <button
            type="button"
            onClick={() => setLocation("/auth")}
            className="btn-pill btn-pill-solid h-10 px-6 text-[12px]"
          >
            Log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F7F7F7]">
      <div className="max-w-[720px] mx-auto p-4 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Bookmark size={16} className="text-[#808080]" />
          <span className="label-sm">Saved Jobs</span>
          <span className="ml-auto text-[11px] text-[#B8B8B8]" style={{ fontFamily: "'DM Mono', monospace" }}>
            {jobs.length} bookmarked
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="label-xs">Loading...</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="atada-card p-8 text-center">
            <Briefcase size={32} className="text-[#D8D8D8] mx-auto mb-3" />
            <p className="text-[14px] font-medium text-[#505050]">No saved jobs yet</p>
            <p className="text-[12px] text-[#B8B8B8] mt-1">
              Tap the bookmark icon on any job card to save it here.
            </p>
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="btn-pill btn-pill-solid mt-4 gap-1.5 h-10 px-5 text-[12px]"
            >
              Browse jobs
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map(job => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="atada-card p-4 cursor-pointer hover:border-[#0A0A0A] transition-colors"
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest("button")) setDetailJob(job);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-lg bg-[#F5F5F5] overflow-hidden flex-shrink-0">
                    {job.imageUrl ? (
                      <img src={job.imageUrl} alt={job.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Briefcase size={18} className="text-[#D8D8D8]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-[14px] font-semibold text-[#0A0A0A] leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {job.title}
                      </h3>
                      <span className="text-[11px] font-bold text-[#0A0A0A] tabular-nums flex-shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {job.matchScore}%
                      </span>
                    </div>
                    <p className="text-[12px] text-[#808080]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {job.company} · {job.location}{job.salary ? ` · ${job.salary}` : ""}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => handleUnsave(job.id)}
                        className="btn-pill btn-pill-outline h-8 px-3 text-[11px]"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApply(job)}
                        className="btn-pill btn-pill-solid h-8 px-3 text-[11px]"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <JobDetailModal
        job={detailJob}
        open={!!detailJob}
        onClose={() => setDetailJob(null)}
        onApply={handleApply}
        onSkip={(j) => handleUnsave(j.id)}
      />
    </motion.div>
  );
}
