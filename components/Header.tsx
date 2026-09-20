"use client";

import { Bell, Search, CalendarDays, ChevronDown, User, LogOut, ShieldCheck, ShieldAlert, ArrowLeftRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { LogoutModal } from "./LogoutModal";
import { useAuth } from "@/lib/AuthContext";

const DATE_OPTIONS = ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "This Month"];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, role, isSuperAdmin, setRole } = useAuth();

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

  const showSearch =
    pathname === "/inventory" ||
    pathname === "/team" ||
    pathname === "/team/add" ||
    pathname === "/orders" ||
    pathname === "/customers";

  const getSearchPlaceholder = () => {
    if (pathname === "/inventory") return "Search products by name, SKU or category...";
    if (pathname === "/team" || pathname === "/team/add") return "Search team members by name, role or email...";
    if (pathname === "/orders") return "Search orders by ID, customer name or amount...";
    if (pathname === "/customers") return "Search customers by name, email, phone or ID...";
    return "Search...";
  };

  const handleRoleToggle = () => {
    const nextRole = isSuperAdmin ? "admin" : "superadmin";
    setRole(nextRole);
    setProfileOpen(false);
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

          {/* ── Role quick pill badge ── */}
          <button
            onClick={handleRoleToggle}
            title="Click to toggle between Admin and Super Admin role for testing"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm hover:scale-105"
            style={
              isSuperAdmin
                ? { backgroundColor: "#FEF2F2", color: "#DC2626", borderColor: "#FECACA" }
                : { backgroundColor: "#EFF6FF", color: "#2563EB", borderColor: "#BFDBFE" }
            }
          >
            {isSuperAdmin ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
            <span>{isSuperAdmin ? "Super Admin" : "Admin"}</span>
            <ArrowLeftRight size={11} className="opacity-60 ml-0.5" />
          </button>

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
            aria-label="Notifications"
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
              className="flex items-center gap-3 hover:opacity-85 transition-opacity select-none"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none mb-0.5" style={{ color: "#102452" }}>
                  {currentUser.name}
                </p>
                <p className="text-xs text-gray-500 leading-none">
                  {currentUser.roleTitle}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border border-gray-200 shrink-0"
                style={{ backgroundColor: "#E8EEF8", color: "#0B2A63" }}
              >
                {currentUser.avatarLetter}
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
                      {currentUser.avatarLetter}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "#102452" }}>{currentUser.name}</p>
                      <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-navy/10 text-navy">
                        {currentUser.roleTitle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role Switcher in dropdown */}
                <div className="p-2 border-b border-gray-100 bg-blue-50/30">
                  <p className="text-[11px] font-semibold text-gray-500 px-2 mb-1.5 uppercase tracking-wider">
                    Switch Test Role:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => { setRole("admin"); setProfileOpen(false); }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors text-center ${
                        !isSuperAdmin ? "bg-navy text-white shadow-sm" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      Admin
                    </button>
                    <button
                      onClick={() => { setRole("superadmin"); setProfileOpen(false); }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors text-center ${
                        isSuperAdmin ? "bg-red text-white shadow-sm" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                      }`}
                      style={isSuperAdmin ? { backgroundColor: "#E31B23" } : {}}
                    >
                      Super Admin
                    </button>
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
