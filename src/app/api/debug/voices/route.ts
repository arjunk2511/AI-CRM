import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY || "";

  if (!apiKey) {
    return NextResponse.json({
      error: "Missing ELEVENLABS_API_KEY environment variable.",
      usable: false
    }, { status: 500 });
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

    // Filter for premade (default free) voices
    const premadeVoices = voicesList.filter((v: any) => v.category === "premade");

    if (premadeVoices.length === 0) {
      // If no premade voices exist, check if there's any voice
      if (voicesList.length > 0) {
        return NextResponse.json({
          voice_id: voicesList[0].voice_id,
          voice_name: voicesList[0].name,
          category: voicesList[0].category,
          usable: true,
          warning: "No premade voices found, falling back to first available voice."
        });
      }
      throw new Error("No voices returned by ElevenLabs API.");
    }

    // Select the first premade voice as default
    const selectedVoice = premadeVoices[0];

    return NextResponse.json({
      voice_id: selectedVoice.voice_id,
      voice_name: selectedVoice.name,
      category: selectedVoice.category,
      usable: true
    });

  } catch (err: any) {
    console.error("ElevenLabs voices diagnostic error:", err);
    return NextResponse.json({
      voice_id: null,
      voice_name: null,
      category: null,
      usable: false,
      error: err.message || String(err)
    }, { status: 500 });
  }
}
