/*
 * ATADA — Global Header
 * Sits above every route (except /auth) with:
 * - Logo (links to /)
 * - 5 nav items (Feed · Saved · Applications · Profile · Employer · Pricing) on md+
 * - Auth state on the right: "Log in" button OR avatar dropdown with Logout
 * - Mobile (<md): hamburger menu that opens a vertical sheet with the same items
 */

import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type NavItem = { href: string; label: string; gated?: "worker" | "employer" };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Feed" },
  { href: "/applications", label: "Applications", gated: "worker" },
  { href: "/employer", label: "Employer" },
  { href: "/pricing", label: "Pricing" },
  { href: "/profile", label: "Profile", gated: "worker" },
];

function initials(name?: string | null, phone?: string | null) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "A";
  }
  if (phone) return phone.slice(-2);
  return "A";
}

const API_BASE = import.meta.env.VITE_API_URL || "/api";
function resolveAvatar(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE.replace(/\/api\/?$/, "")}${url}`;
}

export default function Header() {
  const { user, authenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Hide on /auth — full-screen login takes over
  if (location.startsWith("/auth")) return null;

  // Click-outside for avatar dropdown
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Close drawer on navigation
  useEffect(() => { setDrawerOpen(false); }, [location]);

  const visibleNav = NAV_ITEMS.filter(item => {
    if (!item.gated) return true;
    if (!authenticated) return false;
    return item.gated === user?.role || (item.gated === "worker" && (user?.role === "worker" || !user?.role));
  });

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setLocation("/");
  };

  return (
    <header
      className="sticky top-9 inset-x-0 z-40 bg-white/95 backdrop-blur border-b border-[#ECECEC]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="max-w-[1400px] mx-auto px-4 h-12 flex items-center justify-between gap-4">
        {/* Left: logo + mobile hamburger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(d => !d)}
            className="md:hidden p-1 -ml-1 text-[#505050] hover:text-[#0A0A0A] transition-colors"
            aria-label="Open menu"
          >
            {drawerOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <Link
            href="/"
            className="flex items-center gap-2"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]" />
            <span className="text-[13px] font-medium tracking-[0.08em] uppercase text-[#0A0A0A]">
              ATADA
            </span>
          </Link>
        </div>

        {/* Center: desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {visibleNav.map(item => {
            const active = location === item.href || (item.href === "/" && location === "");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 h-8 inline-flex items-center rounded-full text-[12px] transition-colors ${
                  active
                    ? "bg-[#0A0A0A] text-white"
                    : "text-[#505050] hover:text-[#0A0A0A] hover:bg-[#F5F5F5]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: auth */}
        <div className="flex items-center gap-2">
          {!authenticated ? (
            <Link
              href="/auth"
              className="px-3 h-8 inline-flex items-center rounded-full bg-[#0A0A0A] text-white text-[12px] hover:bg-[#222] transition-colors"
            >
              Log in
            </Link>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(o => !o)}
                className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white text-[11px] font-semibold flex items-center justify-center hover:opacity-90 transition overflow-hidden"
                style={{ fontFamily: "'DM Mono', monospace" }}
                aria-label="Account menu"
                title={user?.name || user?.phone || "Account"}
              >
                {(() => {
                  const av = resolveAvatar(user?.avatar_url);
                  return av
                    ? <img src={av} alt="" className="w-full h-full object-cover" />
                    : initials(user?.name, user?.phone);
                })()}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 w-44 bg-white border border-[#ECECEC] rounded-lg shadow-lg overflow-hidden">
                  <div className="px-3 py-2 border-b border-[#F0F0F0]">
                    <p className="text-[12px] font-medium text-[#0A0A0A] truncate">
                      {user?.name || "Account"}
                    </p>
                    <p className="text-[10px] text-[#808080] truncate" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {user?.role || "worker"} · {user?.plan || "free"}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-[12px] text-[#0A0A0A] hover:bg-[#F5F5F5] transition-colors"
                  >
                    <UserIcon size={13} />
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#C44] hover:bg-[#FAFAFA] transition-colors text-left"
                  >
                    <LogOut size={13} />
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden border-t border-[#ECECEC] bg-white">
          <nav className="flex flex-col py-1">
            {visibleNav.map(item => {
              const active = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2.5 text-[13px] transition-colors ${
                    active
                      ? "bg-[#F5F5F5] text-[#0A0A0A] font-medium"
                      : "text-[#505050] hover:bg-[#FAFAFA]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
