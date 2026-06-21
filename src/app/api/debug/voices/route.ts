import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY || "";

  if (!apiKey) {
    return NextResponse.json({
      error: "Missing ELEVENLABS_API_KEY environment variable.",
      usable: false
    }, { status: 500 });
  }

  // 1. Resolve voice source
  let voiceId = "21m00Tcm4TlvDq8ikWAM"; // default fallback
  let source = "default fallback";

  // Check environment variable
  if (process.env.ELEVENLABS_VOICE_ID) {
    voiceId = process.env.ELEVENLABS_VOICE_ID;
    source = "environment variable";
  }

  // Check database for configured ElevenLabs voice
  try {
    if (supabase) {
      const { data: agents } = await supabase
        .from("agents")
        .select("voice_provider, voice_id")
        .eq("voice_provider", "elevenlabs")
        .limit(1);
      
      if (agents && agents.length > 0 && agents[0].voice_id) {
        voiceId = agents[0].voice_id;
        source = "database";
      }
    }
  } catch (dbErr) {
    console.warn("Database lookup failed for active agent voice:", dbErr);
  }

  try {
    const elResponse = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey }
    });

    if (!elResponse.ok) {
      const errText = await elResponse.text();
      throw new Error(`ElevenLabs GET /v1/voices returned HTTP ${elResponse.status}: ${errText}`);
    }

    const data = await elResponse.json();
    const voicesList = data.voices || [];
    const premadeVoices = voicesList.filter((v: any) => v.category === "premade");

    // Check if the resolved voiceId is a valid premade voice
    const matchedVoice = voicesList.find((v: any) => v.voice_id === voiceId);
    const isVoicePremade = matchedVoice && matchedVoice.category === "premade";

    let finalVoice = matchedVoice;

    if (!isVoicePremade) {
      // Override with first premade voice if current selection is invalid or library voice
      if (premadeVoices.length > 0) {
        finalVoice = premadeVoices[0];
        voiceId = finalVoice.voice_id;
        source = "default fallback"; // since it fell back to default premade
      } else if (voicesList.length > 0) {
        finalVoice = voicesList[0];
        voiceId = finalVoice.voice_id;
        source = "default fallback";
      }
    }

    return NextResponse.json({
      voice_id: voiceId,
      voice_name: finalVoice?.name || "Rachel",
      category: finalVoice?.category || "premade",
      source: source,
      usable: true
    });

  } catch (err: any) {
    console.error("ElevenLabs voices diagnostic error:", err);
    return NextResponse.json({
      voice_id: null,
      voice_name: null,
      category: null,
      source: source,
      usable: false,
      error: err.message || String(err)
    }, { status: 500 });
  }
}
