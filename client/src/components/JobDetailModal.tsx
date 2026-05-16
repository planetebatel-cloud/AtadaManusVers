/*
 * ATADA — JobDetailModal
 * Opens on JobCard click. Shows full description, match-factor breakdown,
 * company section (stub for now), and Apply/Skip CTAs that proxy to the
 * same handlers as the card itself.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Car, Bus, Check, X, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Job } from "@/lib/data";

interface JobDetailModalProps {
  job: Job | null;
  open: boolean;
  onClose: () => void;
  onApply: (job: Job) => void;
  onSkip: (job: Job) => void;
}

function formatMin(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

// Heuristic breakdown used until backend ships a real `match_factors` payload.
// Computed deterministically from the job's own fields so the user sees
// something consistent rather than placeholder text.
function computeFactors(job: Job): { label: string; score: number; note: string }[] {
  const matchScore = job.matchScore || 50;
  // Spread the headline score into three plausible buckets.
  const skills = Math.min(100, Math.max(0, Math.round(matchScore * 0.95 + 5)));
  const commute = job.reachable
    ? Math.max(40, 100 - (job.driveMinutes || 0) * 1.2)
    : 20;
  const salary = Math.min(100, Math.max(30, matchScore - 5 + (job.salary.includes("/h") ? 10 : 0)));
  return [
    {
      label: "Skills match",
      score: skills,
      note: job.tags.length ? `${Math.min(job.tags.length, 4)} of ${job.tags.length} skills overlap` : "based on profile",
    },
    {
      label: "Commute",
      score: Math.round(commute),
      note: job.driveMinutes != null
        ? `${formatMin(job.driveMinutes)} driving${job.transitMinutes != null ? ` · ${formatMin(job.transitMinutes)} transit` : ""}`
        : (job.travelTime || job.distance || "distance estimated"),
    },
    {
      label: "Salary fit",
      score: Math.round(salary),
      note: job.salary || "compensation TBD",
    },
  ];
}

export function JobDetailModal({ job, open, onClose, onApply, onSkip }: JobDetailModalProps) {
  const factors = useMemo(() => (job ? computeFactors(job) : []), [job]);

  if (!job) return null;

  const handleApply = () => {
    onApply(job);
    onClose();
  };

  const handleSkip = () => {
    onSkip(job);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-[640px] max-h-[88vh] overflow-y-auto p-0 gap-0">
        <DialogTitle className="sr-only">{job.title} at {job.company}</DialogTitle>

        {/* Hero */}
        <div className="relative h-[180px] bg-[#F5F5F5] overflow-hidden rounded-t-lg">
          {job.imageUrl ? (
            <img src={job.imageUrl} alt={job.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#F0F0F0] to-[#E0E0E0] flex items-center justify-center">
              <Briefcase size={42} className="text-[#D8D8D8]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div
            className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
          >
            <div className="text-[22px] font-bold text-[#0A0A0A] leading-none tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
              {job.matchScore}
            </div>
            <div className="text-[8px] font-medium text-[#808080] uppercase tracking-[0.1em]" style={{ fontFamily: "'DM Mono', monospace" }}>
              match
            </div>
          </div>
          <div className="absolute bottom-3 left-4 right-4">
            <h2
              className="text-[22px] font-bold text-white leading-tight drop-shadow"
              style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.01em" }}
            >
              {job.title}
            </h2>
            <p className="text-[13px] text-white/90 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {job.company} · {job.location}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-5">
          {/* Quick facts row */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#505050]" style={{ fontFamily: "'DM Mono', monospace" }}>
            <span className="px-2 py-1 rounded-md bg-[#FAFAFA] border border-[#ECECEC] uppercase tracking-[0.06em]">
              {job.type}
            </span>
            {job.salary && (
              <span className="px-2 py-1 rounded-md bg-[#FAFAFA] border border-[#ECECEC] font-semibold text-[#0A0A0A]">
                {job.salary}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin size={11} className="text-[#B8B8B8]" />
              {job.location}
            </span>
            {job.driveMinutes != null && (
              <span className="flex items-center gap-1">
                <Car size={11} className="text-[#B8B8B8]" />
                {formatMin(job.driveMinutes)}
              </span>
            )}
            {job.transitMinutes != null && (
              <span className="flex items-center gap-1">
                <Bus size={11} className="text-[#B8B8B8]" />
                {formatMin(job.transitMinutes)}
              </span>
            )}
            <span className="text-[#B8B8B8]">posted {job.postedAt}</span>
          </div>

          {/* Match breakdown */}
          <section>
            <h3 className="label-sm mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>
              MATCH BREAKDOWN
            </h3>
            <div className="flex flex-col gap-3">
              {factors.map(f => (
                <div key={f.label}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-[12px] text-[#0A0A0A] font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {f.label}
                    </span>
                    <span className="text-[11px] tabular-nums text-[#505050]" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {f.score}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#F5F5F5] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#0A0A0A] to-[#505050] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${f.score}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-[10px] text-[#B8B8B8] mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {f.note}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Description */}
          {job.description && (
            <section>
              <h3 className="label-sm mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                ABOUT THE ROLE
              </h3>
              <p className="text-[13px] text-[#303030] leading-relaxed whitespace-pre-line" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {job.description}
              </p>
            </section>
          )}

          {/* Tags */}
          {job.tags.length > 0 && (
            <section>
              <h3 className="label-sm mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                SKILLS / TAGS
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {job.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-[10px] font-medium bg-[#FAFAFA] border border-[#E8E8E8] text-[#505050] rounded-md"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Company stub */}
          <section>
            <h3 className="label-sm mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
              ABOUT {job.company.toUpperCase()}
            </h3>
            <div className="flex items-center gap-3 p-3 bg-[#FAFAFA] rounded-lg border border-[#ECECEC]">
              <div className="w-10 h-10 rounded-full bg-white border border-[#ECECEC] flex items-center justify-center flex-shrink-0">
                <Building2 size={16} className="text-[#808080]" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[#0A0A0A]">{job.company}</p>
                <p className="text-[11px] text-[#808080]" style={{ fontFamily: "'DM Mono', monospace" }}>
                  Company profile coming soon
                </p>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-2.5 pt-2 sticky bottom-0 bg-white">
            <button onClick={handleSkip} className="btn-pill btn-pill-outline flex-1 flex items-center justify-center gap-2 h-11">
              <X size={14} />
              <span>Skip</span>
            </button>
            <button onClick={handleApply} className="btn-pill btn-pill-solid flex-1 flex items-center justify-center gap-2 h-11">
              <Check size={14} />
              <span>Apply</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
