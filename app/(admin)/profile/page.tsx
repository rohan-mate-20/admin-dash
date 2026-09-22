"use client";

import {
  Mail,
  User,
  Shield,
  CalendarDays,
  LogOut,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { logoutAdmin } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { LogoutModal } from "@/components/LogoutModal";

export default function ProfilePage() {
  const { currentUser, isSuperAdmin } = useAuth();
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);

  const avatarLetter = currentUser?.name
    ? currentUser.name.charAt(0).toUpperCase()
    : "A";

  const roleTitle = isSuperAdmin ? "Super Administrator" : "Administrator";

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: "#102452" }}>
          Admin Profile
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          View your account details and current operational permissions.
        </p>
      </div>

      {/* ── Main Profile Card ── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-gray-100">
          <div className="flex items-center gap-5">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center font-extrabold text-2xl border-2 border-gray-100 shadow-sm shrink-0"
              style={{ backgroundColor: "#E8EEF8", color: "#0B2A63" }}
            >
              {avatarLetter}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-extrabold" style={{ color: "#102452" }}>
                  {currentUser?.name || "Admin User"}
                </h2>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 border"
                  style={
                    isSuperAdmin
                      ? { backgroundColor: "#FEF2F2", color: "#DC2626", borderColor: "#FECACA" }
                      : { backgroundColor: "#EFF6FF", color: "#2563EB", borderColor: "#BFDBFE" }
                  }
                >
                  {isSuperAdmin ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                  <span>{currentUser?.role || "ADMIN"}</span>
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium">
                {currentUser?.email || ""}
              </p>
              <p className="text-xs text-gray-400 mt-1 font-mono">
                Admin ID: {currentUser?.id || "—"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowLogout(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border border-red-200 text-red-600 hover:bg-red-50 shadow-xs"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
          <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              <User size={14} className="text-navy" />
              <span>Full Name</span>
            </div>
            <p className="text-base font-bold text-navy">{currentUser?.name || "—"}</p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              <Mail size={14} className="text-navy" />
              <span>Email Address</span>
            </div>
            <p className="text-base font-bold text-navy">{currentUser?.email || "—"}</p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              <Shield size={14} className="text-navy" />
              <span>Assigned Role</span>
            </div>
            <p className="text-base font-bold text-navy">{roleTitle}</p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              <CalendarDays size={14} className="text-navy" />
              <span>Access Level</span>
            </div>
            <p className="text-sm font-semibold text-navy">
              {isSuperAdmin
                ? "Full Access (Orders, Customers, Inventory, Team, Reports)"
                : "Standard Access (Inventory, Team, Reports, Dashboard)"}
            </p>
          </div>
        </div>
      </div>

      <LogoutModal isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
}
