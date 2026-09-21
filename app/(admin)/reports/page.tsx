"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  DateRangePreset,
  ReportFilters,
  filterOrders,
  calculateSummaryKPIs,
  calculateProductSales,
  calculateInventoryReport,
  calculateCustomerReport,
} from "@/lib/reportService";
import { StatusBadge } from "@/components/StatusBadge";
import { ExportModal, ColumnDefinition } from "@/components/ExportModal";
import {
  CalendarDays,
  Store,
  Clock,
  Filter,
  Download,
  ShoppingBag,
  IndianRupee,
  Package,
  Users,
  TrendingUp,
  ArrowUpDown,
  Search,
  ChevronDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const DATE_PRESETS: DateRangePreset[] = [
  "All Time",
  "Today",
  "Yesterday",
  "Last 7 Days",
  "Last 30 Days",
  "This Month",
  "Last Month",
  "Custom Range",
];

const STORE_OPTIONS = ["All Stores", "Store 1", "Store 2"];
const SLOT_OPTIONS = ["All Slots", "Slot 1", "Slot 2"];
const STATUS_OPTIONS = ["All Statuses", "Pending", "Packed", "Out for Delivery", "Delivered", "Cancelled"];
const SALES_PERIODS = [
  { label: "Day", datePreset: "Today" as DateRangePreset },
  { label: "Week", datePreset: "Last 7 Days" as DateRangePreset },
  { label: "Month", datePreset: "This Month" as DateRangePreset },
  { label: "Year", datePreset: "This Year" as DateRangePreset },
] as const;

type ReportTab = "products" | "orders" | "inventory" | "customers";
type SalesPeriod = (typeof SALES_PERIODS)[number]["label"];

export default function ReportsPage() {
  const { isSuperAdmin, role } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<ReportTab>("products");

  // Global Multi-Filters State
  const [datePreset, setDatePreset] = useState<DateRangePreset>("Last 30 Days");
  const [customFrom, setCustomFrom] = useState("2026-09-01");
  const [customTo, setCustomTo] = useState("2026-09-20");
  const [store, setStore] = useState("All Stores");
  const [slot, setSlot] = useState("All Slots");
  const [status, setStatus] = useState("All Statuses");
  const [searchQuery, setSearchQuery] = useState("");
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>("Month");

  // Dropdown open states
  const [dateOpen, setDateOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [slotOpen, setSlotOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  // Sorting state for Product Sales Analytics
  const [productSortBy, setProductSortBy] = useState<"quantity" | "revenue" | "orders" | "stock" | "name">("quantity");
  const [productSortOrder, setProductSortOrder] = useState<"desc" | "asc">("desc");

  // Export Modal State
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportTargetType, setExportTargetType] = useState<"Orders" | "Inventory" | "Customers" | "Product Sales">("Product Sales");

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

  const activeFilters: ReportFilters = useMemo(
    () => ({
      datePreset,
      customFrom: datePreset === "Custom Range" ? customFrom : undefined,
      customTo: datePreset === "Custom Range" ? customTo : undefined,
      store,
      slot,
      status,
      searchQuery,
    }),
    [datePreset, customFrom, customTo, store, slot, status, searchQuery]
  );

  // Calculated Real Datasets based on current active filters
  const filteredOrders = useMemo(() => filterOrders(activeFilters), [activeFilters]);
  const salesFilters = useMemo(
    () => ({
      ...activeFilters,
      datePreset: SALES_PERIODS.find((period) => period.label === salesPeriod)!.datePreset,
      customFrom: undefined,
      customTo: undefined,
    }),
    [activeFilters, salesPeriod]
  );
  const salesPeriodOrders = useMemo(() => filterOrders(salesFilters), [salesFilters]);
  const summaryKPIs = useMemo(() => calculateSummaryKPIs(salesPeriodOrders), [salesPeriodOrders]);
  const productSalesList = useMemo(
    () => calculateProductSales(salesFilters, productSortBy, productSortOrder),
    [salesFilters, productSortBy, productSortOrder]
  );
  const inventoryReportList = useMemo(() => calculateInventoryReport(activeFilters), [activeFilters]);
  const customerReportList = useMemo(() => calculateCustomerReport(activeFilters, isSuperAdmin), [activeFilters, isSuperAdmin]);

  // Handle Quick Switch between Highest & Lowest Selling
  const handleQuickSalesView = (view: "highest" | "lowest") => {
    setProductSortBy("quantity");
    setProductSortOrder(view === "highest" ? "desc" : "asc");
  };

  // Open Export Modal for specific report type
  const triggerExport = (type: "Orders" | "Inventory" | "Customers" | "Product Sales") => {
    setExportTargetType(type);
    setExportModalOpen(true);
  };

  // Column definitions for the Export Modal
  const getColumnsForExport = (type: string): ColumnDefinition[] => {
    switch (type) {
      case "Product Sales":
        return [
          { key: "name", label: "Product Name", defaultSelected: true },
          { key: "sku", label: "SKU", defaultSelected: true },
          { key: "category", label: "Category", defaultSelected: true },
          { key: "store", label: "Store", defaultSelected: true },
          { key: "price", label: "Unit Price (₹)", defaultSelected: true },
          { key: "quantitySold", label: "Quantity Sold", defaultSelected: true },
          { key: "revenue", label: "Total Revenue (₹)", defaultSelected: true },
          { key: "orderCount", label: "Orders Count", defaultSelected: true },
          { key: "currentStock", label: "Current Stock", defaultSelected: true },
        ];
      case "Orders":
        return [
          { key: "id", label: "Order ID", defaultSelected: true },
          { key: "name", label: "Customer Name", defaultSelected: true },
          { key: "date", label: "Order Date", defaultSelected: true },
          { key: "time", label: "Order Time", defaultSelected: true },
          { key: "store", label: "Store", defaultSelected: true },
          { key: "slot", label: "Delivery Slot", defaultSelected: true },
          { key: "amount", label: "Total Amount (₹)", defaultSelected: true },
          { key: "status", label: "Order Status", defaultSelected: true },
          { key: "paymentMethod", label: "Payment Method", defaultSelected: true },
        ];
      case "Inventory":
        return [
          { key: "sku", label: "SKU", defaultSelected: true },
          { key: "productName", label: "Product Name", defaultSelected: true },
          { key: "category", label: "Category", defaultSelected: true },
          { key: "store", label: "Store", defaultSelected: true },
          { key: "currentStock", label: "Current Stock", defaultSelected: true },
          { key: "quantitySold", label: "Quantity Sold in Period", defaultSelected: true },
          { key: "unitPrice", label: "Unit Price (₹)", defaultSelected: true },
          { key: "stockValue", label: "Inventory Valuation (₹)", defaultSelected: true },
          { key: "status", label: "Stock Status", defaultSelected: true },
          { key: "stockInsight", label: "Sales & Stock Relation", defaultSelected: true },
        ];
      case "Customers":
        return [
          { key: "customerId", label: "Customer ID", defaultSelected: true },
          { key: "name", label: "Customer Name", defaultSelected: true },
          { key: "email", label: "Email Address", defaultSelected: isSuperAdmin },
          { key: "phone", label: "Phone Number", defaultSelected: isSuperAdmin },
          { key: "location", label: "Location", defaultSelected: true },
          { key: "totalOrders", label: "Total Orders", defaultSelected: true },
          { key: "totalSpent", label: "Total Spent (₹)", defaultSelected: true },
          { key: "aov", label: "Average Order Value (₹)", defaultSelected: true },
          { key: "registeredDate", label: "Registration Date", defaultSelected: true },
          { key: "lastOrderDate", label: "Last Order Date", defaultSelected: true },
        ];
      default:
        return [];
    }
  };

  const getExportData = (type: string) => {
    switch (type) {
      case "Product Sales":
        return productSalesList as unknown as Record<string, unknown>[];
      case "Orders":
        return filteredOrders as unknown as Record<string, unknown>[];
      case "Inventory":
        return inventoryReportList as unknown as Record<string, unknown>[];
      case "Customers":
        return customerReportList as unknown as Record<string, unknown>[];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold" style={{ color: "#102452" }}>
              Reports & Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-navy/10 text-navy border border-navy/20">
              {role === "superadmin" ? "Super Admin Access" : "Admin Access"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-navy">Sales period</h2>
              <p className="text-xs text-gray-500 mt-0.5">Compare product performance over the selected period.</p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
              {SALES_PERIODS.map((period) => (
                <button
                  key={period.label}
                  onClick={() => setSalesPeriod(period.label)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                    salesPeriod === period.label ? "text-white shadow-sm" : "text-gray-600 hover:bg-white"
                  }`}
                  style={salesPeriod === period.label ? { backgroundColor: "#0B2A63" } : {}}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Real-time business performance analytics, product sales trends, inventory health, and Excel exports.
          </p>
        </div>

        {/* Global Export Button */}
        <button
          onClick={() => triggerExport(activeTab === "products" ? "Product Sales" : activeTab === "orders" ? "Orders" : activeTab === "inventory" ? "Inventory" : "Customers")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm shrink-0"
          style={{ backgroundColor: "#E31B23" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#c41520")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#E31B23")}
        >
          <Download size={16} />
          <span>Export Excel Report</span>
        </button>
      </div>

      {/* ── Global Multi-Filters Bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* 1. Date Preset Filter */}
          <div ref={dateRef} className="relative">
            <button
              onClick={() => setDateOpen(!dateOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors shadow-2xs"
              style={{ color: "#102452" }}
            >
              <CalendarDays size={14} className="text-gray-400" />
              <span>{datePreset}</span>
              <ChevronDown size={13} className={`text-gray-400 transition-transform ${dateOpen ? "rotate-180" : ""}`} />
            </button>
            {dateOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-gray-100 shadow-xl z-30 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  Date Range
                </div>
                {DATE_PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setDatePreset(p);
                      setDateOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                      datePreset === p ? "font-semibold text-white" : "text-gray-700 hover:bg-gray-50"
                    }`}
                    style={datePreset === p ? { backgroundColor: "#0B2A63" } : {}}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Date Range Picker Inputs */}
          {datePreset === "Custom Range" && (
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-xl border border-gray-200">
              <span className="text-[11px] font-bold text-gray-500">From:</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-white px-2 py-1 rounded-lg border border-gray-200 text-xs font-medium text-navy focus:outline-none"
              />
              <span className="text-[11px] font-bold text-gray-500">To:</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-white px-2 py-1 rounded-lg border border-gray-200 text-xs font-medium text-navy focus:outline-none"
              />
            </div>
          )}

          {/* 2. Store Filter */}
          <div ref={storeRef} className="relative">
            <button
              onClick={() => setStoreOpen(!storeOpen)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors shadow-2xs"
              style={{ color: "#102452" }}
            >
              <Store size={14} className="text-gray-400" />
              <span>{store}</span>
              <ChevronDown size={13} className={`text-gray-400 transition-transform ${storeOpen ? "rotate-180" : ""}`} />
            </button>
            {storeOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-40 bg-white rounded-xl border border-gray-100 shadow-xl z-30 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  Store
                </div>
                {STORE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStore(s);
                      setStoreOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                      store === s ? "font-semibold text-white" : "text-gray-700 hover:bg-gray-50"
                    }`}
                    style={store === s ? { backgroundColor: "#0B2A63" } : {}}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Slot Filter */}
          <div ref={slotRef} className="relative">
            <button
              onClick={() => setSlotOpen(!slotOpen)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors shadow-2xs"
              style={{ color: "#102452" }}
            >
              <Clock size={14} className="text-gray-400" />
              <span>{slot}</span>
              <ChevronDown size={13} className={`text-gray-400 transition-transform ${slotOpen ? "rotate-180" : ""}`} />
            </button>
            {slotOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-36 bg-white rounded-xl border border-gray-100 shadow-xl z-30 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  Slot
                </div>
                {SLOT_OPTIONS.map((sl) => (
                  <button
                    key={sl}
                    onClick={() => {
                      setSlot(sl);
                      setSlotOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                      slot === sl ? "font-semibold text-white" : "text-gray-700 hover:bg-gray-50"
                    }`}
                    style={slot === sl ? { backgroundColor: "#0B2A63" } : {}}
                  >
                    {sl}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. Status Filter */}
          <div ref={statusRef} className="relative">
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors shadow-2xs"
              style={{ color: "#102452" }}
            >
              <Filter size={14} className="text-gray-400" />
              <span>{status}</span>
              <ChevronDown size={13} className={`text-gray-400 transition-transform ${statusOpen ? "rotate-180" : ""}`} />
            </button>
            {statusOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-gray-100 shadow-xl z-30 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  Order Status
                </div>
                {STATUS_OPTIONS.map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatus(st);
                      setStatusOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                      status === st ? "font-semibold text-white" : "text-gray-700 hover:bg-gray-50"
                    }`}
                    style={status === st ? { backgroundColor: "#0B2A63" } : {}}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Clear Filters */}
          {(store !== "All Stores" || slot !== "All Slots" || status !== "All Statuses" || datePreset !== "All Time") && (
            <button
              onClick={() => {
                setStore("All Stores");
                setSlot("All Slots");
                setStatus("All Statuses");
                setDatePreset("All Time");
              }}
              className="text-xs font-bold text-red hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Sales Overview KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy">{summaryKPIs.totalOrders}</p>
          <p className="text-[11px] text-gray-400 font-medium mt-1">In selected period</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Sales</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy">₹{summaryKPIs.totalSales.toLocaleString("en-IN")}</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-0.5">
            <TrendingUp size={12} /> Live aggregated
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Products Sold</p>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy">{summaryKPIs.totalProductsSold}</p>
          <p className="text-[11px] text-gray-400 font-medium mt-1">Units fulfilled</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Customers</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy">{summaryKPIs.totalCustomers}</p>
          <p className="text-[11px] text-gray-400 font-medium mt-1">Distinct purchasers</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Order Value</p>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy">₹{summaryKPIs.averageOrderValue.toLocaleString("en-IN")}</p>
          <p className="text-[11px] text-gray-400 font-medium mt-1">Per checkout invoice</p>
        </div>
      </div>

      {/* ── Analytical Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-gray-200/80 pb-1">
        {[
          { key: "products", label: "Product Sales Performance" },
          { key: "orders", label: `Orders Report (${filteredOrders.length})` },
          { key: "inventory", label: "Inventory Report" },
          { key: "customers", label: "Customer Analytics" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as ReportTab)}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === tab.key
                ? "bg-navy text-white shadow-sm"
                : "text-gray-500 hover:text-navy hover:bg-gray-100"
            }`}
            style={activeTab === tab.key ? { backgroundColor: "#0B2A63" } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: PRODUCT SALES PERFORMANCE (HIGHEST & LOWEST SELLING)
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "products" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Top Highlights: Highest & Lowest Selling Products Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                  <ArrowUpRight size={14} /> Highest Selling Product
                </span>
                <p className="text-lg font-extrabold text-navy mt-1">{summaryKPIs.highestSellingProduct}</p>
                <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                  {summaryKPIs.highestSellingQty} units sold in active period
                </p>
              </div>
              <button
                onClick={() => handleQuickSalesView("highest")}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-2xs"
              >
                View Top
              </button>
            </div>

            <div className="bg-rose-50/50 border border-rose-200/70 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 uppercase tracking-wide">
                  <ArrowDownRight size={14} /> Lowest Selling Product
                </span>
                <p className="text-lg font-extrabold text-navy mt-1">{summaryKPIs.lowestSellingProduct}</p>
                <p className="text-xs text-rose-700 font-semibold mt-0.5">
                  {summaryKPIs.lowestSellingQty} units sold in active period
                </p>
              </div>
              <button
                onClick={() => handleQuickSalesView("lowest")}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-2xs"
              >
                View Low
              </button>
            </div>
          </div>

          {/* Product Sales Table Card with Sorting Toolbar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gray-50/40">
              {/* Left View Switcher */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickSalesView("highest")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    productSortOrder === "desc" && productSortBy === "quantity"
                      ? "bg-navy text-white shadow-2xs"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                  style={productSortOrder === "desc" && productSortBy === "quantity" ? { backgroundColor: "#0B2A63" } : {}}
                >
                  Highest Selling
                </button>
                <button
                  onClick={() => handleQuickSalesView("lowest")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    productSortOrder === "asc" && productSortBy === "quantity"
                      ? "bg-navy text-white shadow-2xs"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                  style={productSortOrder === "asc" && productSortBy === "quantity" ? { backgroundColor: "#0B2A63" } : {}}
                >
                  Lowest Selling
                </button>
              </div>

              {/* Right Sort Selectors */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-gray-500">Sort By:</span>
                  <select
                    value={productSortBy}
                    onChange={(e) => setProductSortBy(e.target.value as "quantity" | "revenue" | "orders" | "stock" | "name")}
                    className="bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-navy focus:outline-none"
                  >
                    <option value="quantity">Quantity Sold</option>
                    <option value="revenue">Total Revenue</option>
                    <option value="orders">Number of Orders</option>
                    <option value="stock">Current Stock</option>
                    <option value="name">Product Name</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-gray-500">Order:</span>
                  <button
                    onClick={() => setProductSortOrder(productSortOrder === "desc" ? "asc" : "desc")}
                    className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-navy hover:bg-gray-50"
                  >
                    <ArrowUpDown size={12} />
                    {productSortOrder === "desc" ? "Descending (↓)" : "Ascending (↑)"}
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[760px]">
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC" }}>
                    {["Product Details", "Category", "Store", "Unit Price", "Quantity Sold", "Total Revenue", "Orders", "Current Stock"].map(
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
                <tbody className="divide-y divide-gray-100 text-sm">
                  {productSalesList.map((product, idx) => (
                    <tr key={product.sku} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-md bg-gray-100 text-[10px] font-bold text-navy flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-navy leading-tight">{product.name}</p>
                            <span className="text-xs font-mono text-gray-400">{product.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-xs font-medium text-gray-600">{product.category}</td>
                      <td className="py-4 px-5 text-xs">
                        <span className="px-2 py-0.5 rounded bg-gray-100 font-semibold text-gray-700">
                          {product.store}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-xs font-semibold text-navy">₹{product.price}</td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                          {product.quantitySold} sold
                        </span>
                      </td>
                      <td className="py-4 px-5 font-extrabold text-navy">
                        ₹{product.revenue.toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-5 text-xs text-gray-500">{product.orderCount} orders</td>
                      <td className="py-4 px-5 font-bold text-navy">{product.currentStock} in stock</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/40">
              <span>Showing {productSalesList.length} products with actual order sales calculation</span>
              <button
                onClick={() => triggerExport("Product Sales")}
                className="font-bold text-navy hover:underline flex items-center gap-1"
              >
                <Download size={13} /> Export this table to Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2: ORDERS REPORT
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders by ID, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 text-sm transition-all"
              />
            </div>
            <button
              onClick={() => triggerExport("Orders")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy/90 transition-colors shadow-2xs"
            >
              <Download size={14} /> Export Orders (.xlsx)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[760px]">
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC" }}>
                  {["Order ID", "Customer", "Date & Time", "Store", "Slot", "Items Breakdown", "Total Amount", "Status"].map(
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
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-gray-400 text-sm font-medium">
                      No orders match the applied filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-4 px-5 font-bold text-navy">{order.id}</td>
                      <td className="py-4 px-5 font-medium text-gray-800">{order.name}</td>
                      <td className="py-4 px-5 text-xs text-gray-500">{order.date || "20 Sep 2026"} • {order.time}</td>
                      <td className="py-4 px-5">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-xs font-semibold text-gray-700">
                          {order.store}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold"
                          style={
                            order.slot === "Slot 1"
                              ? { backgroundColor: "#EFF6FF", color: "#1D4ED8" }
                              : { backgroundColor: "#F5F3FF", color: "#6D28D9" }
                          }
                        >
                          {order.slot}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-xs text-gray-600">
                        {order.items && order.items.length > 0 ? (
                          <span>
                            {order.items.map((it) => `${it.quantity}x ${it.name}`).join(", ")}
                          </span>
                        ) : (
                          "Standard order items"
                        )}
                      </td>
                      <td className="py-4 px-5 font-extrabold text-navy">₹{order.amount.toLocaleString("en-IN")}</td>
                      <td className="py-4 px-5">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 3: INVENTORY REPORT
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "inventory" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy">Inventory Stock Valuation & Sold Units</h3>
            <button
              onClick={() => triggerExport("Inventory")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy/90 transition-colors shadow-2xs"
            >
              <Download size={14} /> Export Inventory (.xlsx)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[760px]">
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC" }}>
                  {["SKU", "Product Name", "Category", "Store", "Current Stock", "Sold in Period", "Unit Price", "Stock Value (₹)", "Status"].map(
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
              <tbody className="divide-y divide-gray-100 text-sm">
                {inventoryReportList.map((item) => (
                  <tr key={item.sku} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-5 font-mono text-xs font-bold text-gray-500">{item.sku}</td>
                    <td className="py-4 px-5 font-bold text-navy">{item.productName}</td>
                    <td className="py-4 px-5 text-xs text-gray-600">{item.category}</td>
                    <td className="py-4 px-5 text-xs font-semibold text-gray-700">{item.store}</td>
                    <td className="py-4 px-5 font-bold text-navy">{item.currentStock}</td>
                    <td className="py-4 px-5 text-xs text-gray-600">{item.quantitySold} units</td>
                    <td className="py-4 px-5 text-xs font-semibold text-navy">₹{item.unitPrice}</td>
                    <td className="py-4 px-5 font-extrabold text-navy">₹{item.stockValue.toLocaleString("en-IN")}</td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.status === "In Stock"
                            ? "bg-green-100 text-green-700"
                            : item.status === "Low Stock"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red/10 text-red"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 4: CUSTOMER ANALYTICS REPORT
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "customers" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-navy">Customer Spend & Order Frequency Report</h3>
              <p className="text-xs text-gray-400">
                {isSuperAdmin
                  ? "Full customer data access active"
                  : "Admin view: Customer PII is protected per RBAC security policy"}
              </p>
            </div>
            <button
              onClick={() => triggerExport("Customers")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy/90 transition-colors shadow-2xs"
            >
              <Download size={14} /> Export Customers (.xlsx)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[760px]">
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC" }}>
                  {["Customer ID", "Customer Name", "Contact", "Location", "Total Orders", "Total Spent", "Avg Order Value", "Registered Date"].map(
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
              <tbody className="divide-y divide-gray-100 text-sm">
                {customerReportList.map((cust) => (
                  <tr key={cust.customerId} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-5 font-mono text-xs font-bold text-gray-500">{cust.customerId}</td>
                    <td className="py-4 px-5 font-bold text-navy">{cust.name}</td>
                    <td className="py-4 px-5 text-xs text-gray-600">
                      {isSuperAdmin ? (
                        <div>
                          <p>{cust.email}</p>
                          <p className="text-gray-400">{cust.phone}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic font-mono">Protected (Super Admin)</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-xs text-gray-600">{cust.location}</td>
                    <td className="py-4 px-5">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-bold">
                        {cust.totalOrders} orders
                      </span>
                    </td>
                    <td className="py-4 px-5 font-extrabold text-navy">₹{cust.totalSpent.toLocaleString("en-IN")}</td>
                    <td className="py-4 px-5 text-xs font-bold text-navy">₹{cust.aov.toLocaleString("en-IN")}</td>
                    <td className="py-4 px-5 text-xs text-gray-500">{cust.registeredDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Reusable Excel Export Modal ── */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        reportType={exportTargetType}
        availableColumns={getColumnsForExport(exportTargetType)}
        data={getExportData(exportTargetType)}
        activeFilters={activeFilters}
      />
    </div>
  );
}
