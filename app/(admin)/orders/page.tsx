"use client";

import { StatusBadge } from "@/components/StatusBadge";
import { SuperAdminGuard } from "@/components/SuperAdminGuard";
import { getOrders, getStores, getPeriodDateRange, OrderRow, Store } from "@/lib/supabaseService";
import { useAuth } from "@/lib/AuthContext";
import { ArrowLeft, Search, ChevronDown, ChevronLeft, ChevronRight, Store as StoreIcon, Clock, Download } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ExportModal, ColumnDefinition } from "@/components/ExportModal";
import Link from "next/link";

const ORDER_EXPORT_COLUMNS: ColumnDefinition[] = [
  { key: "order_number", label: "Order Number" },
  { key: "customer_name", label: "Customer Name" },
  { key: "total", label: "Amount (₹)" },
  { key: "store_name", label: "Store" },
  { key: "order_type", label: "Order Type" },
  { key: "delivery_slot_name", label: "Delivery Slot" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Date & Time" },
];

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

const PERIOD_FILTERS: ("Day" | "Week" | "Month" | "Year" | "All Time")[] = [
  "Day",
  "Week",
  "Month",
  "Year",
  "All Time",
];

const SLOT_OPTIONS = ["All Slots", "Slot 1", "Slot 2"];

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSuperAdmin } = useAuth();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [searchBy, setSearchBy] = useState<"order" | "customer" | "amount">("order");
  const [highlightOrderId] = useState(() => searchParams.get("highlight") ?? "");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [statusFilter, setStatusFilter] = useState("All");
  const [periodFilter, setPeriodFilter] = useState<"Day" | "Week" | "Month" | "Year" | "All Time">("All Time");
  const [recentOrdersOnly, setRecentOrdersOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"created_at" | "total" | "order_number">("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [storeFilter, setStoreFilter] = useState("All Stores");
  const [slotFilter, setSlotFilter] = useState("All Slots");
  const [stores, setStores] = useState<Store[]>([]);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [preparingExport, setPreparingExport] = useState(false);
  const [exportError, setExportError] = useState("");
  const [exportOrders, setExportOrders] = useState<OrderRow[]>([]);

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
        const { from, to } = getPeriodDateRange(recentOrdersOnly ? "Last 7 Days" : periodFilter);

        const { orders: fetchedOrders, total } = await getOrders(
          {
            search,
            searchBy,
            status: statusFilter,
            store: storeFilter,
            slot: slotFilter,
            from,
            to,
            orderId: highlightOrderId || undefined,
            sortBy,
            sortDirection,
          },
          isSuperAdmin,
          currentPage,
          pageSize
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
  }, [search, searchBy, statusFilter, periodFilter, recentOrdersOnly, storeFilter, slotFilter, isSuperAdmin, highlightOrderId, sortBy, sortDirection, currentPage, pageSize]);

  useEffect(() => {
    if (!highlightOrderId || loading || !orders.some((order) => order.id === highlightOrderId)) return;
    document.getElementById(`order-${highlightOrderId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightOrderId, loading, orders]);

  const storeOptions = ["All Stores", ...stores.map((s) => s.name)];
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  async function prepareExport() {
    setPreparingExport(true);
    setExportError("");
    try {
      const { from, to } = getPeriodDateRange(recentOrdersOnly ? "Last 7 Days" : periodFilter);
      const allOrders: OrderRow[] = [];
      let page = 1;
      let total = 0;
      do {
        const result = await getOrders({
          search,
          searchBy,
          status: statusFilter,
          store: storeFilter,
          slot: slotFilter,
          from,
          to,
          orderId: highlightOrderId || undefined,
          sortBy,
          sortDirection,
        }, isSuperAdmin, page, 1000);
        allOrders.push(...result.orders);
        total = result.total;
        page += 1;
      } while ((page - 1) * 1000 < total);

      setExportOrders(allOrders);
      setExportOpen(true);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Unable to prepare the orders export.");
    } finally {
      setPreparingExport(false);
    }
  }

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
              Complete history of orders filtered by period, store, slot, and status.
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
                        setCurrentPage(1);
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
                        setCurrentPage(1);
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
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60" disabled={preparingExport} onClick={prepareExport} type="button">
              <Download size={16} /> {preparingExport ? "Preparing..." : "Export Excel"}
            </button>
          </div>
        </div>
        {exportError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{exportError}</p>}

        {/* ── Period filter tabs ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-gray-200 rounded-xl shadow-xs">
            {PERIOD_FILTERS.map((p) => (
              <button
                key={p}
                onClick={() => { setPeriodFilter(p); setCurrentPage(1); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  periodFilter === p
                    ? "bg-navy text-white shadow-xs"
                    : "text-gray-600 hover:text-navy hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="text-xs font-semibold text-gray-400">
            Period: <span className="text-navy">{periodFilter}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            Order view
            <select className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700" value={recentOrdersOnly ? "recent" : "all"} onChange={(event) => { setRecentOrdersOnly(event.target.value === "recent"); setCurrentPage(1); }}>
              <option value="recent">Recent Orders (7 days)</option>
              <option value="all">All Orders</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            Sort by
            <select className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700" value={sortBy} onChange={(event) => { setSortBy(event.target.value as typeof sortBy); setCurrentPage(1); }}>
              <option value="created_at">Date &amp; Time</option>
              <option value="total">Order Amount</option>
              <option value="order_number">Order ID</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            Direction
            <select className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700" value={sortDirection} onChange={(event) => { setSortDirection(event.target.value as typeof sortDirection); setCurrentPage(1); }}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>
        </div>

        {/* ── Status filter tabs ── */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
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
                type={searchBy === "amount" ? "number" : "text"}
                placeholder={searchBy === "order" ? "Search order number..." : searchBy === "customer" ? "Search customer name..." : "Exact order amount..."}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 text-sm transition-all"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              Search by
              <select className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700" onChange={(event) => { setSearchBy(event.target.value as typeof searchBy); setSearch(""); setCurrentPage(1); }} value={searchBy}>
                <option value="order">Order ID</option>
                {isSuperAdmin && <option value="customer">Customer</option>}
                <option value="amount">Amount</option>
              </select>
            </label>
            <div className="text-xs font-semibold text-gray-400">
              Filters: <span className="text-navy">{periodFilter}</span> • <span className="text-navy">{storeFilter}</span> • <span className="text-navy">{slotFilter}</span>
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
                    <tr id={`order-${order.id}`} key={order.id} className={`hover:bg-gray-50/60 transition-colors ${highlightOrderId === order.id ? "bg-amber-50 ring-1 ring-inset ring-amber-300" : ""}`}>
                      <td className="py-4 px-6 text-sm font-semibold border-b border-gray-50" style={{ color: "#102452" }}>
                        {order.order_number || order.id.slice(0, 8)}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium border-b border-gray-50" style={{ color: "#102452" }}>
                        {order.customer_id ? (
                          <Link className="hover:underline" href={`/customers/${order.customer_id}`}>
                            {order.customer_name || "View customer"}
                          </Link>
                        ) : order.customer_name || "—"}
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
                          {order.order_type} {order.delivery_slot_name ? `• ${order.delivery_slot_name}` : ""}
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
          <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">Showing {orders.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString("en-IN")} orders</p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500">Rows
                <select className="min-h-9 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700" onChange={(event) => { setPageSize(Number(event.target.value)); setCurrentPage(1); }} value={pageSize}>
                  <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
                </select>
              </label>
              <button aria-label="Previous orders page" className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 disabled:opacity-40" disabled={currentPage <= 1 || loading} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} type="button"><ChevronLeft size={14} /> Previous</button>
              <span className="text-xs text-gray-500">{currentPage} / {totalPages}</span>
              <button aria-label="Next orders page" className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 disabled:opacity-40" disabled={currentPage >= totalPages || loading} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} type="button">Next <ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      </div>
      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        reportType="Orders"
        availableColumns={ORDER_EXPORT_COLUMNS}
        data={exportOrders as unknown as Record<string, unknown>[]}
        activeFilters={{ datePreset: recentOrdersOnly ? "Recent Orders (7 days)" : periodFilter, store: storeFilter, slot: slotFilter, status: statusFilter, searchQuery: search }}
      />
    </SuperAdminGuard>
  );
}
