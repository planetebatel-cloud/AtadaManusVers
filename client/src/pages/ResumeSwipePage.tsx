/*
 * ATADA — Resume page inside SwipeLayout
 * Lightweight version of ProfilePage for swipe navigation.
 */

import { motion } from "framer-motion";
import { Download, FileText } from "lucide-react";
import { useRef, useState, useCallback } from "react";
import { ResumeForm } from "@/components/profile/ResumeForm";
import { ResumePreview } from "@/components/profile/ResumePreview";
import { generateResumePDF } from "@/components/profile/ResumeDownload";
import { useResumeState } from "@/hooks/useResumeState";
import { useSwipeLayout } from "@/components/SwipeLayout";
import { toast } from "sonner";

export function ResumeSwipePage() {
  const { goPrev, goNext } = useSwipeLayout();
  const resume = useResumeState();
  const previewRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await generateResumePDF(resume.data);
      toast.success("Resume downloaded!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error(`PDF failed: ${String((err as Error)?.message || err).slice(0, 100)}`);
    }
    setDownloading(false);
  }, [downloading, resume.data]);

  return (
    <div className="w-full h-full bg-[#F7F7F7] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#ECECEC] flex-shrink-0">
        <button onClick={goPrev} className="text-[11px] font-medium text-[#505050] border border-[#D8D8D8] px-2.5 py-1.5 rounded-lg hover:border-[#0A0A0A] transition-colors" style={{ fontFamily: "'DM Mono', monospace" }}>
          ← Feed
        </button>
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-[#808080]" />
          <span className="label-sm" style={{ fontFamily: "'DM Mono', monospace" }}>My Resume</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} disabled={downloading} className="btn-pill btn-pill-solid !py-1.5 !px-3 text-[11px] gap-1">
            <Download size={12} />
            {downloading ? "..." : "PDF"}
          </button>
          <button onClick={goNext} className="text-[11px] font-medium text-[#505050] border border-[#D8D8D8] px-2.5 py-1.5 rounded-lg hover:border-[#0A0A0A] transition-colors" style={{ fontFamily: "'DM Mono', monospace" }}>
            Apps →
          </button>
        </div>
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <div className="w-[42%] overflow-y-auto p-4">
          <ResumeForm data={resume.data} updateField={resume.updateField} addSkill={resume.addSkill} removeSkill={resume.removeSkill} addExperience={resume.addExperience} updateExperience={resume.updateExperience} removeExperience={resume.removeExperience} addEducation={resume.addEducation} updateEducation={resume.updateEducation} removeEducation={resume.removeEducation} updateContact={resume.updateContact} />
        </div>
        <div className="w-[58%] overflow-y-auto p-4 flex justify-center">
          <div style={{ transform: "scale(0.55)", transformOrigin: "top left", width: 794 }}>
            <div className="shadow-xl rounded-sm border border-[#ECECEC]" style={{ overflow: "hidden" }}>
              <ResumePreview ref={previewRef} data={resume.data} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: tabs */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden">
        <div className="flex bg-white border-b border-[#ECECEC]">
          <button onClick={() => setTab("edit")} className={`flex-1 py-2.5 text-[12px] font-medium transition-colors ${tab === "edit" ? "text-[#0A0A0A] border-b-2 border-[#0A0A0A]" : "text-[#808080]"}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Edit</button>
          <button onClick={() => setTab("preview")} className={`flex-1 py-2.5 text-[12px] font-medium transition-colors ${tab === "preview" ? "text-[#0A0A0A] border-b-2 border-[#0A0A0A]" : "text-[#808080]"}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Preview</button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {tab === "edit" ? (
            <ResumeForm data={resume.data} updateField={resume.updateField} addSkill={resume.addSkill} removeSkill={resume.removeSkill} addExperience={resume.addExperience} updateExperience={resume.updateExperience} removeExperience={resume.removeExperience} addEducation={resume.addEducation} updateEducation={resume.updateEducation} removeEducation={resume.removeEducation} updateContact={resume.updateContact} />
          ) : (
            <div style={{ transform: "scale(0.45)", transformOrigin: "top left", width: 794 }}>
              <div className="shadow-xl rounded-sm border border-[#ECECEC]" style={{ overflow: "hidden" }}>
                <ResumePreview ref={previewRef} data={resume.data} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
