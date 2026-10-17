
import { connection, NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  // Kjo rrugë varet nga kërkesa reale e përdoruesit.
  // Nuk duhet të ekzekutohet gjatë prerenderimit statik.
  await connection();

  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Duhet të kyçesh përsëri." },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice(7);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !publishableKey) {
      console.error("Mungon konfigurimi publik i Supabase.");

      return NextResponse.json(
        { error: "Konfigurimi i Supabase mungon." },
        { status: 500 }
      );
    }

    // Verifiko token-in me Supabase Auth.
    const authClient = createClient(
      supabaseUrl,
      publishableKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sesioni nuk është valid. Kyçu përsëri." },
        { status: 401 }
      );
    }

    // Kontrollo në server nëse përdoruesi është i bllokuar.
    const { data: ban, error: banError } = await supabaseAdmin
      .from("user_bans")
      .select("reason")
      .eq("user_id", user.id)
      .maybeSingle();

    if (banError) {
      console.error(
        "Gabim gjatë kontrollit të bllokimit:",
        banError.message
      );

      return NextResponse.json(
        {
          error: "Nuk mund të verifikohet statusi i llogarisë.",
        },
        { status: 500 }
      );
    }

    if (ban) {
      return NextResponse.json({
        authenticated: true,
        banned: true,
        reason: ban.reason || "Bllokuar nga administratori.",
      });
    }

    return NextResponse.json({
      authenticated: true,
      banned: false,
      reason: "",
    });
  } catch (error) {
    console.error("Gabim në account-status:", error);

    return NextResponse.json(
      { error: "Ndodhi një gabim i brendshëm." },
      { status: 500 }
    );
  }
}
