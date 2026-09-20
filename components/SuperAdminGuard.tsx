"use client";

import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { ShieldAlert, ArrowLeft, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SuperAdminGuardProps {
  children: React.ReactNode;
}

export function SuperAdminGuard({ children }: SuperAdminGuardProps) {
  const { isSuperAdmin, role, setRole } = useAuth();
  const router = useRouter();

  if (!isSuperAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-gray-100 shadow-xl p-8 text-center animate-in fade-in zoom-in duration-200">
          <div className="w-20 h-20 rounded-2xl bg-red/10 text-red flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={44} style={{ color: "#E31B23" }} />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
            <span>Security Policy Violation</span>
          </div>

          <h1 className="text-2xl font-extrabold mb-2" style={{ color: "#102452" }}>
            403 - Access Denied
          </h1>

          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            The <strong className="text-navy font-semibold">Customers</strong> section and customer-related records are restricted to <strong className="text-red font-semibold">Super Admin</strong> accounts only. Your current role is configured as <span className="inline-block px-2 py-0.5 rounded bg-gray-100 font-bold text-gray-700 uppercase text-xs">{role}</span>.
          </p>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70 text-left mb-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
              <span>Required Role:</span>
              <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded font-bold">superadmin</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
              <span>Your Active Role:</span>
              <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-bold">{role}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
            <button
              onClick={() => setRole("superadmin")}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-colors shadow-sm"
              style={{ backgroundColor: "#0B2A63" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#071D4A")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0B2A63")}
            >
              <KeyRound size={16} />
              Switch to Super Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
