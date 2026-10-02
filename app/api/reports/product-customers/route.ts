import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getProductCustomerPurchases, ReportFilters } from "@/lib/supabaseService";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ success: false, error: "productId is required" }, { status: 400 });
  }

  const accessToken = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json({ success: false, error: "Product reporting is temporarily unavailable" }, { status: 503 });
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

  const filters: ReportFilters = {
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    store: searchParams.get("store") || "All Stores",
    slot: searchParams.get("slot") || "All Slots",
    status: searchParams.get("status") || "All Statuses",
  };
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "50", 10) || 50));

  try {
    const reportClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const result = await getProductCustomerPurchases(productId, filters, page, pageSize, reportClient);
    return NextResponse.json({ success: true, filters, page, pageSize, total: result.total, data: result.purchases });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch product purchase history";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}