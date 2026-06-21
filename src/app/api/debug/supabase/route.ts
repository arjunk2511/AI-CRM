import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  console.log("Supabase Diagnostics Runtime Check:");
  console.log(`NEXT_PUBLIC_SUPABASE_URL: ${url ? `${url.substring(0, 15)}... (len: ${url.length})` : "MISSING"}`);
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anon ? `${anon.substring(0, 10)}... (len: ${anon.length})` : "MISSING"}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY: ${serviceRole ? `${serviceRole.substring(0, 10)}... (len: ${serviceRole.length})` : "MISSING"}`);

  const responsePayload = {
    url_present: url !== "",
    anon_present: anon !== "",
    service_role_present: serviceRole !== "",
    initialization_success: false,
    error: null as string | null
  };

  try {
    if (!url) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
    }
    if (!url.startsWith("http")) {
      throw new Error(`NEXT_PUBLIC_SUPABASE_URL does not start with http: "${url}"`);
    }
    const key = serviceRole || anon;
    if (!key) {
      throw new Error("Missing both SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }

    const client = createClient(url, key);
    if (!client) {
      throw new Error("createClient returned null or undefined");
    }

    responsePayload.initialization_success = true;
  } catch (err: any) {
    console.error("[Supabase Init Error Details]:", err);
    responsePayload.error = err.message || String(err);
  }

  return NextResponse.json(responsePayload);
}
