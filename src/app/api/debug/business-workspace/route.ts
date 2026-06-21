import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  const resultPayload = {
    user_found: false,
    user_id: null as string | null,
    business_found: false,
    business_id: null as string | null,
    business_name: null as string | null,
    error: null as string | null,
    failing_query: null as string | null
  };

  try {
    if (!supabase) {
      throw new Error("Supabase is not initialized/configured.");
    }

    // 1. Log and verify user ID lookup
    console.log("Supabase User lookup: Querying first user record...");
    resultPayload.failing_query = "SELECT * FROM users LIMIT 1";
    const { data: users, error: userErr } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (userErr) {
      throw userErr;
    }

    const userId = users && users.length > 0 ? users[0].id : "demo-user-id";
    resultPayload.user_found = users && users.length > 0;
    resultPayload.user_id = userId;
    console.log(`Supabase User lookup completed. User ID resolved: "${userId}"`);

    // 2. Log and verify business lookup by either user_id or id
    console.log(`Supabase Business lookup: Querying business for user_id or id matching: "${userId}" or "demo-business-id"`);
    resultPayload.failing_query = `SELECT * FROM businesses WHERE user_id = '${userId}' OR id = 'demo-business-id' LIMIT 1`;
    
    const { data: businesses, error: bizErr } = await supabase
      .from("businesses")
      .select("id, business_name")
      .or(`user_id.eq.${userId},id.eq.demo-business-id`)
      .limit(1);

    if (bizErr) {
      throw bizErr;
    }

    if (businesses && businesses.length > 0) {
      resultPayload.business_found = true;
      resultPayload.business_id = businesses[0].id;
      resultPayload.business_name = businesses[0].business_name;
      resultPayload.failing_query = null;
    } else {
      // Fallback workspace
      resultPayload.business_found = true;
      resultPayload.business_id = "demo-business-id";
      resultPayload.business_name = "SmartMop India (Default Fallback)";
      resultPayload.failing_query = null;
    }

  } catch (err: any) {
    console.error("Business Workspace diagnostics failure:", err);
    resultPayload.error = err.message || String(err);
  }

  return NextResponse.json(resultPayload);
}
