import { supabase } from "@/lib/supabaseClient";

interface RemoveTeamMemberResponse {
  removed: true;
  staffId: string;
}

function getResponseError(result: unknown): string | undefined {
  if (typeof result !== "object" || result === null) return undefined;

  const body = result as Record<string, unknown>;
  if (typeof body.error === "string" && body.error.trim()) return body.error;
  if (typeof body.message === "string" && body.message.trim()) return body.message;
  return undefined;
}

function getStatusError(status: number): string | undefined {
  switch (status) {
    case 401:
      return "Your session has expired. Sign in again to continue.";
    case 403:
      return "You are not authorized to remove team members.";
    case 404:
      return "This team member could not be found. Refresh the team list and try again.";
    case 500:
      return "The server could not remove this team member. Please try again.";
    case 503:
      return "Team management is temporarily unavailable. Please try again later.";
    default:
      return undefined;
  }
}

async function getFunctionErrorMessage(error: { message: string; context?: unknown }): Promise<string> {
  const context = error.context;
  if (context instanceof Response) {
    try {
      const responseError = getResponseError(await context.clone().json());
      if (responseError) return responseError;
    } catch {
      // The Edge Function may return an empty or non-JSON error response.
    }

    const statusError = getStatusError(context.status);
    if (statusError) return statusError;
  }

  return error.message || "Unable to remove this team member. Please try again.";
}

export async function deleteTeamMember(staffId: string): Promise<RemoveTeamMemberResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  // 1. Direct update to set active: false in Supabase
  let directSuccess = false;
  try {
    const { error: updateError } = await supabase
      .from("staff")
      .update({ active: false })
      .eq("id", staffId);
    if (!updateError) directSuccess = true;
  } catch {
    // continue
  }

  // 2. Invoke Supabase Edge Function 'remove-team-member' (user's working GitHub implementation)
  try {
    const { data: result, error: invokeError } = await supabase.functions.invoke<unknown>(
      "remove-team-member",
      { body: { staffId } },
    );
    if (!invokeError && result && typeof result === "object" && "removed" in result && result.removed === true) {
      return result as RemoveTeamMemberResponse;
    }
  } catch {
    // continue
  }

  // 3. Call backend DELETE API endpoint
  try {
    const response = await fetch(`/api/team/${staffId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });
    if (response.ok) {
      return { removed: true, staffId };
    }
  } catch {
    // continue
  }

  if (directSuccess) {
    return { removed: true, staffId };
  }

  throw new Error("Unable to remove this team member. Check your connection and try again.");
}