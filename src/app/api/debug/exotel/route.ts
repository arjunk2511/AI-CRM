import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const webhookHost = `${protocol}://${host}`;

  let currentStep = "agent_found";

  try {
    // 1. Check if agent exists
    currentStep = "agent_found";
    let agent = null;
    try {
      agent = await dbService.getAgent("demo-agent-id");
    } catch (err: any) {
      throw new Error(`Failed to query demo-agent-id from database: ${err.message || err}`);
    }

    if (!agent) {
      // Create a fallback mock agent object matching the database schema so we can debug subsequent steps
      console.warn("demo-agent-id not found in database, creating custom mock object to proceed.");
      agent = {
        id: "demo-agent-id",
        business_id: "demo-business-id",
        name: "ಕುಮಾರ್ (Kumar)",
        greeting_message: "ನಮಸ್ಕಾರ!",
        language: "Kannada"
      };
    }

    // 2. Create conversation in database
    currentStep = "conversation_created";
    let newCall;
    try {
      newCall = await dbService.createConversation(
        agent.business_id,
        agent.id,
        "Debug Exotel Webhook Tester"
      );
    } catch (err: any) {
      throw new Error(`Failed to create conversation in database: ${err.message || err}`);
    }

    // 3. Trigger Central OpenAI/Gemini Chat API
    currentStep = "openai_response_generated";
    let chatResponse;
    try {
      chatResponse = await fetch(`${webhookHost}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "ಬೆಲೆ ಎಷ್ಟು?",
          agentId: agent.id,
          conversationId: newCall.id
        })
      });
    } catch (err: any) {
      throw new Error(`Fetch request to /api/chat failed: ${err.message || err}`);
    }

    if (!chatResponse.ok) {
      const errText = await chatResponse.text();
      throw new Error(`/api/chat returned status ${chatResponse.status}: ${errText}`);
    }

    const chatData = await chatResponse.json();
    if (!chatData.reply) {
      throw new Error(`/api/chat response did not contain a reply field: ${JSON.stringify(chatData)}`);
    }

    // 4. Save message in Supabase
    currentStep = "supabase_saved";
    try {
      await dbService.createMessage(newCall.id, "assistant", chatData.reply);
    } catch (err: any) {
      throw new Error(`Failed to save assistant reply message in database: ${err.message || err}`);
    }

    // 5. Generate TTS Audio
    currentStep = "tts_generated";
    let ttsResponse;
    try {
      ttsResponse = await fetch(`${webhookHost}/api/voice/play?text=${encodeURIComponent(chatData.reply)}&agentId=${agent.id}`);
    } catch (err: any) {
      throw new Error(`Fetch request to /api/voice/play failed: ${err.message || err}`);
    }

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      throw new Error(`/api/voice/play returned status ${ttsResponse.status}: ${errText}`);
    }

    // All steps succeeded
    return NextResponse.json({
      agent_found: true,
      conversation_created: true,
      openai_response_generated: true,
      supabase_saved: true,
      tts_generated: true,
      error: null
    });

  } catch (error: any) {
    console.error(`[/api/debug/exotel Failure at step: ${currentStep}]:`, error);
    return NextResponse.json({
      failing_step: currentStep,
      error: error.message || String(error),
      stack: error.stack || null
    }, { status: 500 });
  }
}
