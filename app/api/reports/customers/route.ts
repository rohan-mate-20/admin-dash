import { NextRequest, NextResponse } from "next/server";
import { getCustomers } from "@/lib/supabaseService";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const store = searchParams.get("store") || "All Stores";
  const search = searchParams.get("search") || "";

  try {
    const customers = await getCustomers(search, store);
    return NextResponse.json({
      success: true,
      store,
      totalCustomers: customers.length,
      data: customers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch customer report";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
