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
import { getPeriodDateRange, getStaffDetail, StaffDetail, StaffExpense } from "@/lib/supabaseService";
import { DeleteTeamMemberModal } from "@/components/DeleteTeamMemberModal";

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [historyPeriod, setHistoryPeriod] = useState<"All Time" | "Day" | "Month" | "Year">("All Time");
  const packedOrders = (member?.orderHistory ?? []).filter((order) => order.activity_status === "PACKED");
  const deliveryOrders = (member?.orderHistory ?? []).filter((order) => ["OUT_FOR_DELIVERY", "DELIVERED"].includes(order.activity_status));
  const historySections = member?.role.toUpperCase() === "PACKER"
    ? [{ title: "Packed Orders", statuses: "PACKED", orders: packedOrders, icon: <Package size={18} /> }]
    : member?.role.toUpperCase() === "DELIVERY"
      ? [{ title: "Delivery History", statuses: "OUT FOR DELIVERY · DELIVERED", orders: deliveryOrders, icon: <Truck size={18} /> }]
      : [
          { title: "Packed Orders", statuses: "PACKED", orders: packedOrders, icon: <Package size={18} /> },
          { title: "Delivery History", statuses: "OUT FOR DELIVERY · DELIVERED", orders: deliveryOrders, icon: <Truck size={18} /> },
        ];

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        setLoading(true);
        const dateRange = historyPeriod === "All Time" ? {} : getPeriodDateRange(historyPeriod);
        const detail = await getStaffDetail(id, dateRange);
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
  }, [id, historyPeriod]);

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
        {(error || deleteSuccess) && member && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-semibold ${deleteSuccess ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            <AlertCircle size={18} className={deleteSuccess ? "text-green-600 shrink-0" : "text-red-600 shrink-0"} />
            <span>{deleteSuccess || error}</span>
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

        {/* Staff order activity */}
        <section className="space-y-4" aria-label="Staff order history">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
            <h2 className="text-lg font-bold text-navy">Order Activity</h2>
            <p className="mt-1 text-sm text-gray-500">{member?.role.toUpperCase() === "PACKER" ? "Orders packed by this team member." : member?.role.toUpperCase() === "DELIVERY" ? "Orders delivered by this team member." : "Orders with status changes recorded against this team member."} Filtered by order placement date.</p>
            </div>
            <label className="grid gap-1 text-xs font-semibold text-gray-500">
              History period
              <select className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700" onChange={(event) => setHistoryPeriod(event.target.value as typeof historyPeriod)} value={historyPeriod}>
                <option value="Day">Today</option>
                <option value="Month">This Month</option>
                <option value="Year">This Year</option>
                <option value="All Time">All Time</option>
              </select>
            </label>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            {historySections.map((section) => (
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm" key={section.title}>
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-navy">{section.icon}{section.title}</div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{section.orders.length}</span>
                </div>
                {section.orders.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm font-medium text-gray-500">No {section.title.toLowerCase()} found for this team member.</p>
                    <p className="mt-1 text-xs text-gray-400">{section.statuses}</p>
                    <p className="mx-auto mt-3 max-w-xs text-xs leading-relaxed text-gray-400">An order appears here when its status history records this team member as the person who changed it.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {section.orders.map((order) => (
                      <article className="space-y-2 px-5 py-4" key={order.id}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-navy">Order {order.order_number}</p>
                            <p className="mt-0.5 text-xs text-gray-500">{order.store_name || member?.store_name || "Store not recorded"} · Placed {order.created_at ? new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "date not recorded"}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{order.activity_status.replaceAll("_", " ")}</span>
                            <p className="mt-1 text-sm font-bold text-navy">₹{order.total.toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">
                          {order.items.length ? order.items.map((item) => `${item.product_name} × ${item.quantity}`).join(" · ") : "No item details available"}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

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
      <DeleteTeamMemberModal
        member={showDeleteConfirm && member ? member : null}
        onClose={() => setShowDeleteConfirm(false)}
        onDeleted={(name) => {
          setShowDeleteConfirm(false);
          setDeleteSuccess(`${name} was deleted from the team.`);
          window.setTimeout(() => router.push("/team"), 900);
        }}
        onError={(message) => {
          setError(message);
        }}
      />
    </>
  );
}
