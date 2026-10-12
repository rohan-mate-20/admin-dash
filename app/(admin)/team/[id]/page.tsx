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
function Avatar({ name, size = 64 }: { name: string; size?: number }) {
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
      className="rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-md ring-4 ring-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        backgroundColor: "#102452",
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
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
        isPacker
          ? "bg-blue-100 text-blue-800 border border-blue-200"
          : "bg-amber-100 text-amber-900 border border-amber-200"
      }`}
    >
      {isPacker ? <Package size={13} /> : <Truck size={13} />}
      {role}
    </span>
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
    <div className="flex items-start gap-3.5 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50/60 rounded-lg px-2 -mx-2 transition-colors">
      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-navy mt-0.5">
        <Receipt size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-snug">
          {expense.note || "Expense recorded"}
        </p>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
          <Calendar size={12} className="text-gray-400" />
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
  const deliveryOrders = (member?.orderHistory ?? []).filter(
    (order) =>
      ["OUT_FOR_DELIVERY", "DELIVERED"].includes(order.activity_status) &&
      order.order_type?.toUpperCase() !== "PICKUP"
  );
  const historySections = member?.role.toUpperCase() === "PACKER"
    ? [{ title: "Packed Orders", statuses: "PACKED", orders: packedOrders, icon: <Package size={17} /> }]
    : member?.role.toUpperCase() === "DELIVERY"
      ? [{ title: "Delivery History", statuses: "OUT FOR DELIVERY · DELIVERED", orders: deliveryOrders, icon: <Truck size={17} /> }]
      : [
          { title: "Packed Orders", statuses: "PACKED", orders: packedOrders, icon: <Package size={17} /> },
          { title: "Delivery History", statuses: "OUT FOR DELIVERY · DELIVERED", orders: deliveryOrders, icon: <Truck size={17} /> },
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
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <div className="w-10 h-10 rounded-full border-3 border-gray-200 border-t-navy animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Loading team member...</p>
      </div>
    );
  }

  // ── Error state ──
  if (error && !member) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center text-red-500">
          <AlertCircle size={28} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{error}</h2>
          <p className="text-xs text-gray-500 mt-1">Please verify the link or return to the team list.</p>
        </div>
        <button
          onClick={() => router.push("/team")}
          className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-white bg-navy hover:bg-navy/90 transition-colors shadow-sm"
        >
          <ArrowLeft size={15} />
          Back to Team
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="pb-12 max-w-5xl mx-auto space-y-6">
        {/* Top Header: Back button + Delete action */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/team"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-navy transition-colors px-3 py-1.5 rounded-lg hover:bg-white"
          >
            <ArrowLeft size={16} />
            Back to Team
          </Link>
          {member?.is_active && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red hover:bg-red/90 transition-colors shadow-sm"
            >
              <Trash2 size={14} />
              <span>Delete Member</span>
            </button>
          )}
        </div>

        {/* Status notification */}
        {(error || deleteSuccess) && member && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-semibold shadow-sm ${
              deleteSuccess
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <AlertCircle size={18} className={deleteSuccess ? "text-green-600 shrink-0" : "text-red-600 shrink-0"} />
            <span>{deleteSuccess || error}</span>
          </div>
        )}

        {/* Member Profile Overview Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header navy gradient strip */}
          <div className="h-24 bg-gradient-to-r from-navy via-[#16356c] to-navy flex items-end justify-end px-6 pb-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                member?.is_active
                  ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/30 backdrop-blur-sm"
                  : "bg-gray-500/30 text-gray-200 border border-gray-400/30 backdrop-blur-sm"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${member?.is_active ? "bg-emerald-400" : "bg-gray-300"}`} />
              {member?.is_active ? "Active Member" : "Inactive"}
            </span>
          </div>

          <div className="px-6 md:px-8 pb-6">
            {/* Avatar & Main Title */}
            <div className="-mt-9 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div className="flex items-end gap-4">
                <Avatar name={member?.name ?? ""} size={72} />
                <div className="pb-1">
                  <h1 className="text-xl md:text-2xl font-extrabold text-navy tracking-tight">
                    {member?.name || "Unnamed"}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <RoleBadge role={member?.role ?? ""} />
                    {member?.employee_id && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                        <Hash size={11} className="text-gray-400" />
                        ID: {member.employee_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick stats badges */}
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-100 text-center min-w-24">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Orders</p>
                  <p className="text-lg font-black text-navy mt-0.5">
                    {member?.role.toUpperCase() === "PACKER"
                      ? packedOrders.length
                      : member?.role.toUpperCase() === "DELIVERY"
                      ? deliveryOrders.length
                      : (member?.orderHistory ?? []).length}
                  </p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-purple-50 border border-purple-100 text-center min-w-24">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Expenses</p>
                  <p className="text-lg font-black text-navy mt-0.5">
                    {(member?.expenses ?? []).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5 border-t border-gray-100">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-gray-500 shrink-0 border border-gray-100">
                  <Mail size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Email</p>
                  <p className="text-xs font-semibold text-gray-800 truncate mt-0.5" title={member?.email}>
                    {member?.email || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-gray-500 shrink-0 border border-gray-100">
                  <StoreIcon size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Store</p>
                  <p className="text-xs font-semibold text-gray-800 truncate mt-0.5">
                    {member?.store_name || "All Stores"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-gray-500 shrink-0 border border-gray-100">
                  <Hash size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Employee ID</p>
                  <p className="text-xs font-semibold text-gray-800 truncate mt-0.5 font-mono">
                    {member?.employee_id || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-gray-500 shrink-0 border border-gray-100">
                  <User size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Staff ID</p>
                  <p className="text-xs font-semibold text-gray-800 truncate mt-0.5 font-mono" title={member?.id}>
                    {member?.id ? `${member.id.slice(0, 8)}...` : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Order Activity Section */}
        <section className="space-y-4" aria-label="Staff order history">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-navy flex items-center gap-2">
                <Package size={17} className="text-red" />
                Order Activity
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {member?.role.toUpperCase() === "PACKER"
                  ? "Orders packed by this team member"
                  : member?.role.toUpperCase() === "DELIVERY"
                  ? "Orders delivered by this team member"
                  : "Orders processed by this team member"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Period:</label>
              <select
                className="min-h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-navy"
                onChange={(event) => setHistoryPeriod(event.target.value as typeof historyPeriod)}
                value={historyPeriod}
              >
                <option value="Day">Today</option>
                <option value="Month">This Month</option>
                <option value="Year">This Year</option>
                <option value="All Time">All Time</option>
              </select>
            </div>
          </div>

          <div className="space-y-5">
            {historySections.map((section) => (
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col w-full" key={section.title}>
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
                  <div className="flex items-center gap-2 text-sm font-bold text-navy">
                    {section.icon}
                    {section.title}
                  </div>
                  <span className="rounded-full bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-0.5 text-xs font-bold">
                    {section.orders.length}
                  </span>
                </div>
                {section.orders.length === 0 ? (
                  <div className="px-5 py-12 text-center flex-1 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
                      <Package size={18} />
                    </div>
                    <p className="text-sm font-semibold text-gray-600">No {section.title.toLowerCase()} found</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      Orders handled during the selected period will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {section.orders.map((order) => (
                      <article className="space-y-2 px-5 py-3.5 hover:bg-gray-50/60 transition-colors" key={order.id}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-navy flex items-center gap-2">
                              <span>Order #{order.order_number}</span>
                              {order.order_type?.toUpperCase() === "PICKUP" ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                  Self Pickup
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                  Delivery
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {order.store_name || member?.store_name || "Store"} ·{" "}
                              {order.created_at
                                ? new Date(order.created_at).toLocaleString("en-IN", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })
                                : "—"}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                              {order.activity_status.replaceAll("_", " ")}
                            </span>
                            <p className="mt-1 text-sm font-bold text-navy">
                              ₹{order.total.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                          {order.items.length
                            ? order.items.map((item) => `${item.product_name} × ${item.quantity}`).join(" · ")
                            : "No items listed"}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Expenses Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h2 className="text-base font-bold text-navy flex items-center gap-2">
                <Receipt size={17} className="text-red" />
                Expense History
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {(member?.expenses ?? []).length} expense
                {(member?.expenses ?? []).length !== 1 ? "s" : ""} recorded for this member
              </p>
            </div>
            <span className="rounded-full bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-0.5 text-xs font-bold">
              {(member?.expenses ?? []).length}
            </span>
          </div>

          <div className="px-6 py-2">
            {(member?.expenses ?? []).length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-2">
                  <Receipt size={18} />
                </div>
                <p className="text-sm font-semibold text-gray-600">No expenses recorded</p>
                <p className="text-xs text-gray-400 mt-1">No recorded expense notes found for this staff member.</p>
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
