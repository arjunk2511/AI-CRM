import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openaiKey = process.env.OPENAI_API_KEY || "";
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "Missing audio file blob" }, { status: 400 });
    }

    let text = "";

    if (openai) {
      // Send audio byte stream to OpenAI Whisper
      const response = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "kn" // Hint Kannada language transcription
      });
      text = response.text || "";
    } else {
      // Sandbox fallback transcription simulation
      // Emulates successful transcription of a random Kannada FAQ query
      const mockTranscripts = [
        "ಬೆಲೆ ಎಷ್ಟು?",
        "ಬ್ಯಾಟರಿ ಎಷ್ಟು ಸಮಯ ಬರುತ್ತದೆ?",
        "ವಾರಂಟಿ ಎಷ್ಟು ತಿಂಗಳು?",
        "ಹೋಮ್ ಡೆಲಿವರಿ ಇದೆಯೇ?"
      ];
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      text = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
    }

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("Transcription API route error:", error);
    return NextResponse.json({ error: error.message || "Failed to transcribe audio" }, { status: 505 });
  }
}
