import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  const generatedId = randomUUID();

  try {
    if (!supabase) {
      throw new Error("Supabase client is not configured/initialized.");
    }

    // Test a complete insert into calls table
    const { data, error } = await supabase
      .from("calls")
      .insert({
        id: generatedId,
        business_id: "demo-business-id", // mock business ID
        agent_id: "demo-agent-id",       // mock agent ID
        customer_id: "cust-temp",
        customer_name: "Database Diagnostics Test Client",
        duration_seconds: 0,
        status: "active",
        summary: "Database diagnostics test row.",
        sentiment: "neutral",
        outcome: "Test Insert",
        recording_url: "debug:test"
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    // Cleanup: delete the test insert row immediately
    try {
      await supabase
        .from("calls")
        .delete()
        .eq("id", generatedId);
    } catch (cleanupErr) {
      console.warn("Could not delete diagnostic test call row:", cleanupErr);
    }

    return NextResponse.json({
      calls_table_insert: true,
      generated_id: data?.id || generatedId
    });

  } catch (err: any) {
    console.error("Database diagnostics insert failure:", err);
    return NextResponse.json({
      calls_table_insert: false,
      error: err.message || String(err),
      details: err.details || null,
      hint: err.hint || null
    }, { status: 500 });
  }
}
