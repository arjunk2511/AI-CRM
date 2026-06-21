import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

const DEFAULT_FALLBACK_AGENT = {
  id: "demo-agent-id",
  name: "ಕುಮಾರ್ (Kumar)",
  business_id: "demo-business-id"
};

export async function GET(request: NextRequest) {
  const resultPayload = {
    agent_found: false,
    agent_id: null as string | null,
    agent_name: null as string | null,
    source: null as string | null,
    error: null as string | null
  };

  try {
    if (!supabase) {
      // Supabase is not configured, fall back to default deployed agent
      resultPayload.agent_found = true;
      resultPayload.agent_id = DEFAULT_FALLBACK_AGENT.id;
      resultPayload.agent_name = DEFAULT_FALLBACK_AGENT.name;
      resultPayload.source = "default fallback";
      return NextResponse.json(resultPayload);
    }

    // Query agents table
    console.log("Supabase agent lookup query starting...");
    const { data: agents, error } = await supabase
      .from("agents")
      .select("id, name, business_id")
      .limit(1);

    console.log("Supabase agent lookup query result:", { agents, error });

    if (error) {
      throw error;
    }

    if (agents && agents.length > 0) {
      resultPayload.agent_found = true;
      resultPayload.agent_id = agents[0].id;
      resultPayload.agent_name = agents[0].name;
      resultPayload.source = "supabase";
    } else {
      // No agents exist in Supabase, fall back to default deployed agent
      resultPayload.agent_found = true;
      resultPayload.agent_id = DEFAULT_FALLBACK_AGENT.id;
      resultPayload.agent_name = DEFAULT_FALLBACK_AGENT.name;
      resultPayload.source = "default fallback";
    }

  } catch (err: any) {
    console.error("Error in /api/debug/agent:", err);
    resultPayload.error = err.message || String(err);
  }

  return NextResponse.json(resultPayload);
}
