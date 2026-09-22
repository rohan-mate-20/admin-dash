import { NextRequest, NextResponse } from "next/server";
import { getReportKPIs, ReportFilters } from "@/lib/supabaseService";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const store = searchParams.get("store") || "All Stores";
  const slot = searchParams.get("slot") || "All Slots";
  const status = searchParams.get("status") || "All Statuses";

  const filters: ReportFilters = {
    from,
    to,
    store,
    slot,
    status,
  };

  try {
    const kpis = await getReportKPIs(filters);
    return NextResponse.json({
      success: true,
      filters,
      kpis,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch KPI summary";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
