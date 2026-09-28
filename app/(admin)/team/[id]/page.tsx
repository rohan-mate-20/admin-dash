"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Package,
  Truck,
  Store as StoreIcon,
  Receipt,
  Calendar,
  Hash,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { getStaffDetail, StaffDetail, StaffExpense } from "@/lib/supabaseService";
import { supabase } from "@/lib/supabaseClient";

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ST";
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.3,
        backgroundColor: "#1A3A6B",
        color: "#fff",
      }}
    >
      {initials}
    </div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const isPacker = role?.toUpperCase() === "PACKER";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold"
      style={
        isPacker
          ? { backgroundColor: "#DBEAFE", color: "#1D4ED8" }
          : { backgroundColor: "#FEF3C7", color: "#92400E" }
      }
    >
      {isPacker ? <Package size={14} /> : <Truck size={14} />}
      {role}
    </span>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold mt-0.5 truncate" style={{ color: "#102452" }}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// ─── Expense row ──────────────────────────────────────────────────────────────
function ExpenseRow({ expense }: { expense: StaffExpense }) {
  const date = expense.expense_date
    ? new Date(expense.expense_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date(expense.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-50 last:border-0">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: "#EBF0FB" }}
      >
        <Receipt size={16} style={{ color: "#0B2A63" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "#102452" }}>
          {expense.note || "Expense recorded"}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
          <Calendar size={11} />
          {date}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TeamMemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [member, setMember] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        setLoading(true);
        const detail = await getStaffDetail(id);
        if (!detail) {
          setError("Team member not found.");
        } else {
          setMember(detail);
        }
      } catch (err) {
        console.error("Failed to load staff detail:", err);
        setError("Failed to load team member details.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    if (!member) return;
    try {
      setDeleting(true);
      const { error: deleteError } = await supabase
        .from("staff")
        .delete()
        .eq("id", member.id);
      if (deleteError) throw new Error(deleteError.message);
      router.push("/team");
    } catch (err) {
      console.error("Failed to delete staff member:", err);
      setError(err instanceof Error ? err.message : "Failed to delete team member.");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "#0B2A63", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  // ── Error state ──
  if (error && !member) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold" style={{ color: "#102452" }}>
          {error}
        </h2>
        <button
          onClick={() => router.push("/team")}
          className="text-sm font-semibold px-6 py-2.5 rounded-xl text-white"
          style={{ backgroundColor: "#0B2A63" }}
        >
          Back to Team
        </button>
      </div>
    );
  }

  return (
    <>
      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-500" />
            </div>
            <h3
              className="text-lg font-extrabold text-center mb-1"
              style={{ color: "#102452" }}
            >
              Delete Team Member?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This will permanently remove{" "}
              <strong>{member?.name}</strong> from the team. This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: "#E31B23" }}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pb-10 max-w-3xl space-y-6">
        {/* Back link + Delete button row */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/team"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-navy transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Team
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors shadow-sm"
            style={{ backgroundColor: "#E31B23" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#c41520")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#E31B23")
            }
          >
            <Trash2 size={15} />
            <span className="hidden sm:inline">Delete Member</span>
          </button>
        </div>

        {/* Error banner (non-fatal) */}
        {error && member && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-sm text-red-700 font-semibold">
            <AlertCircle size={18} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header banner */}
          <div className="h-24 w-full" style={{ backgroundColor: "#0B2A63" }} />

          {/* Avatar + name */}
          <div className="px-6 sm:px-8 pb-6">
            <div className="-mt-7 flex items-end gap-4 sm:gap-5 mb-5">
              <Avatar name={member?.name ?? ""} size={64} />
              <div className="pb-1 min-w-0">
                <h1
                  className="text-lg sm:text-xl font-extrabold leading-tight truncate"
                  style={{ color: "#102452" }}
                >
                  {member?.name}
                </h1>
                <RoleBadge role={member?.role ?? ""} />
              </div>
            </div>

            {/* Details */}
            <InfoRow icon={<Mail size={15} />} label="Email" value={member?.email ?? ""} />
            <InfoRow
              icon={<StoreIcon size={15} />}
              label="Assigned Store"
              value={member?.store_name ?? ""}
            />
            {member?.employee_id && (
              <InfoRow
                icon={<Hash size={15} />}
                label="Employee ID"
                value={member.employee_id}
              />
            )}
            <InfoRow
              icon={<User size={15} />}
              label="Staff ID"
              value={member?.id ?? ""}
            />
          </div>
        </div>

        {/* Expenses card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold" style={{ color: "#102452" }}>
                Expense History
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {(member?.expenses ?? []).length} expense
                {(member?.expenses ?? []).length !== 1 ? "s" : ""} recorded
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#EBF0FB" }}
            >
              <Receipt size={18} style={{ color: "#0B2A63" }} />
            </div>
          </div>

          <div className="px-6 sm:px-8">
            {(member?.expenses ?? []).length === 0 ? (
              <div className="py-14 text-center">
                <Receipt size={32} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm text-gray-400 font-medium">No expenses recorded yet</p>
              </div>
            ) : (
              (member?.expenses ?? []).map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
