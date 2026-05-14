/*
 * ATADA — JobFeed (Redesigned with Thumbnails)
 * Compact list with image thumbnails
 */

import { motion } from "framer-motion";
import { Check, Clock, MapPin, MoreHorizontal, Briefcase } from "lucide-react";
import { useState } from "react";
import type { Job } from "@/lib/data";
import { toast } from "sonner";

interface JobFeedProps {
  jobs: Job[];
  className?: string;
}

export function JobFeed({ jobs, className = "" }: JobFeedProps) {
  const [appliedSet, setAppliedSet] = useState<Set<string>>(new Set());

  const handleApply = (job: Job) => {
    setAppliedSet(prev => new Set(prev).add(job.id));
    toast(`Applied to ${job.title}`, {
      description: `${job.company} · ${job.location}`,
    });
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#ECECEC] flex items-center justify-between flex-shrink-0">
        <span className="label-sm" style={{ fontFamily: "'DM Mono', monospace" }}>Job Feed</span>
        <span className="text-[11px] text-[#B8B8B8]" style={{ fontFamily: "'DM Mono', monospace" }}>
          {jobs.length} jobs
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {jobs.map((job, index) => (
          <JobFeedItem
            key={job.id}
            job={job}
            index={index}
            onApply={handleApply}
            applied={appliedSet.has(job.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface JobFeedItemProps {
  job: Job;
  index: number;
  onApply: (job: Job) => void;
  applied?: boolean;
}

function JobFeedItem({ job, index, onApply, applied = false }: JobFeedItemProps) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03 }}
      className="px-4 py-3 border-b border-[#F5F5F5] hover:bg-[#FAFAFA] transition-colors"
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-[56px] h-[56px] rounded-lg overflow-hidden bg-[#F5F5F5] flex-shrink-0">
          {job.imageUrl ? (
            <img
              src={job.imageUrl}
              alt={job.title}
              className={`w-full h-full object-cover transition-opacity duration-200 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImgLoaded(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F0F0F0] to-[#E8E8E8]">
              <Briefcase size={18} className="text-[#D8D8D8]" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-[14px] font-semibold text-[#0A0A0A] truncate leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {job.title}
              </h4>
              <p className="text-[12px] text-[#808080] truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {job.company}
              </p>
            </div>
            <span className="text-[14px] font-bold text-[#0A0A0A] tabular-nums flex-shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>
              {job.matchScore}%
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1">
              <MapPin size={10} className="text-[#B8B8B8]" />
              <span className="text-[10px] text-[#808080]" style={{ fontFamily: "'DM Mono', monospace" }}>{job.location}</span>
            </div>
            {job.travelTime && (
              <div className="flex items-center gap-1">
                <Clock size={10} className="text-[#B8B8B8]" />
                <span className="text-[10px] text-[#808080]" style={{ fontFamily: "'DM Mono', monospace" }}>{job.travelTime}</span>
              </div>
            )}
            {job.salary && (
              <span className="text-[10px] font-bold text-[#0A0A0A] ml-auto" style={{ fontFamily: "'DM Mono', monospace" }}>{job.salary}</span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => !applied && onApply(job)}
              disabled={applied}
              className={`text-[10px] font-medium px-3 py-1 rounded-full transition-colors ${
                applied ? "bg-[#0A0A0A] text-white" : "bg-[#F5F5F5] text-[#505050] hover:bg-[#0A0A0A] hover:text-white"
              }`}
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {applied ? <span className="flex items-center gap-1"><Check size={10} /> Applied</span> : "Apply"}
            </button>
            <div className="flex gap-1 ml-1">
              {job.tags.slice(0, 2).map(tag => (
                <span key={tag} className="px-1.5 py-0.5 text-[8px] bg-[#F5F5F5] border border-[#ECECEC] text-[#808080] rounded" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
