import { NextRequest, NextResponse } from "next/server";
import { mockCustomers } from "@/lib/mockData";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const customerId = resolvedParams.id;

  const roleHeader =
    request.headers.get("x-user-role") ||
    request.cookies.get("kmart_user_role")?.value ||
    request.nextUrl.searchParams.get("role");

  if (roleHeader && roleHeader !== "superadmin") {
    return NextResponse.json(
      {
        error: "403 Forbidden: Super Admin privileges required to access customer details and order history.",
        code: "ACCESS_DENIED",
      },
      { status: 403 }
    );
  }

  const customer = mockCustomers.find(
    (c) => c.id.toLowerCase() === customerId.toLowerCase()
  );

  if (!customer) {
    return NextResponse.json(
      { error: "Customer not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: customer,
  });
}
