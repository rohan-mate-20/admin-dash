"use client";

import { Bell, Search, User, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { LogoutModal } from "./LogoutModal";
import { useAuth } from "@/lib/AuthContext";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isSuperAdmin } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const showSearch =
    pathname === "/inventory" ||
    pathname === "/team" ||
    pathname === "/team/add" ||
    pathname === "/orders" ||
    pathname === "/customers" ||
    pathname === "/reports";

  const getSearchPlaceholder = () => {
    if (pathname === "/inventory") return "Search products by name, SKU or category...";
    if (pathname === "/team" || pathname === "/team/add") return "Search team members by name, role or email...";
    if (pathname === "/orders") return "Search orders by ID, customer name or amount...";
    if (pathname === "/customers") return "Search customers by name, email, phone or ID...";
    if (pathname === "/reports") return "Search across orders, products, inventory, customers...";
    return "Search...";
  };

  const avatarLetter = currentUser?.name
    ? currentUser.name.charAt(0).toUpperCase()
    : "A";

  const roleDisplay = isSuperAdmin ? "Super Admin" : "Admin";

  return (
    <>
      <header className="h-[68px] bg-white border-b border-gray-100 flex items-center justify-between pl-16 pr-4 sm:px-6 lg:px-6 sticky top-0 z-30 gap-2 sm:gap-3">
        {/* Left: search bar */}
        <div className="flex-1 min-w-0 flex items-center">
          {showSearch && (
            <div className="w-full min-w-0 max-w-lg relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:border-navy focus:border-transparent text-sm transition-all"
              />
            </div>
          )}
        </div>

        {/* Right controls */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          {/* Role badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm"
            style={
              isSuperAdmin
                ? { backgroundColor: "#FEF2F2", color: "#DC2626", borderColor: "#FECACA" }
                : { backgroundColor: "#EFF6FF", color: "#2563EB", borderColor: "#BFDBFE" }
            }
          >
            <span>{roleDisplay}</span>
          </div>

          {/* Bell */}
          <button
            className="relative p-2 rounded-full hover:bg-gray-50 transition-colors"
            style={{ color: "#0B2A63" }}
            aria-label="Notifications"
          >
            <Bell size={21} />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white"
              style={{ backgroundColor: "#E31B23" }}
            />
          </button>

          {/* Divider */}
          <div className="hidden sm:block h-8 w-px bg-gray-200" />

          {/* Avatar + user info (dropdown) */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 hover:opacity-85 transition-opacity select-none"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none mb-0.5" style={{ color: "#102452" }}>
                  {currentUser?.name || "Admin"}
                </p>
                <p className="text-xs text-gray-500 leading-none">
                  {roleDisplay}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border border-gray-200 shrink-0"
                style={{ backgroundColor: "#E8EEF8", color: "#0B2A63" }}
              >
                {avatarLetter}
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User info header */}
                <div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border border-gray-200 shrink-0"
                      style={{ backgroundColor: "#E8EEF8", color: "#0B2A63" }}
                    >
                      {avatarLetter}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "#102452" }}>
                        {currentUser?.name || "Admin"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {currentUser?.email || ""}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-navy/10 text-navy">
                        {roleDisplay}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/profile");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    <User size={16} className="text-gray-400" />
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setShowLogout(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                    style={{ color: "#E31B23" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FFF0F0")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <LogOut size={16} style={{ color: "#E31B23" }} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <LogoutModal isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </>
  );
}
