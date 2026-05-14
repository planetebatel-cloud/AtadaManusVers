/*
 * ATADA — Home Address card
 * Saves the user's home address to the backend so that job cards can show
 * driving / transit time. On save the backend geocodes the address and
 * returns lat/lng, which we display inline as a confirmation.
 */

import { motion } from "framer-motion";
import { MapPin, Loader2, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getMe, updateProfile, isAuthenticated } from "@/lib/api";

type SaveState = "idle" | "saving" | "saved";

export function HomeAddressCard() {
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoaded(true);
      return;
    }
    getMe()
      .then((u) => {
        setAddress(u.location || "");
        setLat(u.lat ?? null);
        setLng(u.lng ?? null);
      })
      .catch(() => {
        // silent — user will just see an empty field
      })
      .finally(() => setLoaded(true));
  }, []);

  const handleSave = async () => {
    if (!isAuthenticated()) {
      toast.error("Sign in first to save your address");
      return;
    }
    const trimmed = address.trim();
    if (!trimmed) {
      toast.error("Enter an address");
      return;
    }
    setSaveState("saving");
    try {
      const updated = await updateProfile({ location: trimmed });
      setLat(updated.lat ?? null);
      setLng(updated.lng ?? null);
      setSaveState("saved");
      if (updated.lat && updated.lng) {
        toast.success("Address saved — commute times will update");
      } else {
        toast.warning("Saved, but couldn't locate it on the map");
      }
      setTimeout(() => setSaveState("idle"), 1800);
    } catch (e) {
      setSaveState("idle");
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="atada-card p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="label-xs">Home Address</div>
        {lat != null && lng != null && (
          <span
            className="text-[10px] text-[#505050] flex items-center gap-1"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <MapPin size={10} className="text-[#0A0A0A]" />
            {lat.toFixed(3)}, {lng.toFixed(3)}
          </span>
        )}
      </div>
      <p
        className="text-[11px] text-[#808080] mb-3 leading-relaxed"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        Used to estimate driving and public-transit time for each job.
      </p>
      <div className="flex gap-2">
        <input
          className="atada-input flex-1"
          placeholder={loaded ? "e.g. Rothschild Blvd 50, Tel Aviv" : "Loading..."}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSave())}
          disabled={!loaded || saveState === "saving"}
        />
        <button
          onClick={handleSave}
          disabled={saveState === "saving" || !loaded}
          className="btn-pill btn-pill-solid !py-2 !px-4 min-w-[84px] flex items-center justify-center gap-1.5"
        >
          {saveState === "saving" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saveState === "saved" ? (
            <>
              <Check size={13} />
              <span>Saved</span>
            </>
          ) : (
            <span>Save</span>
          )}
        </button>
      </div>
    </motion.div>
  );
}
