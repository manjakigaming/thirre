
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";


export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { authenticated: false, banned: false, reason: "" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return NextResponse.json(
        { authenticated: false, banned: false, reason: "" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase environment variables are missing.");

      return NextResponse.json(
        { error: "Gabim i konfigurimit të serverit." },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { authenticated: false, banned: false, reason: "" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const { data: ban, error: banError } = await supabaseAdmin
      .from("user_bans")
      .select("reason")
      .eq("user_id", user.id)
      .maybeSingle();

    if (banError) {
      console.error("Account ban check failed:", banError);

      return NextResponse.json(
        { error: "Nuk mund të kontrollohet statusi i llogarisë." },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (ban) {
      return NextResponse.json(
        {
          authenticated: true,
          banned: true,
          reason: ban.reason || "Bllokuar nga administratori.",
        },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        banned: false,
        reason: "",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Account status API error:", error);

    return NextResponse.json(
      { error: "Ndodhi një gabim gjatë kontrollit të llogarisë." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
