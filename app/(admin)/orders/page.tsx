"use client";

import { StatusBadge } from "@/components/StatusBadge";
import { mockOrders } from "@/lib/mockData";
import { ArrowLeft, Search, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ALL_ORDERS = [
  ...mockOrders,
  { id: "KM1019", name: "Kiran Mehta", amount: 1150, store: "Store 1", status: "Delivered", time: "04:00 AM" },
  { id: "KM1018", name: "Divya Rao", amount: 660, store: "Store 2", status: "Cancelled", time: "03:30 AM" },
  { id: "KM1017", name: "Ankit Joshi", amount: 2400, store: "Store 1", status: "Delivered", time: "02:45 AM" },
  { id: "KM1016", name: "Meera Nair", amount: 310, store: "Store 2", status: "Packed", time: "02:10 AM" },
  { id: "KM1015", name: "Siddharth Kumar", amount: 980, store: "Store 1", status: "Out for Delivery", time: "01:50 AM" },
  { id: "KM1014", name: "Ritu Gupta", amount: 1750, store: "Store 2", status: "Pending", time: "01:20 AM" },
  { id: "KM1013", name: "Farhan Sheikh", amount: 420, store: "Store 1", status: "Delivered", time: "12:55 AM" },
  { id: "KM1012", name: "Pooja Menon", amount: 870, store: "Store 2", status: "Packed", time: "12:30 AM" },
  { id: "KM1011", name: "Arjun Singh", amount: 3200, store: "Store 1", status: "Delivered", time: "Yesterday" },
  { id: "KM1010", name: "Smita Patil", amount: 540, store: "Store 2", status: "Cancelled", time: "Yesterday" },
];

const STATUS_FILTERS = ["All", "Pending", "Packed", "Out for Delivery", "Delivered", "Cancelled"];

export default function OrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [storeFilter, setStoreFilter] = useState("All Stores");
  const [storeOpen, setStoreOpen] = useState(false);

  const filtered = ALL_ORDERS.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    const matchStore = storeFilter === "All Stores" || o.store === storeFilter;
    return matchSearch && matchStatus && matchStore;
  });

  return (
    <div className="space-y-6 pb-8">
      {/* ── Back + Heading ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-navy transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "#102452" }}>
            All Orders
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Complete history of orders across all stores.
          </p>
        </div>
        {/* Store filter */}
        <div className="relative">
          <button
            onClick={() => setStoreOpen(!storeOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            style={{ color: "#102452" }}
          >
            <SlidersHorizontal size={15} className="text-gray-400" />
            {storeFilter}
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          {storeOpen && (
            <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl border border-gray-100 shadow-xl z-20 py-1 overflow-hidden">
              {["All Stores", "Store 1", "Store 2"].map((s) => (
                <button
                  key={s}
                  onClick={() => { setStoreFilter(s); setStoreOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                    storeFilter === s ? "font-semibold text-white" : "text-gray-700 hover:bg-gray-50"
                  }`}
                  style={storeFilter === s ? { backgroundColor: "#0B2A63" } : {}}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Status filter tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              statusFilter === s
                ? "text-white border-transparent shadow-sm"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
            style={statusFilter === s ? { backgroundColor: "#0B2A63", borderColor: "#0B2A63" } : {}}
          >
            {s}
          </button>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Search row */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 text-sm transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC" }}>
                {["Order ID", "Customer Name", "Amount", "Store", "Status", "Time"].map((h) => (
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400 text-sm font-medium">
                    No orders found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((order, i) => (
                  <tr key={i} className="hover:bg-gray-50/60 transition-colors">
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-400 font-medium">
            Showing {filtered.length} of {ALL_ORDERS.length} orders
          </p>
        </div>
      </div>
    </div>
  );
}
