import { supabase } from "./supabaseClient";

export const OUT_OF_STOCK_THRESHOLD = 5;

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
  items?: OrderItemSummary[];
}

export interface OrderItemSummary {
  product_id: string;
  product_name: string;
  quantity: number;
  line_total: number;
}

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  address: string;
  location: string;
  last_order_date: string;
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
  category?: string;
}

export interface ProductCustomerPurchase {
  order_id: string;
  order_number: string;
  customer_name: string;
  product_name: string;
  quantity: number;
  line_total: number;
  created_at: string;
  store_name: string;
  status: string;
}

export interface ReportBuilderRow {
  order_number: string;
  order_date: string;
  order_status: string;
  order_type: string;
  order_total: number;
  store_name: string;
  delivery_slot: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_registered_at: string;
  product_id: string;
  product_name: string;
  sku: string;
  category: string;
  quantity: number;
  line_total: number;
}

export const REPORT_BUILDER_FIELDS: Array<{ key: keyof ReportBuilderRow; label: string; group: string }> = [
  { key: "order_number", label: "Order Number", group: "Order" },
  { key: "order_date", label: "Order Date & Time", group: "Order" },
  { key: "order_status", label: "Order Status", group: "Order" },
  { key: "order_type", label: "Order Type", group: "Order" },
  { key: "order_total", label: "Order Total (₹)", group: "Order" },
  { key: "store_name", label: "Store", group: "Order" },
  { key: "delivery_slot", label: "Delivery Slot", group: "Order" },
  { key: "customer_id", label: "Customer ID", group: "Customer" },
  { key: "customer_name", label: "Customer Name", group: "Customer" },
  { key: "customer_email", label: "Customer Email", group: "Customer" },
  { key: "customer_phone", label: "Customer Phone", group: "Customer" },
  { key: "customer_address", label: "Customer Address", group: "Customer" },
  { key: "customer_registered_at", label: "Registration Date", group: "Customer" },
  { key: "product_id", label: "Product ID", group: "Product" },
  { key: "product_name", label: "Product Name", group: "Product" },
  { key: "sku", label: "SKU", group: "Product" },
  { key: "category", label: "Category", group: "Product" },
  { key: "quantity", label: "Quantity", group: "Product" },
  { key: "line_total", label: "Line Total (₹)", group: "Product" },
];

export interface ReportBuilderFilters extends ReportFilters {
  customerSearch?: string;
  productSearch?: string;
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

async function getDeliverySlotIds(slotName: string): Promise<string[]> {
  const { data } = await supabase.from("delivery_slots").select("id").eq("slot_name", slotName);
  return ((data as Array<{ id: string }> | null) ?? []).map((slot) => slot.id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────

export async function getLowStockThreshold(): Promise<number> {
  return OUT_OF_STOCK_THRESHOLD;
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
  tab: "All Products" | "In Stock" | "Out of Stock",
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
    query = query.gt("stock_quantity", OUT_OF_STOCK_THRESHOLD);
  } else if (tab === "Out of Stock") {
    query = query.lte("stock_quantity", OUT_OF_STOCK_THRESHOLD);
  }

  if (storeFilter !== "All Stores") {
    const { data: selectedStore } = await supabase.from("stores").select("id").eq("name", storeFilter).maybeSingle();
    const storeId = (selectedStore as { id: string } | null)?.id;
    if (!storeId) return { items: [], total: 0 };
    query = query.eq("store_id", storeId);
  }

  query = tab === "All Products"
    ? query.order("stock_quantity", { ascending: true }).order("id", { ascending: true })
    : query.order("id", { ascending: true });
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count } = await query;

  const rows = (data as unknown as Array<{
    id: string;
    stock_quantity: number;
    products: { id: string; name: string; sku: string; mrp: number; selling_price: number; categories: { name: string } | null } | null;
    stores: { id: string; name: string } | null;
  }>) ?? [];

  const items = rows.map((row) => ({
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
  storeFilter: string,
  page = 1,
  pageSize = 50
): Promise<{ members: StaffMember[]; total: number }> {
  let storeId: string | undefined;
  if (storeFilter !== "All Stores") {
    const { data: selectedStore } = await supabase.from("stores").select("id").eq("name", storeFilter).maybeSingle();
    storeId = (selectedStore as { id: string } | null)?.id;
    if (!storeId) return { members: [], total: 0 };
  }

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
    `,
      { count: "exact" }
    )
    .order("name", { ascending: true });

  if (roleFilter !== "All") {
    query = query.eq("role", roleFilter);
  }
  if (storeId) query = query.eq("store_id", storeId);

  const safePageSize = Math.min(1000, Math.max(1, pageSize));
  query = query
    .order("created_at", { referencedTable: "staff_expenses", ascending: false })
    .limit(1, { referencedTable: "staff_expenses" })
    .range((Math.max(1, page) - 1) * safePageSize, Math.max(1, page) * safePageSize - 1);

  const { data, count, error } = await query;
  if (error) throw error;

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

  const members = rows.map((m) => {
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

  return { members, total: count ?? 0 };
}

export interface StaffExpense {
  id: string;
  note: string;
  expense_date: string | null;
  created_at: string;
}

export interface StaffDetail extends StaffMember {
  expenses: StaffExpense[];
  orderHistory: StaffHandledOrder[];
}

export interface StaffHandledOrder {
  id: string;
  order_id: string;
  order_number: string;
  activity_status: string;
  order_status: string;
  total: number;
  created_at: string;
  store_name: string;
  items: Array<{ product_name: string; quantity: number }>;
}

export async function getStaffDetail(
  staffId: string,
  dateRange: { from?: string; to?: string } = {}
): Promise<StaffDetail | null> {
  const { data } = await supabase
    .from("staff")
    .select(
      `
      id,
      auth_user_id,
      name,
      email,
      role,
      employee_id,
      store_id,
      stores ( name ),
      staff_expenses ( id, note, expense_date, created_at )
    `
    )
    .eq("id", staffId)
    .maybeSingle();

  if (!data) return null;

  const raw = data as unknown as {
    id: string;
    auth_user_id: string | null;
    name: string;
    email: string;
    role: string;
    employee_id: string;
    store_id: string;
    stores: { name: string } | null;
    staff_expenses: StaffExpense[];
  };

  const expenses = (raw.staff_expenses ?? []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  let orderHistory: StaffHandledOrder[] = [];
  const actorIds = [...new Set([raw.auth_user_id, raw.id, raw.email].filter((actorId): actorId is string => Boolean(actorId)))];
  if (actorIds.length > 0) {
    const historyById = new Map<string, {
        id: string;
        order_id: string;
        status: string;
        orders: {
          order_number: string;
          total: number;
          status: string;
          created_at: string;
          stores: { name: string } | null;
          order_items: Array<{ quantity: number; products: { name: string } | null }>;
        } | null;
      }>();

    for (const actorId of actorIds) {
      let historyQuery = supabase
        .from("order_status_history")
        .select("id, order_id, changed_by, status, orders(order_number, total, status, created_at, stores(name), order_items(quantity, products(name)))")
        .eq("changed_by", actorId);
      if (dateRange.from) historyQuery = historyQuery.gte("orders.created_at", `${dateRange.from}T00:00:00`);
      if (dateRange.to) historyQuery = historyQuery.lte("orders.created_at", `${dateRange.to}T23:59:59`);

      const { data: historyData, error: historyError } = await historyQuery;

      if (historyError) {
        console.error("Failed to load staff order activity:", historyError);
        continue;
      }

      ((historyData ?? []) as unknown as Array<typeof historyById extends Map<string, infer T> ? T : never>)
        .forEach((row) => historyById.set(row.id, row));
    }

    orderHistory = [...historyById.values()]
        .filter((row) => row.orders && /PACK|DELIVER|OUT_FOR_DELIVERY|PICKED_UP/i.test(row.status))
        .map((row) => ({
          id: row.id,
          order_id: row.order_id,
          order_number: row.orders?.order_number ?? row.order_id.slice(0, 8),
          activity_status: row.status.trim().toUpperCase().replace(/[ -]+/g, "_"),
          order_status: row.orders?.status ?? "",
          total: row.orders?.total ?? 0,
          created_at: row.orders?.created_at ?? "",
          store_name: row.orders?.stores?.name ?? "",
          items: (row.orders?.order_items ?? []).map((item) => ({
            product_name: item.products?.name ?? "Product",
            quantity: item.quantity ?? 0,
          })),
        }))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  return {
    id: raw.id,
    name: raw.name ?? "",
    email: raw.email ?? "",
    role: raw.role ?? "",
    employee_id: raw.employee_id ?? "",
    store_id: raw.store_id ?? "",
    store_name: raw.stores?.name ?? "",
    latest_expense_note: expenses[0]?.note ?? "",
    expenses,
    orderHistory,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Reports
// ─────────────────────────────────────────────────────────────────────────────

export async function getReportKPIs(filters: ReportFilters): Promise<ReportKPIs> {
  let query = supabase.from("orders").select("id, total, customer_id, status, delivery_slot_id", { count: "exact" });

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
  if (filters.slot && filters.slot !== "All Slots") {
    const slotIds = await getDeliverySlotIds(filters.slot);
    if (slotIds.length === 0) {
      return { totalOrders: 0, totalSales: 0, totalProductsSold: 0, totalCustomers: 0, averageOrderValue: 0 };
    }
    query = query.in("delivery_slot_id", slotIds);
  }

  const { data, count } = await query;
  const orders = (data as Array<{ id: string; total: number; customer_id: string | null }>) ?? [];

  const totalSales = orders.reduce((s, o) => s + (o.total ?? 0), 0);
  const uniqueCustomers = new Set(
    orders.filter((o) => o.customer_id).map((o) => o.customer_id)
  ).size;

  if (orders.length === 0) {
    return {
      totalOrders: 0,
      totalSales: 0,
      totalProductsSold: 0,
      totalCustomers: 0,
      averageOrderValue: 0,
    };
  }

  let itemsQuery = supabase.from("order_items").select("quantity");
  if (filters.from || filters.to || filters.store || filters.slot || filters.status) {
    itemsQuery = itemsQuery.in("order_id", orders.map((o) => o.id));
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
  let ordersQuery = supabase.from("orders").select("id, store_id, status, delivery_slot_id");
  if (filters.from) ordersQuery = ordersQuery.gte("created_at", `${filters.from}T00:00:00`);
  if (filters.to) ordersQuery = ordersQuery.lte("created_at", `${filters.to}T23:59:59`);
  if (filters.status && filters.status !== "All Statuses" && filters.status !== "All") {
    ordersQuery = ordersQuery.eq("status", filters.status);
  }
  const slotIds = filters.slot && filters.slot !== "All Slots"
    ? await getDeliverySlotIds(filters.slot)
    : null;
  if (slotIds && slotIds.length > 0) ordersQuery = ordersQuery.in("delivery_slot_id", slotIds);
  if (slotIds && slotIds.length === 0) return [];

  let storeId: string | undefined;
  if (filters.store && filters.store !== "All Stores") {
    const { data: storeData } = await supabase
      .from("stores")
      .select("id")
      .eq("name", filters.store)
      .maybeSingle();
    storeId = (storeData as { id: string } | null)?.id;
    if (!storeId) return [];
    ordersQuery = ordersQuery.eq("store_id", storeId);
  }

  const { data: ordersData } = await ordersQuery;
  const rawOrders = (ordersData as Array<{ id: string; store_id: string; delivery_slot_id: string | null }>) ?? [];
  const orderIds = rawOrders.map((o) => o.id);

  if (orderIds.length === 0) {
    let inventoryQuery = supabase
      .from("inventory")
      .select("id, store_id, stock_quantity, products(id, name, sku, mrp, selling_price, categories(name)), stores(name)");
    if (storeId) inventoryQuery = inventoryQuery.eq("store_id", storeId);
    const { data: inv } = await inventoryQuery;
    const rows = (inv as unknown as Array<{
      store_id: string;
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

  const orderStoreIds = new Map(rawOrders.map((order) => [order.id, order.store_id]));
  const productMap: Record<string, { productId: string; storeId: string; name: string; sku: string; category: string; qty: number; revenue: number; orders: Set<string> }> = {};
  rawItems.forEach((item) => {
    const storeIdForOrder = orderStoreIds.get(item.order_id) ?? "";
    const productKey = `${item.product_id}:${storeIdForOrder}`;
    if (!productMap[productKey]) {
      productMap[productKey] = {
        productId: item.product_id,
        storeId: storeIdForOrder,
        name: item.products?.name ?? "",
        sku: item.products?.sku ?? "",
        category: item.products?.categories?.name ?? "General",
        qty: 0,
        revenue: 0,
        orders: new Set(),
      };
    }
    productMap[productKey].qty += item.quantity ?? 0;
    productMap[productKey].revenue += item.line_total ?? 0;
    productMap[productKey].orders.add(item.order_id);
  });

  const { data: inv } = await supabase
    .from("inventory")
    .select("product_id, store_id, stock_quantity, products(id, name, sku, mrp, selling_price, categories(name)), stores(name)");

  const rawInv = (inv as unknown as Array<{
    product_id: string;
    store_id: string;
    stock_quantity: number;
    products: { id: string; name: string; sku: string; mrp: number; selling_price: number; categories: { name: string } | null } | null;
    stores: { name: string } | null;
  }>) ?? [];

  const inventoryByProductStore: Record<string, { stock: number; price: number; mrp: number; store: string }> = {};
  rawInv.forEach((row) => {
    const productKey = `${row.product_id}:${row.store_id}`;
    inventoryByProductStore[productKey] = {
      stock: row.stock_quantity ?? 0,
      price: row.products?.selling_price ?? 0,
      mrp: row.products?.mrp ?? 0,
      store: row.stores?.name ?? "",
    };
    if (!productMap[productKey] && row.products) {
      productMap[productKey] = {
        productId: row.product_id,
        storeId: row.store_id,
        name: row.products.name ?? "",
        sku: row.products.sku ?? "",
        category: row.products.categories?.name ?? "General",
        qty: 0,
        revenue: 0,
        orders: new Set(),
      };
    }
  });

  const rows = Object.values(productMap).map((stat) => {
    const inventory = inventoryByProductStore[`${stat.productId}:${stat.storeId}`];
    return {
    product_id: stat.productId,
    product_name: stat.name,
    sku: stat.sku,
    category: stat.category,
    selling_price: inventory?.price ?? 0,
    mrp: inventory?.mrp ?? 0,
    quantity_sold: stat.qty,
    revenue: stat.revenue,
    order_count: stat.orders.size,
    current_stock: inventory?.stock ?? 0,
    store_name: inventory?.store ?? "",
  };
  }).sort((a, b) => b.quantity_sold - a.quantity_sold);
  return filters.category && filters.category !== "All Categories"
    ? rows.filter((row) => row.category === filters.category)
    : rows;
}

export async function getProductCustomerPurchases(
  productId: string,
  filters: ReportFilters,
  page = 1,
  pageSize = 50,
  client: typeof supabase = supabase
): Promise<{ purchases: ProductCustomerPurchase[]; total: number }> {
  let query = client
    .from("order_items")
    .select("quantity, line_total, order_id, products(name), orders!inner(id, order_number, created_at, status, store_id, delivery_slot_id, customers(name), stores(name))", { count: "exact" })
    .eq("product_id", productId);

  if (filters.from) query = query.gte("orders.created_at", `${filters.from}T00:00:00`);
  if (filters.to) query = query.lte("orders.created_at", `${filters.to}T23:59:59`);
  if (filters.status && filters.status !== "All Statuses" && filters.status !== "All") {
    query = query.eq("orders.status", filters.status);
  }

  if (filters.store && filters.store !== "All Stores") {
    const { data: storeData } = await client.from("stores").select("id").eq("name", filters.store).maybeSingle();
    const storeId = (storeData as { id: string } | null)?.id;
    if (!storeId) return { purchases: [], total: 0 };
    query = query.eq("orders.store_id", storeId);
  }

  if (filters.slot && filters.slot !== "All Slots") {
    const { data: slots } = await client.from("delivery_slots").select("id").eq("slot_name", filters.slot);
    const slotIds = ((slots ?? []) as Array<{ id: string }>).map((slotItem) => slotItem.id);
    if (slotIds.length === 0) return { purchases: [], total: 0 };
    query = query.in("orders.delivery_slot_id", slotIds);
  }

  const safePageSize = Math.min(1000, Math.max(1, pageSize));
  query = query
    .order("created_at", { referencedTable: "orders", ascending: false })
    .range((Math.max(1, page) - 1) * safePageSize, Math.max(1, page) * safePageSize - 1);
  const { data, count, error } = await query;
  if (error) throw error;

  const purchases = ((data ?? []) as unknown as Array<{
    order_id: string;
    quantity: number;
    line_total: number;
    products: { name: string } | null;
    orders: {
      id: string;
      order_number: string;
      created_at: string;
      status: string;
      customers: { name: string } | null;
      stores: { name: string } | null;
    };
  }>).map((row) => ({
    order_id: row.orders.id,
    order_number: row.orders.order_number ?? row.orders.id.slice(0, 8),
    customer_name: row.orders.customers?.name ?? "Customer",
    product_name: row.products?.name ?? "Product",
    quantity: row.quantity ?? 0,
    line_total: row.line_total ?? 0,
    created_at: row.orders.created_at,
    store_name: row.orders.stores?.name ?? "",
    status: row.orders.status ?? "",
  }));
  return { purchases, total: count ?? 0 };
}

export async function getReportBuilderRows(
  filters: ReportBuilderFilters,
  page = 1,
  pageSize = 50,
  client: typeof supabase = supabase
): Promise<{ rows: ReportBuilderRow[]; totalOrders: number }> {
  let query = client
    .from("orders")
    .select("id, order_number, total, status, order_type, created_at, customers(id, name, email, phone, created_at, addresses(line1, line2, city, state, pincode, is_default)), stores(name), delivery_slots(slot_name), order_items!inner(product_id, quantity, line_total, products(id, name, sku, categories(name)))", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00`);
  if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59`);
  if (filters.status && filters.status !== "All Statuses" && filters.status !== "All") {
    query = query.eq("status", filters.status);
  }
  if (filters.store && filters.store !== "All Stores") {
    const { data: storeData } = await client.from("stores").select("id").eq("name", filters.store).maybeSingle();
    const storeId = (storeData as { id: string } | null)?.id;
    if (!storeId) return { rows: [], totalOrders: 0 };
    query = query.eq("store_id", storeId);
  }
  if (filters.category && filters.category !== "All Categories") {
    query = query.eq("order_items.products.categories.name", filters.category);
  }
  if (filters.customerSearch) {
    query = query.ilike("customers.name", `%${filters.customerSearch}%`);
  }
  if (filters.productSearch) {
    query = query.ilike("order_items.products.name", `%${filters.productSearch}%`);
  }

  const offset = Math.max(0, page - 1) * Math.min(Math.max(pageSize, 1), 100);
  query = query.range(offset, offset + Math.min(Math.max(pageSize, 1), 100) - 1);
  const { data, count, error } = await query;
  if (error) throw error;

  type RawOrder = {
    id: string;
    order_number: string;
    total: number;
    status: string;
    order_type: string;
    created_at: string;
    customers: {
      id: string;
      name: string;
      email: string;
      phone: string;
      created_at: string;
      addresses: Array<{ line1: string; line2: string | null; city: string; state: string; pincode: string; is_default: boolean }>;
    } | null;
    stores: { name: string } | null;
    delivery_slots: { slot_name: string } | null;
    order_items: Array<{
      product_id: string;
      quantity: number;
      line_total: number;
      products: { id: string; name: string; sku: string; categories: { name: string } | null } | null;
    }>;
  };

  const rows = ((data ?? []) as unknown as RawOrder[]).flatMap((order) => {
    const address = order.customers?.addresses?.find((item) => item.is_default) ?? order.customers?.addresses?.[0];
    const customerAddress = address
      ? [address.line1, address.line2, address.city, address.state, address.pincode].filter(Boolean).join(", ")
      : "";
    return order.order_items.map((item) => ({
      order_number: order.order_number ?? order.id.slice(0, 8),
      order_date: order.created_at,
      order_status: order.status ?? "",
      order_type: order.order_type ?? "",
      order_total: order.total ?? 0,
      store_name: order.stores?.name ?? "",
      delivery_slot: order.delivery_slots?.slot_name ?? "",
      customer_id: order.customers?.id ?? "",
      customer_name: order.customers?.name ?? "",
      customer_email: order.customers?.email ?? "",
      customer_phone: order.customers?.phone ?? "",
      customer_address: customerAddress,
      customer_registered_at: order.customers?.created_at ?? "",
      product_id: item.products?.id ?? item.product_id ?? "",
      product_name: item.products?.name ?? "",
      sku: item.products?.sku ?? "",
      category: item.products?.categories?.name ?? "",
      quantity: item.quantity ?? 0,
      line_total: item.line_total ?? 0,
    }));
  });

  return { rows, totalOrders: count ?? 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Orders
// ─────────────────────────────────────────────────────────────────────────────

export async function getOrders(
  filters: ReportFilters & {
    search?: string;
    searchBy?: "order" | "customer" | "amount";
    status?: string;
    orderId?: string;
    sortBy?: "created_at" | "total" | "order_number";
    sortDirection?: "asc" | "desc";
  },
  isSuperAdmin: boolean,
  page = 1,
  pageSize = 20
): Promise<{ orders: OrderRow[]; total: number }> {
  const searchCustomer = filters.searchBy === "customer" && Boolean(filters.search?.trim());
  const selectQuery = isSuperAdmin
    ? `id, order_number, total, status, order_type, created_at, delivery_slot_id, store_id, customer_id, stores(name), customers${searchCustomer ? "!inner" : ""}(name), delivery_slots(slot_name)`
    : "id, order_number, total, status, order_type, created_at, delivery_slot_id, store_id, stores(name), delivery_slots(slot_name)";

  let storeId: string | undefined;
  if (filters.store && filters.store !== "All Stores") {
    const { data: selectedStore } = await supabase.from("stores").select("id").eq("name", filters.store).maybeSingle();
    storeId = (selectedStore as { id: string } | null)?.id;
    if (!storeId) return { orders: [], total: 0 };
  }

  let query = supabase
    .from("orders")
    .select(selectQuery, { count: "exact" })
    .order(filters.sortBy ?? "created_at", { ascending: filters.sortDirection === "asc" });

  if (filters.orderId) query = query.eq("id", filters.orderId);
  if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00`);
  if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59`);
  if (filters.status && filters.status !== "All" && filters.status !== "All Statuses") {
    query = query.eq("status", filters.status);
  }
  if (storeId) query = query.eq("store_id", storeId);
  if (filters.slot && filters.slot !== "All Slots") {
    const slotIds = await getDeliverySlotIds(filters.slot);
    if (slotIds.length === 0) return { orders: [], total: 0 };
    query = query.in("delivery_slot_id", slotIds);
  }
  if (filters.search?.trim()) {
    const searchValue = filters.search.trim().replace(/[,%()]/g, " ");
    if (filters.searchBy === "customer") {
      if (!isSuperAdmin) return { orders: [], total: 0 };
      query = query.ilike("customers.name", `%${searchValue}%`);
    } else if (filters.searchBy === "amount") {
      const numericSearch = Number(searchValue);
      if (!Number.isFinite(numericSearch)) return { orders: [], total: 0 };
      query = query.eq("total", numericSearch);
    } else {
      query = query.ilike("order_number", `%${searchValue}%`);
    }
  }

  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw error;
  const orders = (data as unknown as Array<{
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
  storeFilter: string,
  page = 1,
  pageSize = 50
): Promise<{ customers: CustomerRow[]; total: number }> {
  let storeId: string | undefined;
  if (storeFilter !== "All Stores") {
    const { data: selectedStore } = await supabase.from("stores").select("id").eq("name", storeFilter).maybeSingle();
    storeId = (selectedStore as { id: string } | null)?.id;
    if (!storeId) return { customers: [], total: 0 };
  }

  const ordersRelation = storeId
    ? "orders!inner ( id, total, store_id, created_at, stores(name) )"
    : "orders ( id, total, store_id, created_at, stores(name) )";
  let query = supabase
    .from("customers")
    .select(`id, name, email, phone, created_at, addresses ( line1, line2, city, state, pincode, is_default ), ${ordersRelation}`, { count: "exact" })
    .order("created_at", { ascending: false });

  if (storeId) query = query.eq("orders.store_id", storeId);
  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    if (/^[0-9a-f-]{36}$/i.test(trimmedSearch)) {
      query = query.eq("id", trimmedSearch);
    } else {
      const searchValue = trimmedSearch.replace(/[,%()]/g, " ");
      query = query.or(`name.ilike.%${searchValue}%,email.ilike.%${searchValue}%,phone.ilike.%${searchValue}%`);
    }
  }

  const safePageSize = Math.min(1000, Math.max(1, pageSize));
  query = query.range((Math.max(1, page) - 1) * safePageSize, Math.max(1, page) * safePageSize - 1);
  const { data, count, error } = await query;
  if (error) throw error;

  const raw = (data as unknown as Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    created_at: string;
    addresses: Array<{ line1: string; line2: string | null; city: string; state: string; pincode: string; is_default: boolean }>;
    orders: Array<{ id: string; total: number; store_id: string; created_at: string; stores: { name: string } | null }>;
  }>) ?? [];

  const customers = raw.map((c) => {
    const filteredOrders = c.orders ?? [];
    const address = (c.addresses ?? []).find((item) => item.is_default) ?? c.addresses?.[0];
    const lastOrder = filteredOrders.reduce((latest, order) =>
      !latest || order.created_at > latest ? order.created_at : latest, "");
    return {
      id: c.id,
      name: c.name ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      created_at: c.created_at,
      address: address ? [address.line1, address.line2].filter(Boolean).join(", ") : "",
      location: address ? [address.city, address.state, address.pincode].filter(Boolean).join(", ") : "",
      last_order_date: lastOrder,
      total_orders: filteredOrders.length,
      total_spent: filteredOrders.reduce((s, o) => s + (o.total ?? 0), 0),
    };
  });

  return { customers, total: count ?? 0 };
}

export async function getCustomerDetail(
  customerId: string,
  page = 1,
  pageSize = 50,
  filters: ReportFilters = {}
): Promise<CustomerDetail | null> {
  const { data } = await supabase
    .from("customers")
    .select(
      `
      id,
      name,
      email,
      phone,
      created_at,
      addresses ( id, line1, line2, city, state, pincode, is_default )
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
  };

  let ordersQuery = supabase
    .from("orders")
    .select("id, order_number, total, status, order_type, created_at, stores(name), delivery_slots(slot_name)", { count: "exact" })
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (filters.from) ordersQuery = ordersQuery.gte("created_at", `${filters.from}T00:00:00`);
  if (filters.to) ordersQuery = ordersQuery.lte("created_at", `${filters.to}T23:59:59`);
  if (filters.status && filters.status !== "All Statuses" && filters.status !== "All") {
    ordersQuery = ordersQuery.eq("status", filters.status);
  }
  if (filters.store && filters.store !== "All Stores") {
    const { data: selectedStore } = await supabase.from("stores").select("id").eq("name", filters.store).maybeSingle();
    const storeId = (selectedStore as { id: string } | null)?.id;
    if (!storeId) {
      return {
        id: raw.id,
        name: raw.name ?? "",
        email: raw.email ?? "",
        phone: raw.phone ?? "",
        created_at: raw.created_at,
        addresses: raw.addresses ?? [],
        orders: [],
        total_orders: 0,
        total_spent: 0,
      };
    }
    ordersQuery = ordersQuery.eq("store_id", storeId);
  }

  const safePageSize = Math.min(1000, Math.max(1, pageSize));
  ordersQuery = ordersQuery.range((Math.max(1, page) - 1) * safePageSize, Math.max(1, page) * safePageSize - 1);
  const { data: ordersData, count: orderCount, error: ordersError } = await ordersQuery;
  if (ordersError) throw ordersError;
  const orders = (ordersData ?? []) as unknown as Array<{
    id: string;
    order_number: string;
    total: number;
    status: string;
    order_type: string;
    created_at: string;
    stores: { name: string } | null;
    delivery_slots: { slot_name: string } | null;
  }>;
  const orderIds = orders.map((order) => order.id);
  const { data: itemData } = orderIds.length > 0
    ? await supabase
        .from("order_items")
        .select("order_id, product_id, quantity, line_total, products(name)")
        .in("order_id", orderIds)
    : { data: [] };
  const itemsByOrder = new Map<string, OrderItemSummary[]>();
  ((itemData ?? []) as unknown as Array<{
    order_id: string;
    product_id: string;
    quantity: number;
    line_total: number;
    products: { name: string } | null;
  }>).forEach((item) => {
    const items = itemsByOrder.get(item.order_id) ?? [];
    items.push({
      product_id: item.product_id,
      product_name: item.products?.name ?? "Product",
      quantity: item.quantity ?? 0,
      line_total: item.line_total ?? 0,
    });
    itemsByOrder.set(item.order_id, items);
  });

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
      items: itemsByOrder.get(o.id) ?? [],
    })),
    total_orders: orderCount ?? 0,
    total_spent: orders.reduce((s: number, o: { total: number }) => s + (o.total ?? 0), 0),
  };
}
