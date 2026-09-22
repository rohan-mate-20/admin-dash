import { supabase } from "./supabaseClient";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalOrders: number;
  earnings: number;
  pendingOrders: number;
  outForDelivery: number;
  deliveredOrders: number;
  periodLabel: string;
}

export interface EarningsDataPoint {
  label: string;
  earnings: number;
}

export interface LowStockItem {
  inventory_id: string;
  product_name: string;
  sku: string;
  stock_quantity: number;
  store_name: string;
}

export interface RecentOrder {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  store_name: string;
  customer_name?: string;
}

export interface InventoryItem {
  inventory_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  category: string;
  store_id: string;
  store_name: string;
  stock_quantity: number;
  mrp: number;
  selling_price: number;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  store_id: string;
  store_name: string;
  latest_expense_note?: string;
  employee_id?: string;
}

export interface Store {
  id: string;
  name: string;
}

export interface DeliverySettings {
  min_order_value: number;
  tier1_max_value: number;
  tier1_fee: number;
  tier2_fee: number;
  free_delivery_order_count: number;
}

export interface ReportKPIs {
  totalOrders: number;
  totalSales: number;
  totalProductsSold: number;
  totalCustomers: number;
  averageOrderValue: number;
  highestSellingProduct?: string;
  highestSellingQty?: number;
  highestSellingRevenue?: number;
  lowestSellingProduct?: string;
  lowestSellingQty?: number;
  lowestSellingRevenue?: number;
}

export interface ProductSaleRow {
  product_id: string;
  product_name: string;
  sku: string;
  category: string;
  selling_price: number;
  mrp: number;
  quantity_sold: number;
  revenue: number;
  order_count: number;
  current_stock: number;
  store_name: string;
}

export interface OrderRow {
  id: string;
  order_number: string;
  total: number;
  status: string;
  order_type: string;
  created_at: string;
  store_name: string;
  delivery_slot_name?: string;
  customer_name?: string;
  customer_id?: string;
}

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  total_orders: number;
  total_spent: number;
}

export interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  addresses: CustomerAddress[];
  orders: OrderRow[];
  total_orders: number;
  total_spent: number;
}

export interface CustomerAddress {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export interface ReportFilters {
  from?: string;
  to?: string;
  store?: string;
  slot?: string;
  status?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getPeriodDateRange(period: "Day" | "Week" | "Month" | "Year" | "Today" | "Yesterday" | "Last 7 Days" | "Last 30 Days" | "This Month" | "This Year" | "All Time"): { from?: string; to?: string } {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  if (period === "Day" || period === "Today") {
    return { from: todayStr, to: todayStr };
  }
  if (period === "Yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const yStr = y.toISOString().split("T")[0];
    return { from: yStr, to: yStr };
  }
  if (period === "Week" || period === "Last 7 Days") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { from: d.toISOString().split("T")[0], to: todayStr };
  }
  if (period === "Last 30 Days") {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    return { from: d.toISOString().split("T")[0], to: todayStr };
  }
  if (period === "Month" || period === "This Month") {
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    return { from: start, to: todayStr };
  }
  if (period === "Year" || period === "This Year") {
    const start = `${now.getFullYear()}-01-01`;
    return { from: start, to: todayStr };
  }
  return {};
}

function formatHour(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", hour12: true });
}

function formatDay(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
}

function formatMonth(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-IN", { month: "short" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────

export async function getLowStockThreshold(): Promise<number> {
  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "low_stock_alert_threshold")
    .maybeSingle();
  return data?.value ? parseInt(data.value, 10) : 8;
}

export async function getDeliverySettings(): Promise<DeliverySettings | null> {
  const { data } = await supabase
    .from("delivery_settings")
    .select("min_order_value, tier1_max_value, tier1_fee, tier2_fee, free_delivery_order_count")
    .limit(1)
    .maybeSingle();
  return data ? (data as DeliverySettings) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export async function getDashboardStats(period: "Day" | "Week" | "Month" | "Year" = "Day"): Promise<DashboardStats> {
  const { from, to } = getPeriodDateRange(period);

  let ordersQuery = supabase.from("orders").select("id, total, status, created_at", { count: "exact" });
  if (from) ordersQuery = ordersQuery.gte("created_at", `${from}T00:00:00`);
  if (to) ordersQuery = ordersQuery.lte("created_at", `${to}T23:59:59`);

  const [periodOrders, pending, outForDel] = await Promise.all([
    ordersQuery,
    supabase
      .from("orders")
      .select("id", { count: "exact" })
      .in("status", ["CREATED", "CONFIRMED", "PREPARING"]),
    supabase
      .from("orders")
      .select("id", { count: "exact" })
      .eq("status", "OUT_FOR_DELIVERY"),
  ]);

  const ordersList = (periodOrders.data as Array<{ id: string; total: number; status: string }>) ?? [];
  const earnings = ordersList.reduce(
    (sum: number, o) => sum + (o.total ?? 0),
    0
  );
  const deliveredOrders = ordersList.filter((o) => o.status === "DELIVERED" || o.status === "PICKED_UP").length;

  const periodLabelMap: Record<string, string> = {
    Day: "Today",
    Week: "Past 7 Days",
    Month: "This Month",
    Year: "This Year",
  };

  return {
    totalOrders: periodOrders.count ?? 0,
    earnings,
    pendingOrders: pending.count ?? 0,
    outForDelivery: outForDel.count ?? 0,
    deliveredOrders,
    periodLabel: periodLabelMap[period] || period,
  };
}

export async function getEarningsData(
  period: "Day" | "Week" | "Month" | "Year"
): Promise<EarningsDataPoint[]> {
  const { from, to } = getPeriodDateRange(period);

  let query = supabase
    .from("orders")
    .select("created_at, total")
    .not("status", "in", "(CANCELLED,FAILED,REFUNDED)")
    .order("created_at", { ascending: true });

  if (from) query = query.gte("created_at", `${from}T00:00:00`);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);

  const { data } = await query;
  const rows = (data as Array<{ created_at: string; total: number }>) ?? [];
  if (rows.length === 0) return [];

  const buckets: Record<string, number> = {};
  rows.forEach((o) => {
    let key: string;
    if (period === "Day") key = formatHour(o.created_at);
    else if (period === "Week" || period === "Month") key = formatDay(o.created_at);
    else key = formatMonth(o.created_at);

    buckets[key] = (buckets[key] ?? 0) + (o.total ?? 0);
  });

  return Object.entries(buckets).map(([label, earnings]) => ({ label, earnings }));
}

export async function getLowStockItems(threshold: number): Promise<LowStockItem[]> {
  const { data } = await supabase
    .from("inventory")
    .select(
      `
      id,
      stock_quantity,
      products ( name, sku ),
      stores ( name )
    `
    )
    .lte("stock_quantity", threshold)
    .order("stock_quantity", { ascending: true })
    .limit(20);

  const rows = (data as unknown as Array<{
    id: string;
    stock_quantity: number;
    products: { name: string; sku: string } | null;
    stores: { name: string } | null;
  }>) ?? [];

  return rows.map((row) => ({
    inventory_id: row.id,
    product_name: row.products?.name ?? "Unknown",
    sku: row.products?.sku ?? "",
    stock_quantity: row.stock_quantity,
    store_name: row.stores?.name ?? "",
  }));
}

export async function getRecentOrders(isSuperAdmin: boolean): Promise<RecentOrder[]> {
  const selectQuery = isSuperAdmin
    ? "id, order_number, total, status, created_at, stores(name), customers(name)"
    : "id, order_number, total, status, created_at, stores(name)";

  const { data } = await supabase
    .from("orders")
    .select(selectQuery)
    .order("created_at", { ascending: false })
    .limit(10);

  const rows = (data as unknown as Array<{
    id: string;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
    stores: { name: string } | null;
    customers?: { name: string } | null;
  }>) ?? [];

  return rows.map((o) => ({
    id: o.id,
    order_number: o.order_number,
    total: o.total ?? 0,
    status: o.status,
    created_at: o.created_at,
    store_name: o.stores?.name ?? "",
    customer_name: isSuperAdmin ? (o.customers?.name ?? "—") : undefined,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Inventory
// ─────────────────────────────────────────────────────────────────────────────

export async function getInventory(
  tab: "In Stock" | "Out of Stock",
  storeFilter: string,
  page: number,
  pageSize = 20
): Promise<{ items: InventoryItem[]; total: number }> {
  let query = supabase
    .from("inventory")
    .select(
      `
      id,
      stock_quantity,
      products ( id, name, sku, mrp, selling_price, categories(name) ),
      stores ( id, name )
    `,
      { count: "exact" }
    );

  if (tab === "In Stock") {
    query = query.gt("stock_quantity", 0);
  } else {
    query = query.eq("stock_quantity", 0);
  }

  query = query
    .order("id", { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count } = await query;

  const rows = (data as unknown as Array<{
    id: string;
    stock_quantity: number;
    products: { id: string; name: string; sku: string; mrp: number; selling_price: number; categories: { name: string } | null } | null;
    stores: { id: string; name: string } | null;
  }>) ?? [];

  const items = rows
    .filter((row) => {
      if (storeFilter === "All Stores") return true;
      return row.stores?.name === storeFilter;
    })
    .map((row) => ({
      inventory_id: row.id,
      product_id: row.products?.id ?? "",
      product_name: row.products?.name ?? "Unknown",
      sku: row.products?.sku ?? "",
      category: row.products?.categories?.name ?? "General",
      store_id: row.stores?.id ?? "",
      store_name: row.stores?.name ?? "",
      stock_quantity: row.stock_quantity ?? 0,
      mrp: row.products?.mrp ?? 0,
      selling_price: row.products?.selling_price ?? 0,
    }));

  return { items, total: count ?? 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Stores
// ─────────────────────────────────────────────────────────────────────────────

export async function getStores(): Promise<Store[]> {
  const { data } = await supabase
    .from("stores")
    .select("id, name")
    .order("name", { ascending: true });
  return (data as Store[]) ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Team / Staff
// ─────────────────────────────────────────────────────────────────────────────

export async function getStaff(
  roleFilter: "All" | "PACKER" | "DELIVERY",
  storeFilter: string
): Promise<StaffMember[]> {
  let query = supabase
    .from("staff")
    .select(
      `
      id,
      name,
      email,
      role,
      employee_id,
      store_id,
      stores ( name ),
      staff_expenses ( note, created_at )
    `
    )
    .order("name", { ascending: true });

  if (roleFilter !== "All") {
    query = query.eq("role", roleFilter);
  }

  const { data } = await query;

  const rows = (data as unknown as Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    employee_id: string;
    store_id: string;
    stores: { name: string } | null;
    staff_expenses: { note: string; created_at: string }[];
  }>) ?? [];

  return rows
    .filter((m) => {
      if (storeFilter === "All Stores") return true;
      return m.stores?.name === storeFilter;
    })
    .map((m) => {
      const expenses = (m.staff_expenses ?? []).sort(
        (a: { created_at: string }, b: { created_at: string }) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return {
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        employee_id: m.employee_id,
        store_id: m.store_id,
        store_name: m.stores?.name ?? "",
        latest_expense_note: expenses[0]?.note ?? "",
      };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Reports
// ─────────────────────────────────────────────────────────────────────────────

export async function getReportKPIs(filters: ReportFilters): Promise<ReportKPIs> {
  let query = supabase.from("orders").select("id, total, customer_id, status", { count: "exact" });

  if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00`);
  if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59`);
  if (filters.store && filters.store !== "All Stores") {
    const { data: storeData } = await supabase
      .from("stores")
      .select("id")
      .eq("name", filters.store)
      .maybeSingle();
    const sId = (storeData as { id: string } | null)?.id;
    if (sId) query = query.eq("store_id", sId);
  }
  if (filters.status && filters.status !== "All Statuses" && filters.status !== "All") {
    query = query.eq("status", filters.status);
  }

  const { data, count } = await query;
  const orders = (data as Array<{ id: string; total: number; customer_id: string | null }>) ?? [];

  const totalSales = orders.reduce((s, o) => s + (o.total ?? 0), 0);
  const uniqueCustomers = new Set(
    orders.filter((o) => o.customer_id).map((o) => o.customer_id)
  ).size;

  let itemsQuery = supabase.from("order_items").select("quantity");
  if (filters.from || filters.to || filters.store || filters.status) {
    const orderIds = orders.map((o) => o.id);
    if (orderIds.length > 0) {
      itemsQuery = itemsQuery.in("order_id", orderIds);
    }
  }
  const { data: itemData } = await itemsQuery;
  const totalProductsSold = ((itemData as Array<{ quantity: number }>) ?? []).reduce(
    (s, i) => s + (i.quantity ?? 0),
    0
  );

  const productSales = await getProductSales(filters);
  const highestSelling = productSales.length > 0 && productSales[0].quantity_sold > 0 ? productSales[0] : undefined;
  
  // Find lowest selling item among items with recorded sales, or last item
  const lowestSelling = productSales.length > 1 ? productSales[productSales.length - 1] : undefined;

  const totalOrders = count ?? 0;
  return {
    totalOrders,
    totalSales,
    totalProductsSold,
    totalCustomers: uniqueCustomers,
    averageOrderValue: totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0,
    highestSellingProduct: highestSelling?.product_name,
    highestSellingQty: highestSelling?.quantity_sold,
    highestSellingRevenue: highestSelling?.revenue,
    lowestSellingProduct: lowestSelling?.product_name,
    lowestSellingQty: lowestSelling?.quantity_sold,
    lowestSellingRevenue: lowestSelling?.revenue,
  };
}

export async function getProductSales(filters: ReportFilters): Promise<ProductSaleRow[]> {
  let ordersQuery = supabase.from("orders").select("id, store_id, status");
  if (filters.from) ordersQuery = ordersQuery.gte("created_at", `${filters.from}T00:00:00`);
  if (filters.to) ordersQuery = ordersQuery.lte("created_at", `${filters.to}T23:59:59`);
  if (filters.status && filters.status !== "All Statuses" && filters.status !== "All") {
    ordersQuery = ordersQuery.eq("status", filters.status);
  }

  const { data: ordersData } = await ordersQuery;
  const rawOrders = (ordersData as Array<{ id: string; store_id: string }>) ?? [];
  let orderIds = rawOrders.map((o) => o.id);

  if (filters.store && filters.store !== "All Stores") {
    const { data: storeData } = await supabase
      .from("stores")
      .select("id")
      .eq("name", filters.store)
      .maybeSingle();
    const sId = (storeData as { id: string } | null)?.id;
    if (sId) {
      orderIds = rawOrders.filter((o) => o.store_id === sId).map((o) => o.id);
    }
  }

  if (orderIds.length === 0) {
    const { data: inv } = await supabase
      .from("inventory")
      .select("id, stock_quantity, products(id, name, sku, mrp, selling_price, categories(name)), stores(name)");
    const rows = (inv as unknown as Array<{
      products: { id: string; name: string; sku: string; mrp: number; selling_price: number; categories: { name: string } | null } | null;
      stock_quantity: number;
      stores: { name: string } | null;
    }>) ?? [];

    return rows.map((row) => ({
      product_id: row.products?.id ?? "",
      product_name: row.products?.name ?? "",
      sku: row.products?.sku ?? "",
      category: row.products?.categories?.name ?? "General",
      selling_price: row.products?.selling_price ?? 0,
      mrp: row.products?.mrp ?? 0,
      quantity_sold: 0,
      revenue: 0,
      order_count: 0,
      current_stock: row.stock_quantity ?? 0,
      store_name: row.stores?.name ?? "",
    }));
  }

  const { data: itemsData } = await supabase
    .from("order_items")
    .select("product_id, quantity, line_total, order_id, products(name, sku, mrp, selling_price, categories(name))")
    .in("order_id", orderIds);

  const rawItems = (itemsData as unknown as Array<{
    product_id: string;
    quantity: number;
    line_total: number;
    order_id: string;
    products: { name: string; sku: string; mrp: number; selling_price: number; categories: { name: string } | null } | null;
  }>) ?? [];

  const productMap: Record<string, { name: string; sku: string; category: string; qty: number; revenue: number; orders: Set<string> }> = {};
  rawItems.forEach((item) => {
    if (!productMap[item.product_id]) {
      productMap[item.product_id] = {
        name: item.products?.name ?? "",
        sku: item.products?.sku ?? "",
        category: item.products?.categories?.name ?? "General",
        qty: 0,
        revenue: 0,
        orders: new Set(),
      };
    }
    productMap[item.product_id].qty += item.quantity ?? 0;
    productMap[item.product_id].revenue += item.line_total ?? 0;
    productMap[item.product_id].orders.add(item.order_id);
  });

  const { data: inv } = await supabase
    .from("inventory")
    .select("product_id, stock_quantity, products(mrp, selling_price), stores(name)");

  const rawInv = (inv as unknown as Array<{
    product_id: string;
    stock_quantity: number;
    products: { mrp: number; selling_price: number } | null;
    stores: { name: string } | null;
  }>) ?? [];

  const inventoryByProduct: Record<string, { stock: number; price: number; mrp: number; store: string }> = {};
  rawInv.forEach((row) => {
    inventoryByProduct[row.product_id] = {
      stock: row.stock_quantity ?? 0,
      price: row.products?.selling_price ?? 0,
      mrp: row.products?.mrp ?? 0,
      store: row.stores?.name ?? "",
    };
  });

  return Object.entries(productMap).map(([productId, stat]) => ({
    product_id: productId,
    product_name: stat.name,
    sku: stat.sku,
    category: stat.category,
    selling_price: inventoryByProduct[productId]?.price ?? 0,
    mrp: inventoryByProduct[productId]?.mrp ?? 0,
    quantity_sold: stat.qty,
    revenue: stat.revenue,
    order_count: stat.orders.size,
    current_stock: inventoryByProduct[productId]?.stock ?? 0,
    store_name: inventoryByProduct[productId]?.store ?? "",
  })).sort((a, b) => b.quantity_sold - a.quantity_sold);
}

// ─────────────────────────────────────────────────────────────────────────────
// Orders
// ─────────────────────────────────────────────────────────────────────────────

export async function getOrders(
  filters: ReportFilters & { search?: string; status?: string },
  isSuperAdmin: boolean,
  page = 1,
  pageSize = 20
): Promise<{ orders: OrderRow[]; total: number }> {
  const selectQuery = isSuperAdmin
    ? "id, order_number, total, status, order_type, created_at, delivery_slot_id, store_id, customer_id, stores(name), customers(name), delivery_slots(slot_name)"
    : "id, order_number, total, status, order_type, created_at, delivery_slot_id, store_id, stores(name), delivery_slots(slot_name)";

  let query = supabase
    .from("orders")
    .select(selectQuery, { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00`);
  if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59`);
  if (filters.status && filters.status !== "All" && filters.status !== "All Statuses") {
    query = query.eq("status", filters.status);
  }

  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count } = await query;
  let orders = (data as unknown as Array<{
    id: string;
    order_number: string;
    total: number;
    status: string;
    order_type: string;
    created_at: string;
    delivery_slot_id: string;
    store_id: string;
    customer_id?: string;
    stores: { name: string } | null;
    customers?: { name: string } | null;
    delivery_slots?: { slot_name: string } | null;
  }>) ?? [];

  if (filters.store && filters.store !== "All Stores") {
    orders = orders.filter((o) => o.stores?.name === filters.store);
  }

  if (filters.slot && filters.slot !== "All Slots") {
    orders = orders.filter((o) => o.delivery_slots?.slot_name === filters.slot);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    orders = orders.filter((o) => {
      const matchOrder = o.order_number?.toLowerCase().includes(q);
      const matchAmount = String(o.total).includes(q);
      const matchCustomer = isSuperAdmin && o.customers?.name?.toLowerCase().includes(q);
      return matchOrder || matchAmount || matchCustomer;
    });
  }

  return {
    orders: orders.map((o) => ({
      id: o.id,
      order_number: o.order_number,
      total: o.total ?? 0,
      status: o.status,
      order_type: o.order_type,
      created_at: o.created_at,
      store_name: o.stores?.name ?? "",
      delivery_slot_name: o.delivery_slots?.slot_name ?? "",
      customer_name: isSuperAdmin ? (o.customers?.name ?? "—") : undefined,
      customer_id: o.customer_id,
    })),
    total: count ?? 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Customers
// ─────────────────────────────────────────────────────────────────────────────

export async function getCustomers(
  search: string,
  storeFilter: string
): Promise<CustomerRow[]> {
  const { data } = await supabase
    .from("customers")
    .select(
      `
      id,
      name,
      email,
      phone,
      created_at,
      orders ( id, total, store_id, stores(name) )
    `
    )
    .order("created_at", { ascending: false });

  const raw = (data as unknown as Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    created_at: string;
    orders: Array<{ id: string; total: number; store_id: string; stores: { name: string } | null }>;
  }>) ?? [];

  let customers = raw;

  if (search) {
    const q = search.toLowerCase();
    customers = customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q)
    );
  }

  return customers.map((c) => {
    let filteredOrders = c.orders ?? [];
    if (storeFilter !== "All Stores") {
      filteredOrders = filteredOrders.filter((o) => o.stores?.name === storeFilter);
    }
    return {
      id: c.id,
      name: c.name ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      created_at: c.created_at,
      total_orders: filteredOrders.length,
      total_spent: filteredOrders.reduce((s, o) => s + (o.total ?? 0), 0),
    };
  });
}

export async function getCustomerDetail(customerId: string): Promise<CustomerDetail | null> {
  const { data } = await supabase
    .from("customers")
    .select(
      `
      id,
      name,
      email,
      phone,
      created_at,
      addresses ( id, line1, line2, city, state, pincode, is_default ),
      orders ( id, order_number, total, status, order_type, created_at, stores(name), delivery_slots(slot_name) )
    `
    )
    .eq("id", customerId)
    .maybeSingle();

  if (!data) return null;

  const raw = data as unknown as {
    id: string;
    name: string;
    email: string;
    phone: string;
    created_at: string;
    addresses: CustomerAddress[];
    orders: Array<{
      id: string;
      order_number: string;
      total: number;
      status: string;
      order_type: string;
      created_at: string;
      stores: { name: string } | null;
      delivery_slots?: { slot_name: string } | null;
    }>;
  };

  const orders = (raw.orders ?? []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return {
    id: raw.id,
    name: raw.name ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    created_at: raw.created_at,
    addresses: raw.addresses ?? [],
    orders: orders.map((o) => ({
      id: o.id,
      order_number: o.order_number,
      total: o.total ?? 0,
      status: o.status,
      order_type: o.order_type,
      created_at: o.created_at,
      store_name: o.stores?.name ?? "",
      delivery_slot_name: o.delivery_slots?.slot_name ?? "",
    })),
    total_orders: orders.length,
    total_spent: orders.reduce((s: number, o: { total: number }) => s + (o.total ?? 0), 0),
  };
}
