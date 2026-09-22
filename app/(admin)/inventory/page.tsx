"use client";

import { useState, useRef, useEffect } from "react";
import { getInventory, getStores, InventoryItem, Store } from "@/lib/supabaseService";
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

// Store dropdown
function StoreDropdown({
  value,
  stores,
  onChange,
}: {
  value: string;
  stores: Store[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const storeOptions = ["All Stores", ...stores.map((s) => s.name)];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors min-w-[140px] justify-between"
        style={{ color: "#102452" }}
      >
        <span>{value}</span>
        <ChevronDown
          size={14}
          className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-xl border border-gray-100 shadow-xl z-20 py-1 overflow-hidden">
          {storeOptions.map((s) => (
            <button
              key={s}
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors"
              style={
                value === s
                  ? { backgroundColor: "#0B2A63", color: "#fff" }
                  : { color: "#374151" }
              }
              onMouseEnter={(e) => {
                if (value !== s) e.currentTarget.style.backgroundColor = "#F9FAFB";
              }}
              onMouseLeave={(e) => {
                if (value !== s) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"In Stock" | "Out of Stock">("In Stock");
  const [currentPage, setCurrentPage] = useState(1);
  const [store, setStore] = useState("All Stores");
  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 15;

  useEffect(() => {
    async function loadStores() {
      try {
        const storeList = await getStores();
        setStores(storeList);
      } catch (err) {
        console.error("Error loading stores:", err);
      }
    }
    loadStores();
  }, []);

  useEffect(() => {
    async function loadInventory() {
      try {
        setLoading(true);
        const { items: fetchedItems, total } = await getInventory(
          activeTab,
          store,
          currentPage,
          PAGE_SIZE
        );
        setItems(fetchedItems);
        setTotalCount(total);
      } catch (err) {
        console.error("Error loading inventory:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInventory();
  }, [activeTab, store, currentPage]);

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.product_name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <div className="space-y-5 pb-8">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: "#102452" }}>
          Inventory
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          View product stock across your stores (synchronized automatically via GOFRUGAL).
        </p>
      </div>

      {/* Tabs & Controls row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tab buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setActiveTab("In Stock");
              setCurrentPage(1);
            }}
            className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={
              activeTab === "In Stock"
                ? { backgroundColor: "#0B2A63", color: "#fff" }
                : { backgroundColor: "#fff", color: "#64748B", border: "1px solid #E5E7EB" }
            }
          >
            In Stock
          </button>
          <button
            onClick={() => {
              setActiveTab("Out of Stock");
              setCurrentPage(1);
            }}
            className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={
              activeTab === "Out of Stock"
                ? { backgroundColor: "#0B2A63", color: "#fff" }
                : { backgroundColor: "#fff", color: "#E31B23", border: "1px solid #E5E7EB" }
            }
          >
            Out of Stock
          </button>
        </div>

        {/* Store dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-500">Store</span>
          <StoreDropdown value={store} stores={stores} onChange={setStore} />
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Search bar inside card */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by name, SKU or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 text-sm transition-all"
            />
          </div>
          <p className="text-xs text-gray-400 font-semibold">
            {activeTab} • {store}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC" }}>
                {["Product", "SKU", "Category", "Store", "Stock", "Selling Price (₹)", "MRP (₹)", "Status"].map((h) => (
                  <th
                    key={h}
                    className="py-3.5 px-5 text-xs font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-100"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-gray-400 font-medium">
                    Loading inventory data...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-gray-400 font-medium">
                    No products found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.inventory_id}
                    className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <td className="py-3.5 px-5">
                      <div>
                        <p className="text-sm font-bold leading-tight" style={{ color: "#102452" }}>
                          {item.product_name}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-sm font-medium text-gray-500">{item.sku || "—"}</td>
                    <td className="py-3.5 px-5 text-sm" style={{ color: "#102452" }}>{item.category || "—"}</td>
                    <td className="py-3.5 px-5 text-sm text-gray-500">{item.store_name || "—"}</td>
                    <td className="py-3.5 px-5 text-sm font-semibold" style={{ color: "#102452" }}>
                      {item.stock_quantity}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-semibold" style={{ color: "#102452" }}>
                      ₹{item.selling_price}
                    </td>
                    <td className="py-3.5 px-5 text-sm text-gray-400">
                      ₹{item.mrp}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={item.stock_quantity > 0 ? "In Stock" : "Out of Stock"} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-sm text-gray-400 font-medium">
            Showing {filteredItems.length} of {totalCount} products
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 flex items-center gap-1 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
              Previous
            </button>

            <span className="text-xs font-bold text-gray-600 px-2">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 flex items-center gap-1 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
