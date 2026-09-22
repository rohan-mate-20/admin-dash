"use client";

import { StatusBadge } from "@/components/StatusBadge";
import { SuperAdminGuard } from "@/components/SuperAdminGuard";
import { getOrders, getStores, OrderRow, Store } from "@/lib/supabaseService";
import { useAuth } from "@/lib/AuthContext";
import { ArrowLeft, Search, ChevronDown, Store as StoreIcon, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const STATUS_FILTERS = [
  "All",
  "CREATED",
  "CONFIRMED",
  "PREPARING",
  "PACKED",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const SLOT_OPTIONS = ["All Slots", "Slot 1", "Slot 2"];

export default function OrdersPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [storeFilter, setStoreFilter] = useState("All Stores");
  const [slotFilter, setSlotFilter] = useState("All Slots");
  const [stores, setStores] = useState<Store[]>([]);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    async function loadStores() {
      try {
        const storeList = await getStores();
        setStores(storeList);
      } catch (err) {
        console.error("Failed to load stores:", err);
      }
    }
    loadStores();
  }, []);

  useEffect(() => {
    async function loadOrdersData() {
      try {
        setLoading(true);
        const { orders: fetchedOrders, total } = await getOrders(
          {
            search,
            status: statusFilter,
            store: storeFilter,
            slot: slotFilter,
          },
          isSuperAdmin,
          1,
          50
        );
        setOrders(fetchedOrders);
        setTotalCount(total);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    }

    loadOrdersData();
  }, [search, statusFilter, storeFilter, slotFilter, isSuperAdmin]);

  const storeOptions = ["All Stores", ...stores.map((s) => s.name)];

  return (
    <SuperAdminGuard>
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
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold" style={{ color: "#102452" }}>
                All Orders
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red/10 text-red border border-red/20">
                Super Admin Only
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Complete history of orders with Store, Slot, and Customer details.
            </p>
          </div>

          {/* Filters: Store & Slot Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Store Filter */}
            <div ref={storeRef} className="relative">
              <button
                onClick={() => {
                  setStoreOpen(!storeOpen);
                  setSlotOpen(false);
                }}
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
                  {storeOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStoreFilter(s);
                        setStoreOpen(false);
                      }}
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
                onClick={() => {
                  setSlotOpen(!slotOpen);
                  setStoreOpen(false);
                }}
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
                  {SLOT_OPTIONS.map((sl) => (
                    <button
                      key={sl}
                      onClick={() => {
                        setSlotFilter(sl);
                        setSlotOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                        slotFilter === sl ? "font-semibold text-white" : "text-gray-700 hover:bg-gray-50"
                      }`}
                      style={slotFilter === sl ? { backgroundColor: "#0B2A63" } : {}}
                    >
                      {sl}
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
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
                placeholder="Search by order number, customer, amount..."
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
                  {["Order Number", "Customer Name", "Amount", "Store", "Type / Slot", "Status", "Date & Time"].map((h) => (
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
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400 text-sm font-medium">
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400 text-sm font-medium">
                      No orders found matching your filters.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-4 px-6 text-sm font-semibold border-b border-gray-50" style={{ color: "#102452" }}>
                        {order.order_number || order.id.slice(0, 8)}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium border-b border-gray-50" style={{ color: "#102452" }}>
                        {order.customer_name || "—"}
                      </td>
                      <td className="py-4 px-6 text-sm font-semibold border-b border-gray-50" style={{ color: "#102452" }}>
                        ₹{order.total.toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 border-b border-gray-50">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 font-medium text-xs">
                          {order.store_name || "—"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm border-b border-gray-50">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700">
                          {order.type} {order.delivery_slot ? `• ${order.delivery_slot}` : ""}
                        </span>
                      </td>
                      <td className="py-4 px-6 border-b border-gray-50">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500 border-b border-gray-50">
                        {new Date(order.created_at).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
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
              Showing {orders.length} of {totalCount} orders
            </p>
          </div>
        </div>
      </div>
    </SuperAdminGuard>
  );
}
