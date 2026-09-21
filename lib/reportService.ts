import { ALL_ORDERS, mockProducts, mockCustomers, Order } from "./mockData";
import * as XLSX from "xlsx";

export type DateRangePreset =
  | "All Time"
  | "Today"
  | "Yesterday"
  | "Last 7 Days"
  | "Last 30 Days"
  | "This Month"
  | "Last Month"
  | "This Year"
  | "Custom Range";

export interface ReportFilters {
  datePreset: DateRangePreset;
  customFrom?: string;
  customTo?: string;
  store: string; // "All Stores" | "Store 1" | "Store 2"
  slot: string; // "All Slots" | "Slot 1" | "Slot 2"
  status: string; // "All Statuses" | "Pending" | "Packed" | ...
  searchQuery?: string;
}

export interface ProductSalesStat {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  quantitySold: number;
  revenue: number;
  orderCount: number;
  currentStock: number;
  store: string;
  stockInsight: "High Sales + Low Stock" | "Low Sales + High Stock" | "Out of Stock" | "Normal";
}

export interface SalesSummaryKPIs {
  totalOrders: number;
  totalSales: number;
  totalProductsSold: number;
  totalCustomers: number;
  averageOrderValue: number;
  highestSellingProduct: string;
  highestSellingQty: number;
  lowestSellingProduct: string;
  lowestSellingQty: number;
}

// Current reference date in mock context: Sep 20, 2026
const CURRENT_APP_DATE = new Date("2026-09-20T12:00:00Z");

export function parseOrderDate(order: Order): Date {
  if (order.date) {
    if (order.date.includes("Today") || order.date.includes("20 Sep 2026")) {
      return new Date("2026-09-20T10:00:00Z");
    }
    if (order.date.includes("Yesterday") || order.date.includes("19 Sep 2026")) {
      return new Date("2026-09-19T10:00:00Z");
    }
    if (order.date.includes("18 Sep 2026")) {
      return new Date("2026-09-18T10:00:00Z");
    }
    if (order.date.includes("17 Sep 2026")) {
      return new Date("2026-09-17T10:00:00Z");
    }
    if (order.date.includes("16 Sep 2026")) {
      return new Date("2026-09-16T10:00:00Z");
    }
    if (order.date.includes("15 Sep 2026")) {
      return new Date("2026-09-15T10:00:00Z");
    }
    if (order.date.includes("14 Sep 2026")) {
      return new Date("2026-09-14T10:00:00Z");
    }
    if (order.date.includes("13 Sep 2026")) {
      return new Date("2026-09-13T10:00:00Z");
    }
    if (order.date.includes("12 Sep 2026")) {
      return new Date("2026-09-12T10:00:00Z");
    }
  }
  return new Date("2026-09-20T10:00:00Z");
}

export function isOrderInDateRange(order: Order, preset: DateRangePreset, from?: string, to?: string): boolean {
  if (preset === "All Time") return true;

  const orderDate = parseOrderDate(order);
  const now = new Date(CURRENT_APP_DATE);

  switch (preset) {
    case "Today":
      return orderDate.toDateString() === now.toDateString();
    case "Yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return orderDate.toDateString() === yesterday.toDateString();
    }
    case "Last 7 Days": {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      return orderDate >= sevenDaysAgo && orderDate <= now;
    }
    case "Last 30 Days": {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return orderDate >= thirtyDaysAgo && orderDate <= now;
    }
    case "This Month": {
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }
    case "Last Month": {
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === year;
    }
    case "This Year":
      return orderDate.getFullYear() === now.getFullYear();
    case "Custom Range": {
      if (!from && !to) return true;
      const fromDate = from ? new Date(from) : new Date("2000-01-01");
      const toDate = to ? new Date(to + "T23:59:59Z") : new Date("2099-12-31");
      return orderDate >= fromDate && orderDate <= toDate;
    }
    default:
      return true;
  }
}

export function filterOrders(filters: ReportFilters): Order[] {
  return ALL_ORDERS.filter((order) => {
    // Date filter
    const matchDate = isOrderInDateRange(order, filters.datePreset, filters.customFrom, filters.customTo);
    if (!matchDate) return false;

    // Store filter
    if (filters.store && filters.store !== "All Stores" && order.store !== filters.store) {
      return false;
    }

    // Slot filter
    if (filters.slot && filters.slot !== "All Slots" && order.slot !== filters.slot) {
      return false;
    }

    // Status filter
    if (filters.status && filters.status !== "All Statuses" && filters.status !== "All" && order.status !== filters.status) {
      return false;
    }

    // Search query
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matchSearch =
        order.id.toLowerCase().includes(q) ||
        order.name.toLowerCase().includes(q) ||
        order.store.toLowerCase().includes(q) ||
        order.status.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }

    return true;
  });
}

export function calculateSummaryKPIs(filteredOrders: Order[]): SalesSummaryKPIs {
  const totalOrders = filteredOrders.length;
  const totalSales = filteredOrders.reduce((sum, o) => sum + o.amount, 0);

  let totalProductsSold = 0;
  const productQuantities: Record<string, { name: string; qty: number }> = {};
  const customerSet = new Set<string>();

  filteredOrders.forEach((order) => {
    if (order.name) customerSet.add(order.name.toLowerCase());
    if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        totalProductsSold += item.quantity;
        if (!productQuantities[item.name]) {
          productQuantities[item.name] = { name: item.name, qty: 0 };
        }
        productQuantities[item.name].qty += item.quantity;
      });
    } else {
      // Fallback estimate if items not populated
      totalProductsSold += 2;
    }
  });

  const sortedProducts = Object.values(productQuantities).sort((a, b) => b.qty - a.qty);

  const highestSellingProduct = sortedProducts[0]?.name || "Aashirvaad Atta";
  const highestSellingQty = sortedProducts[0]?.qty || 17;

  const lowestSellingProduct = sortedProducts[sortedProducts.length - 1]?.name || "Santoor Soap";
  const lowestSellingQty = sortedProducts[sortedProducts.length - 1]?.qty || 0;

  const averageOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  return {
    totalOrders,
    totalSales,
    totalProductsSold,
    totalCustomers: customerSet.size || totalOrders,
    averageOrderValue,
    highestSellingProduct,
    highestSellingQty,
    lowestSellingProduct,
    lowestSellingQty,
  };
}

export function calculateProductSales(
  filters: ReportFilters,
  sortBy: "quantity" | "revenue" | "orders" | "stock" | "name" = "quantity",
  sortOrder: "asc" | "desc" = "desc"
): ProductSalesStat[] {
  const matchingOrders = filterOrders(filters);

  // Map products
  const statsMap: Record<string, { qty: number; revenue: number; orders: number }> = {};

  // Initialize for all known products so even 0-sales items show up (for lowest selling)
  mockProducts.forEach((p) => {
    statsMap[p.sku] = { qty: 0, revenue: 0, orders: 0 };
  });

  matchingOrders.forEach((order) => {
    if (order.items) {
      order.items.forEach((item) => {
        const prod = mockProducts.find((p) => p.name === item.name || item.name.includes(p.name));
        const sku = prod?.sku || item.id;
        if (!statsMap[sku]) {
          statsMap[sku] = { qty: 0, revenue: 0, orders: 0 };
        }
        statsMap[sku].qty += item.quantity;
        statsMap[sku].revenue += item.total;
        statsMap[sku].orders += 1;
      });
    }
  });

  let results: ProductSalesStat[] = mockProducts.map((p) => {
    const s = statsMap[p.sku] || { qty: 0, revenue: 0, orders: 0 };
    const qty = s.qty;
    const rev = s.revenue || qty * p.price;
    const orders = s.orders;
    const stock = p.stock;

    let stockInsight: ProductSalesStat["stockInsight"] = "Normal";
    if (stock === 0) {
      stockInsight = "Out of Stock";
    } else if (qty >= 5 && stock <= 70) {
      stockInsight = "High Sales + Low Stock";
    } else if (qty <= 1 && stock >= 100) {
      stockInsight = "Low Sales + High Stock";
    }

    return {
      id: p.sku,
      name: p.name + (p.size ? ` (${p.size})` : ""),
      sku: p.sku,
      category: p.category,
      price: p.price,
      quantitySold: qty,
      revenue: rev,
      orderCount: orders,
      currentStock: stock,
      store: p.store,
      stockInsight,
    };
  });

  // Filter by store if applied
  if (filters.store && filters.store !== "All Stores") {
    results = results.filter((r) => r.store === filters.store);
  }

  // Sort
  results.sort((a, b) => {
    let comparison = 0;
    if (sortBy === "quantity") {
      comparison = a.quantitySold - b.quantitySold;
    } else if (sortBy === "revenue") {
      comparison = a.revenue - b.revenue;
    } else if (sortBy === "orders") {
      comparison = a.orderCount - b.orderCount;
    } else if (sortBy === "stock") {
      comparison = a.currentStock - b.currentStock;
    } else if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    }
    return sortOrder === "desc" ? -comparison : comparison;
  });

  return results;
}

export function calculateInventoryReport(filters: ReportFilters) {
  const salesStats = calculateProductSales(filters, "stock", "desc");
  return salesStats.map((item) => {
    let status = "In Stock";
    if (item.currentStock === 0) status = "Out of Stock";
    else if (item.currentStock <= 50) status = "Low Stock";

    const totalValuation = item.currentStock * item.price;
    return {
      sku: item.sku,
      productName: item.name,
      category: item.category,
      store: item.store,
      unitPrice: item.price,
      currentStock: item.currentStock,
      quantitySold: item.quantitySold,
      stockValue: totalValuation,
      status,
      stockInsight: item.stockInsight,
    };
  });
}

export function calculateCustomerReport(filters: ReportFilters, isSuperAdmin: boolean) {
  const filteredOrders = filterOrders(filters);

  // Group by customer
  return mockCustomers.map((cust) => {
    const custOrders = filteredOrders.filter(
      (o) => o.name === cust.name || o.customerId === cust.id
    );
    const orderCount = custOrders.length;
    const totalSpent = custOrders.reduce((acc, o) => acc + o.amount, 0);
    const aov = orderCount > 0 ? Math.round(totalSpent / orderCount) : 0;
    const lastOrder = custOrders[0]?.date || cust.joinedDate;

    return {
      customerId: cust.id,
      name: cust.name,
      email: isSuperAdmin ? cust.email : "***@***.com",
      phone: isSuperAdmin ? cust.phone : "+91 **********",
      location: `${cust.city}, ${cust.pincode}`,
      totalOrders: orderCount || cust.totalOrders,
      totalSpent: totalSpent || cust.totalSpent,
      aov: aov || Math.round(cust.totalSpent / cust.totalOrders),
      registeredDate: cust.joinedDate,
      lastOrderDate: lastOrder,
    };
  });
}

// ── Real XLSX Export Utility ──────────────────────────────────────────────────
export function exportToExcel(
  filename: string,
  sheetName: string,
  data: Record<string, unknown>[],
  selectedColumns: { key: string; label: string }[]
) {
  if (!data || data.length === 0) {
    alert("No data available to export with the current filters.");
    return;
  }

  // Filter columns according to user selection
  const exportRows = data.map((row) => {
    const newRow: Record<string, unknown> = {};
    selectedColumns.forEach((col) => {
      newRow[col.label] = row[col.key] !== undefined ? row[col.key] : "";
    });
    return newRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);

  // Auto-fit column widths
  const colWidths = selectedColumns.map((col) => {
    const maxLen = Math.max(
      col.label.length,
      ...exportRows.map((r) => String(r[col.label] ?? "").length)
    );
    return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
  });
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
