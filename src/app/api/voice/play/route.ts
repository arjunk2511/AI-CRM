import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text") || "";
  const agentId = searchParams.get("agentId") || "";

  if (!text) {
    return new NextResponse("Missing text parameter", { status: 400 });
  }

  // 1. Resolve Voice Config
  let voiceId = "21m00Tcm4TlvDq8ikWAM"; // default ElevenLabs Rachel
  let language = "Kannada";

  if (agentId) {
    try {
      const agent = await dbService.getAgent(agentId);
      if (agent) {
        voiceId = agent.voice_id || voiceId;
        language = agent.language || language;
      }
    } catch (err) {
      console.warn("Could not load agent details for voice config:", err);
    }
  }

  const langCodeMap: Record<string, string> = {
    "Kannada": "kn",
    "Telugu": "te",
    "Hindi": "hi",
    "Tamil": "ta",
    "Malayalam": "ml",
    "English": "en"
  };
  const langCode = langCodeMap[language] || "kn";

  const apiKey = process.env.ELEVENLABS_API_KEY || "";

  // Enforce ElevenLabs TTS: Throw error if API key is missing
  if (!apiKey) {
    console.error("[ElevenLabs API Failure] Component: ElevenLabs Text-to-Speech API - Missing ELEVENLABS_API_KEY environment variable. Fallback to Google TTS is disabled.");
    return new NextResponse("Error: ElevenLabs API Key is missing. Production speech synthesis is required.", { status: 500 });
  }

  // 2. Fetch and Automatically Resolve Voice (Filter out library / paid voices)
  let resolvedVoiceId = voiceId;
  try {
    const elVoicesRes = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey }
    });
    if (elVoicesRes.ok) {
      const voicesData = await elVoicesRes.json();
      const voicesList = voicesData.voices || [];
      const premadeVoices = voicesList.filter((v: any) => v.category === "premade");
      
      const isCurrentVoicePremade = premadeVoices.some((v: any) => v.voice_id === voiceId);
      
      if (!isCurrentVoicePremade) {
        if (premadeVoices.length > 0) {
          resolvedVoiceId = premadeVoices[0].voice_id;
          console.log(`Auto-selected ElevenLabs premade voice: ${premadeVoices[0].name} (${resolvedVoiceId}) instead of "${voiceId}"`);
        } else if (voicesList.length > 0) {
          resolvedVoiceId = voicesList[0].voice_id;
          console.log(`No premade voices found. Falling back to first available voice: ${voicesList[0].name} (${resolvedVoiceId})`);
        }
      }
    } else {
      console.warn("ElevenLabs GET /v1/voices failed, relying on default voiceId.");
    }
  } catch (err) {
    console.warn("Exception while querying ElevenLabs voices API:", err);
  }

  // 3. Connect to ElevenLabs TTS
  try {
    const elUrl = `https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}`;
    const elResponse = await fetch(elUrl, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "accept": "audio/mpeg"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!elResponse.ok) {
      const errText = await elResponse.text();
      console.error("[ElevenLabs API Failure] Component: ElevenLabs Text-to-Speech API - HTTP status:", elResponse.status, "Error details:", errText);
      throw new Error(`ElevenLabs failure: ${errText}`);
    }

    const audioBuffer = await elResponse.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600"
      }
    });

  } catch (error: any) {
    console.error("[ElevenLabs API Failure] Component: ElevenLabs Text-to-Speech API - Exception details:", error.message || error);
    return new NextResponse(`Error: ElevenLabs speech generation failed: ${error.message || error}`, { status: 500 });
  }
}
