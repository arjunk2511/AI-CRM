import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { telephonyService } from "@/lib/telephony";

// Telephony Provider Webhook (processes URL-encoded POST requests from Twilio / Exotel)
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get("conversationId") || "";
    const agentId = url.searchParams.get("agentId") || "";

    if (!conversationId || !agentId) {
      return new NextResponse("Missing conversationId or agentId parameters", { status: 400 });
    }

    // Parse URL-encoded Form parameters
    const formData = await request.formData();
    const userSpeech = (formData.get("SpeechResult") || formData.get("digits") || "").toString().trim();
    const callerPhone = (formData.get("From") || formData.get("CustomerNumber") || "+91 99000 00000").toString();
    const callSid = (formData.get("CallSid") || "").toString();

    // 1. Fetch Agent & Business Workspace
    const agent = await dbService.getAgent(agentId);
    if (!agent) {
      return new NextResponse("Agent not found", { status: 404 });
    }

    const business = await dbService.getBusiness(agent.business_id);
    const humanTransferPhone = business?.phone || "+91 98860 12345";
    const webhookUrl = `/api/calls/webhook?conversationId=${conversationId}&agentId=${agentId}`;

    let replyXml = "";

    // 2. Scenario A: Inbound Speech Received
    if (userSpeech) {
      // Log User message
      await dbService.createMessage(conversationId, "user", userSpeech);

      // Trigger chat API processor locally to retrieve RAG matching & auto CRM qualification
      const chatHost = request.headers.get("host") || "localhost:3000";
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      
      const chatResponse = await fetch(`${protocol}://${chatHost}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userSpeech,
          agentId: agent.id,
          conversationId: conversationId
        })
      });

      if (!chatResponse.ok) {
        throw new Error("Local RAG Chat completion failed");
      }

      const chatData = await chatResponse.json();
      const replyText = chatData.reply;

      // Log AI Agent response
      await dbService.createMessage(conversationId, "assistant", replyText);

      // Update call logs metrics
      await dbService.updateConversation(conversationId, {
        duration_seconds: 40, // increment duration
        sentiment: chatData.sentiment || "neutral",
        status: chatData.escalated ? "escalated" : "completed",
        summary: chatData.summary || "Call active context.",
        outcome: chatData.outcome || "Call active"
      });

      // Generate TwiML based on escalation status
      if (chatData.escalated) {
        replyXml = telephonyService.generateTwiMLEscalation(replyText, agent.language, humanTransferPhone);
      } else {
        replyXml = telephonyService.generateTwiMLSpeech(replyText, agent.language, webhookUrl);
      }
    } 
    // 3. Scenario B: Newly Initiated Call (No user speech yet - Play Greeting)
    else {
      const greeting = agent.greeting_message || (agent.language === "Kannada" 
        ? "ನಮಸ್ಕಾರ, ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?" 
        : "Hello! How can I help you today?");

      // Log AI Agent Greeting message
      await dbService.createMessage(conversationId, "assistant", greeting);
      
      await dbService.updateConversation(conversationId, {
        outcome: "Connected / Call Active"
      });

      replyXml = telephonyService.generateTwiMLSpeech(greeting, agent.language, webhookUrl);
    }

    // Return TwiML XML payload response to Telephony Carrier
    return new NextResponse(replyXml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "no-cache"
      }
    });

  } catch (error: any) {
    console.error("Telephony Webhook processing error:", error);
    
    // Fallback safe XML directive
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="kn-IN" voice="Google.kn-IN-Standard-A">ಕ್ಷಮಿಸಿ, ಸಂಪರ್ಕದಲ್ಲಿ ದೋಷವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.</Say>
    <Hangup/>
</Response>`;
    
    return new NextResponse(fallbackXml, {
      headers: { "Content-Type": "application/xml" }
    });
  }
}
