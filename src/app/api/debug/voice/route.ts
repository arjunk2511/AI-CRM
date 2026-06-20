import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import OpenAI from "openai";

export async function GET(request: NextRequest) {
  const results = {
    openai: "connected",
    elevenlabs: "connected",
    supabase: "connected"
  };

  // 1. Verify and test Supabase Connection
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl) {
    results.supabase = "failed: missing NEXT_PUBLIC_SUPABASE_URL";
  } else if (!supabaseAnonKey) {
    results.supabase = "failed: missing NEXT_PUBLIC_SUPABASE_ANON_KEY";
  } else if (!supabaseServiceKey) {
    results.supabase = "failed: missing SUPABASE_SERVICE_ROLE_KEY";
  } else {
    try {
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }
      // Simple select query to test database connectivity
      const { error } = await supabase.from("businesses").select("id").limit(1);
      if (error) throw error;
      results.supabase = "connected";
    } catch (err: any) {
      results.supabase = `failed: ${err.message || err}`;
    }
  }

  // 2. Verify and test OpenAI connection
  const openaiKey = process.env.OPENAI_API_KEY || "";
  if (!openaiKey) {
    results.openai = "failed: missing OPENAI_API_KEY";
  } else {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      await openai.models.list();
      results.openai = "connected";
    } catch (err: any) {
      results.openai = `failed: ${err.message || err}`;
    }
  }

  // 3. Verify and test ElevenLabs connection
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY || "";
  if (!elevenlabsKey) {
    results.elevenlabs = "failed: missing ELEVENLABS_API_KEY";
  } else {
    try {
      const elResponse = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": elevenlabsKey }
      });
      if (!elResponse.ok) {
        const errText = await elResponse.text();
        throw new Error(`ElevenLabs returned HTTP ${elResponse.status}: ${errText}`);
      }
      results.elevenlabs = "connected";
    } catch (err: any) {
      results.elevenlabs = `failed: ${err.message || err}`;
    }
  }

  return NextResponse.json(results);
}
