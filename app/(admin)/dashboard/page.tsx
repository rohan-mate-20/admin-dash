"use client";

import { StatusBadge } from "@/components/StatusBadge";
import {
  getDashboardStats,
  getEarningsData,
  getLowStockThreshold,
  getLowStockItems,
  getRecentOrders,
  DashboardStats,
  EarningsDataPoint,
  LowStockItem,
  RecentOrder,
} from "@/lib/supabaseService";
import { useAuth } from "@/lib/AuthContext";
import {
  ShoppingCart,
  Clock,
  Package,
  CheckCircle2,
  ChevronDown,
  IndianRupee,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const PERIOD_OPTIONS: ("Day" | "Week" | "Month" | "Year")[] = ["Day", "Week", "Month", "Year"];

// ── Stat Card ──────────────────────────────────────────────────────────────────
type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
};

function StatCard({ title, value, subtitle, icon, iconBg }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500 mb-0.5">{title}</p>
        <p className="text-3xl font-extrabold" style={{ color: "#102452" }}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs font-semibold mt-1 text-gray-500">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Custom Y-axis tick (₹) ─────────────────────────────────────────────────────
function RupeeYTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: number } }) {
  if (!x || !y || !payload) return null;
  const label =
    payload.value >= 1000
      ? `₹${(payload.value / 1000).toFixed(1)}K`
      : `₹${payload.value}`;
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={11} fill="#94a3b8">
      {label}
    </text>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-3 py-2 text-sm">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="font-bold" style={{ color: "#0B2A63" }}>
        ₹{payload[0].value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, isSuperAdmin } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<"Day" | "Week" | "Month" | "Year">("Day");
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    earnings: 0,
    pendingOrders: 0,
    outForDelivery: 0,
    deliveredOrders: 0,
    periodLabel: "Today",
  });
  const [earningsData, setEarningsData] = useState<EarningsDataPoint[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [dashStats, threshold, recOrders] = await Promise.all([
          getDashboardStats(selectedPeriod),
          getLowStockThreshold(),
          getRecentOrders(isSuperAdmin),
        ]);

        setStats(dashStats);
        setLowStockThreshold(threshold);
        setRecentOrders(recOrders);

        const [lowStock, earnings] = await Promise.all([
          getLowStockItems(threshold),
          getEarningsData(selectedPeriod),
        ]);

        setLowStockItems(lowStock);
        setEarningsData(earnings);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [isSuperAdmin, selectedPeriod]);

  const statCards = [
    {
      title: `${selectedPeriod === "Day" ? "Today's" : selectedPeriod} Orders`,
      value: stats.totalOrders,
      subtitle: `${stats.periodLabel}`,
      icon: <ShoppingCart size={26} color="#3b82f6" />,
      iconBg: "#EBF5FF",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      subtitle: "Requires action",
      icon: <Clock size={26} color="#E31B23" />,
      iconBg: "#FFF0F0",
    },
    {
      title: "Out for Delivery",
      value: stats.outForDelivery,
      subtitle: "In transit",
      icon: <Package size={26} color="#f97316" />,
      iconBg: "#FFF4EB",
    },
    {
      title: `${selectedPeriod === "Day" ? "Delivered Today" : "Delivered (" + selectedPeriod + ")"}`,
      value: stats.deliveredOrders,
      subtitle: "Successfully completed",
      icon: <CheckCircle2 size={26} color="#22c55e" />,
      iconBg: "#EDFBF2",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* ── Top Header & Filter ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "#102452" }}>
            Welcome, {currentUser?.name || "Admin"} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Operational overview for {stats.periodLabel.toLowerCase()}.
          </p>
        </div>

        {/* Period Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-gray-200 rounded-2xl shadow-xs self-start sm:self-auto">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedPeriod === p
                  ? "bg-navy text-white shadow-xs"
                  : "text-gray-600 hover:text-navy hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Low Stock Alert Banner ── */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-red-100 text-red-600 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-900">
                Low Stock Alert ({lowStockItems.length} {lowStockItems.length === 1 ? "item" : "items"} ≤ {lowStockThreshold} units)
              </h3>
              <p className="text-xs text-red-700 mt-0.5">
                {lowStockItems.slice(0, 3).map((item) => `${item.product_name} (${item.stock_quantity} left at ${item.store_name})`).join(", ")}
                {lowStockItems.length > 3 && ` and ${lowStockItems.length - 3} more...`}
              </p>
            </div>
          </div>
          <Link
            href="/inventory"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-sm"
          >
            Check Inventory
          </Link>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {/* ── Earnings row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold" style={{ color: "#102452" }}>
                Earnings Breakdown
              </h2>
              <p className="text-xs text-gray-400">Viewed by {selectedPeriod.toLowerCase()}</p>
            </div>
            {/* Period dropdown */}
            <div ref={periodRef} className="relative">
              <button
                onClick={() => setPeriodOpen(!periodOpen)}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <span>{selectedPeriod}</span>
                <ChevronDown size={14} className={`transition-transform ${periodOpen ? "rotate-180" : ""}`} />
              </button>
              {periodOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-32 bg-white rounded-xl border border-gray-100 shadow-xl z-20 py-1 overflow-hidden">
                  {PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSelectedPeriod(opt);
                        setPeriodOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm font-medium transition-colors"
                      style={selectedPeriod === opt ? { backgroundColor: "#0B2A63", color: "#fff" } : { color: "#374151" }}
                      onMouseEnter={(e) => { if (selectedPeriod !== opt) e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                      onMouseLeave={(e) => { if (selectedPeriod !== opt) e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="h-[220px]">
            {earningsData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                No earnings data recorded for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={earningsData}
                  margin={{ top: 4, right: 4, left: 8, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={<RupeeYTick />}
                    width={44}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                  <Bar
                    dataKey="earnings"
                    fill="#5B8FF9"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Total earnings card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "#EBF5FF" }}
          >
            <IndianRupee size={24} color="#3b82f6" />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">{stats.periodLabel} Earnings</p>
          <p className="text-4xl font-extrabold mb-3" style={{ color: "#102452" }}>
            ₹{stats.earnings.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-gray-400 font-medium">
            Based on {stats.totalOrders} {stats.totalOrders === 1 ? "order" : "orders"} in {stats.periodLabel.toLowerCase()}
          </p>
        </div>
      </div>

      {/* ── Recent Orders ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold" style={{ color: "#102452" }}>
            Recent Orders
          </h2>
          {isSuperAdmin && (
            <button
              onClick={() => router.push("/orders")}
              className="text-sm font-semibold hover:underline"
              style={{ color: "#3b82f6" }}
            >
              View All →
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC" }}>
                {[
                  "Order Number",
                  ...(isSuperAdmin ? ["Customer Name"] : []),
                  "Amount",
                  "Store",
                  "Status",
                  "Time",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-100"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 6 : 5} className="py-12 text-center text-sm text-gray-400">
                    {loading ? "Loading orders..." : "No recent orders found."}
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm font-semibold border-b border-gray-50" style={{ color: "#102452" }}>
                      {order.order_number || order.id.slice(0, 8)}
                    </td>
                    {isSuperAdmin && (
                      <td className="py-4 px-6 text-sm border-b border-gray-50" style={{ color: "#102452" }}>
                        {order.customer_name || "—"}
                      </td>
                    )}
                    <td className="py-4 px-6 text-sm font-semibold border-b border-gray-50" style={{ color: "#102452" }}>
                      ₹{order.total.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500 border-b border-gray-50">
                      {order.store_name || "—"}
                    </td>
                    <td className="py-4 px-6 border-b border-gray-50">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500 border-b border-gray-50">
                      {new Date(order.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
