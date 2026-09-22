"use client";

import { useState, useRef, useEffect } from "react";
import { SuperAdminGuard } from "@/components/SuperAdminGuard";
import { mockCustomers, Customer } from "@/lib/mockData";
import { ExportModal, ColumnDefinition } from "@/components/ExportModal";
import {
  Users,
  Search,
  ArrowRight,
  ShoppingBag,
  IndianRupee,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Store,
  ChevronDown,
  Download,
} from "lucide-react";
import Link from "next/link";

function CustomerAvatar({ name, color }: { name: string; color: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-xs"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

const CUSTOMER_EXPORT_COLUMNS: ColumnDefinition[] = [
  { key: "id", label: "Customer ID", defaultSelected: true },
  { key: "name", label: "Customer Name", defaultSelected: true },
  { key: "email", label: "Email Address", defaultSelected: true },
  { key: "phone", label: "Phone Number", defaultSelected: true },
  { key: "city", label: "City", defaultSelected: true },
  { key: "pincode", label: "Pincode", defaultSelected: true },
  { key: "address", label: "Full Address", defaultSelected: false },
  { key: "joinedDate", label: "Registration Date", defaultSelected: true },
  { key: "totalOrders", label: "Total Orders", defaultSelected: true },
  { key: "totalSpent", label: "Total Amount Spent (₹)", defaultSelected: true },
];

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("All Stores");
  const [storeOpen, setStoreOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const storeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (storeRef.current && !storeRef.current.contains(e.target as Node)) {
        setStoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = mockCustomers.filter((c: Customer) => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q);
    const matchesStore = storeFilter === "All Stores" || c.defaultStore === storeFilter;
    return matchesSearch && matchesStore;
  });

  const totalSpent = mockCustomers.reduce((acc, c) => acc + c.totalSpent, 0);
  const totalOrders = mockCustomers.reduce((acc, c) => acc + c.totalOrders, 0);

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
          <div className="flex items-center gap-3">
            {/* Store Filter Dropdown in Top Header */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-500">Store</span>
              <div ref={storeRef} className="relative">
                <button
                  type="button"
                  onClick={() => setStoreOpen(!storeOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors shadow-xs"
                  style={{ color: "#102452" }}
                >
                  <Store size={15} className="text-gray-400" />
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
                    {["All Stores", "Store 1", "Store 2"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setStoreFilter(s);
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
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-xs"
              style={{ backgroundColor: "#0B2A63" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#071D4A")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0B2A63")}
            >
              <Download size={15} />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* ── Overview Metrics ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Registered</p>
              <p className="text-2xl font-extrabold text-navy mt-0.5">{mockCustomers.length}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">All customer accounts</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Orders Placed</p>
              <p className="text-2xl font-extrabold text-navy mt-0.5">{totalOrders}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Combined customer orders</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <IndianRupee size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Customer Spend</p>
              <p className="text-2xl font-extrabold text-navy mt-0.5">₹{totalSpent.toLocaleString("en-IN")}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Lifetime revenue</p>
            </div>
          </div>
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table Search & Status bar */}
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer name, email, phone, city or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 text-sm transition-all"
              />
            </div>
            <div className="text-xs font-semibold text-gray-400 flex items-center gap-2">
              <span>Filter: <strong className="text-navy">{storeFilter}</strong></span>
              <span>•</span>
              <span>
                Showing <span className="text-navy font-bold">{filtered.length}</span> of {mockCustomers.length} registered customers
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[850px]">
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC" }}>
                  {["Customer", "Contact Details", "Location", "Registered Date", "Orders", "Total Spent", "Action"].map(
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400 text-sm font-medium">
                      No registered customers found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((customer: Customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-gray-50/60 transition-colors border-b border-gray-50 last:border-0"
                    >
                      {/* Customer Name & ID */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <CustomerAvatar name={customer.name} color={customer.avatarColor} />
                          <div>
                            <p className="text-sm font-bold leading-tight" style={{ color: "#102452" }}>
                              {customer.name}
                            </p>
                            <span className="text-xs font-mono text-gray-400 mt-0.5 block">{customer.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-5 text-sm">
                        <div className="space-y-0.5">
                          <p className="text-xs text-gray-700 font-medium flex items-center gap-1.5">
                            <Mail size={12} className="text-gray-400 shrink-0" />
                            {customer.email}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <Phone size={12} className="text-gray-400 shrink-0" />
                            {customer.phone}
                          </p>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-5 text-sm">
                        <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                          <MapPin size={12} className="text-red shrink-0" />
                          {customer.city}
                        </p>
                        <p className="text-[11px] text-gray-400 ml-4">{customer.pincode}</p>
                      </td>

                      {/* Registered Date */}
                      <td className="py-4 px-5 text-xs font-medium text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-gray-400" />
                          {customer.joinedDate}
                        </span>
                      </td>

                      {/* Orders */}
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                          {customer.totalOrders} orders
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-4 px-5">
                        <p className="text-sm font-extrabold text-navy">
                          ₹{customer.totalSpent.toLocaleString("en-IN")}
                        </p>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-5">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-gray-200 hover:border-navy hover:text-white hover:bg-navy shadow-xs"
                          style={{ color: "#102452" }}
                        >
                          <span>Details</span>
                          <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between text-xs text-gray-500">
            <span>Customer Directory restricted to Super Admin role</span>
            <span>All registered customers displayed</span>
          </div>
        </div>
      </div>

      {/* ── Customer Export Modal ── */}
      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        reportType="Customers"
        availableColumns={CUSTOMER_EXPORT_COLUMNS}
        data={filtered as unknown as Record<string, unknown>[]}
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
