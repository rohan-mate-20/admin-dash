"use client";

import { StatusBadge } from "@/components/StatusBadge";
import { ALL_ORDERS, Order } from "@/lib/mockData";
import { ArrowLeft, Search, ChevronDown, Store as StoreIcon, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const STATUS_FILTERS = ["All", "Pending", "Packed", "Out for Delivery", "Delivered", "Cancelled"];
const STORE_OPTIONS = ["All Stores", "Store 1", "Store 2"];
const SLOT_OPTIONS = ["All Slots", "Slot 1", "Slot 2"];

export default function OrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [storeFilter, setStoreFilter] = useState("All Stores");
  const [slotFilter, setSlotFilter] = useState("All Slots");

  const [storeOpen, setStoreOpen] = useState(false);
  const [slotOpen, setSlotOpen] = useState(false);

  const storeRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (storeRef.current && !storeRef.current.contains(e.target as Node)) {
        setStoreOpen(false);
      }
      if (slotRef.current && !slotRef.current.contains(e.target as Node)) {
        setSlotOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = ALL_ORDERS.filter((o: Order) => {
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    const matchStore = storeFilter === "All Stores" || o.store === storeFilter;
    const matchSlot = slotFilter === "All Slots" || o.slot === slotFilter;
    return matchSearch && matchStatus && matchStore && matchSlot;
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

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "#102452" }}>
            All Orders
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Complete history of orders with Store and Slot filtering.
          </p>
        </div>

        {/* Filters: Store & Slot Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Store Filter */}
          <div ref={storeRef} className="relative">
            <button
              onClick={() => { setStoreOpen(!storeOpen); setSlotOpen(false); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
              style={{ color: "#102452" }}
            >
              <StoreIcon size={15} className="text-gray-400" />
              <span>{storeFilter}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${storeOpen ? "rotate-180" : ""}`} />
            </button>
            {storeOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-gray-100 shadow-xl z-20 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  Filter by Store
                </div>
                {STORE_OPTIONS.map((s) => (
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

          {/* Slot Filter */}
          <div ref={slotRef} className="relative">
            <button
              onClick={() => { setSlotOpen(!slotOpen); setStoreOpen(false); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
              style={{ color: "#102452" }}
            >
              <Clock size={15} className="text-gray-400" />
              <span>{slotFilter}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${slotOpen ? "rotate-180" : ""}`} />
            </button>
            {slotOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-gray-100 shadow-xl z-20 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  Filter by Slot
                </div>
                {SLOT_OPTIONS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => { setSlotFilter(slot); setSlotOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                      slotFilter === slot ? "font-semibold text-white" : "text-gray-700 hover:bg-gray-50"
                    }`}
                    style={slotFilter === slot ? { backgroundColor: "#0B2A63" } : {}}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
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
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 text-sm transition-all"
            />
          </div>
          <div className="text-xs font-semibold text-gray-400">
            Filters: <span className="text-navy">{storeFilter}</span> • <span className="text-navy">{slotFilter}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[760px]">
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC" }}>
                {["Order ID", "Customer Name", "Amount", "Store", "Delivery Slot", "Status", "Time"].map((h) => (
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
                  <td colSpan={7} className="py-16 text-center text-gray-400 text-sm font-medium">
                    No orders found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((order, i) => (
                  <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6 text-sm font-semibold border-b border-gray-50" style={{ color: "#102452" }}>
                      {order.id}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium border-b border-gray-50" style={{ color: "#102452" }}>
                      {order.name}
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold border-b border-gray-50" style={{ color: "#102452" }}>
                      ₹{order.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 border-b border-gray-50">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 font-medium text-xs">
                        {order.store}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm border-b border-gray-50">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold"
                        style={
                          order.slot === "Slot 1"
                            ? { backgroundColor: "#EFF6FF", color: "#1D4ED8" }
                            : { backgroundColor: "#F5F3FF", color: "#6D28D9" }
                        }
                      >
                        <Clock size={12} />
                        {order.slot}
                      </span>
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
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-400 font-medium">
            Showing {filtered.length} of {ALL_ORDERS.length} orders
          </p>
        </div>
      </div>
    </div>
  );
}
