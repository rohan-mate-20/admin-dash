import { supabase } from "./supabaseClient";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalOrdersToday: number;
  totalOrdersMonth: number;
  pendingOrders: number;
  outForDelivery: number;
  deliveredToday: number;
  earningsToday: number;
  earningsMonth: number;
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

export interface ReportKPIs {
  totalOrders: number;
  totalSales: number;
  totalProductsSold: number;
  totalCustomers: number;
  averageOrderValue: number;
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
  type: string;
  created_at: string;
  store_name: string;
  delivery_slot?: string;
  customer_name?: string;
  customer_id?: string;
}

export interface CustomerRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  total_orders: number;
  total_spent: number;
}

export interface CustomerDetail {
  id: string;
  full_name: string;
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
  address_line1: string;
  address_line2?: string;
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

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function startOfMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
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

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = todayISO();
  const monthStart = startOfMonthISO();

  const [todayOrders, monthOrders, pending, outForDel, deliveredToday] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total", { count: "exact" })
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`),
    supabase
      .from("orders")
      .select("id, total", { count: "exact" })
      .gte("created_at", `${monthStart}T00:00:00`),
    supabase
      .from("orders")
      .select("id", { count: "exact" })
      .in("status", ["CREATED", "CONFIRMED", "PREPARING"]),
    supabase
      .from("orders")
      .select("id", { count: "exact" })
      .eq("status", "OUT_FOR_DELIVERY"),
    supabase
      .from("orders")
      .select("id", { count: "exact" })
      .in("status", ["DELIVERED", "PICKED_UP"])
      .gte("created_at", `${today}T00:00:00`),
  ]);

  const earningsToday = ((todayOrders.data as Array<{ total: number }>) ?? []).reduce(
    (sum: number, o: { total: number }) => sum + (o.total ?? 0),
    0
  );
  const earningsMonth = ((monthOrders.data as Array<{ total: number }>) ?? []).reduce(
    (sum: number, o: { total: number }) => sum + (o.total ?? 0),
    0
  );

  return {
    totalOrdersToday: todayOrders.count ?? 0,
    totalOrdersMonth: monthOrders.count ?? 0,
    pendingOrders: pending.count ?? 0,
    outForDelivery: outForDel.count ?? 0,
    deliveredToday: deliveredToday.count ?? 0,
    earningsToday,
    earningsMonth,
  };
}

export async function getEarningsData(
  period: "Day" | "Week" | "Month" | "Year"
): Promise<EarningsDataPoint[]> {
  const now = new Date();
  let from: string;

  if (period === "Day") {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  } else if (period === "Week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    from = d.toISOString();
  } else if (period === "Month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  } else {
    from = new Date(now.getFullYear(), 0, 1).toISOString();
  }

  const { data } = await supabase
    .from("orders")
    .select("created_at, total")
    .gte("created_at", from)
    .not("status", "in", "(CANCELLED,FAILED,REFUNDED)")
    .order("created_at", { ascending: true });

  const rows = (data as Array<{ created_at: string; total: number }>) ?? [];
  if (rows.length === 0) return [];

  // Group by period bucket
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
    ? "id, order_number, total, status, created_at, stores(name), customers(full_name)"
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
    customers?: { full_name: string } | null;
  }>) ?? [];

  return rows.map((o) => ({
    id: o.id,
    order_number: o.order_number,
    total: o.total ?? 0,
    status: o.status,
    created_at: o.created_at,
    store_name: o.stores?.name ?? "",
    customer_name: isSuperAdmin ? (o.customers?.full_name ?? "—") : undefined,
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
      mrp,
      selling_price,
      products ( id, name, sku, category ),
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
    mrp: number;
    selling_price: number;
    products: { id: string; name: string; sku: string; category: string } | null;
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
      category: row.products?.category ?? "",
      store_id: row.stores?.id ?? "",
      store_name: row.stores?.name ?? "",
      stock_quantity: row.stock_quantity ?? 0,
      mrp: row.mrp ?? 0,
      selling_price: row.selling_price ?? 0,
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

  const totalOrders = count ?? 0;
  return {
    totalOrders,
    totalSales,
    totalProductsSold,
    totalCustomers: uniqueCustomers,
    averageOrderValue: totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0,
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
      .select("id, stock_quantity, mrp, selling_price, products(id, name, sku, category), stores(name)");
    const rows = (inv as unknown as Array<{
      products: { id: string; name: string; sku: string; category: string } | null;
      selling_price: number;
      mrp: number;
      stock_quantity: number;
      stores: { name: string } | null;
    }>) ?? [];

    return rows.map((row) => ({
      product_id: row.products?.id ?? "",
      product_name: row.products?.name ?? "",
      sku: row.products?.sku ?? "",
      category: row.products?.category ?? "",
      selling_price: row.selling_price ?? 0,
      mrp: row.mrp ?? 0,
      quantity_sold: 0,
      revenue: 0,
      order_count: 0,
      current_stock: row.stock_quantity ?? 0,
      store_name: row.stores?.name ?? "",
    }));
  }

  const { data: itemsData } = await supabase
    .from("order_items")
    .select("product_id, quantity, unit_price, order_id, products(name, sku, category)")
    .in("order_id", orderIds);

  const rawItems = (itemsData as unknown as Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    order_id: string;
    products: { name: string; sku: string; category: string } | null;
  }>) ?? [];

  const productMap: Record<string, { name: string; sku: string; category: string; qty: number; revenue: number; orders: Set<string> }> = {};
  rawItems.forEach((item) => {
    if (!productMap[item.product_id]) {
      productMap[item.product_id] = {
        name: item.products?.name ?? "",
        sku: item.products?.sku ?? "",
        category: item.products?.category ?? "",
        qty: 0,
        revenue: 0,
        orders: new Set(),
      };
    }
    productMap[item.product_id].qty += item.quantity ?? 0;
    productMap[item.product_id].revenue += (item.unit_price ?? 0) * (item.quantity ?? 0);
    productMap[item.product_id].orders.add(item.order_id);
  });

  const { data: inv } = await supabase
    .from("inventory")
    .select("product_id, stock_quantity, selling_price, mrp, stores(name)");

  const rawInv = (inv as unknown as Array<{
    product_id: string;
    stock_quantity: number;
    selling_price: number;
    mrp: number;
    stores: { name: string } | null;
  }>) ?? [];

  const inventoryByProduct: Record<string, { stock: number; price: number; mrp: number; store: string }> = {};
  rawInv.forEach((row) => {
    inventoryByProduct[row.product_id] = {
      stock: row.stock_quantity ?? 0,
      price: row.selling_price ?? 0,
      mrp: row.mrp ?? 0,
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
    ? "id, order_number, total, status, type, created_at, delivery_slot, store_id, customer_id, stores(name), customers(full_name)"
    : "id, order_number, total, status, type, created_at, delivery_slot, store_id, stores(name)";

  let query = supabase
    .from("orders")
    .select(selectQuery, { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00`);
  if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59`);
  if (filters.status && filters.status !== "All" && filters.status !== "All Statuses") {
    query = query.eq("status", filters.status);
  }
  if (filters.slot && filters.slot !== "All Slots") {
    query = query.eq("delivery_slot", filters.slot);
  }

  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count } = await query;
  let orders = (data as unknown as Array<{
    id: string;
    order_number: string;
    total: number;
    status: string;
    type: string;
    created_at: string;
    delivery_slot: string;
    store_id: string;
    customer_id?: string;
    stores: { name: string } | null;
    customers?: { full_name: string } | null;
  }>) ?? [];

  if (filters.store && filters.store !== "All Stores") {
    orders = orders.filter((o) => o.stores?.name === filters.store);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    orders = orders.filter((o) => {
      const matchOrder = o.order_number?.toLowerCase().includes(q);
      const matchAmount = String(o.total).includes(q);
      const matchCustomer = isSuperAdmin && o.customers?.full_name?.toLowerCase().includes(q);
      return matchOrder || matchAmount || matchCustomer;
    });
  }

  return {
    orders: orders.map((o) => ({
      id: o.id,
      order_number: o.order_number,
      total: o.total ?? 0,
      status: o.status,
      type: o.type,
      created_at: o.created_at,
      store_name: o.stores?.name ?? "",
      delivery_slot: o.delivery_slot ?? "",
      customer_name: isSuperAdmin ? (o.customers?.full_name ?? "—") : undefined,
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
      full_name,
      email,
      phone,
      created_at,
      orders ( id, total, store_id, stores(name) )
    `
    )
    .order("created_at", { ascending: false });

  const raw = (data as unknown as Array<{
    id: string;
    full_name: string;
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
        c.full_name?.toLowerCase().includes(q) ||
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
      full_name: c.full_name ?? "",
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
      full_name,
      email,
      phone,
      created_at,
      addresses ( id, address_line1, address_line2, city, state, pincode, is_default ),
      orders ( id, order_number, total, status, type, created_at, delivery_slot, stores(name) )
    `
    )
    .eq("id", customerId)
    .maybeSingle();

  if (!data) return null;

  const raw = data as unknown as {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    created_at: string;
    addresses: CustomerAddress[];
    orders: Array<{
      id: string;
      order_number: string;
      total: number;
      status: string;
      type: string;
      created_at: string;
      delivery_slot: string;
      stores: { name: string } | null;
    }>;
  };

  const orders = (raw.orders ?? []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return {
    id: raw.id,
    full_name: raw.full_name ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    created_at: raw.created_at,
    addresses: raw.addresses ?? [],
    orders: orders.map((o) => ({
      id: o.id,
      order_number: o.order_number,
      total: o.total ?? 0,
      status: o.status,
      type: o.type,
      created_at: o.created_at,
      store_name: o.stores?.name ?? "",
      delivery_slot: o.delivery_slot ?? "",
    })),
    total_orders: orders.length,
    total_spent: orders.reduce((s: number, o) => s + (o.total ?? 0), 0),
  };
}
