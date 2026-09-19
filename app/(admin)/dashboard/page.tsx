"use client";

import { StatusBadge } from "@/components/StatusBadge";
import { mockEarningsData, mockOrders } from "@/lib/mockData";
import {
  ShoppingCart,
  Clock,
  Package,
  CheckCircle2,
  ChevronDown,
  IndianRupee,
  TrendingUp,
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

const DAY_OPTIONS = ["Day", "Week", "Month", "Year"];

// ── Stat Card ──────────────────────────────────────────────────────────────────
type StatCardProps = {
  title: string;
  value: string | number;
  trend: string;
  trendColor?: string;
  icon: React.ReactNode;
  iconBg: string;
};

function StatCard({ title, value, trend, trendColor = "#22c55e", icon, iconBg }: StatCardProps) {
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
        <p className="text-xs font-semibold mt-1 flex items-center gap-1" style={{ color: trendColor }}>
          <TrendingUp size={12} />
          {trend}
        </p>
      </div>
    </div>
  );
}

// ── Custom Y-axis tick (₹) ─────────────────────────────────────────────────────
function RupeeYTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: number } }) {
  if (!x || !y || !payload) return null;
  const label =
    payload.value >= 1000
      ? `₹${payload.value / 1000}K`
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
  const [dayOpen, setDayOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("Day");
  const dayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dayRef.current && !dayRef.current.contains(e.target as Node)) setDayOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const stats = [
    {
      title: "Total Orders",
      value: "48",
      trend: "+12% from yesterday",
      trendColor: "#22c55e",
      icon: <ShoppingCart size={26} color="#3b82f6" />,
      iconBg: "#EBF5FF",
    },
    {
      title: "Pending Orders",
      value: "12",
      trend: "+8% from yesterday",
      trendColor: "#E31B23",
      icon: <Clock size={26} color="#E31B23" />,
      iconBg: "#FFF0F0",
    },
    {
      title: "Out for Delivery",
      value: "10",
      trend: "+25% from yesterday",
      trendColor: "#22c55e",
      icon: <Package size={26} color="#f97316" />,
      iconBg: "#FFF4EB",
    },
    {
      title: "Delivered Orders",
      value: "22",
      trend: "+15% from yesterday",
      trendColor: "#22c55e",
      icon: <CheckCircle2 size={26} color="#22c55e" />,
      iconBg: "#EDFBF2",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* ── Greeting ── */}
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: "#102452" }}>
          Good Morning, Admin 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Here&apos;s what&apos;s happening at K Mart today.
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {/* ── Earnings row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold" style={{ color: "#102452" }}>
              Today&apos;s Earnings
            </h2>
            {/* Day dropdown */}
            <div ref={dayRef} className="relative">
              <button
                onClick={() => setDayOpen(!dayOpen)}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                {selectedDay}
                <ChevronDown size={14} className={`transition-transform ${dayOpen ? "rotate-180" : ""}`} />
              </button>
              {dayOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-32 bg-white rounded-xl border border-gray-100 shadow-xl z-20 py-1 overflow-hidden">
                  {DAY_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setSelectedDay(opt); setDayOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm font-medium transition-colors"
                      style={selectedDay === opt ? { backgroundColor: "#0B2A63", color: "#fff" } : { color: "#374151" }}
                      onMouseEnter={(e) => { if (selectedDay !== opt) e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                      onMouseLeave={(e) => { if (selectedDay !== opt) e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mockEarningsData}
                margin={{ top: 4, right: 4, left: 8, bottom: 0 }}
                barCategoryGap="30%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="time"
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
          <p className="text-sm font-medium text-gray-500 mb-1">Total Earnings</p>
          <p className="text-4xl font-extrabold mb-3" style={{ color: "#102452" }}>
            ₹24,560
          </p>
          <p
            className="text-sm font-bold flex items-center gap-1"
            style={{ color: "#22c55e" }}
          >
            <TrendingUp size={14} />
            +18% from yesterday
          </p>
        </div>
      </div>

      {/* ── Recent Orders ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold" style={{ color: "#102452" }}>
            Recent Orders
          </h2>
          <button
            onClick={() => router.push("/orders")}
            className="text-sm font-semibold hover:underline"
            style={{ color: "#3b82f6" }}
          >
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC" }}>
                {["Order ID", "Customer Name", "Amount", "Store", "Status", "Time"].map(
                  (h) => (
                    <th
                      key={h}
                      className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-100"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((order, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50/60 transition-colors"
                >
                  <td className="py-4 px-6 text-sm font-semibold border-b border-gray-50" style={{ color: "#102452" }}>
                    {order.id}
                  </td>
                  <td className="py-4 px-6 text-sm border-b border-gray-50" style={{ color: "#102452" }}>
                    {order.name}
                  </td>
                  <td className="py-4 px-6 text-sm font-semibold border-b border-gray-50" style={{ color: "#102452" }}>
                    ₹{order.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500 border-b border-gray-50">
                    {order.store}
                  </td>
                  <td className="py-4 px-6 border-b border-gray-50">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500 border-b border-gray-50">
                    {order.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
