"use client";

import { useState, useRef, useEffect } from "react";
import { mockProducts } from "@/lib/mockData";
import { ChevronDown, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

// Coloured product image placeholder matching each brand
function ProductImage({ color, emoji }: { color: string; emoji: string }) {
  return (
    <div
      className="w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0 border border-gray-100"
      style={{ backgroundColor: color + "22" }}
    >
      {emoji}
    </div>
  );
}

// Store dropdown
function StoreDropdown({
  value,
  onChange,
}: {
  value: string;
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

  const stores = ["All Stores", "Store 1", "Store 2"];

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
          {stores.map((s) => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors"
              style={
                value === s
                  ? { backgroundColor: "#0B2A63", color: "#fff" }
                  : { color: "#374151" }
              }
              onMouseEnter={(e) => { if (value !== s) e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
              onMouseLeave={(e) => { if (value !== s) e.currentTarget.style.backgroundColor = "transparent"; }}
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

  const filtered = mockProducts.filter((p) => {
    const matchStock = activeTab === "In Stock" ? p.stock > 0 : p.stock === 0;
    const matchStore = store === "All Stores" || p.store === store;
    return matchStock && matchStore;
  });

  const PAGES = [1, 2, 3, 4, 5];
  const TOTAL = 110;

  return (
    <div className="space-y-5 pb-8">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: "#102452" }}>
          Inventory
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          View and manage product stock across your stores.
        </p>
      </div>

      {/* Tabs row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tab buttons — exactly matching reference: navy solid + red text */}
        <div className="flex gap-3">
          <button
            onClick={() => { setActiveTab("In Stock"); setCurrentPage(1); }}
            className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={
              activeTab === "In Stock"
                ? { backgroundColor: "#0B2A63", color: "#fff" }
                : { backgroundColor: "#fff", color: "#64748B", border: "1px solid #E5E7EB" }
            }
          >
            In Stock (874)
          </button>
          <button
            onClick={() => { setActiveTab("Out of Stock"); setCurrentPage(1); }}
            className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={
              activeTab === "Out of Stock"
                ? { backgroundColor: "#0B2A63", color: "#fff" }
                : { backgroundColor: "#fff", color: "#E31B23", border: "1px solid #E5E7EB" }
            }
          >
            Out of Stock (108)
          </button>
        </div>

        {/* Store dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-500">Store</span>
          <StoreDropdown value={store} onChange={setStore} />
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[820px]">
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC" }}>
                {["Product", "SKU", "Category", "Store", "Stock", "Price (₹)", "Status", "Action"].map((h) => (
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-gray-400 font-medium">
                    No products found.
                  </td>
                </tr>
              ) : (
                filtered.map((product, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    {/* Product with image */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <ProductImage color={product.color} emoji={product.emoji} />
                        <div>
                          <p className="text-sm font-bold leading-tight" style={{ color: "#102452" }}>
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{product.size}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-sm font-medium text-gray-500">{product.sku}</td>
                    <td className="py-3.5 px-5 text-sm" style={{ color: "#102452" }}>{product.category}</td>
                    <td className="py-3.5 px-5 text-sm text-gray-500">{product.store}</td>
                    <td className="py-3.5 px-5 text-sm font-semibold" style={{ color: "#102452" }}>{product.stock}</td>
                    <td className="py-3.5 px-5 text-sm font-semibold" style={{ color: "#102452" }}>₹{product.price}</td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={product.stock > 0 ? "In Stock" : "Out of Stock"} />
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <button
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:border-navy hover:text-navy transition-colors"
                          style={{ color: "#374151" }}
                        >
                          Edit
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical size={15} />
                        </button>
                      </div>
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
            Showing 1–{Math.min(8, filtered.length)} of 874 products
          </p>
          <div className="flex items-center gap-1">
            {/* Prev */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={15} />
            </button>

            {/* Page numbers */}
            {PAGES.map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors"
                style={
                  currentPage === p
                    ? { backgroundColor: "#0B2A63", color: "#fff" }
                    : { color: "#374151", backgroundColor: "transparent" }
                }
                onMouseEnter={(e) => { if (currentPage !== p) e.currentTarget.style.backgroundColor = "#F3F4F6"; }}
                onMouseLeave={(e) => { if (currentPage !== p) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                {p}
              </button>
            ))}

            <span className="text-gray-400 px-1 text-sm">...</span>

            <button
              onClick={() => setCurrentPage(TOTAL)}
              className="w-10 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors"
              style={
                currentPage === TOTAL
                  ? { backgroundColor: "#0B2A63", color: "#fff" }
                  : { color: "#374151" }
              }
              onMouseEnter={(e) => { if (currentPage !== TOTAL) e.currentTarget.style.backgroundColor = "#F3F4F6"; }}
              onMouseLeave={(e) => { if (currentPage !== TOTAL) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              110
            </button>

            {/* Next */}
            <button
              onClick={() => setCurrentPage(Math.min(TOTAL, currentPage + 1))}
              disabled={currentPage === TOTAL}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
