"use client";

import { Bell, Search, CalendarDays, ChevronDown, User, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { LogoutModal } from "./LogoutModal";

const DATE_OPTIONS = ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "This Month"];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState("Today");
  const [dateOpen, setDateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const dateRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDateOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const showSearch = pathname === "/inventory" || pathname === "/team" || pathname === "/team/add";

  const getSearchPlaceholder = () => {
    if (pathname === "/inventory") return "Search products by name, SKU or category...";
    if (pathname === "/team" || pathname === "/team/add") return "Search team members by name, role or email...";
    return "Search...";
  };

  return (
    <>
      <header className="h-[68px] bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
        {/* Left: search bar */}
        <div className="flex-1 flex items-center">
          {showSearch && (
            <div className="w-full max-w-lg relative">
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
        <div className="flex items-center gap-3">

          {/* ── Date selector (dashboard only) ── */}
          {pathname === "/dashboard" && (
            <div ref={dateRef} className="relative">
              <button
                onClick={() => setDateOpen(!dateOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors text-sm font-semibold select-none"
                style={{ color: "#102452" }}
              >
                <CalendarDays size={15} className="text-gray-500" />
                <span>{selectedDate}</span>
                <ChevronDown
                  size={13}
                  className={`text-gray-500 transition-transform duration-200 ${dateOpen ? "rotate-180" : ""}`}
                />
              </button>

              {dateOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-gray-100 shadow-xl z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {DATE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setSelectedDate(opt); setDateOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        selectedDate === opt
                          ? "font-semibold text-white"
                          : "text-gray-700 hover:bg-gray-50 font-medium"
                      }`}
                      style={selectedDate === opt ? { backgroundColor: "#0B2A63" } : {}}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Bell ── */}
          <button
            className="relative p-2 rounded-full hover:bg-gray-50 transition-colors"
            style={{ color: "#0B2A63" }}
          >
            <Bell size={21} />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white"
              style={{ backgroundColor: "#E31B23" }}
            />
          </button>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-200" />

          {/* ── Avatar + user info (dropdown) ── */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity select-none"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none mb-0.5" style={{ color: "#102452" }}>Admin</p>
                <p className="text-xs text-gray-500 leading-none">Super Admin</p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border border-gray-200 shrink-0"
                style={{ backgroundColor: "#E8EEF8", color: "#0B2A63" }}
              >
                A
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-gray-100 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-base border border-gray-200 shrink-0"
                      style={{ backgroundColor: "#E8EEF8", color: "#0B2A63" }}
                    >
                      A
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#102452" }}>Admin</p>
                      <p className="text-xs text-gray-400">admin@kmart.com</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => { setProfileOpen(false); router.push("/profile"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    <User size={16} className="text-gray-400" />
                    My Profile
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); setShowLogout(true); }}
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
