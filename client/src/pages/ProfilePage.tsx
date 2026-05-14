import { motion } from "framer-motion";
import { useRef, useState, useCallback } from "react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ResumeForm } from "@/components/profile/ResumeForm";
import { ResumePreview } from "@/components/profile/ResumePreview";
import { generateResumePDF } from "@/components/profile/ResumeDownload";
import { HomeAddressCard } from "@/components/profile/HomeAddressCard";
import { useResumeState } from "@/hooks/useResumeState";
import { toast } from "sonner";

export default function ProfilePage() {
  const resume = useResumeState();
  const previewRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const handleDownload = useCallback(async () => {
    if (!previewRef.current || downloading) return;
    setDownloading(true);
    try {
      await generateResumePDF(previewRef.current);
      toast.success("Resume downloaded!");
    } catch {
      toast.error("Failed to generate PDF. Try again.");
    } finally {
      setDownloading(false);
    }
  }, [downloading]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-screen bg-[#F7F7F7]"
    >
      <ProfileHeader onDownload={handleDownload} downloading={downloading} />

      {/* Desktop layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <div className="w-[42%] overflow-y-auto p-6 flex flex-col gap-4">
          <HomeAddressCard />
          <ResumeForm
            data={resume.data}
            updateField={resume.updateField}
            addSkill={resume.addSkill}
            removeSkill={resume.removeSkill}
            addExperience={resume.addExperience}
            updateExperience={resume.updateExperience}
            removeExperience={resume.removeExperience}
            addEducation={resume.addEducation}
            updateEducation={resume.updateEducation}
            removeEducation={resume.removeEducation}
            updateContact={resume.updateContact}
          />
        </div>
        <div className="w-[58%] overflow-y-auto p-6 flex justify-center">
          <div className="sticky top-0">
            <PreviewScaler>
              <ResumePreview ref={previewRef} data={resume.data} />
            </PreviewScaler>
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden">
        {/* Tab switcher */}
        <div className="flex bg-white border-b border-[#ECECEC]">
          <TabButton active={activeTab === "edit"} onClick={() => setActiveTab("edit")}>
            Edit
          </TabButton>
          <TabButton active={activeTab === "preview"} onClick={() => setActiveTab("preview")}>
            Preview
          </TabButton>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "edit" ? (
            <div className="flex flex-col gap-4">
              <HomeAddressCard />
              <ResumeForm
              data={resume.data}
              updateField={resume.updateField}
              addSkill={resume.addSkill}
              removeSkill={resume.removeSkill}
              addExperience={resume.addExperience}
              updateExperience={resume.updateExperience}
              removeExperience={resume.removeExperience}
              addEducation={resume.addEducation}
              updateEducation={resume.updateEducation}
              removeEducation={resume.removeEducation}
              updateContact={resume.updateContact}
            />
            </div>
          ) : (
            <div className="flex justify-center">
              <PreviewScaler>
                <ResumePreview ref={previewRef} data={resume.data} />
              </PreviewScaler>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function PreviewScaler({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(0.55);

  const measuredRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const newScale = Math.min(width / 794, 0.75);
        setScale(newScale);
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const scaledHeight = 1123 * scale;

  return (
    <div ref={measuredRef} className="w-full" style={{ height: scaledHeight }}>
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: 794,
        }}
      >
        <div
          className="shadow-xl rounded-sm border border-[#ECECEC]"
          style={{ overflow: "hidden" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-[13px] font-medium transition-colors ${
        active
          ? "text-[#0A0A0A] border-b-2 border-[#0A0A0A]"
          : "text-[#808080] hover:text-[#505050]"
      }`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {children}
    </button>
  );
}
