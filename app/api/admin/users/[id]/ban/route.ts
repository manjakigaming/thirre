
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = {
  params: Promise<{ id: string }>;
};

type AuthResult =
  | { userId: string }
  | { error: string; status: number };

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function authorize(request: NextRequest): Promise<AuthResult> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return { error: "Duhet të kyçesh përsëri.", status: 401 };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return { error: "Konfigurimi i Supabase mungon.", status: 500 };
  }

  const authClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token);

  if (authError || !user) {
    return { error: "Sesioni nuk është valid.", status: 401 };
  }

  // Kontrollo administratorin drejtpërdrejt në databazë.
  const { data: adminRecord, error: adminError } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    console.error("Kontrolli i administratorit dështoi:", adminError.message);
    return {
      error: "Nuk mund të verifikohet administratori.",
      status: 500,
    };
  }

  if (!adminRecord) {
    return { error: "Nuk ke leje administratori.", status: 403 };
  }

  return { userId: user.id };
}

export async function GET(
  request: NextRequest,
  context: Context
) {
  try {
    const auth = await authorize(request);

    if ("error" in auth) {
      return errorResponse(auth.error, auth.status);
    }

    const { id } = await context.params;

    if (!uuidPattern.test(id)) {
      return errorResponse("ID e përdoruesit nuk është valide.", 400);
    }

    const { data: target, error: targetError } =
      await supabaseAdmin.auth.admin.getUserById(id);

    if (targetError || !target.user) {
      return errorResponse("Përdoruesi nuk u gjet.", 404);
    }

    const { data: ban, error: banError } = await supabaseAdmin
      .from("user_bans")
      .select("user_id, reason, created_at")
      .eq("user_id", id)
      .maybeSingle();

    if (banError) {
      console.error("Leximi i bllokimit dështoi:", banError.message);
      return errorResponse("Nuk mund të lexohet statusi i bllokimit.", 500);
    }

    return NextResponse.json(
      {
        banned: Boolean(ban),
        reason: ban?.reason ?? "",
        created_at: ban?.created_at ?? null,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Gabim në GET ban:", error);
    return errorResponse("Ndodhi një gabim i brendshëm.", 500);
  }
}

export async function POST(
  request: NextRequest,
  context: Context
) {
  try {
    const auth = await authorize(request);

    if ("error" in auth) {
      return errorResponse(auth.error, auth.status);
    }

    const { id } = await context.params;

    if (!uuidPattern.test(id)) {
      return errorResponse("ID e përdoruesit nuk është valide.", 400);
    }

    if (auth.userId === id) {
      return errorResponse(
        "Nuk mund ta bllokosh ose zhbllokosh llogarinë tënde.",
        400
      );
    }

    let body: { action?: unknown; reason?: unknown };

    try {
      body = await request.json();
    } catch {
      return errorResponse("Kërkesa nuk përmban JSON valid.", 400);
    }

    if (body.action !== "ban" && body.action !== "unban") {
      return errorResponse("Veprimi duhet të jetë ban ose unban.", 400);
    }

    const { data: target, error: targetError } =
      await supabaseAdmin.auth.admin.getUserById(id);

    if (targetError || !target.user) {
      return errorResponse("Përdoruesi nuk u gjet.", 404);
    }

    if (body.action === "ban") {
      const reason =
        typeof body.reason === "string"
          ? body.reason.trim().slice(0, 500)
          : "";

      const finalReason = reason || "Bllokuar nga administratori";

      const { error: banError } = await supabaseAdmin
        .from("user_bans")
        .upsert(
          {
            user_id: id,
            reason: finalReason,
            created_by: auth.userId,
          },
          { onConflict: "user_id" }
        );

      if (banError) {
        console.error("Ruajtja e bllokimit dështoi:", banError.message);
        return errorResponse("Bllokimi nuk u ruajt në databazë.", 500);
      }

      return NextResponse.json({
        success: true,
        banned: true,
        reason: finalReason,
        message: "Bllokimi u regjistrua.",
      });
    }

    const { error: unbanError } = await supabaseAdmin
      .from("user_bans")
      .delete()
      .eq("user_id", id);

    if (unbanError) {
      console.error("Heqja e bllokimit dështoi:", unbanError.message);
      return errorResponse("Bllokimi nuk u hoq nga databaza.", 500);
    }

    return NextResponse.json({
      success: true,
      banned: false,
      reason: "",
      message: "Bllokimi u hoq.",
    });
  } catch (error) {
    console.error("Gabim në API-n e bllokimit:", error);
    return errorResponse("Ndodhi një gabim i brendshëm.", 500);
  }
}
