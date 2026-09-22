"use client";

import { useState, useRef, useEffect } from "react";
import {
  getReportKPIs,
  getProductSales,
  getStores,
  ReportKPIs,
  ProductSaleRow,
  Store,
  ReportFilters,
} from "@/lib/supabaseService";
import { exportToExcel } from "@/lib/reportService";
import {
  BarChart3,
  Calendar,
  Store as StoreIcon,
  Clock,
  Filter,
  Download,
  IndianRupee,
  ShoppingBag,
  Package,
  Users,
  Percent,
  ChevronDown,
} from "lucide-react";

const DATE_PRESETS = [
  "Today",
  "Yesterday",
  "Last 7 Days",
  "Last 30 Days",
  "This Month",
  "All Time",
];

const SLOT_OPTIONS = ["All Slots", "Slot 1", "Slot 2"];
const STATUS_OPTIONS = [
  "All Statuses",
  "CREATED",
  "CONFIRMED",
  "PREPARING",
  "PACKED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

export default function ReportsPage() {
  const [datePreset, setDatePreset] = useState("This Month");
  const [store, setStore] = useState("All Stores");
  const [stores, setStores] = useState<Store[]>([]);
  const [slot, setSlot] = useState("All Slots");
  const [status, setStatus] = useState("All Statuses");

  const [dateOpen, setDateOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [slotOpen, setSlotOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const [kpis, setKpis] = useState<ReportKPIs>({
    totalOrders: 0,
    totalSales: 0,
    totalProductsSold: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
  });
  const [products, setProducts] = useState<ProductSaleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const dateRef = useRef<HTMLDivElement>(null);
  const storeRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDateOpen(false);
      if (storeRef.current && !storeRef.current.contains(e.target as Node)) setStoreOpen(false);
      if (slotRef.current && !slotRef.current.contains(e.target as Node)) setSlotOpen(false);
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
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

  // Compute from / to dates based on preset
  function getDateRange(preset: string): { from?: string; to?: string } {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (preset === "Today") {
      return { from: todayStr, to: todayStr };
    }
    if (preset === "Yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split("T")[0];
      return { from: yStr, to: yStr };
    }
    if (preset === "Last 7 Days") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { from: d.toISOString().split("T")[0], to: todayStr };
    }
    if (preset === "Last 30 Days") {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return { from: d.toISOString().split("T")[0], to: todayStr };
    }
    if (preset === "This Month") {
      const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      return { from: start, to: todayStr };
    }
    return {};
  }

  useEffect(() => {
    async function loadReportData() {
      try {
        setLoading(true);
        const { from, to } = getDateRange(datePreset);
        const filters: ReportFilters = {
          from,
          to,
          store,
          slot,
          status,
        };

        const [kpiData, productData] = await Promise.all([
          getReportKPIs(filters),
          getProductSales(filters),
        ]);

        setKpis(kpiData);
        setProducts(productData);
      } catch (err) {
        console.error("Failed to load report data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReportData();
  }, [datePreset, store, slot, status]);

  const handleExport = () => {
    const exportData = products.map((p) => ({
      product_name: p.product_name,
      sku: p.sku,
      category: p.category,
      quantity_sold: p.quantity_sold,
      revenue: p.revenue,
      order_count: p.order_count,
      current_stock: p.current_stock,
      selling_price: p.selling_price,
    }));

    exportToExcel(
      `kmart_product_sales_report_${datePreset.toLowerCase().replace(/\s+/g, "_")}`,
      "Product Sales",
      exportData as unknown as Record<string, unknown>[],
      [
        { key: "product_name", label: "Product Name" },
        { key: "sku", label: "SKU" },
        { key: "category", label: "Category" },
        { key: "quantity_sold", label: "Quantity Sold" },
        { key: "revenue", label: "Revenue (₹)" },
        { key: "order_count", label: "Orders" },
        { key: "current_stock", label: "Current Stock" },
        { key: "selling_price", label: "Unit Price (₹)" },
      ]
    );
  };

  const storeOptions = ["All Stores", ...stores.map((s) => s.name)];

  return (
    <div className="space-y-6 pb-8">
      {/* ── Heading & Export ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "#102452" }}>
            Sales & Performance Reports
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time aggregate performance insights and item-level analysis.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors shadow-sm self-start sm:self-auto"
          style={{ backgroundColor: "#0B2A63" }}
        >
          <Download size={16} />
          Export Report
        </button>
      </div>

      {/* ── Filters Bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-wrap gap-3 items-center">
        {/* Date preset dropdown */}
        <div ref={dateRef} className="relative">
          <button
            onClick={() => setDateOpen(!dateOpen)}
            className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Calendar size={14} className="text-gray-500" />
            <span>{datePreset}</span>
            <ChevronDown size={12} />
          </button>
          {dateOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-40 bg-white rounded-xl border border-gray-100 shadow-xl z-20 py-1 overflow-hidden">
              {DATE_PRESETS.map((dp) => (
                <button
                  key={dp}
                  onClick={() => {
                    setDatePreset(dp);
                    setDateOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                    datePreset === dp ? "bg-navy text-white font-bold" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {dp}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Store dropdown */}
        <div ref={storeRef} className="relative">
          <button
            onClick={() => setStoreOpen(!storeOpen)}
            className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <StoreIcon size={14} className="text-gray-500" />
            <span>{store}</span>
            <ChevronDown size={12} />
          </button>
          {storeOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-40 bg-white rounded-xl border border-gray-100 shadow-xl z-20 py-1 overflow-hidden">
              {storeOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStore(s);
                    setStoreOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                    store === s ? "bg-navy text-white font-bold" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Slot dropdown */}
        <div ref={slotRef} className="relative">
          <button
            onClick={() => setSlotOpen(!slotOpen)}
            className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Clock size={14} className="text-gray-500" />
            <span>{slot}</span>
            <ChevronDown size={12} />
          </button>
          {slotOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-36 bg-white rounded-xl border border-gray-100 shadow-xl z-20 py-1 overflow-hidden">
              {SLOT_OPTIONS.map((sl) => (
                <button
                  key={sl}
                  onClick={() => {
                    setSlot(sl);
                    setSlotOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                    slot === sl ? "bg-navy text-white font-bold" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {sl}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status dropdown */}
        <div ref={statusRef} className="relative">
          <button
            onClick={() => setStatusOpen(!statusOpen)}
            className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Filter size={14} className="text-gray-500" />
            <span>{status}</span>
            <ChevronDown size={12} />
          </button>
          {statusOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-gray-100 shadow-xl z-20 py-1 overflow-hidden">
              {STATUS_OPTIONS.map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatus(st);
                    setStatusOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                    status === st ? "bg-navy text-white font-bold" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <ShoppingBag size={20} />
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase">Total Orders</p>
          <p className="text-2xl font-extrabold text-navy mt-1">{kpis.totalOrders}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-3">
            <IndianRupee size={20} />
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase">Total Sales</p>
          <p className="text-2xl font-extrabold text-navy mt-1">₹{kpis.totalSales.toLocaleString("en-IN")}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Package size={20} />
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase">Products Sold</p>
          <p className="text-2xl font-extrabold text-navy mt-1">{kpis.totalProductsSold}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <Users size={20} />
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase">Total Customers</p>
          <p className="text-2xl font-extrabold text-navy mt-1">{kpis.totalCustomers}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
            <Percent size={20} />
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase">Avg Order Value</p>
          <p className="text-2xl font-extrabold text-navy mt-1">₹{kpis.averageOrderValue}</p>
        </div>
      </div>

      {/* ── Product Performance Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: "#102452" }}>
            Product Performance Table
          </h2>
          <span className="text-xs text-gray-400 font-semibold">
            {products.length} products tracked
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[760px]">
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC" }}>
                {["Product", "Category", "Quantity Sold", "Revenue (₹)", "Orders", "Current Stock", "Price (₹)"].map((h) => (
                  <th key={h} className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-100">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                    Loading performance reports...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                    No sales recorded for the selected filter combination.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.product_id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold" style={{ color: "#102452" }}>{p.product_name}</p>
                      <p className="text-xs text-gray-400">{p.sku}</p>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{p.category || "—"}</td>
                    <td className="py-4 px-6 text-sm font-bold text-navy">{p.quantity_sold}</td>
                    <td className="py-4 px-6 text-sm font-bold text-navy">₹{p.revenue.toLocaleString("en-IN")}</td>
                    <td className="py-4 px-6 text-sm text-gray-500">{p.order_count}</td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`font-semibold ${p.current_stock <= 8 ? "text-red-600 font-bold" : "text-gray-700"}`}>
                        {p.current_stock}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">₹{p.selling_price}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
