"use client";

import { useState, useRef, useEffect } from "react";
import { SuperAdminGuard } from "@/components/SuperAdminGuard";
import { mockCustomers, Customer } from "@/lib/mockData";
import {
  Users,
  Search,
  ChevronDown,
  Store,
  Clock,
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  Award,
  Phone,
  Mail,
  SlidersHorizontal,
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
      className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

function TierBadge({ tier }: { tier: Customer["loyaltyTier"] }) {
  const getStyle = () => {
    switch (tier) {
      case "Platinum":
        return { bg: "#EDE9FE", color: "#6D28D9", border: "#DDD6FE" };
      case "Gold":
        return { bg: "#FEF3C7", color: "#B45309", border: "#FDE68A" };
      case "Silver":
        return { bg: "#F1F5F9", color: "#475569", border: "#E2E8F0" };
      case "Bronze":
        return { bg: "#FFEDD5", color: "#C2410C", border: "#FED7AA" };
    }
  };
  const s = getStyle();
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border"
      style={{ backgroundColor: s.bg, color: s.color, borderColor: s.border }}
    >
      <Award size={11} />
      {tier}
    </span>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("All Stores");
  const [statusFilter, setStatusFilter] = useState("All");
  const [slotFilter, setSlotFilter] = useState("All Slots");

  const [storeOpen, setStoreOpen] = useState(false);
  const [slotOpen, setSlotOpen] = useState(false);

  const storeRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (storeRef.current && !storeRef.current.contains(e.target as Node)) setStoreOpen(false);
      if (slotRef.current && !slotRef.current.contains(e.target as Node)) setSlotOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = mockCustomers.filter((c: Customer) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q);
    const matchStore = storeFilter === "All Stores" || c.defaultStore === storeFilter;
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    const matchSlot = slotFilter === "All Slots" || c.preferredSlot === slotFilter;
    return matchSearch && matchStore && matchStatus && matchSlot;
  });

  const totalSpent = mockCustomers.reduce((acc, c) => acc + c.totalSpent, 0);
  const totalOrders = mockCustomers.reduce((acc, c) => acc + c.totalOrders, 0);
  const activeCount = mockCustomers.filter((c) => c.status === "Active").length;

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
              Manage verified customer records, account profiles, and order histories.
            </p>
          </div>
        </div>

        {/* ── Overview Metrics ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Customers</p>
              <p className="text-2xl font-extrabold text-navy mt-0.5">{mockCustomers.length}</p>
              <p className="text-xs text-green-600 font-semibold flex items-center gap-0.5 mt-0.5">
                <TrendingUp size={12} /> {activeCount} active
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Orders</p>
              <p className="text-2xl font-extrabold text-navy mt-0.5">{totalOrders}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Avg {(totalOrders / mockCustomers.length).toFixed(1)} / customer</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Award size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Lifetime Revenue</p>
              <p className="text-2xl font-extrabold text-navy mt-0.5">₹{totalSpent.toLocaleString("en-IN")}</p>
              <p className="text-xs text-green-600 font-semibold mt-0.5">+24% this month</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avg Ticket Size</p>
              <p className="text-2xl font-extrabold text-navy mt-0.5">
                ₹{Math.round(totalSpent / totalOrders).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Across Store 1 & 2</p>
            </div>
          </div>
        </div>

        {/* ── Filters & Search ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status filter tabs */}
          <div className="flex gap-2">
            {["All", "Active", "Inactive"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  statusFilter === s
                    ? "text-white border-transparent shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
                style={statusFilter === s ? { backgroundColor: "#0B2A63", borderColor: "#0B2A63" } : {}}
              >
                {s} ({s === "All" ? mockCustomers.length : mockCustomers.filter((c) => c.status === s).length})
              </button>
            ))}
          </div>

          {/* Store & Slot dropdown filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Store Filter */}
            <div ref={storeRef} className="relative">
              <button
                onClick={() => { setStoreOpen(!storeOpen); setSlotOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                style={{ color: "#102452" }}
              >
                <Store size={15} className="text-gray-400" />
                <span>{storeFilter}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${storeOpen ? "rotate-180" : ""}`} />
              </button>
              {storeOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-gray-100 shadow-xl z-20 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    Store Filter
                  </div>
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

            {/* Slot Filter */}
            <div ref={slotRef} className="relative">
              <button
                onClick={() => { setSlotOpen(!slotOpen); setStoreOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                style={{ color: "#102452" }}
              >
                <Clock size={15} className="text-gray-400" />
                <span>{slotFilter}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${slotOpen ? "rotate-180" : ""}`} />
              </button>
              {slotOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-gray-100 shadow-xl z-20 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    Preferred Slot
                  </div>
                  {["All Slots", "Slot 1", "Slot 2"].map((slot) => (
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

        {/* ── Table Card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table Search Bar */}
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
            <div className="text-xs font-semibold text-gray-400">
              Showing <span className="text-navy font-bold">{filtered.length}</span> of {mockCustomers.length} registered customers
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC" }}>
                  {["Customer", "Contact Details", "Location", "Store & Slot", "Loyalty Tier", "Orders / Spent", "Status", "Action"].map(
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
                    <td colSpan={8} className="py-16 text-center text-gray-400 text-sm font-medium">
                      No customers match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((customer: Customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50/60 transition-colors border-b border-gray-50 last:border-0">
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
                            <Mail size={12} className="text-gray-400" />
                            {customer.email}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <Phone size={12} className="text-gray-400" />
                            {customer.phone}
                          </p>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-5 text-sm">
                        <p className="text-xs font-semibold text-gray-700">{customer.city}</p>
                        <p className="text-[11px] text-gray-400">{customer.pincode}</p>
                      </td>

                      {/* Store & Slot */}
                      <td className="py-4 px-5 text-sm">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-[11px] font-semibold text-gray-700">
                            {customer.defaultStore}
                          </span>
                          <div>
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold"
                              style={
                                customer.preferredSlot === "Slot 1"
                                  ? { backgroundColor: "#EFF6FF", color: "#1D4ED8" }
                                  : { backgroundColor: "#F5F3FF", color: "#6D28D9" }
                              }
                            >
                              <Clock size={10} />
                              {customer.preferredSlot}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tier */}
                      <td className="py-4 px-5">
                        <TierBadge tier={customer.loyaltyTier} />
                      </td>

                      {/* Orders / Spend */}
                      <td className="py-4 px-5">
                        <p className="text-sm font-bold text-navy">
                          ₹{customer.totalSpent.toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-gray-400">{customer.totalOrders} total orders</p>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            customer.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {customer.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-5">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-gray-200 hover:border-navy hover:text-white hover:bg-navy shadow-sm"
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
            <span>Security Policy: Active RBAC</span>
          </div>
        </div>
      </div>
    </SuperAdminGuard>
  );
}
