import { NextRequest, NextResponse } from "next/server";
import { getCustomers } from "@/lib/supabaseService";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const store = searchParams.get("store") || "All Stores";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(1000, Math.max(1, Number.parseInt(searchParams.get("pageSize") || "50", 10) || 50));

  try {
    const result = await getCustomers(search, store, page, pageSize);
    return NextResponse.json({
      success: true,
      data: result.customers,
      total: result.total,
      page,
      pageSize,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch customers";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
