import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Team management is temporarily unavailable." },
      { status: 503 }
    );
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } = await authClient.auth.getUser(accessToken);
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Your session is invalid or expired." }, { status: 401 });
  }

  const { data: callerAdmin, error: callerError } = await adminClient
    .from("admins")
    .select("role")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  if (
    callerError ||
    !callerAdmin ||
    !["ADMIN", "SUPER_ADMIN"].includes(callerAdmin.role)
  ) {
    return NextResponse.json({ error: "You are not authorized to delete team members." }, { status: 403 });
  }

  const { id } = await params;
  const { data: member, error: memberError } = await adminClient
    .from("staff")
    .select("id, email")
    .eq("id", id)
    .maybeSingle();

  if (memberError) {
    return NextResponse.json({ error: "Unable to load this team member." }, { status: 500 });
  }
  if (!member) {
    return NextResponse.json({ error: "Team member not found." }, { status: 404 });
  }

  let linkedAuthUserId: string | null = null;
  if (member.email) {
    for (let page = 1; ; page += 1) {
      const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers({
        page,
        perPage: 1000,
      });

      if (usersError) {
        return NextResponse.json(
          { error: "Unable to verify the team member's sign-in account." },
          { status: 500 }
        );
      }

      const linkedUser = usersData.users.find(
        (user) => user.email?.toLowerCase() === member.email.toLowerCase()
      );
      if (linkedUser) {
        linkedAuthUserId = linkedUser.id;
        break;
      }
      if (usersData.users.length < 1000) break;
    }
  }

  if (linkedAuthUserId) {
    const { data: linkedAdmin, error: linkedAdminError } = await adminClient
      .from("admins")
      .select("id")
      .eq("auth_user_id", linkedAuthUserId)
      .maybeSingle();

    if (linkedAdminError) {
      return NextResponse.json({ error: "Unable to verify this account." }, { status: 500 });
    }
    if (linkedAdmin) {
      return NextResponse.json(
        { error: "Administrator accounts cannot be deleted from Team Management." },
        { status: 409 }
      );
    }
  }

  const { error: staffDeleteError } = await adminClient.from("staff").delete().eq("id", member.id);
  if (staffDeleteError) {
    return NextResponse.json(
      { error: "Unable to delete this team member while related records remain." },
      { status: 409 }
    );
  }

  if (linkedAuthUserId) {
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(linkedAuthUserId);
    if (authDeleteError) {
      console.error("Team member Auth cleanup failed after staff deletion:", authDeleteError);
      return NextResponse.json(
        {
          error: "The team record was removed, but its sign-in account could not be removed. Contact support.",
          staffDeleted: true,
        },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ success: true });
}