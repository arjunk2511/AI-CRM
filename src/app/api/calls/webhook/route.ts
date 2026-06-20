import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { telephonyService, escapeXmlValue } from "@/lib/telephony";

// Simple XML tag balancing and unescaped ampersand validator
function validateXml(xml: string): { valid: boolean; error?: string } {
  // Check for raw unescaped ampersands first.
  // Any & must be followed by a valid XML entity reference code (like amp;, lt;, gt;, quot;, apos;, #123;, #xab;)
  const ampRegex = /&(?!([a-zA-Z0-9#]+);)/g;
  if (ampRegex.test(xml)) {
    return { valid: false, error: "Unescaped ampersand found in XML" };
  }

  const stack: string[] = [];
  const tagTokenRegex = /<([^>]+)>/g;
  let tokenMatch;

  while ((tokenMatch = tagTokenRegex.exec(xml)) !== null) {
    const content = tokenMatch[1].trim();
    if (content.startsWith("?")) {
      // XML declarations skip
      continue;
    }
    if (content.startsWith("/")) {
      // Closing tag
      const tagName = content.slice(1).trim().split(/\s+/)[0];
      const lastTag = stack.pop();
      if (lastTag !== tagName) {
        return { 
          valid: false, 
          error: `Mismatched closing tag: expected </${lastTag || "none"}>, but found </${tagName}>` 
        };
      }
    } else if (content.endsWith("/")) {
      // Self-closing tag
      const tagName = content.slice(0, -1).trim().split(/\s+/)[0];
      if (!tagName) {
        return { valid: false, error: "Empty tag name" };
      }
    } else {
      // Opening tag
      const tagName = content.split(/\s+/)[0];
      stack.push(tagName);
    }
  }

  if (stack.length > 0) {
    return { valid: false, error: `Unclosed tags: ${stack.join(", ")}` };
  }

  return { valid: true };
}

function buildNextResponse(xmlContent: string): NextResponse {
  const validation = validateXml(xmlContent);
  if (!validation.valid) {
    console.error("XML Generation Error:", validation.error);
    console.error("Malformed XML content:", xmlContent);
    const safeFallback = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="kn-IN" voice="Google.kn-IN-Standard-A">ಕ್ಷಮಿಸಿ, ಸಂಪರ್ಕದಲ್ಲಿ ದೋಷವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.</Say>
    <Hangup/>
</Response>`;
    return new NextResponse(safeFallback, {
      headers: { "Content-Type": "application/xml" }
    });
  }

  return new NextResponse(xmlContent, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "no-cache"
    }
  });
}

// Telephony Provider Webhook (processes URL-encoded POST requests from Twilio / Exotel)
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId") || "";
  let agentId = url.searchParams.get("agentId") || "";

  const chatHost = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const webhookHost = `${protocol}://${chatHost}`;

  try {
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
      const chatResponse = await fetch(`${webhookHost}/api/chat`, {
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

      // Generate TwiML based on escalation status using ElevenLabs Play tags
      if (chatData.escalated) {
        replyXml = telephonyService.generateTwiMLEscalation(replyText, agent.language, humanTransferPhone, agent.id, webhookHost);
      } else {
        replyXml = telephonyService.generateTwiMLSpeech(replyText, agent.language, webhookUrl, agent.id, webhookHost);
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

      replyXml = telephonyService.generateTwiMLSpeech(greeting, agent.language, webhookUrl, agent.id, webhookHost);
    }

    // Return TwiML XML payload response to Telephony Carrier
    return buildNextResponse(replyXml);

  } catch (error: any) {
    console.error("Telephony Webhook processing error:", error);
    
    // Fallback safe XML playing ElevenLabs audio
    const errorText = "ಕ್ಷಮಿಸಿ, ಸಂಪರ್ಕದಲ್ಲಿ ದೋಷವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.";
    const errPlayUrl = escapeXmlValue(`${webhookHost}/api/voice/play?text=${encodeURIComponent(errorText)}&agentId=${agentId || "demo-agent-id"}`);
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>${errPlayUrl}</Play>
    <Hangup/>
</Response>`;
    
    return buildNextResponse(fallbackXml);
  }
}
