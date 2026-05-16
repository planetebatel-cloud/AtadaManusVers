/*
 * ATADA — JobCard (Redesigned with Hero Image)
 * Premium depth, shadows, visual hierarchy
 * Compact information-dense design with category images
 */

import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { Check, Clock, MapPin, X, Briefcase, Car, Bus, Bookmark } from "lucide-react";
import { useState } from "react";
import type { Job } from "@/lib/data";

interface JobCardProps {
  job: Job;
  onApply: (job: Job) => void;
  onSkip: (job: Job) => void;
  onDetails?: (job: Job) => void;
  onSaveToggle?: (job: Job, saved: boolean) => void;
  initialSaved?: boolean;
  isActive?: boolean;
}

function formatMin(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

export function JobCard({ job, onApply, onSkip, onDetails, onSaveToggle, initialSaved = false, isActive = true }: JobCardProps) {
  const [exiting, setExiting] = useState<"apply" | "skip" | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [saved, setSaved] = useState(initialSaved);

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSaveToggle) return;
    const next = !saved;
    setSaved(next);
    onSaveToggle(job, next);
  };

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const applyOpacity = useTransform(x, [30, 120], [0, 1]);
  const skipOpacity = useTransform(x, [-120, -30], [1, 0]);
  const cardOpacity = useTransform(x, [-250, -180, 0, 180, 250], [0, 1, 1, 1, 0]);

  const handleApply = () => {
    if (exiting) return;
    setExiting("apply");
    setTimeout(() => onApply(job), 280);
  };

  const handleSkip = () => {
    if (exiting) return;
    setExiting("skip");
    setTimeout(() => onSkip(job), 280);
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 100;
    const velocityThreshold = 500;
    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      handleApply();
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      handleSkip();
    }
  };

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{
            opacity: 0,
            x: exiting === "apply" ? 220 : -220,
            rotate: exiting === "apply" ? 18 : -18,
            transition: { duration: 0.22, ease: "easeIn" },
          }}
          transition={{ duration: 0.28, type: "spring", stiffness: 320, damping: 30 }}
          className="relative w-full"
          style={{ x, rotate, opacity: cardOpacity }}
          drag={isActive ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.015 }}
        >
          {/* Apply label */}
          <motion.div
            className="absolute top-5 left-5 z-10 px-2.5 py-1 border-2 border-white rounded-md pointer-events-none bg-[#0A0A0A]/60 backdrop-blur-sm"
            style={{ opacity: applyOpacity }}
          >
            <span className="text-[10px] font-bold text-white tracking-[0.15em] uppercase" style={{ fontFamily: "'DM Mono', monospace" }}>
              Apply
            </span>
          </motion.div>

          {/* Skip label */}
          <motion.div
            className="absolute top-5 right-5 z-10 px-2.5 py-1 border-2 border-white/60 rounded-md pointer-events-none bg-black/40 backdrop-blur-sm"
            style={{ opacity: skipOpacity }}
          >
            <span className="text-[10px] font-bold text-white/80 tracking-[0.15em] uppercase" style={{ fontFamily: "'DM Mono', monospace" }}>
              Skip
            </span>
          </motion.div>

          {/* Card */}
          <div
            className={`w-full bg-white rounded-xl border border-[#ECECEC] overflow-hidden ${onDetails ? "cursor-pointer" : ""}`}
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)" }}
            onClick={(e) => {
              // Only open details if the user clicked the card body, not a
              // button. Buttons inside the card stop propagation below.
              if (onDetails && !(e.target as HTMLElement).closest("button")) {
                onDetails(job);
              }
            }}
          >
            {/* Hero image */}
            <div className="relative h-[160px] bg-[#F5F5F5] overflow-hidden">
              {job.imageUrl ? (
                <img
                  src={job.imageUrl}
                  alt={job.title}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                  onLoad={() => setImgLoaded(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#F0F0F0] to-[#E0E0E0] flex items-center justify-center">
                  <Briefcase size={32} className="text-[#D8D8D8]" />
                </div>
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

              {/* Match badge on image */}
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <div className="text-[20px] font-bold text-[#0A0A0A] leading-none tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {job.matchScore}
                </div>
                <div className="text-[8px] font-medium text-[#808080] uppercase tracking-[0.1em]" style={{ fontFamily: "'DM Mono', monospace" }}>
                  match
                </div>
              </div>

              {/* Job type badge */}
              <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm">
                <span className="text-[9px] font-medium text-[#505050] uppercase tracking-[0.08em]" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {job.type}
                </span>
              </div>

              {/* Save (bookmark) button */}
              {onSaveToggle && (
                <button
                  type="button"
                  onClick={handleSaveToggle}
                  title={saved ? "Remove from saved" : "Save for later"}
                  className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                  style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }}
                >
                  <Bookmark
                    size={14}
                    className={saved ? "text-[#0A0A0A] fill-[#0A0A0A]" : "text-[#505050]"}
                  />
                </button>
              )}
            </div>

            {/* Match score bar */}
            <div className="h-1 bg-[#F5F5F5]">
              <div
                className="h-full bg-gradient-to-r from-[#0A0A0A] to-[#505050] rounded-r-full"
                style={{ width: `${job.matchScore}%` }}
              />
            </div>

            <div className="p-4">
              {/* Title + Company */}
              <div className="mb-3">
                <h3 className="text-[18px] font-bold text-[#0A0A0A] leading-tight" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.01em" }}>
                  {job.title}
                </h3>
                <p className="text-[13px] text-[#808080] mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {job.company}
                </p>
              </div>

              {/* Meta grid */}
              <div className="flex items-center gap-4 mb-2 py-2 px-3 bg-[#FAFAFA] rounded-lg">
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-[#B8B8B8] flex-shrink-0" />
                  <span className="text-[11px] text-[#505050]" style={{ fontFamily: "'DM Mono', monospace" }}>{job.location}</span>
                </div>
                {!job.driveMinutes && !job.transitMinutes && job.travelTime && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-[#B8B8B8] flex-shrink-0" />
                    <span className="text-[11px] text-[#505050]" style={{ fontFamily: "'DM Mono', monospace" }}>{job.travelTime}</span>
                  </div>
                )}
                <div className="ml-auto">
                  <span className="text-[12px] font-bold text-[#0A0A0A]" style={{ fontFamily: "'DM Mono', monospace" }}>{job.salary}</span>
                </div>
              </div>

              {/* Commute (drive + transit) */}
              {(job.driveMinutes || job.transitMinutes) && (
                <div className="flex items-center gap-3 mb-3 px-3 py-1.5 bg-[#FAFAFA] rounded-md">
                  {job.driveMinutes != null && (
                    <div className="flex items-center gap-1.5" title="Driving time">
                      <Car size={12} className="text-[#505050] flex-shrink-0" />
                      <span className="text-[11px] font-medium text-[#0A0A0A]" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {formatMin(job.driveMinutes)}
                      </span>
                    </div>
                  )}
                  {job.transitMinutes != null && (
                    <div className="flex items-center gap-1.5" title="Public transit time">
                      <Bus size={12} className="text-[#505050] flex-shrink-0" />
                      <span className="text-[11px] font-medium text-[#0A0A0A]" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {formatMin(job.transitMinutes)}
                      </span>
                    </div>
                  )}
                  {job.distanceKm != null && (
                    <span className="text-[10px] text-[#B8B8B8] ml-auto" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {job.distanceKm} km
                    </span>
                  )}
                </div>
              )}

              {/* Reachability */}
              {job.distance && (
                <div className="flex items-center gap-1.5 mb-3 px-3 py-1.5 bg-[#FAFAFA] rounded-md">
                  <div className={`w-2 h-2 rounded-full ${job.reachable ? "bg-[#0A0A0A]" : "bg-[#D8D8D8]"}`} />
                  <span className={`text-[10px] font-medium ${job.reachable ? "text-[#0A0A0A]" : "text-[#B8B8B8]"}`} style={{ fontFamily: "'DM Mono', monospace" }}>
                    {job.reachable ? "Reachable" : "Out of range"}
                  </span>
                  <span className="text-[10px] text-[#B8B8B8] ml-auto" style={{ fontFamily: "'DM Mono', monospace" }}>{job.distance}</span>
                </div>
              )}

              {/* Description */}
              <p className="text-[12px] text-[#505050] leading-relaxed mb-3 line-clamp-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {job.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {job.tags.slice(0, 4).map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-[9px] font-medium bg-[#FAFAFA] border border-[#E8E8E8] text-[#505050] rounded-md"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {tag}
                  </span>
                ))}
                {job.tags.length > 4 && (
                  <span className="px-2 py-0.5 text-[9px] text-[#B8B8B8]" style={{ fontFamily: "'DM Mono', monospace" }}>
                    +{job.tags.length - 4}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2.5">
                <button onClick={handleSkip} className="btn-pill btn-pill-outline flex-1 flex items-center justify-center gap-2 h-10">
                  <X size={13} />
                  <span>Skip</span>
                </button>
                <button onClick={handleApply} className="btn-pill btn-pill-solid flex-1 flex items-center justify-center gap-2 h-10">
                  <Check size={13} />
                  <span>Apply</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── JobCardStack ─────────────────────────────────────────────────────────────

interface JobCardStackProps {
  jobs: Job[];
  onApply: (job: Job) => void;
  onSkip: (job: Job) => void;
  onDetails?: (job: Job) => void;
  onSaveToggle?: (job: Job, saved: boolean) => void;
  savedJobIds?: Set<string>;
}

export function JobCardStack({ jobs, onApply, onSkip, onDetails, onSaveToggle, savedJobIds }: JobCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleApply = (job: Job) => {
    onApply(job);
    setTimeout(() => setCurrentIndex(i => i + 1), 320);
  };

  const handleSkip = (job: Job) => {
    onSkip(job);
    setTimeout(() => setCurrentIndex(i => i + 1), 320);
  };

  const currentJob = jobs[currentIndex];

  if (!currentJob) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-[#ECECEC] flex items-center justify-center mb-4" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <Check size={18} className="text-[#B8B8B8]" />
        </div>
        <p className="text-[16px] font-semibold text-[#0A0A0A]" style={{ fontFamily: "'DM Sans', sans-serif" }}>All caught up</p>
        <p className="text-[12px] text-[#B8B8B8] mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>{jobs.length} jobs reviewed</p>
      </motion.div>
    );
  }

  return (
    <div className="relative w-full pb-2">
      {/* Stack shadow cards */}
      {jobs[currentIndex + 2] && (
        <div className="absolute inset-x-0 bg-white rounded-xl border border-[#ECECEC]"
          style={{ top: 12, bottom: -12, transform: "scale(0.93)", zIndex: 0, opacity: 0.3, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }} />
      )}
      {jobs[currentIndex + 1] && (
        <div className="absolute inset-x-0 bg-white rounded-xl border border-[#ECECEC]"
          style={{ top: 6, bottom: -6, transform: "scale(0.965)", zIndex: 1, opacity: 0.5, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }} />
      )}

      <div className="relative z-10">
        <JobCard
          key={currentJob.id}
          job={currentJob}
          onApply={handleApply}
          onSkip={handleSkip}
          onDetails={onDetails}
          onSaveToggle={onSaveToggle}
          initialSaved={savedJobIds?.has(currentJob.id) || false}
          isActive
        />
      </div>

      <div className="flex justify-center mt-4">
        <span className="text-[11px] font-medium text-[#B8B8B8]" style={{ fontFamily: "'DM Mono', monospace" }}>
          {currentIndex + 1} / {jobs.length}
        </span>
      </div>
    </div>
  );
}
