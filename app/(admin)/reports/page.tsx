"use client";

import { useState, useRef, useEffect } from "react";
import {
  getReportKPIs,
  getProductSales,
  getStores,
  getPeriodDateRange,
  ReportKPIs,
  ProductSaleRow,
  ProductCustomerPurchase,
  ReportBuilderRow,
  REPORT_BUILDER_FIELDS,
  Store,
  ReportFilters,
} from "@/lib/supabaseService";
import { ExportModal, ColumnDefinition } from "@/components/ExportModal";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
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

const PRODUCT_CUSTOMER_EXPORT_COLUMNS: ColumnDefinition[] = [
  { key: "customer_name", label: "Customer Name" },
  { key: "product_name", label: "Product Name" },
  { key: "quantity", label: "Quantity" },
  { key: "created_at", label: "Order Date" },
  { key: "order_number", label: "Order Number" },
  { key: "line_total", label: "Amount (₹)" },
  { key: "store_name", label: "Store" },
  { key: "status", label: "Status" },
];

const DEFAULT_REPORT_COLUMNS: Array<keyof ReportBuilderRow> = [
  "order_number",
  "order_date",
  "customer_name",
  "customer_phone",
  "product_name",
  "quantity",
  "line_total",
  "order_status",
];

type ReportDatePreset = "Day" | "Week" | "Month" | "Year" | "All Time" | "Custom Range";
type ReportView = "overview" | "builder" | "customers";

export default function ReportsPage() {
  const { isSuperAdmin } = useAuth();
  const [activeView, setActiveView] = useState<ReportView>("overview");
  const [datePreset, setDatePreset] = useState<ReportDatePreset>("Month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [store, setStore] = useState("All Stores");
  const [stores, setStores] = useState<Store[]>([]);
  const [slot, setSlot] = useState("All Slots");
  const [status, setStatus] = useState("All Statuses");
  const [category, setCategory] = useState("All Categories");
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productPurchases, setProductPurchases] = useState<ProductCustomerPurchase[]>([]);
  const [purchasePage, setPurchasePage] = useState(1);
  const [purchaseTotal, setPurchaseTotal] = useState(0);
  const [customerExportRows, setCustomerExportRows] = useState<ProductCustomerPurchase[]>([]);
  const [preparingCustomerExport, setPreparingCustomerExport] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [reportColumns, setReportColumns] = useState<Array<keyof ReportBuilderRow>>(DEFAULT_REPORT_COLUMNS);
  const [reportRows, setReportRows] = useState<Record<string, unknown>[]>([]);
  const [reportPage, setReportPage] = useState(1);
  const [reportTotalOrders, setReportTotalOrders] = useState(0);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportCustomerSearch, setReportCustomerSearch] = useState("");
  const [reportProductSearch, setReportProductSearch] = useState("");
  const [reportExportOpen, setReportExportOpen] = useState(false);

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
  const [customerExportOpen, setCustomerExportOpen] = useState(false);

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

  useEffect(() => {
    if (!selectedProductId || !isSuperAdmin) return;

    const controller = new AbortController();
    async function loadProductPurchases() {
      setPurchaseLoading(true);
      setPurchaseError("");
      try {
        const range = datePreset === "Custom Range"
          ? { from: customFrom, to: customTo }
          : getPeriodDateRange(datePreset);
        const params = new URLSearchParams({ productId: selectedProductId, store, slot, status, page: String(purchasePage), pageSize: "50" });
        if (range.from) params.set("from", range.from);
        if (range.to) params.set("to", range.to);
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) throw new Error("Sign in again to view customer purchase history.");
        const response = await fetch(`/api/reports/product-customers?${params}`, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const result = await response.json() as { data?: ProductCustomerPurchase[]; total?: number; error?: string };
        if (!response.ok) throw new Error(result.error || "Unable to load product purchase history.");
        const total = result.total ?? 0;
        if (purchasePage > Math.max(1, Math.ceil(total / 50))) {
          setPurchasePage(1);
          return;
        }
        setProductPurchases(result.data ?? []);
        setPurchaseTotal(total);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPurchaseError(error instanceof Error ? error.message : "Unable to load product purchase history.");
      } finally {
        if (!controller.signal.aborted) setPurchaseLoading(false);
      }
    }

    loadProductPurchases();
    return () => controller.abort();
  }, [selectedProductId, purchasePage, datePreset, customFrom, customTo, store, slot, status, isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin || reportColumns.length === 0) return;

    const controller = new AbortController();
    async function loadReportBuilder() {
      setReportLoading(true);
      setReportError("");
      try {
        const range = datePreset === "Custom Range"
          ? { from: customFrom, to: customTo }
          : getPeriodDateRange(datePreset);
        const params = new URLSearchParams({
          columns: reportColumns.join(","),
          page: String(reportPage),
          pageSize: "50",
          store,
          status,
          category,
          customer: reportCustomerSearch,
          product: reportProductSearch,
        });
        if (range.from) params.set("from", range.from);
        if (range.to) params.set("to", range.to);

        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) throw new Error("Sign in again to generate reports.");
        const response = await fetch(`/api/reports/builder?${params}`, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const result = await response.json() as { data?: Record<string, unknown>[]; totalOrders?: number; error?: string };
        if (!response.ok) throw new Error(result.error || "Unable to generate the report.");
        setReportRows(result.data ?? []);
        setReportTotalOrders(result.totalOrders ?? 0);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setReportError(error instanceof Error ? error.message : "Unable to generate the report.");
      } finally {
        if (!controller.signal.aborted) setReportLoading(false);
      }
    }

    void loadReportBuilder();
    return () => controller.abort();
  }, [isSuperAdmin, reportColumns, reportPage, datePreset, customFrom, customTo, store, status, category, reportCustomerSearch, reportProductSearch]);

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
  const purchaseExportData = customerExportRows.map((purchase) => ({
    ...purchase,
    created_at: new Date(purchase.created_at).toLocaleString("en-IN"),
  }));

  async function prepareProductCustomerExport() {
    if (!selectedProductId) return;
    setPreparingCustomerExport(true);
    setPurchaseError("");
    try {
      const range = datePreset === "Custom Range"
        ? { from: customFrom, to: customTo }
        : getPeriodDateRange(datePreset);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Sign in again to export customer purchase history.");

      const allPurchases: ProductCustomerPurchase[] = [];
      let page = 1;
      let total = 0;
      do {
        const params = new URLSearchParams({ productId: selectedProductId, store, slot, status, page: String(page), pageSize: "100" });
        if (range.from) params.set("from", range.from);
        if (range.to) params.set("to", range.to);
        const response = await fetch(`/api/reports/product-customers?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const result = await response.json() as { data?: ProductCustomerPurchase[]; total?: number; error?: string };
        if (!response.ok) throw new Error(result.error || "Unable to prepare the customer purchase export.");
        allPurchases.push(...(result.data ?? []));
        total = result.total ?? 0;
        page += 1;
      } while (allPurchases.length < total);

      setCustomerExportRows(allPurchases);
      setCustomerExportOpen(true);
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : "Unable to prepare the customer purchase export.");
    } finally {
      setPreparingCustomerExport(false);
    }
  }
  const reportFieldGroups = [...new Set(REPORT_BUILDER_FIELDS.map((field) => field.group))];
  const reportExportColumns = REPORT_BUILDER_FIELDS
    .filter((field) => reportColumns.includes(field.key))
    .map(({ key, label }) => ({ key, label }));
  const reportPageCount = Math.max(1, Math.ceil(reportTotalOrders / 50));
  const purchasePageCount = Math.max(1, Math.ceil(purchaseTotal / 50));
  const exportCurrentView = () => {
    if (activeView === "builder") setReportExportOpen(true);
    else if (activeView === "customers") void prepareProductCustomerExport();
    else setExportOpen(true);
  };
  const exportDisabled = activeView === "builder"
    ? reportRows.length === 0
    : activeView === "customers"
      ? productPurchases.length === 0 || preparingCustomerExport
      : products.length === 0;
  const reportTabs: Array<{ key: ReportView; label: string }> = [
    { key: "overview", label: "Overview" },
    ...(isSuperAdmin ? [
      { key: "builder" as const, label: "Custom Builder" },
      { key: "customers" as const, label: "Customer Purchases" },
    ] : []),
  ];

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-red">Kmart analytics</p>
          <h1 className="text-2xl font-extrabold text-navy">Reports</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Sales performance, order detail, and customer purchase activity in one workspace.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600">
            {datePreset === "Custom Range" ? `${customFrom || "Start"} – ${customTo || "Today"}` : datePreset}
            <span className="mx-2 text-gray-300">·</span>{store}
          </span>
          <button
            onClick={exportCurrentView}
            disabled={exportDisabled}
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

      <div className="flex items-center justify-between gap-4 border-b border-gray-200" role="tablist" aria-label="Report views">
        <div className="flex min-w-0 flex-wrap gap-1">
          {reportTabs.map((tab) => (
            <button
              aria-selected={activeView === tab.key}
              className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${activeView === tab.key ? "border-red text-navy" : "border-transparent text-gray-500 hover:text-navy"}`}
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="hidden text-xs text-gray-400 sm:inline">Filters apply across report views</span>
      </div>

      {activeView === "overview" && <section aria-label="Performance at a glance" className="space-y-3">
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
      </section>}

      {isSuperAdmin && activeView === "builder" && <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-navy">Dynamic Report Builder</h2>
            <p className="mt-1 text-xs text-gray-500">Order lines joined with customer, product, store, and delivery details.</p>
          </div>
          <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-navy px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={!reportRows.length} onClick={() => setReportExportOpen(true)} type="button"><Download size={15} /> Export selected columns</button>
        </div>

        <div className="grid gap-4 border-b border-gray-100 bg-gray-50/60 p-5 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-xs font-semibold text-gray-500">Customer name<input className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-normal text-gray-700" placeholder="Filter customer..." value={reportCustomerSearch} onChange={(event) => { setReportCustomerSearch(event.target.value); setReportPage(1); }} /></label>
          <label className="grid gap-1 text-xs font-semibold text-gray-500">Product name<input className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-normal text-gray-700" placeholder="Filter product..." value={reportProductSearch} onChange={(event) => { setReportProductSearch(event.target.value); setReportPage(1); }} /></label>
          <div className="flex items-end gap-2">
            <button className="min-h-10 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700" onClick={() => { setReportColumns(REPORT_BUILDER_FIELDS.map((field) => field.key)); setReportPage(1); }} type="button">Select all</button>
            <button className="min-h-10 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700" onClick={() => { setReportColumns([]); setReportRows([]); }} type="button">Clear</button>
            <span className="text-xs text-gray-500">{reportColumns.length} fields</span>
          </div>
          <p className="self-end text-xs text-gray-500">{reportTotalOrders.toLocaleString("en-IN")} matching orders</p>
        </div>

        <div className="grid gap-5 border-b border-gray-100 p-5 md:grid-cols-3">
          {reportFieldGroups.map((group) => (
            <fieldset key={group} className="min-w-0">
              <legend className="mb-2 text-xs font-bold uppercase text-gray-400">{group} fields</legend>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                {REPORT_BUILDER_FIELDS.filter((field) => field.group === group).map((field) => (
                  <label key={field.key} className="flex min-w-0 items-center gap-2 text-sm text-gray-700">
                    <input checked={reportColumns.includes(field.key)} className="accent-[#0B2A63]" onChange={() => {
                      setReportColumns((current) => current.includes(field.key) ? current.filter((key) => key !== field.key) : [...current, field.key]);
                      setReportPage(1);
                    }} type="checkbox" />
                    <span className="truncate">{field.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        {reportError && <p className="px-5 py-3 text-sm text-red-700" role="alert">{reportError}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead><tr className="bg-gray-50">{reportColumns.map((key) => <th className="border-b border-gray-100 px-4 py-3 text-xs font-semibold uppercase text-gray-400" key={key}>{REPORT_BUILDER_FIELDS.find((field) => field.key === key)?.label}</th>)}</tr></thead>
            <tbody>
              {reportColumns.length === 0 ? <tr><td className="px-4 py-10 text-center text-sm text-gray-400">Select at least one field to build a report.</td></tr>
                : reportLoading ? <tr><td className="px-4 py-10 text-center text-sm text-gray-400" colSpan={reportColumns.length}>Loading report rows...</td></tr>
                  : reportRows.length === 0 ? <tr><td className="px-4 py-10 text-center text-sm text-gray-400" colSpan={reportColumns.length}>No matching order items found.</td></tr>
                    : reportRows.map((row, index) => <tr className="border-b border-gray-50 last:border-0" key={`${String(row.order_number)}-${String(row.product_id)}-${index}`}>
                      {reportColumns.map((key) => {
                        const value = row[key];
                        const rendered = value == null || value === "" ? "—"
                          : key === "order_date" && typeof value === "string" ? new Date(value).toLocaleString("en-IN")
                            : (key === "order_total" || key === "line_total") && typeof value === "number" ? `₹${value.toLocaleString("en-IN")}`
                              : String(value);
                        return <td className="max-w-[240px] truncate px-4 py-3 text-sm text-gray-700" key={key} title={rendered}>{rendered}</td>;
                      })}
                    </tr>)}
            </tbody>
          </table>
        </div>
        {reportColumns.length > 0 && <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <span className="text-xs text-gray-500">Page {reportPage} of {reportPageCount} · 50 orders per page</span>
          <div className="flex gap-2">
            <button className="min-h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 disabled:opacity-40" disabled={reportPage <= 1 || reportLoading} onClick={() => setReportPage((page) => Math.max(1, page - 1))} type="button">Previous</button>
            <button className="min-h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 disabled:opacity-40" disabled={reportPage >= reportPageCount || reportLoading} onClick={() => setReportPage((page) => Math.min(reportPageCount, page + 1))} type="button">Next</button>
          </div>
        </div>}
      </section>}

      {activeView === "overview" && <section className="grid grid-cols-1 gap-4 xl:grid-cols-2" aria-label="Monthly product rankings">
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
      </section>}

      {isSuperAdmin && activeView === "customers" && <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-navy">Product to Customer Traceability</h2>
            <p className="mt-1 text-xs text-gray-500">Customer purchases for a selected product, using the active report filters.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select aria-label="Select a product" className="min-h-10 max-w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700" value={selectedProductId} onChange={(event) => { setSelectedProductId(event.target.value); setProductPurchases([]); setPurchaseError(""); }}>
              <option value="">Select product</option>
              {products.map((product) => <option key={product.product_id} value={product.product_id}>{product.product_name}</option>)}
            </select>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 disabled:opacity-50" disabled={!productPurchases.length || preparingCustomerExport} onClick={() => void prepareProductCustomerExport()} type="button"><Download size={15} /> {preparingCustomerExport ? "Preparing..." : "Export Excel"}</button>
          </div>
        </div>
        {purchaseError && <p className="px-5 py-3 text-sm text-red-700" role="alert">{purchaseError}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead><tr className="bg-gray-50">{["Customer", "Product", "Quantity", "Date", "Order", "Amount", "Store", "Status"].map((heading) => <th key={heading} className="border-b border-gray-100 px-4 py-3 text-xs font-semibold uppercase text-gray-400">{heading}</th>)}</tr></thead>
            <tbody>
              {purchaseLoading ? <tr><td className="px-4 py-10 text-center text-sm text-gray-400" colSpan={8}>Loading product purchases...</td></tr>
                : !selectedProductId ? <tr><td className="px-4 py-10 text-center text-sm text-gray-400" colSpan={8}>Select a product to view its customers.</td></tr>
                  : productPurchases.length === 0 ? <tr><td className="px-4 py-10 text-center text-sm text-gray-400" colSpan={8}>No matching purchases found.</td></tr>
                    : productPurchases.map((purchase) => <tr key={`${purchase.order_id}-${purchase.product_name}`} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3 text-sm font-semibold text-navy">{purchase.customer_name}</td><td className="px-4 py-3 text-sm text-gray-600">{purchase.product_name}</td><td className="px-4 py-3 text-sm text-gray-600">{purchase.quantity}</td><td className="px-4 py-3 text-sm text-gray-600">{new Date(purchase.created_at).toLocaleDateString("en-IN")}</td><td className="px-4 py-3 text-sm text-gray-600">{purchase.order_number}</td><td className="px-4 py-3 text-sm font-semibold text-navy">₹{purchase.line_total.toLocaleString("en-IN")}</td><td className="px-4 py-3 text-sm text-gray-600">{purchase.store_name || "—"}</td><td className="px-4 py-3 text-sm text-gray-600">{purchase.status}</td>
                    </tr>)}
            </tbody>
          </table>
        </div>
        {selectedProductId && <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">Showing {productPurchases.length ? (purchasePage - 1) * 50 + 1 : 0}–{Math.min(purchasePage * 50, purchaseTotal)} of {purchaseTotal.toLocaleString("en-IN")} purchases</p>
          <div className="flex items-center gap-2">
            <button className="min-h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 disabled:opacity-40" disabled={purchasePage <= 1 || purchaseLoading} onClick={() => setPurchasePage((page) => Math.max(1, page - 1))} type="button">Previous</button>
            <span className="text-xs text-gray-500">{purchasePage} / {purchasePageCount}</span>
            <button className="min-h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 disabled:opacity-40" disabled={purchasePage >= purchasePageCount || purchaseLoading} onClick={() => setPurchasePage((page) => Math.min(purchasePageCount, page + 1))} type="button">Next</button>
          </div>
        </div>}
      </section>}

      {/* ── Product Performance Table ── */}
      {activeView === "overview" && <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
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
      </div>}
      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        reportType="Product Sales"
        availableColumns={PRODUCT_EXPORT_COLUMNS}
        data={exportData}
        activeFilters={{ datePreset: datePreset === "Custom Range" ? `${customFrom || "Start"} to ${customTo || "Today"}` : datePreset, store, slot, status, category }}
      />
      {isSuperAdmin && <ExportModal
        isOpen={reportExportOpen}
        onClose={() => setReportExportOpen(false)}
        reportType="Orders"
        availableColumns={reportExportColumns}
        data={reportRows}
        activeFilters={{ datePreset: datePreset === "Custom Range" ? `${customFrom || "Start"} to ${customTo || "Today"}` : datePreset, store, slot, status, category, searchQuery: [reportCustomerSearch, reportProductSearch].filter(Boolean).join("; ") }}
      />}
      {isSuperAdmin && <ExportModal
        isOpen={customerExportOpen}
        onClose={() => setCustomerExportOpen(false)}
        reportType="Product Customers"
        availableColumns={PRODUCT_CUSTOMER_EXPORT_COLUMNS}
        data={purchaseExportData}
        activeFilters={{ datePreset: datePreset === "Custom Range" ? `${customFrom || "Start"} to ${customTo || "Today"}` : datePreset, store, slot, status, category }}
      />}
    </div>
  );
}
