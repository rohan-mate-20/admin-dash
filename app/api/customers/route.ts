import { NextRequest, NextResponse } from "next/server";
import { mockCustomers } from "@/lib/mockData";

export async function GET(request: NextRequest) {
  // Check authorization header or role cookie/header
  const roleHeader =
    request.headers.get("x-user-role") ||
    request.cookies.get("kmart_user_role")?.value ||
    request.nextUrl.searchParams.get("role");

  // In production, this verifies JWT or session role
  // If role is explicitly admin or not superadmin, deny access
  if (roleHeader && roleHeader !== "superadmin") {
    return NextResponse.json(
      {
        error: "403 Forbidden: Super Admin privileges required to access customer directory.",
        code: "ACCESS_DENIED",
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    data: mockCustomers,
    total: mockCustomers.length,
  });
}
