/*
 * ATADA — Demo Banner
 * Sticky top strip shown on all routes (except /auth) while the visitor
 * is not authenticated. Explains this is a live demo and links to the
 * one-click login. Closable; preference persisted in localStorage.
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Sparkles, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "atada_demo_banner_dismissed";

export default function DemoBanner() {
  const { authenticated, loading } = useAuth();
  const [location] = useLocation();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "1",
  );

  if (loading || authenticated || dismissed) return null;
  if (location.startsWith("/auth")) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div
      className="fixed top-0 inset-x-0 z-50 bg-[#0A0A0A] text-white"
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      <div className="max-w-[1400px] mx-auto px-4 h-9 flex items-center justify-between gap-3 text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={12} className="shrink-0" />
          <span className="hidden md:inline truncate">
            ATADA · Live demo · No phone required · One-click access to worker and employer flows
          </span>
          <span className="md:hidden truncate">
            ATADA · Live demo · Try worker / employer
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/auth"
            className="px-3 h-6 inline-flex items-center rounded-full bg-white text-[#0A0A0A] hover:bg-[#F0F0F0] transition"
          >
            Try demo
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="opacity-70 hover:opacity-100 transition"
            aria-label="Dismiss demo banner"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
