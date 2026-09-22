import { NextRequest, NextResponse } from "next/server";
import { getOrders, ReportFilters } from "@/lib/supabaseService";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const store = searchParams.get("store") || "All Stores";
  const slot = searchParams.get("slot") || "All Slots";
  const status = searchParams.get("status") || "All Statuses";
  const search = searchParams.get("search") || undefined;
  const isSuperAdmin = searchParams.get("isSuperAdmin") === "true";

  const filters: ReportFilters & { search?: string } = {
    from,
    to,
    store,
    slot,
    status,
    search,
  };

  try {
    const { orders, total } = await getOrders(filters, isSuperAdmin);
    return NextResponse.json({
      success: true,
      filters,
      totalOrders: total,
      data: orders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch orders report";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
