import { NextRequest, NextResponse } from "next/server";
import { supabase, dbService } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  try {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    // 1. Fetch and log OpenAPI schema for messages table (Requirement 6)
    let messagesSchema = null;
    try {
      const response = await fetch(`${url}/rest/v1/?apikey=${key}`);
      if (response.ok) {
        const schema = await response.json();
        messagesSchema = schema.definitions?.messages || null;
        console.log("Messages Table Schema (Postgrest Definitions):");
        console.log(JSON.stringify(messagesSchema, null, 2));
      }
    } catch (schemaErr) {
      console.warn("Could not retrieve Postgrest schema definitions:", schemaErr);
    }

    // 2. Perform a test insert into messages table (Requirement 4)
    // We create a temporary conversation first to avoid foreign key violations.
    const tempCallId = randomUUID();
    await supabase
      .from("calls")
      .insert({
        id: tempCallId,
        business_id: "demo-business-id",
        agent_id: "demo-agent-id",
        customer_id: "cust-temp",
        customer_name: "Messages Debug Tester",
        duration_seconds: 0,
        status: "active",
        summary: "Temp call for messages debug.",
        sentiment: "neutral",
        outcome: "Temp",
        recording_url: "debug:temp"
      });

    // Test message insert using our updated createMessage method
    let insertedMsg = null;
    try {
      insertedMsg = await dbService.createMessage(
        tempCallId,
        "assistant",
        "This is a test messages insert for diagnostics."
      );
    } finally {
      // Cleanup the temporary messages and conversation records
      try {
        await supabase.from("messages").delete().eq("conversation_id", tempCallId);
        await supabase.from("calls").delete().eq("id", tempCallId);
      } catch (cleanupErr) {
        console.warn("Messages debug cleanup failed:", cleanupErr);
      }
    }

    return NextResponse.json({
      messages_insert: true,
      generated_id: insertedMsg?.id || null,
      schema: messagesSchema
    });

  } catch (err: any) {
    console.error("Messages diagnostics insert failure:", err);
    return NextResponse.json({
      messages_insert: false,
      error: err.message || String(err),
      stack: err.stack || null
    }, { status: 500 });
  }
}
