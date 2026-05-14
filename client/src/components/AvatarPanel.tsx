/*
 * ATADA — AvatarPanel (Redesigned)
 * Premium visual hierarchy with depth, shadows, and golden ratio
 * Compact, information-dense design
 */

import { motion } from "framer-motion";
import { Briefcase, ChevronRight, FileText, LogIn, Zap } from "lucide-react";
import { useLocation } from "wouter";
import type { UserProfile } from "@/lib/data";
import { useSwipeLayout } from "./SwipeLayout";

interface AvatarPanelProps {
  user: UserProfile;
  matchCount?: number;
  appliedCount?: number;
}

export function AvatarPanel({ user, matchCount = 6, appliedCount = 0 }: AvatarPanelProps) {
  const { goNext } = useSwipeLayout();
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Top: Logo + visual anchor */}
      <div className="px-5 pt-5 pb-3 border-b border-[#ECECEC]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[#0A0A0A]" />
          <span
            className="label-xs"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            ATADA
          </span>
        </div>
        <div className="h-0.5 w-8 bg-gradient-to-r from-[#0A0A0A] to-transparent rounded-full" />
      </div>

      {/* Middle: Profile section */}
      <div className="flex-1 px-5 py-5 overflow-y-auto flex flex-col gap-5">
        {/* Avatar + name */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className="flex flex-col gap-3"
        >
          {/* Avatar with depth */}
          <div className="relative">
            <div
              className="absolute inset-0 bg-[#0A0A0A] rounded-full blur-lg opacity-20"
              style={{ transform: "scale(1.15)" }}
            />
            <div
              className="relative w-14 h-14 rounded-full bg-[#0A0A0A] flex items-center justify-center border-2 border-[#ECECEC]"
              style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
            >
              <span
                className="text-white text-[16px] font-bold"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {user.initials}
              </span>
            </div>
          </div>

          {/* Name + location */}
          <div>
            <h3 className="h4 text-[#0A0A0A] mb-1">{user.name}</h3>
            <p
              className="text-[12px] text-[#808080]"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              📍 {user.location}
            </p>
          </div>
        </motion.div>

        {/* Stats grid — golden ratio proportions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.16, duration: 0.35 }}
          className="grid grid-cols-3 gap-2 p-3 bg-[#FAFAFA] rounded-lg border border-[#ECECEC]"
        >
          <div className="text-center">
            <div
              className="text-[21px] font-bold text-[#0A0A0A] tabular-nums"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {matchCount}
            </div>
            <div className="label-xs mt-1">Matches</div>
          </div>
          <div className="text-center border-l border-r border-[#D8D8D8]">
            <div
              className="text-[21px] font-bold text-[#0A0A0A] tabular-nums"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {appliedCount}
            </div>
            <div className="label-xs mt-1">Applied</div>
          </div>
          <div className="text-center">
            <div
              className="text-[21px] font-bold text-[#0A0A0A] tabular-nums"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              0
            </div>
            <div className="label-xs mt-1">Saved</div>
          </div>
        </motion.div>

        {/* Skills section — compact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.24, duration: 0.35 }}
        >
          <div className="label-xs mb-2">Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {user.skills.map(skill => (
              <span
                key={skill}
                className="px-2.5 py-1 text-[11px] font-medium bg-[#FAFAFA] border border-[#D8D8D8] text-[#505050] rounded-md hover:bg-[#F5F5F5] transition-colors"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {skill}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex flex-col gap-2">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32, duration: 0.35 }}
            onClick={goNext}
            className="atada-card-hover group w-full py-3 px-3 border border-[#D8D8D8] rounded-lg flex items-center justify-between"
          >
            <span className="text-[12px] font-medium text-[#505050] group-hover:text-[#0A0A0A] transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              View all jobs
            </span>
            <ChevronRight size={14} className="text-[#B8B8B8] group-hover:text-[#0A0A0A] transition-colors" />
          </motion.button>

          {[
            { icon: FileText, label: "My Resume", href: "/profile", delay: 0.36 },
            { icon: Briefcase, label: "Applications", href: "/applications", delay: 0.40 },
            { icon: LogIn, label: "Login / Sign up", href: "/auth", delay: 0.44 },
          ].map(({ icon: Icon, label, href, delay }) => (
            <motion.button
              key={href}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay, duration: 0.35 }}
              onClick={() => setLocation(href)}
              className="atada-card-hover group w-full py-3 px-3 border border-[#D8D8D8] rounded-lg flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Icon size={13} className="text-[#B8B8B8] group-hover:text-[#0A0A0A] transition-colors" />
                <span className="text-[12px] font-medium text-[#505050] group-hover:text-[#0A0A0A] transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {label}
                </span>
              </span>
              <ChevronRight size={14} className="text-[#B8B8B8] group-hover:text-[#0A0A0A] transition-colors" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Bottom: AI status indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.35 }}
        className="px-5 pb-5 pt-3 border-t border-[#ECECEC]"
      >
        <div className="flex items-center gap-2 py-2.5 px-3 bg-gradient-to-r from-[#F5F5F5] to-[#FAFAFA] rounded-lg border border-[#ECECEC]">
          <Zap size={12} className="text-[#505050]" />
          <span
            className="text-[11px] text-[#808080]"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            AI matching active
          </span>
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0A0A0A] animate-pulse" />
        </div>
      </motion.div>
    </div>
  );
}
