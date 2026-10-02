import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  getReportBuilderRows,
  REPORT_BUILDER_FIELDS,
  ReportBuilderFilters,
  ReportBuilderRow,
} from "@/lib/supabaseService";

export async function GET(request: NextRequest) {
  const accessToken = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json({ success: false, error: "Report builder is temporarily unavailable" }, { status: 503 });
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(accessToken);
  if (authError || !authData.user) {
    return NextResponse.json({ success: false, error: "Your session is invalid or expired" }, { status: 401 });
  }

  const { data: admin } = await adminClient
    .from("admins")
    .select("role")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();
  if (admin?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "Super Admin access is required" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const allowedFields = new Set(REPORT_BUILDER_FIELDS.map((field) => field.key));
  const columns = (params.get("columns") ?? "")
    .split(",")
    .filter((field): field is keyof ReportBuilderRow => allowedFields.has(field as keyof ReportBuilderRow));
  if (columns.length === 0) {
    return NextResponse.json({ success: false, error: "Select at least one report field" }, { status: 400 });
  }

  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(params.get("pageSize") ?? "50", 10) || 50));
  const filters: ReportBuilderFilters = {
    from: params.get("from") || undefined,
    to: params.get("to") || undefined,
    store: params.get("store") || "All Stores",
    status: params.get("status") || "All Statuses",
    category: params.get("category") || "All Categories",
    customerSearch: params.get("customer") || undefined,
    productSearch: params.get("product") || undefined,
  };

  try {
    const reportClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const result = await getReportBuilderRows(filters, page, pageSize, reportClient);
    const data = result.rows.map((row) => Object.fromEntries(columns.map((column) => [column, row[column]])));
    return NextResponse.json({
      success: true,
      filters,
      columns,
      page,
      pageSize,
      totalOrders: result.totalOrders,
      data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate report";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}