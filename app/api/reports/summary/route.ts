import { NextRequest, NextResponse } from "next/server";
import { filterOrders, calculateSummaryKPIs, DateRangePreset, ReportFilters } from "@/lib/reportService";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const datePreset = (searchParams.get("datePreset") as DateRangePreset) || "All Time";
  const customFrom = searchParams.get("customFrom") || undefined;
  const customTo = searchParams.get("customTo") || undefined;
  const store = searchParams.get("store") || "All Stores";
  const slot = searchParams.get("slot") || "All Slots";
  const status = searchParams.get("status") || "All Statuses";

  const filters: ReportFilters = {
    datePreset,
    customFrom,
    customTo,
    store,
    slot,
    status,
  };

  const matchingOrders = filterOrders(filters);
  const kpis = calculateSummaryKPIs(matchingOrders);

  return NextResponse.json({
    success: true,
    filters,
    kpis,
    matchingOrdersCount: matchingOrders.length,
  });
}
