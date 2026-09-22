import { NextRequest, NextResponse } from "next/server";
import { calculateProductSales, DateRangePreset, ReportFilters } from "@/lib/reportService";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const datePreset = (searchParams.get("datePreset") as DateRangePreset) || "All Time";
  const customFrom = searchParams.get("customFrom") || undefined;
  const customTo = searchParams.get("customTo") || undefined;
  const store = searchParams.get("store") || "All Stores";
  const slot = searchParams.get("slot") || "All Slots";
  const status = searchParams.get("status") || "All Statuses";
  const sortBy = (searchParams.get("sortBy") as "quantity" | "revenue" | "orders" | "stock" | "name") || "quantity";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  const filters: ReportFilters = {
    datePreset,
    customFrom,
    customTo,
    store,
    slot,
    status,
  };

  const products = calculateProductSales(filters, sortBy, sortOrder);

  return NextResponse.json({
    success: true,
    filters,
    sortBy,
    sortOrder,
    totalProducts: products.length,
    data: products,
  });
}
