import { ArrowLeft, Download } from "lucide-react";
import { useLocation } from "wouter";

interface ProfileHeaderProps {
  onDownload: () => void;
  downloading: boolean;
}

export function ProfileHeader({ onDownload, downloading }: ProfileHeaderProps) {
  const [, setLocation] = useLocation();

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#ECECEC]">
      <button
        onClick={() => setLocation("/")}
        className="flex items-center gap-2 text-[#505050] hover:text-[#0A0A0A] transition-colors"
      >
        <ArrowLeft size={18} />
        <span
          className="text-[13px] font-medium hidden sm:inline"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Back
        </span>
      </button>

      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]" />
        <span
          className="label-xs"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          ATADA
        </span>
      </div>

      <button
        onClick={onDownload}
        disabled={downloading}
        className="btn-pill btn-pill-solid gap-1.5 !py-2 !px-4 text-[12px]"
      >
        <Download size={14} />
        {downloading ? "Saving..." : "Download PDF"}
      </button>
    </header>
  );
}
