import { NextRequest, NextResponse } from "next/server";
import { getInventory } from "@/lib/supabaseService";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tabParam = searchParams.get("tab");
  const tab = tabParam === "In Stock" || tabParam === "Out of Stock" ? tabParam : "All Products";
  const store = searchParams.get("store") || "All Stores";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);

  try {
    const { items, total } = await getInventory(tab, store, page, pageSize);
    return NextResponse.json({
      success: true,
      tab,
      store,
      page,
      totalItems: total,
      data: items,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch inventory report";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
