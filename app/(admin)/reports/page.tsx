"use client";

import { useState, useRef, useEffect } from "react";
import {
  getReportKPIs,
  getProductSales,
  getStores,
  getPeriodDateRange,
  ReportKPIs,
  ProductSaleRow,
  Store,
  ReportFilters,
} from "@/lib/supabaseService";
import { ExportModal, ColumnDefinition } from "@/components/ExportModal";
import {
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
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const DATE_PRESETS = [
  "Day",
  "Week",
  "Month",
  "Year",
  "All Time",
  "Custom Range",
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

const PRODUCT_EXPORT_COLUMNS: ColumnDefinition[] = [
  { key: "product_name", label: "Product Name" },
  { key: "sku", label: "SKU" },
  { key: "category", label: "Category" },
  { key: "quantity_sold", label: "Quantity Sold" },
  { key: "revenue", label: "Revenue (₹)" },
  { key: "order_count", label: "Orders" },
  { key: "current_stock", label: "Current Stock" },
  { key: "selling_price", label: "Unit Price (₹)" },
  { key: "store_name", label: "Store" },
];

type ReportDatePreset = "Day" | "Week" | "Month" | "Year" | "All Time" | "Custom Range";

export default function ReportsPage() {
  const [datePreset, setDatePreset] = useState<ReportDatePreset>("Month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [store, setStore] = useState("All Stores");
  const [stores, setStores] = useState<Store[]>([]);
  const [slot, setSlot] = useState("All Slots");
  const [status, setStatus] = useState("All Statuses");
  const [category, setCategory] = useState("All Categories");
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

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
  const [exportOpen, setExportOpen] = useState(false);

  const storeRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
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

  useEffect(() => {
    async function loadReportData() {
      try {
        setLoading(true);
        const { from, to } = datePreset === "Custom Range"
          ? { from: customFrom || undefined, to: customTo || undefined }
          : getPeriodDateRange(datePreset);
        const filters: ReportFilters = {
          from,
          to,
          store,
          slot,
          status,
          category,
        };

        const [kpiData, productData] = await Promise.all([
          getReportKPIs(filters),
          getProductSales({ ...filters, category: undefined }),
        ]);

        setKpis(kpiData);
        setCategoryOptions([...new Set(productData.map((product) => product.category).filter(Boolean))].sort());
        setProducts(category === "All Categories" ? productData : productData.filter((product) => product.category === category));
      } catch (err) {
        console.error("Failed to load report data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReportData();
  }, [datePreset, customFrom, customTo, store, slot, status, category]);

  const exportData = products.map((product) => ({
    product_name: product.product_name,
    sku: product.sku,
    category: product.category,
    quantity_sold: product.quantity_sold,
    revenue: product.revenue,
    order_count: product.order_count,
    current_stock: product.current_stock,
    selling_price: product.selling_price,
    store_name: product.store_name,
  }));

  const storeOptions = ["All Stores", ...stores.map((s) => s.name)];
  const topTenProducts = [...products].filter((product) => product.quantity_sold > 0).sort((a, b) => b.quantity_sold - a.quantity_sold).slice(0, 10);
  const lowestTenProducts = [...products].filter((product) => product.quantity_sold > 0).sort((a, b) => a.quantity_sold - b.quantity_sold).slice(0, 10);

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-red">Kmart analytics</p>
          <h1 className="text-2xl font-extrabold text-navy">Reports</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Sales performance and product activity in one workspace.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600">
            {datePreset === "Custom Range" ? `${customFrom || "Start"} – ${customTo || "Today"}` : datePreset}
            <span className="mx-2 text-gray-300">·</span>{store}
          </span>
          <button
            onClick={() => setExportOpen(true)}
            disabled={products.length === 0}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-navy px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} /> Export view
          </button>
        </div>
      </div>

      {/* ── Period Filter Tabs Bar ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Quick Period Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-gray-200 rounded-xl shadow-xs">
          {DATE_PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setDatePreset(p as ReportDatePreset)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                datePreset === p
                  ? "bg-navy text-white shadow-xs"
                  : "text-gray-600 hover:text-navy hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Dropdowns (Store, Slot, Status) */}
        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Store dropdown */}
          <div ref={storeRef} className="relative">
            <button
              onClick={() => setStoreOpen(!storeOpen)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
            >
              <StoreIcon size={14} className="text-gray-500" />
              <span>{store}</span>
              <ChevronDown size={12} />
            </button>
            {storeOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-xl border border-gray-100 shadow-xl z-20 py-1 overflow-hidden">
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
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
            >
              <Clock size={14} className="text-gray-500" />
              <span>{slot}</span>
              <ChevronDown size={12} />
            </button>
            {slotOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl border border-gray-100 shadow-xl z-20 py-1 overflow-hidden">
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
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
            >
              <Filter size={14} className="text-gray-500" />
              <span>{status}</span>
              <ChevronDown size={12} />
            </button>
            {statusOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-gray-100 shadow-xl z-20 py-1 overflow-hidden">
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
      </div>

      {datePreset === "Custom Range" && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <label className="grid gap-1 text-xs font-semibold text-gray-500">Start date<input className="min-h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-700" type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} /></label>
          <label className="grid gap-1 text-xs font-semibold text-gray-500">End date<input className="min-h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-700" type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} /></label>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          Category
          <select className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option>All Categories</option>
            {categoryOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>

      {/* ── Performance at a glance ── */}
      <section aria-label="Performance at a glance" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-navy">Performance at a glance</h2>
            <p className="mt-1 text-xs text-gray-500">Summary for {datePreset === "Custom Range" ? `${customFrom || "start"} to ${customTo || "today"}` : datePreset.toLowerCase()} · {store}</p>
          </div>
          {loading && <span className="text-xs font-medium text-gray-400">Updating…</span>}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            { label: "Orders", value: kpis.totalOrders.toLocaleString("en-IN"), icon: <ShoppingBag size={18} />, tone: "bg-blue-50 text-blue-700" },
            { label: "Sales", value: `₹${kpis.totalSales.toLocaleString("en-IN")}`, icon: <IndianRupee size={18} />, tone: "bg-emerald-50 text-emerald-700" },
            { label: "Units sold", value: kpis.totalProductsSold.toLocaleString("en-IN"), icon: <Package size={18} />, tone: "bg-amber-50 text-amber-700" },
            { label: "Customers", value: kpis.totalCustomers.toLocaleString("en-IN"), icon: <Users size={18} />, tone: "bg-cyan-50 text-cyan-700" },
            { label: "Avg. order value", value: `₹${kpis.averageOrderValue.toLocaleString("en-IN")}`, icon: <Percent size={18} />, tone: "bg-rose-50 text-rose-700" },
          ].map((metric) => (
            <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-4" key={metric.label}>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold text-gray-500">{metric.label}</span>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${metric.tone}`}>{metric.icon}</span>
              </div>
              <p className="mt-3 truncate text-xl font-extrabold text-navy">{metric.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Top/Lowest Selling Rankings ── */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2" aria-label="Monthly product rankings">
        {[{ title: `Top 10 Highest Selling (${datePreset})`, data: topTenProducts, icon: <TrendingUp size={18} /> }, { title: `10 Lowest Selling (${datePreset})`, data: lowestTenProducts, icon: <TrendingDown size={18} /> }].map((ranking) => (
          <div key={ranking.title} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 text-sm font-bold text-navy">{ranking.icon}{ranking.title}</div>
            {ranking.data.length === 0 ? <p className="px-5 py-6 text-sm text-gray-400">No product sales for this period.</p> : (
              <ol className="divide-y divide-gray-100">
                {ranking.data.map((product, index) => <li key={product.product_id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                  <span className="min-w-0 truncate text-gray-700"><strong className="mr-2 text-gray-400">{index + 1}.</strong>{product.product_name}</span>
                  <span className="shrink-0 text-right font-semibold text-navy">{product.quantity_sold} units · ₹{product.revenue.toLocaleString("en-IN")}</span>
                </li>)}
              </ol>
            )}
          </div>
        ))}
      </section>

      {/* ── Product Performance Table ── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: "#102452" }}>
            Product Performance Table ({datePreset})
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
                products.map((p, idx) => (
                  <tr key={p.product_id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {idx === 0 && p.quantity_sold > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">#1 Top</span>
                        )}
                        <div>
                          <p className="text-sm font-bold" style={{ color: "#102452" }}>{p.product_name}</p>
                          <p className="text-xs text-gray-400">{p.sku}</p>
                        </div>
                      </div>
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
      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        reportType="Product Sales"
        availableColumns={PRODUCT_EXPORT_COLUMNS}
        data={exportData}
        activeFilters={{ datePreset: datePreset === "Custom Range" ? `${customFrom || "Start"} to ${customTo || "Today"}` : datePreset, store, slot, status, category }}
      />
    </div>
  );
}
