import { NextRequest, NextResponse } from "next/server";
import { dbService, supabase } from "@/lib/db";
import OpenAI from "openai";

export async function GET(request: NextRequest) {
  const results = {
    openai: "connected",
    elevenlabs: "connected",
    supabase: "connected"
  };

  // 1. Test Supabase connection
  if (dbService.isMock()) {
    results.supabase = "sandbox_mode (running with local json database)";
  } else {
    try {
      if (!supabase) {
        throw new Error("Supabase client is null despite being configured");
      }
      const { data, error } = await supabase.from("businesses").select("id").limit(1);
      if (error) {
        throw error;
      }
      results.supabase = "connected";
    } catch (err: any) {
      console.error("Debug: Supabase connection failed:", err);
      results.supabase = `failed: ${err.message || err}`;
    }
  }

  // 2. Test OpenAI connection
  const openaiKey = process.env.OPENAI_API_KEY || "";
  if (!openaiKey) {
    results.openai = "missing_api_key (running with local rule-based fallback)";
  } else {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      // Call a quick lightweight model listing
      await openai.models.list();
      results.openai = "connected";
    } catch (err: any) {
      console.error("Debug: OpenAI connection failed:", err);
      results.openai = `failed: ${err.message || err}`;
    }
  }

  // 3. Test ElevenLabs connection
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY || "";
  if (!elevenlabsKey) {
    results.elevenlabs = "missing_api_key (running with Google TTS redirect fallback)";
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
      console.error("Debug: ElevenLabs connection failed:", err);
      results.elevenlabs = `failed: ${err.message || err}`;
    }
  }

  return NextResponse.json(results);
}
