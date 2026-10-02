"use client";

import { useState, useRef, useEffect } from "react";
import { SuperAdminGuard } from "@/components/SuperAdminGuard";
import { getCustomers, getStores, CustomerRow, Store } from "@/lib/supabaseService";
import { ExportModal, ColumnDefinition } from "@/components/ExportModal";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  ShoppingBag,
  IndianRupee,
  Phone,
  Mail,
  Calendar,
  Store as StoreIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

function CustomerAvatar({ name }: { name: string }) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CU";
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-xs bg-navy"
    >
      {initials}
    </div>
  );
}

const CUSTOMER_EXPORT_COLUMNS: ColumnDefinition[] = [
  { key: "name", label: "Name", defaultSelected: true },
  { key: "email", label: "Email", defaultSelected: true },
  { key: "phone", label: "Phone", defaultSelected: true },
  { key: "address", label: "Address", defaultSelected: true },
  { key: "location", label: "Location", defaultSelected: true },
  { key: "total_orders", label: "Total Orders", defaultSelected: true },
  { key: "total_spent", label: "Total Spent (₹)", defaultSelected: true },
  { key: "last_order_date", label: "Last Order", defaultSelected: true },
  { key: "created_at", label: "Created Date", defaultSelected: true },
];

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("All Stores");
  const [stores, setStores] = useState<Store[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [storeOpen, setStoreOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [preparingExport, setPreparingExport] = useState(false);
  const [exportError, setExportError] = useState("");
  const [exportCustomers, setExportCustomers] = useState<CustomerRow[]>([]);
  const storeRef = useRef<HTMLDivElement>(null);
  const pageSize = 50;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (storeRef.current && !storeRef.current.contains(e.target as Node)) {
        setStoreOpen(false);
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
    async function loadCustomerData() {
      try {
        setLoading(true);
        const result = await getCustomers(search, storeFilter, currentPage, pageSize);
        setCustomers(result.customers);
        setTotalCount(result.total);
      } catch (err) {
        console.error("Failed to load customers:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCustomerData();
  }, [search, storeFilter, currentPage]);

  const totalSpent = customers.reduce((acc, c) => acc + c.total_spent, 0);
  const totalOrders = customers.reduce((acc, c) => acc + c.total_orders, 0);
  const storeOptions = ["All Stores", ...stores.map((s) => s.name)];
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  async function prepareExport() {
    setPreparingExport(true);
    setExportError("");
    try {
      const rows: CustomerRow[] = [];
      let page = 1;
      let total = 0;
      do {
        const result = await getCustomers(search, storeFilter, page, 1000);
        rows.push(...result.customers);
        total = result.total;
        page += 1;
      } while (rows.length < total);
      setExportCustomers(rows);
      setExportOpen(true);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Unable to prepare the customer export.");
    } finally {
      setPreparingExport(false);
    }
  }

  return (
    <SuperAdminGuard>
      <div className="space-y-6 pb-8">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold" style={{ color: "#102452" }}>
                Customers
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red/10 text-red border border-red/20">
                Super Admin Only
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Manage all registered customer records and order histories.
            </p>
          </div>

          {/* Actions: Store Filter & Export Excel */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Store Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-500">Store</span>
              <div ref={storeRef} className="relative">
                <button
                  type="button"
                  onClick={() => setStoreOpen(!storeOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors shadow-xs"
                  style={{ color: "#102452" }}
                >
                  <StoreIcon size={15} className="text-gray-400" />
                  <span>{storeFilter}</span>
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform duration-200 ${
                      storeOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {storeOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-gray-100 shadow-xl z-30 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      Filter by Store
                    </div>
                    {storeOptions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setStoreFilter(s);
                          setCurrentPage(1);
                          setStoreOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                          storeFilter === s
                            ? "font-semibold text-white"
                            : "text-gray-700 hover:bg-gray-50"
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

            {/* Export Excel Button */}
            <button
              onClick={prepareExport}
              disabled={preparingExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-xs disabled:opacity-60"
              style={{ backgroundColor: "#0B2A63" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#071D4A")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0B2A63")}
            >
              <Download size={15} />
              <span>{preparingExport ? "Preparing..." : "Export Excel"}</span>
            </button>
          </div>
        </div>
        {exportError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{exportError}</p>}

        {/* ── Overview Metrics ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Registered</p>
              <p className="text-2xl font-extrabold text-navy mt-0.5">{totalCount.toLocaleString("en-IN")}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Matching records</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Orders on This Page</p>
              <p className="text-2xl font-extrabold text-navy mt-0.5">{totalOrders}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Current page</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <IndianRupee size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Spend on This Page</p>
              <p className="text-2xl font-extrabold text-navy mt-0.5">₹{totalSpent.toLocaleString("en-IN")}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Current page</p>
            </div>
          </div>
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer name, email, phone or ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 text-sm transition-all"
              />
            </div>
            <div className="text-xs font-semibold text-gray-400 flex items-center gap-2">
              <span>Filter: <strong className="text-navy">{storeFilter}</strong></span>
              <span>•</span>
              <span>
                Showing <span className="text-navy font-bold">{customers.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, totalCount)}</span> of {totalCount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[850px]">
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC" }}>
                        {["Customer", "Contact Details", "Registered Date", "Orders", "Total Spent"].map(
                    (h) => (
                      <th
                        key={h}
                        className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-100"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-gray-400 text-sm font-medium">
                      Loading customer records...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-gray-400 text-sm font-medium">
                      No registered customers found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="cursor-pointer hover:bg-gray-50/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-navy transition-colors border-b border-gray-50 last:border-0"
                      onClick={() => router.push(`/customers/${customer.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") router.push(`/customers/${customer.id}`);
                      }}
                      role="link"
                      tabIndex={0}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <CustomerAvatar name={customer.name} />
                          <div>
                            <p className="text-sm font-bold leading-tight" style={{ color: "#102452" }}>
                              {customer.name || "Unnamed Customer"}
                            </p>
                            <span className="text-xs font-mono text-gray-400 mt-0.5 block">{customer.id.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-sm">
                        <div className="space-y-0.5">
                          {customer.email && (
                            <p className="text-xs text-gray-700 font-medium flex items-center gap-1.5">
                              <Mail size={12} className="text-gray-400 shrink-0" />
                              {customer.email}
                            </p>
                          )}
                          {customer.phone && (
                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                              <Phone size={12} className="text-gray-400 shrink-0" />
                              {customer.phone}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5 text-xs font-medium text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-gray-400" />
                          {new Date(customer.created_at).toLocaleDateString("en-IN", {
                            dateStyle: "medium",
                          })}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                          {customer.total_orders} orders
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <p className="text-sm font-extrabold text-navy">
                          ₹{customer.total_spent.toLocaleString("en-IN")}
                        </p>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">Page {currentPage} of {totalPages} · 50 customers per page</p>
            <div className="flex items-center gap-2">
              <button aria-label="Previous customers page" className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 disabled:opacity-40" disabled={currentPage <= 1 || loading} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} type="button"><ChevronLeft size={14} /> Previous</button>
              <button aria-label="Next customers page" className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 disabled:opacity-40" disabled={currentPage >= totalPages || loading} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} type="button">Next <ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        reportType="Customers"
        availableColumns={CUSTOMER_EXPORT_COLUMNS}
        data={exportCustomers as unknown as Record<string, unknown>[]}
        activeFilters={{
          datePreset: "All Time",
          store: storeFilter,
          slot: "All Slots",
          status: "All Statuses",
          searchQuery: search,
        }}
      />
    </SuperAdminGuard>
  );
}
