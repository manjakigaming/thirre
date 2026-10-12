
import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { connected: false, message: "Environment variables missing" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      cache: "no-store",
    });

    return NextResponse.json({
      connected: response.ok,
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { connected: false, message: "Could not reach Supabase" },
      { status: 502 }
    );
  }
}
