import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!url || !key) {
    return NextResponse.json({ error: "Missing Supabase URL or key" }, { status: 500 });
  }

  try {
    const response = await fetch(`${url}/rest/v1/?apikey=${key}`);
    if (!response.ok) {
      throw new Error(`Postgrest returned HTTP ${response.status}`);
    }
    const schema = await response.json();
    
    const definitions = schema.definitions || {};
    return NextResponse.json({
      agents: definitions.agents,
      businesses: definitions.businesses,
      calls: definitions.calls
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
