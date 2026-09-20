import { NextRequest, NextResponse } from "next/server";
import { calculateCustomerReport, DateRangePreset, ReportFilters } from "@/lib/reportService";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const datePreset = (searchParams.get("datePreset") as DateRangePreset) || "All Time";
  const customFrom = searchParams.get("customFrom") || undefined;
  const customTo = searchParams.get("customTo") || undefined;
  const store = searchParams.get("store") || "All Stores";
  const slot = searchParams.get("slot") || "All Slots";
  const status = searchParams.get("status") || "All Statuses";

  // Check caller role
  const roleHeader =
    request.headers.get("x-user-role") ||
    request.cookies.get("kmart_user_role")?.value ||
    searchParams.get("role") ||
    "admin";

  const isSuperAdmin = roleHeader === "superadmin";

  const filters: ReportFilters = {
    datePreset,
    customFrom,
    customTo,
    store,
    slot,
    status,
  };

  const customers = calculateCustomerReport(filters, isSuperAdmin);

  return NextResponse.json({
    success: true,
    isSuperAdmin,
    filters,
    totalCustomers: customers.length,
    data: customers,
  });
}
