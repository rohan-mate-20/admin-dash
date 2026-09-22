import { NextRequest, NextResponse } from "next/server";
import { getCustomers } from "@/lib/supabaseService";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const store = searchParams.get("store") || "All Stores";

  try {
    const customers = await getCustomers(search, store);
    return NextResponse.json({
      success: true,
      data: customers,
      total: customers.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch customers";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
