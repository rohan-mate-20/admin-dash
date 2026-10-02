"use client";

import {
  Mail,
  User,
  Shield,
  CalendarDays,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { LogoutModal } from "@/components/LogoutModal";

export default function ProfilePage() {
  const { currentUser, isSuperAdmin } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const avatarLetter = currentUser?.name
    ? currentUser.name.charAt(0).toUpperCase()
    : "A";

  const roleTitle = isSuperAdmin ? "Super Administrator" : "Administrator";

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentUser?.email) {
      setPasswordError("Could not verify the signed-in admin account.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Use at least 8 characters for the new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("The new password and confirmation do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const { error: reauthenticationError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword,
      });
      if (reauthenticationError) {
        setPasswordError("Current password is incorrect.");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password changed successfully.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Unable to change the password.");
    } finally {
      setPasswordSaving(false);
    }
  }

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

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5 sm:px-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><KeyRound size={19} /></div>
          <div>
            <h2 className="text-base font-bold text-navy">Change Password</h2>
            <p className="mt-0.5 text-sm text-gray-500">Confirm your current password before setting a new one.</p>
          </div>
        </div>
        <form className="grid gap-4 p-6 sm:grid-cols-2 sm:px-8" onSubmit={changePassword}>
          <label className="grid gap-1.5 text-sm font-semibold text-gray-700 sm:col-span-2">
            Current password
            <input autoComplete="current-password" className="min-h-11 rounded-lg border border-gray-300 px-3 font-normal focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15" onChange={(event) => setCurrentPassword(event.target.value)} required type="password" value={currentPassword} />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-gray-700">
            New password
            <input autoComplete="new-password" className="min-h-11 rounded-lg border border-gray-300 px-3 font-normal focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15" minLength={8} onChange={(event) => setNewPassword(event.target.value)} required type="password" value={newPassword} />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-gray-700">
            Confirm new password
            <input autoComplete="new-password" className="min-h-11 rounded-lg border border-gray-300 px-3 font-normal focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15" minLength={8} onChange={(event) => setConfirmPassword(event.target.value)} required type="password" value={confirmPassword} />
          </label>
          {passwordError && <p className="text-sm font-medium text-red-700 sm:col-span-2" role="alert">{passwordError}</p>}
          {passwordSuccess && <p className="text-sm font-medium text-green-700 sm:col-span-2" role="status">{passwordSuccess}</p>}
          <div className="sm:col-span-2">
            <button className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy px-5 text-sm font-bold text-white hover:bg-blue-950 disabled:opacity-60" disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword} type="submit">
              <KeyRound size={16} />{passwordSaving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </section>

      <LogoutModal isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
}
