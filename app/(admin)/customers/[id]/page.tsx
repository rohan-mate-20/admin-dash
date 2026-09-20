"use client";

import { use } from "react";
import { SuperAdminGuard } from "@/components/SuperAdminGuard";
import { mockCustomers, Customer, Order } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  IndianRupee,
  Package,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function CustomerAvatar({ name, color, size = 64 }: { name: string; color: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      className="rounded-2xl flex items-center justify-center font-bold text-white shadow-md shrink-0"
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  );
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;

  const customer = mockCustomers.find(
    (c) => c.id.toLowerCase() === customerId.toLowerCase()
  );

  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  if (!customer) {
    return (
      <SuperAdminGuard>
        <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
          <h2 className="text-xl font-bold text-navy mb-2">Customer Not Found</h2>
          <p className="text-sm text-gray-500 mb-6">No customer record exists for ID: {customerId}</p>
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-sm font-bold rounded-xl"
          >
            <ArrowLeft size={16} /> Back to Customer List
          </Link>
        </div>
      </SuperAdminGuard>
    );
  }

  return (
    <SuperAdminGuard>
      <div className="space-y-6 pb-12">
        {/* ── Breadcrumb & Back ── */}
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-navy transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Customers
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-bold text-navy">{customer.name}</span>
        </div>

        {/* ── Customer Profile Header Banner ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              <CustomerAvatar name={customer.name} color={customer.avatarColor} size={68} />
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-2xl lg:text-3xl font-extrabold" style={{ color: "#102452" }}>
                    {customer.name}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500 font-medium">
                  <span className="font-mono bg-gray-100 px-2.5 py-0.5 rounded text-gray-700 font-bold">
                    {customer.id}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={13} className="text-gray-400" />
                    Joined on {customer.joinedDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-red" />
                    {customer.city}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-red/10 text-red border border-red/20">
                Super Admin Protected Record
              </span>
            </div>
          </div>
        </div>

        {/* ── Key Performance Cards (Removed Avg Order Value & Slot Preference) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Orders Placed</p>
              <p className="text-3xl font-extrabold text-navy mt-1">{customer.totalOrders}</p>
              <p className="text-xs text-gray-400 font-medium mt-1">Completed & processed orders</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag size={24} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Lifetime Spend</p>
              <p className="text-3xl font-extrabold text-navy mt-1">₹{customer.totalSpent.toLocaleString("en-IN")}</p>
              <p className="text-xs text-gray-400 font-medium mt-1">Total revenue generated</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
              <IndianRupee size={24} />
            </div>
          </div>
        </div>

        {/* ── Two-Column Detail Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Contact & Address Information */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <h2 className="text-base font-bold pb-3 border-b border-gray-100" style={{ color: "#102452" }}>
                Contact & Address
              </h2>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</p>
                  <p className="font-semibold text-navy flex items-center gap-2">
                    <Mail size={15} className="text-gray-400 shrink-0" />
                    {customer.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</p>
                  <p className="font-semibold text-navy flex items-center gap-2">
                    <Phone size={15} className="text-gray-400 shrink-0" />
                    {customer.phone}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Delivery Address</p>
                  <p className="font-medium text-gray-700 flex items-start gap-2 leading-relaxed">
                    <MapPin size={16} className="text-red shrink-0 mt-0.5" />
                    <span>
                      {customer.address}, {customer.city} - {customer.pincode}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customer Order History */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/30">
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "#102452" }}>
                    <FileText size={18} className="text-navy" />
                    Customer Order History
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Showing all past transactions and items purchased by {customer.name}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-navy text-white">
                  {customer.orderHistory.length} Orders Recorded
                </span>
              </div>

              {customer.orderHistory.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <Package size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No order history available for this customer yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {customer.orderHistory.map((order: Order) => {
                    const isExpanded = expandedOrder === order.id;
                    return (
                      <div key={order.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold text-sm text-navy">{order.id}</span>
                              <StatusBadge status={order.status} />
                              <span className="text-xs font-medium text-gray-400">• {order.date || order.time}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">{order.store}</span>
                              <span
                                className="font-bold px-2 py-0.5 rounded"
                                style={
                                  order.slot === "Slot 1"
                                    ? { backgroundColor: "#EFF6FF", color: "#1D4ED8" }
                                    : { backgroundColor: "#F5F3FF", color: "#6D28D9" }
                                }
                              >
                                {order.slot}
                              </span>
                              <span>Payment: {order.paymentMethod || "Online"}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-base font-extrabold text-navy">
                                ₹{order.amount.toLocaleString("en-IN")}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                {order.items ? `${order.items.length} items` : "Standard order"}
                              </p>
                            </div>
                            {order.items && order.items.length > 0 && (
                              <button
                                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 hover:border-navy text-navy transition-colors"
                              >
                                {isExpanded ? "Hide Items" : "View Items"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expandable Item Details */}
                        {isExpanded && order.items && (
                          <div className="mt-4 pt-4 border-t border-dashed border-gray-200 bg-gray-50/60 rounded-xl p-4 animate-in fade-in duration-150">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                              Ordered Items Breakdown:
                            </p>
                            <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-xs py-1 border-b border-gray-200/50 last:border-0"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded bg-white font-bold text-navy flex items-center justify-center border border-gray-200">
                                      {item.quantity}x
                                    </span>
                                    <span className="font-semibold text-gray-800">{item.name}</span>
                                  </div>
                                  <span className="font-bold text-navy">₹{item.total}</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between items-center text-xs font-bold text-navy">
                              <span>Total Invoice Amount:</span>
                              <span className="text-sm">₹{order.amount.toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SuperAdminGuard>
  );
}
