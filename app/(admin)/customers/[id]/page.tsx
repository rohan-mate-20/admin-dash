"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SuperAdminGuard } from "@/components/SuperAdminGuard";
import { getCustomerDetail, CustomerDetail } from "@/lib/supabaseService";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShoppingBag,
  IndianRupee,
  Clock,
  Building2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!customerId) return;
      try {
        setLoading(true);
        const data = await getCustomerDetail(customerId);
        setCustomer(data);
      } catch (err) {
        console.error("Failed to load customer detail:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [customerId]);

  const initials = customer?.full_name
    ? customer.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CU";

  return (
    <SuperAdminGuard>
      <div className="space-y-6 pb-8">
        {/* Back Link */}
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-navy transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Customers
        </Link>

        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400">
            Loading customer profile...
          </div>
        ) : !customer ? (
          <div className="py-20 text-center">
            <h2 className="text-xl font-bold text-navy">Customer Not Found</h2>
            <p className="text-sm text-gray-500 mt-1">
              Could not find customer record with ID: {customerId}
            </p>
          </div>
        ) : (
          <>
            {/* Customer Overview Card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-navy text-white text-xl font-extrabold flex items-center justify-center shrink-0 shadow-md">
                  {initials}
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-navy">
                    {customer.full_name || "Unnamed Customer"}
                  </h1>
                  <p className="text-xs font-mono text-gray-400 mt-0.5">
                    ID: {customer.id}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-600 font-medium">
                    {customer.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail size={13} className="text-gray-400" />
                        {customer.email}
                      </span>
                    )}
                    {customer.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone size={13} className="text-gray-400" />
                        {customer.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-gray-400" />
                      Joined {new Date(customer.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="px-5 py-3 rounded-2xl bg-blue-50 border border-blue-100 flex-1 md:flex-initial">
                  <p className="text-[11px] font-bold text-blue-600 uppercase">Total Orders</p>
                  <p className="text-xl font-extrabold text-navy mt-0.5">{customer.total_orders}</p>
                </div>
                <div className="px-5 py-3 rounded-2xl bg-green-50 border border-green-100 flex-1 md:flex-initial">
                  <p className="text-[11px] font-bold text-green-600 uppercase">Total Spent</p>
                  <p className="text-xl font-extrabold text-navy mt-0.5">
                    ₹{customer.total_spent.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Addresses List */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-base font-bold text-navy mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-red" />
                  Saved Addresses ({customer.addresses.length})
                </h2>
                {customer.addresses.length === 0 ? (
                  <p className="text-sm text-gray-400">No saved addresses on file.</p>
                ) : (
                  <div className="space-y-3">
                    {customer.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-4 rounded-xl border text-sm ${
                          addr.is_default ? "border-navy/20 bg-blue-50/30" : "border-gray-100 bg-gray-50/50"
                        }`}
                      >
                        {addr.is_default && (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-navy text-white uppercase mb-2">
                            Default Address
                          </span>
                        )}
                        <p className="font-semibold text-navy">{addr.address_line1}</p>
                        {addr.address_line2 && <p className="text-gray-500 text-xs">{addr.address_line2}</p>}
                        <p className="text-gray-600 text-xs mt-1">
                          {addr.city}, {addr.state} — {addr.pincode}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order History */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-base font-bold text-navy flex items-center gap-2">
                    <ShoppingBag size={18} className="text-navy" />
                    Complete Order History ({customer.orders.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[500px]">
                    <thead>
                      <tr style={{ backgroundColor: "#F8FAFC" }}>
                        {["Order Number", "Amount", "Store", "Status", "Date"].map((h) => (
                          <th key={h} className="py-3 px-6 text-xs font-semibold uppercase text-gray-400 border-b border-gray-100">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {customer.orders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-sm text-gray-400">
                            No orders placed yet.
                          </td>
                        </tr>
                      ) : (
                        customer.orders.map((o) => (
                          <tr key={o.id} className="hover:bg-gray-50/50 border-b border-gray-50 last:border-0">
                            <td className="py-3.5 px-6 text-sm font-semibold text-navy">
                              {o.order_number || o.id.slice(0, 8)}
                            </td>
                            <td className="py-3.5 px-6 text-sm font-bold text-navy">
                              ₹{o.total.toLocaleString("en-IN")}
                            </td>
                            <td className="py-3.5 px-6 text-sm text-gray-500">
                              {o.store_name || "—"}
                            </td>
                            <td className="py-3.5 px-6">
                              <StatusBadge status={o.status} />
                            </td>
                            <td className="py-3.5 px-6 text-xs text-gray-500">
                              {new Date(o.created_at).toLocaleDateString("en-IN", {
                                dateStyle: "short",
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
          </>
        )}
      </div>
    </SuperAdminGuard>
  );
}
