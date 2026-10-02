"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SuperAdminGuard } from "@/components/SuperAdminGuard";
import { getCustomerDetail, getStores, CustomerDetail, Store } from "@/lib/supabaseService";
import { StatusBadge } from "@/components/StatusBadge";
import { ExportModal, ColumnDefinition } from "@/components/ExportModal";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShoppingBag,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const CUSTOMER_ORDER_EXPORT_COLUMNS: ColumnDefinition[] = [
  { key: "order_number", label: "Order Number" },
  { key: "items", label: "Items" },
  { key: "total", label: "Order Amount (₹)" },
  { key: "store_name", label: "Store" },
  { key: "delivery_slot_name", label: "Delivery Slot" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Order Date" },
];

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params?.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderFrom, setOrderFrom] = useState("");
  const [orderTo, setOrderTo] = useState("");
  const [orderStatus, setOrderStatus] = useState("All Statuses");
  const [orderStore, setOrderStore] = useState("All Stores");
  const [orderPage, setOrderPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  const [preparingExport, setPreparingExport] = useState(false);
  const [exportRows, setExportRows] = useState<CustomerDetail["orders"]>([]);
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const orderPageSize = 50;

  useEffect(() => {
    getStores().then(setStores).catch((error) => console.error("Failed to load stores:", error));
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!customerId) return;
      try {
        setHistoryLoading(true);
        setHistoryError("");
        const data = await getCustomerDetail(customerId, orderPage, orderPageSize, {
          from: orderFrom || undefined,
          to: orderTo || undefined,
          status: orderStatus,
          store: orderStore,
        });
        setCustomer(data);
      } catch (err) {
        console.error("Failed to load customer detail:", err);
        setHistoryError(err instanceof Error ? err.message : "Failed to load order history.");
      } finally {
        setLoading(false);
        setHistoryLoading(false);
      }
    }
    loadData();
  }, [customerId, orderPage, orderFrom, orderTo, orderStatus, orderStore]);

  const filteredOrders = customer?.orders ?? [];
  const orderStatuses = ["CREATED", "CONFIRMED", "PREPARING", "PACKED", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "PICKED_UP", "CANCELLED"];
  const customerOrderExportData = exportRows.map((order) => ({
    order_number: order.order_number || order.id.slice(0, 8),
    items: (order.items ?? []).map((item) => `${item.product_name} x ${item.quantity} (₹${item.line_total})`).join("; "),
    total: order.total,
    store_name: order.store_name,
    delivery_slot_name: order.delivery_slot_name ?? "",
    status: order.status,
    created_at: new Date(order.created_at).toLocaleString("en-IN"),
  }));
  const orderPageCount = Math.max(1, Math.ceil((customer?.total_orders ?? 0) / orderPageSize));

  async function prepareOrderExport() {
    if (!customer) return;
    setPreparingExport(true);
    setHistoryError("");
    try {
      const allOrders: CustomerDetail["orders"] = [];
      let page = 1;
      let total = 0;
      do {
        const result = await getCustomerDetail(customerId, page, 1000, {
          from: orderFrom || undefined,
          to: orderTo || undefined,
          status: orderStatus,
          store: orderStore,
        });
        if (!result) break;
        allOrders.push(...result.orders);
        total = result.total_orders;
        page += 1;
      } while (allOrders.length < total);
      setExportRows(allOrders);
      setExportOpen(true);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "Unable to prepare the order export.");
    } finally {
      setPreparingExport(false);
    }
  }

  const initials = customer?.name
    ? customer.name
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
                    {customer.name || "Unnamed Customer"}
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
                  <p className="text-[11px] font-bold text-green-600 uppercase">Spend on Page</p>
                  <p className="text-xl font-extrabold text-navy mt-0.5">
                    ₹{customer.total_spent.toLocaleString("en-IN")}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium text-green-600">Current history page</p>
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
                        <p className="font-semibold text-navy">{addr.line1}</p>
                        {addr.line2 && <p className="text-gray-500 text-xs">{addr.line2}</p>}
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
                <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-base font-bold text-navy flex items-center gap-2">
                      <ShoppingBag size={18} className="text-navy" />
                      Order History ({filteredOrders.length} of {customer.total_orders})
                    </h2>
                    <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-navy px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={filteredOrders.length === 0 || preparingExport} onClick={prepareOrderExport} type="button">
                      <Download size={15} /> {preparingExport ? "Preparing..." : "Export Excel"}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="grid gap-1 text-xs font-semibold text-gray-500">From<input className="min-h-10 rounded-lg border border-gray-200 px-3 text-sm font-normal text-gray-700" type="date" value={orderFrom} onChange={(event) => { setOrderFrom(event.target.value); setOrderPage(1); }} /></label>
                    <label className="grid gap-1 text-xs font-semibold text-gray-500">To<input className="min-h-10 rounded-lg border border-gray-200 px-3 text-sm font-normal text-gray-700" type="date" value={orderTo} onChange={(event) => { setOrderTo(event.target.value); setOrderPage(1); }} /></label>
                    <label className="grid gap-1 text-xs font-semibold text-gray-500">Status<select className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-normal text-gray-700" value={orderStatus} onChange={(event) => { setOrderStatus(event.target.value); setOrderPage(1); }}><option>All Statuses</option>{orderStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                    <label className="grid gap-1 text-xs font-semibold text-gray-500">Store<select className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-normal text-gray-700" value={orderStore} onChange={(event) => { setOrderStore(event.target.value); setOrderPage(1); }}><option>All Stores</option>{stores.map((store) => <option key={store.id}>{store.name}</option>)}</select></label>
                    {(orderFrom || orderTo || orderStatus !== "All Statuses" || orderStore !== "All Stores") && <button className="min-h-10 px-2 text-xs font-semibold text-gray-500 hover:text-navy" onClick={() => { setOrderFrom(""); setOrderTo(""); setOrderStatus("All Statuses"); setOrderStore("All Stores"); setOrderPage(1); }} type="button">Clear filters</button>}
                  </div>
                </div>
                {historyError && <p className="px-6 py-3 text-sm text-red-700" role="alert">{historyError}</p>}
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[720px]">
                    <thead>
                      <tr style={{ backgroundColor: "#F8FAFC" }}>
                        {["Order Number", "Items", "Amount", "Store", "Slot", "Status", "Date"].map((h) => (
                          <th key={h} className="py-3 px-6 text-xs font-semibold uppercase text-gray-400 border-b border-gray-100">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {historyLoading ? (
                        <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">Loading order history…</td></tr>
                      ) : filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                            No orders match these filters.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((o) => (
                          <tr key={o.id} className="hover:bg-gray-50/50 border-b border-gray-50 last:border-0">
                            <td className="py-3.5 px-6 text-sm font-semibold text-navy">
                              {o.order_number || o.id.slice(0, 8)}
                            </td>
                            <td className="py-3.5 px-6 text-xs text-gray-600">
                              {o.items?.length ? o.items.map((item) => (
                                <p key={item.product_id}>
                                  {item.product_name} × {item.quantity} · ₹{item.line_total.toLocaleString("en-IN")}
                                </p>
                              )) : "No item details"}
                            </td>
                            <td className="py-3.5 px-6 text-sm font-bold text-navy">
                              ₹{o.total.toLocaleString("en-IN")}
                            </td>
                            <td className="py-3.5 px-6 text-sm text-gray-500">
                              {o.store_name || "—"}
                            </td>
                            <td className="py-3.5 px-6 text-sm text-gray-500">
                              {o.delivery_slot_name || "—"}
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
                <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-500">Showing {filteredOrders.length ? (orderPage - 1) * orderPageSize + 1 : 0}–{Math.min(orderPage * orderPageSize, customer.total_orders)} of {customer.total_orders.toLocaleString("en-IN")} matching orders</p>
                  <div className="flex items-center gap-2">
                    <button aria-label="Previous customer orders page" className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 disabled:opacity-40" disabled={orderPage <= 1 || historyLoading} onClick={() => setOrderPage((page) => Math.max(1, page - 1))} type="button"><ChevronLeft size={14} /> Previous</button>
                    <span className="text-xs text-gray-500">{orderPage} / {orderPageCount}</span>
                    <button aria-label="Next customer orders page" className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 disabled:opacity-40" disabled={orderPage >= orderPageCount || historyLoading} onClick={() => setOrderPage((page) => Math.min(orderPageCount, page + 1))} type="button">Next <ChevronRight size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {customer && <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        reportType="Orders"
        availableColumns={CUSTOMER_ORDER_EXPORT_COLUMNS}
        data={customerOrderExportData}
        activeFilters={{
          datePreset: orderFrom || orderTo ? `${orderFrom || "Any date"} to ${orderTo || "Today"}` : "All Time",
          store: orderStore,
          slot: "All Slots",
          status: orderStatus,
        }}
      />}
    </SuperAdminGuard>
  );
}
