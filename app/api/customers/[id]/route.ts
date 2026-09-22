import { NextRequest, NextResponse } from "next/server";
import { getCustomerDetail } from "@/lib/supabaseService";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const customerId = resolvedParams.id;

  try {
    const customer = await getCustomerDetail(customerId);

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch customer";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
