"use client";

import { Bell, Search, User, LogOut, X, Package, ShoppingBag, Users, Layers } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { LogoutModal } from "./LogoutModal";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";

// ─── Global Search Types ──────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  category: "Order" | "Product" | "Inventory" | "Customer" | "Team";
  href: string;
}

const CATEGORY_ICONS: Record<SearchResult["category"], React.ReactNode> = {
  Order: <ShoppingBag size={14} />,
  Product: <Package size={14} />,
  Inventory: <Layers size={14} />,
  Customer: <Users size={14} />,
  Team: <User size={14} />,
};

const CATEGORY_COLORS: Record<SearchResult["category"], string> = {
  Order: "bg-blue-50 text-blue-600",
  Product: "bg-amber-50 text-amber-600",
  Inventory: "bg-purple-50 text-purple-600",
  Customer: "bg-cyan-50 text-cyan-600",
  Team: "bg-emerald-50 text-emerald-600",
};

// ─── Global Search Component ──────────────────────────────────────────────────

function GlobalSearch() {
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const runSearch = useCallback(
    async (q: string) => {
      const term = q.trim();
      if (!term || term.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }

      setLoading(true);
      setOpen(true);

      try {
        const like = `%${term}%`;
        const combined: SearchResult[] = [];

        // Orders — search by order_number or total (Super Admin also searches customer name)
        const ordersQuery = supabase
          .from("orders")
          .select(isSuperAdmin ? "id, order_number, total, status, customers(name)" : "id, order_number, total, status")
          .or(`order_number.ilike.${like}`)
          .limit(5);

        // Products
        const productsQuery = supabase
          .from("products")
          .select("id, name, sku")
          .or(`name.ilike.${like},sku.ilike.${like}`)
          .limit(5);

        // Inventory — search joined products using referencedTable parameter
        const inventoryQuery = supabase
          .from("inventory")
          .select("id, stock_quantity, products!inner(id, name, sku), stores(name)")
          .or(`name.ilike.${like},sku.ilike.${like}`, { referencedTable: "products" })
          .limit(5);

        // Customers — only for Super Admin
        const customerPromise = isSuperAdmin
          ? supabase
              .from("customers")
              .select("id, name, email, phone")
              .or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like}`)
              .limit(5)
          : Promise.resolve({ data: [], error: null });

        // Team / Staff members
        const staffQuery = supabase
          .from("staff")
          .select("id, name, email, role, employee_id")
          .or(`name.ilike.${like},email.ilike.${like},employee_id.ilike.${like}`)
          .limit(5);

        const [ordersRes, productsRes, inventoryRes, customersRes, staffRes] = await Promise.all([
          ordersQuery,
          productsQuery,
          inventoryQuery,
          customerPromise,
          staffQuery,
        ]);

        // Map orders
        (
          (ordersRes.data ?? []) as unknown as Array<{
            id: string;
            order_number: string;
            total: number;
            status: string;
            customers?: { name: string } | null;
          }>
        ).forEach((o) => {
          combined.push({
            id: o.id,
            label: `Order #${o.order_number}`,
            sublabel: [o.status, isSuperAdmin && o.customers?.name ? o.customers.name : null, `₹${(o.total ?? 0).toLocaleString("en-IN")}`]
              .filter(Boolean)
              .join(" · "),
            category: "Order",
            href: `/orders`,
          });
        });

        // Map products
        (
          (productsRes.data ?? []) as unknown as Array<{ id: string; name: string; sku: string }>
        ).forEach((p) => {
          combined.push({
            id: p.id,
            label: p.name,
            sublabel: `SKU: ${p.sku}`,
            category: "Product",
            href: `/inventory`,
          });
        });

        // Map inventory
        (
          (inventoryRes.data ?? []) as unknown as Array<{
            id: string;
            stock_quantity: number;
            products: { id: string; name: string; sku: string } | null;
            stores: { name: string } | null;
          }>
        ).forEach((inv) => {
          if (!inv.products) return;
          combined.push({
            id: inv.id,
            label: inv.products.name,
            sublabel: `${inv.stores?.name ?? "Store"} · Stock: ${inv.stock_quantity}`,
            category: "Inventory",
            href: `/inventory`,
          });
        });

        // Map customers (Super Admin only)
        if (isSuperAdmin) {
          (
            (customersRes.data ?? []) as Array<{ id: string; name: string; email: string; phone: string }>
          ).forEach((c) => {
            combined.push({
              id: c.id,
              label: c.name,
              sublabel: [c.email, c.phone].filter(Boolean).join(" · "),
              category: "Customer",
              href: `/customers/${c.id}`,
            });
          });
        }

        // Map team members
        (
          (staffRes.data ?? []) as Array<{ id: string; name: string; email: string; role: string; employee_id: string | null }>
        ).forEach((member) => {
          combined.push({
            id: member.id,
            label: member.name,
            sublabel: [member.role, member.employee_id ? `ID: ${member.employee_id}` : null, member.email].filter(Boolean).join(" · "),
            category: "Team",
            href: `/team/${member.id}`,
          });
        });

        setResults(combined);
        setOpen(true);
      } catch (err) {
        console.error("Global search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [isSuperAdmin]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim() || val.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => void runSearch(val), 300);
  }

  function handleSelect(result: SearchResult) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(result.href);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="w-full min-w-0 max-w-lg relative">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        placeholder="Search across orders, products, inventory, customers..."
        className="w-full pl-10 pr-9 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:border-navy focus:border-transparent text-sm transition-all"
        aria-label="Global search"
        aria-expanded={open}
        aria-haspopup="listbox"
        autoComplete="off"
      />
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={15} />
        </button>
      )}

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-100 shadow-xl z-50 overflow-hidden"
          role="listbox"
          aria-label="Search results"
        >
          {loading ? (
            <p className="px-4 py-3 text-sm text-gray-400">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">
              No results for &ldquo;{query.trim()}&rdquo;
            </p>
          ) : (
            <ul>
              {results.map((result) => (
                <li key={`${result.category}-${result.id}`}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    onClick={() => handleSelect(result)}
                    role="option"
                    aria-selected={false}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs ${CATEGORY_COLORS[result.category]}`}>
                      {CATEGORY_ICONS[result.category]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">{result.label}</p>
                      {result.sublabel && (
                        <p className="text-xs text-gray-400 truncate">{result.sublabel}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      {result.category}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Team Search Component ────────────────────────────────────────────────────

function TeamSearch() {
  // The Team page manages its own search state internally now.
  // This is just a placeholder so the header renders the correct placeholder
  // when on the team page — the actual search input is inside the Team page.
  return null;
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isSuperAdmin } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // On the team page the search bar is rendered inline in the page itself,
  // so we don't show a separate one in the header for /team.
  const showGlobalSearch =
    pathname === "/dashboard" ||
    pathname === "/" ||
    pathname === "/inventory" ||
    pathname === "/orders" ||
    pathname === "/customers" ||
    pathname === "/reports";

  const isTeamPage = pathname === "/team" || pathname?.startsWith("/team/");
  // Suppress TeamSearch — team page now has its own search control
  void TeamSearch;

  const avatarLetter = currentUser?.name
    ? currentUser.name.charAt(0).toUpperCase()
    : "A";

  const roleDisplay = isSuperAdmin ? "Super Admin" : "Admin";

  return (
    <>
      <header className="h-[68px] bg-white border-b border-gray-100 flex items-center justify-between pl-16 pr-4 sm:px-6 lg:px-6 sticky top-0 z-30 gap-2 sm:gap-3">
        {/* Left: search bar */}
        <div className="flex-1 min-w-0 flex items-center">
          {showGlobalSearch && <GlobalSearch />}
          {isTeamPage && (
            <div className="w-full min-w-0 max-w-lg relative opacity-0 pointer-events-none" aria-hidden="true">
              {/* Spacer so header height stays consistent on team pages */}
            </div>
          )}
        </div>

        {/* Right controls */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          {/* Role badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm"
            style={
              isSuperAdmin
                ? { backgroundColor: "#FEF2F2", color: "#DC2626", borderColor: "#FECACA" }
                : { backgroundColor: "#EFF6FF", color: "#2563EB", borderColor: "#BFDBFE" }
            }
          >
            <span>{roleDisplay}</span>
          </div>

          {/* Bell */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-order-notifications"))}
            className="relative p-2 rounded-full hover:bg-gray-50 transition-colors"
            style={{ color: "#0B2A63" }}
            aria-label="Notifications"
            aria-haspopup="dialog"
          >
            <Bell size={21} />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white"
              style={{ backgroundColor: "#E31B23" }}
            />
          </button>

          {/* Divider */}
          <div className="hidden sm:block h-8 w-px bg-gray-200" />

          {/* Avatar + user info (dropdown) */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 hover:opacity-85 transition-opacity select-none"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none mb-0.5" style={{ color: "#102452" }}>
                  {currentUser?.name || "Admin"}
                </p>
                <p className="text-xs text-gray-500 leading-none">
                  {roleDisplay}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border border-gray-200 shrink-0"
                style={{ backgroundColor: "#E8EEF8", color: "#0B2A63" }}
              >
                {avatarLetter}
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User info header */}
                <div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border border-gray-200 shrink-0"
                      style={{ backgroundColor: "#E8EEF8", color: "#0B2A63" }}
                    >
                      {avatarLetter}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "#102452" }}>
                        {currentUser?.name || "Admin"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {currentUser?.email || ""}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-navy/10 text-navy">
                        {roleDisplay}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/profile");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    <User size={16} className="text-gray-400" />
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setShowLogout(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                    style={{ color: "#E31B23" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FFF0F0")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <LogOut size={16} style={{ color: "#E31B23" }} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <LogoutModal isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </>
  );
}
