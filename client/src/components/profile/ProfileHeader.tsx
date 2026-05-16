import { Download } from "lucide-react";

interface ProfileHeaderProps {
  onDownload: () => void;
  downloading: boolean;
}

// Page-local header for /profile — only carries the page-specific action
// (Download PDF). Global navigation lives in <Header /> above.
export function ProfileHeader({ onDownload, downloading }: ProfileHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#ECECEC]">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]" />
        <span className="label-xs" style={{ fontFamily: "'DM Mono', monospace" }}>
          MY RESUME
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
