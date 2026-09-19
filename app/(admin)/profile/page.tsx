"use client";

import {
  Eye, EyeOff, Mail, User, Shield, CalendarDays,
  Lock, CheckCircle2, AlertCircle, Pencil
} from "lucide-react";
import { useState } from "react";

// ── Reusable password field ────────────────────────────────────────────────────
function PasswordField({
  label, placeholder, show, onToggle,
}: {
  label: string; placeholder: string; show: boolean; onToggle: () => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color: "#102452" }}>
        {label}
      </label>
      <div className="relative">
        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400"
          style={{ color: "#102452" }}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}

// ── Toast notification ─────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl animate-in slide-in-from-bottom-4 duration-300"
      style={{ backgroundColor: type === "success" ? "#DCFCE7" : "#FFE4E6", minWidth: 260 }}
    >
      {type === "success"
        ? <CheckCircle2 size={20} style={{ color: "#16a34a" }} />
        : <AlertCircle size={20} style={{ color: "#dc2626" }} />}
      <p className="text-sm font-semibold" style={{ color: type === "success" ? "#15803d" : "#dc2626" }}>
        {message}
      </p>
      <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 text-xs font-bold">✕</button>
    </div>
  );
}

export default function ProfilePage() {
  // Account info state
  const [name, setName] = useState("Admin");
  const [editingName, setEditingName] = useState(false);

  // Password state
  const [showCurrent, setShowCurrent]     = useState(false);
  const [showNew, setShowNew]             = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [currentPwd, setCurrentPwd]       = useState("");
  const [newPwd, setNewPwd]               = useState("");
  const [confirmPwd, setConfirmPwd]       = useState("");
  const [pwdError, setPwdError]           = useState("");

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
    if (!currentPwd) { setPwdError("Current password is required."); return; }
    if (newPwd.length < 6) { setPwdError("New password must be at least 6 characters."); return; }
    if (newPwd !== confirmPwd) { setPwdError("Passwords do not match."); return; }
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    showToast("Password updated successfully!");
  };

  return (
    <>
      <div className="space-y-6 pb-8 max-w-5xl">
        {/* ── Heading ── */}
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "#102452" }}>My Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">View and manage your account information.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ════ LEFT — Avatar Card ════ */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-4">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center font-extrabold text-4xl border-4 border-white shadow-md"
                  style={{ backgroundColor: "#E8EEF8", color: "#0B2A63" }}
                >
                  A
                </div>
                <button
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow border border-gray-200 hover:scale-105 transition-transform"
                  style={{ backgroundColor: "#0B2A63" }}
                  title="Change avatar"
                >
                  <Pencil size={13} color="#fff" />
                </button>
              </div>

              <h2 className="text-xl font-bold mb-0.5" style={{ color: "#102452" }}>{name}</h2>
              <p className="text-sm font-medium text-gray-400 mb-6">Super Admin</p>

              <div className="w-full h-px bg-gray-100 mb-5" />

              {/* Info rows */}
              <div className="w-full space-y-4 text-left">
                {[
                  { icon: <Mail size={15} className="text-gray-400 shrink-0" />, label: "admin@kmart.com" },
                  { icon: <Shield size={15} className="text-gray-400 shrink-0" />, label: "Administrator" },
                  { icon: <CalendarDays size={15} className="text-gray-400 shrink-0" />, label: "Joined 12 Jan 2024" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    {icon}
                    <span className="text-sm font-medium" style={{ color: "#102452" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ════ RIGHT — Forms ════ */}
          <div className="lg:col-span-2 space-y-5">

            {/* ── Account Information ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-base font-bold" style={{ color: "#102452" }}>Account Information</h3>
                <p className="text-sm text-gray-400 mt-0.5">Update your basic details here.</p>
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
                      value="admin@kmart.com"
                      disabled
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 ml-1">Email cannot be changed.</p>
                </div>

                {/* Role — read only */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-400">Role</label>
                  <div className="relative">
                    <Shield size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value="Administrator"
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
                <h3 className="text-base font-bold" style={{ color: "#102452" }}>Change Password</h3>
                <p className="text-sm text-gray-400 mt-0.5">Set a new password for your account.</p>
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
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
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
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {/* Password strength hint */}
                  {newPwd.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-colors"
                          style={{ backgroundColor: newPwd.length >= i * 3 ? (newPwd.length >= 10 ? "#22c55e" : newPwd.length >= 6 ? "#f59e0b" : "#ef4444") : "#E5E7EB" }}
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
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
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
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ backgroundColor: "#FFE4E6", color: "#dc2626" }}>
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
