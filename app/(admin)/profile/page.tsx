"use client";

import {
  Eye,
  EyeOff,
  Mail,
  User,
  Shield,
  CalendarDays,
  Lock,
  CheckCircle2,
  AlertCircle,
  Pencil,
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth, UserRole } from "@/lib/AuthContext";
import Link from "next/link";

// ── Toast notification ─────────────────────────────────────────────────────────
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl animate-in slide-in-from-bottom-4 duration-300"
      style={{ backgroundColor: type === "success" ? "#DCFCE7" : "#FFE4E6", minWidth: 260 }}
    >
      {type === "success" ? (
        <CheckCircle2 size={20} style={{ color: "#16a34a" }} />
      ) : (
        <AlertCircle size={20} style={{ color: "#dc2626" }} />
      )}
      <p className="text-sm font-semibold" style={{ color: type === "success" ? "#15803d" : "#dc2626" }}>
        {message}
      </p>
      <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 text-xs font-bold">
        ✕
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const { currentUser, role, isSuperAdmin, setRole } = useAuth();

  // Account info state
  const [name, setName] = useState(currentUser.name);
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    setName(currentUser.name);
  }, [currentUser]);

  // Password state
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setEditingName(false);
    showToast("Profile information updated successfully!");
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    if (!currentPwd) {
      setPwdError("Current password is required.");
      return;
    }
    if (newPwd.length < 6) {
      setPwdError("New password must be at least 6 characters.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("Passwords do not match.");
      return;
    }
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
    showToast("Password updated successfully!");
  };

  const handleSwitchRole = (newRole: UserRole) => {
    setRole(newRole);
    showToast(`Switched active role to ${newRole === "superadmin" ? "Super Admin" : "Admin"}`);
  };

  return (
    <>
      <div className="space-y-6 pb-12 max-w-5xl">
        {/* ── Heading ── */}
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "#102452" }}>
            My Profile
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            View account identity, permissions, and security settings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ════ LEFT — Avatar & Role Card ════ */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-4">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center font-extrabold text-3xl border-4 border-white shadow-md"
                  style={{
                    backgroundColor: isSuperAdmin ? "#FFF1F2" : "#E8EEF8",
                    color: isSuperAdmin ? "#E31B23" : "#0B2A63",
                  }}
                >
                  {currentUser.avatarLetter}
                </div>
                <button
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow border border-gray-200 hover:scale-105 transition-transform"
                  style={{ backgroundColor: "#0B2A63" }}
                  title="Change avatar"
                >
                  <Pencil size={13} color="#fff" />
                </button>
              </div>

              <h2 className="text-xl font-bold mb-0.5" style={{ color: "#102452" }}>
                {currentUser.name}
              </h2>
              <span
                className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6"
                style={
                  isSuperAdmin
                    ? { backgroundColor: "#FEE2E2", color: "#DC2626" }
                    : { backgroundColor: "#EFF6FF", color: "#1D4ED8" }
                }
              >
                {currentUser.roleTitle}
              </span>

              <div className="w-full h-px bg-gray-100 mb-5" />

              {/* Info rows */}
              <div className="w-full space-y-4 text-left">
                {[
                  { icon: <Mail size={15} className="text-gray-400 shrink-0" />, label: currentUser.email },
                  { icon: <Shield size={15} className="text-gray-400 shrink-0" />, label: currentUser.roleTitle },
                  { icon: <CalendarDays size={15} className="text-gray-400 shrink-0" />, label: `Joined ${currentUser.joinedDate}` },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    {icon}
                    <span className="text-sm font-medium" style={{ color: "#102452" }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Role Switcher Box for Live Testing */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-navy mb-1 flex items-center gap-2">
                <ShieldCheck size={16} className="text-red" />
                Role Switcher (Live Demo)
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Toggle roles to test UI visibility and security restrictions:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSwitchRole("admin")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    role === "admin"
                      ? "bg-navy text-white shadow-sm"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <ShieldAlert size={14} />
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchRole("superadmin")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    role === "superadmin"
                      ? "bg-red text-white shadow-sm"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                  style={role === "superadmin" ? { backgroundColor: "#E31B23" } : {}}
                >
                  <ShieldCheck size={14} />
                  Super Admin
                </button>
              </div>
            </div>
          </div>

          {/* ════ RIGHT — Forms & Permission Matrix ════ */}
          <div className="lg:col-span-2 space-y-5">
            {/* ── Role Permission Matrix ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-navy">Role Access Permissions</h3>
                  <p className="text-xs text-gray-400">Current Role: <strong className="text-navy uppercase">{role}</strong></p>
                </div>
                {isSuperAdmin && (
                  <Link
                    href="/customers"
                    className="inline-flex items-center gap-1 text-xs font-bold text-red hover:underline"
                  >
                    Go to Customers <ArrowRight size={12} />
                  </Link>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="py-2.5 px-5 font-semibold text-gray-500">Feature</th>
                      <th className="py-2.5 px-4 font-semibold text-gray-500 text-center">Admin</th>
                      <th className="py-2.5 px-4 font-semibold text-gray-500 text-center">Super Admin</th>
                      <th className="py-2.5 px-4 font-semibold text-gray-500 text-center">Your Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { feature: "Dashboard & Metrics", admin: true, super: true },
                      { feature: "Orders Management", admin: true, super: true },
                      { feature: "Store 1 / Store 2 Filter", admin: true, super: true },
                      { feature: "Slot 1 / Slot 2 Filter", admin: true, super: true },
                      { feature: "Team Management", admin: true, super: true },
                      { feature: "Customers Directory", admin: false, super: true, restricted: true },
                      { feature: "Customer Details Profile", admin: false, super: true, restricted: true },
                      { feature: "Customer Order History", admin: false, super: true, restricted: true },
                    ].map((row) => {
                      const hasAccess = isSuperAdmin ? row.super : row.admin;
                      return (
                        <tr key={row.feature} className="hover:bg-gray-50/50">
                          <td className="py-2.5 px-5 font-medium text-gray-800">
                            {row.feature}
                            {row.restricted && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red/10 text-red">
                                Super Admin Only
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {row.admin ? (
                              <Check size={14} className="text-green-600 inline" />
                            ) : (
                              <X size={14} className="text-gray-300 inline" />
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <Check size={14} className="text-green-600 inline" />
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {hasAccess ? (
                              <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 font-bold text-[10px]">
                                GRANTED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-red/10 text-red font-bold text-[10px]">
                                LOCKED (403)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Account Information ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-base font-bold" style={{ color: "#102452" }}>
                  Account Information
                </h3>
                <p className="text-sm text-text-secondary mt-0.5">Update your basic details here.</p>
              </div>

              <form onSubmit={handleSaveInfo} className="px-6 py-5 space-y-4">
                {/* Name — editable */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#102452" }}>
                    Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setEditingName(true)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                      style={{
                        borderColor: editingName ? "#0B2A63" : "#E5E7EB",
                        color: "#102452",
                      }}
                    />
                  </div>
                </div>

                {/* Email — read only */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-400">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={currentUser.email}
                      disabled
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 ml-1">Email is tied to your role profile.</p>
                </div>

                {/* Role — read only */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-400">Role</label>
                  <div className="relative">
                    <Shield size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={currentUser.roleTitle}
                      disabled
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Save button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    className="px-7 py-2.5 text-sm font-bold text-white rounded-xl transition-colors shadow-sm"
                    style={{ backgroundColor: "#0B2A63" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#071d4a")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0B2A63")}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>

            {/* ── Change Password ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-base font-bold" style={{ color: "#102452" }}>
                  Change Password
                </h3>
                <p className="text-sm text-text-secondary mt-0.5">Set a new password for your account.</p>
              </div>

              <form onSubmit={handleUpdatePassword} className="px-6 py-5 space-y-4">
                {/* Current password */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#102452" }}>
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showCurrent ? "text" : "password"}
                      placeholder="Enter current password"
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400"
                      style={{ color: "#102452" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#102452" }}>
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showNew ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400"
                      style={{ color: "#102452" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {newPwd.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-colors"
                          style={{
                            backgroundColor:
                              newPwd.length >= i * 3
                                ? newPwd.length >= 10
                                  ? "#22c55e"
                                  : newPwd.length >= 6
                                  ? "#f59e0b"
                                  : "#ef4444"
                                : "#E5E7EB",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#102452" }}>
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      className="w-full pl-11 pr-12 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400"
                      style={{
                        borderColor: confirmPwd && confirmPwd !== newPwd ? "#EF4444" : "#E5E7EB",
                        color: "#102452",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {confirmPwd && confirmPwd !== newPwd && (
                    <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1">
                      <AlertCircle size={12} /> Passwords do not match
                    </p>
                  )}
                  {confirmPwd && confirmPwd === newPwd && newPwd.length >= 6 && (
                    <p className="text-xs text-green-600 mt-1 ml-1 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Passwords match
                    </p>
                  )}
                </div>

                {/* Error */}
                {pwdError && (
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ backgroundColor: "#FFE4E6", color: "#dc2626" }}
                  >
                    <AlertCircle size={16} />
                    {pwdError}
                  </div>
                )}

                {/* Submit */}
                <div className="pt-1">
                  <button
                    type="submit"
                    className="px-7 py-2.5 text-sm font-bold text-white rounded-xl transition-colors shadow-sm"
                    style={{ backgroundColor: "#E31B23" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#c41520")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#E31B23")}
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
