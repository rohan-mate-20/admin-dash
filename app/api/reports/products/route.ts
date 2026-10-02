import { NextRequest, NextResponse } from "next/server";
import { getProductSales, ReportFilters } from "@/lib/supabaseService";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const store = searchParams.get("store") || "All Stores";
  const slot = searchParams.get("slot") || "All Slots";
  const status = searchParams.get("status") || "All Statuses";
  const category = searchParams.get("category") || "All Categories";

  const filters: ReportFilters = {
    from,
    to,
    store,
    slot,
    status,
    category,
  };

  try {
    const products = await getProductSales(filters);
    return NextResponse.json({
      success: true,
      filters,
      totalProducts: products.length,
      data: products,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch product performance";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
