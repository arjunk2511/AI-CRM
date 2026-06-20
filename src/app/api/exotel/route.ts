import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";

// Handle GET requests (verification or manual triggers)
export async function GET(request: NextRequest) {
  return handleTelephonyRequest(request);
}

// Handle POST requests (Exotel urlencoded payloads)
export async function POST(request: NextRequest) {
  return handleTelephonyRequest(request);
}

async function handleTelephonyRequest(request: NextRequest) {
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const webhookHost = `${protocol}://${host}`;
  let agentId = "";

  try {
    // 1. Parse Parameters from GET or POST
    let params: Record<string, string> = {};
    
    // Extract query params from URL
    const { searchParams } = new URL(request.url);
    searchParams.forEach((val, key) => {
      params[key] = val;
    });

    // Extract form urlencoded body parameters if POST
    if (request.method === "POST") {
      try {
        const formData = await request.formData();
        formData.forEach((val, key) => {
          if (typeof val === "string") {
            params[key] = val;
          }
        });
      } catch (e) {
        // Fallback to JSON if urlencoded parses fail
        try {
          const jsonBody = await request.json();
          params = { ...params, ...jsonBody };
        } catch (jsonErr) {}
      }
    }

    // Standard carrier metadata
    const callSid = params.CallSid || params.CallUUID || `call-${Math.random().toString(36).substr(2, 9)}`;
    const fromPhone = params.From || params.CallerId || "+91 99999 99999";
    const toPhone = params.To || "+91 80 4709 2311";
    const speechResult = params.SpeechResult || params.digits || "";

    // Session tracking params
    let conversationId = params.conversationId || params.ConversationSid || "";
    agentId = params.agentId || "";

    // 2. Fetch Agent details
    let agent = null;
    if (agentId) {
      agent = await dbService.getAgent(agentId);
    }
    
    // If no agentId or agent not found, resolve a default agent
    if (!agent) {
      // Find default business
      const businesses = await dbService.getAdminBusinessesList();
      const defaultBizId = businesses.length > 0 ? businesses[0].id : "demo-business-id";
      const agents = await dbService.getAgents(defaultBizId);
      agent = agents.length > 0 ? agents[0] : null;
    }

    if (!agent) {
      throw new Error("No voice agent deployed in this workspace");
    }
    agentId = agent.id;

    // 3. START OF CALL (Greeting phase)
    if (!speechResult && !conversationId) {
      // Initialize new conversation session
      const newCall = await dbService.createConversation(
        agent.business_id,
        agent.id,
        `Customer (${fromPhone})`
      );
      
      // Update Call sid
      await dbService.updateConversation(newCall.id, {
        recording_url: `exotel:${callSid}`,
        status: "active"
      });

      const greetingText = agent.greeting_message || (agent.language === "Kannada"
        ? "ನಮಸ್ಕಾರ! ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?"
        : "Hello! How can I assist you today?");

      // Log greeting in Supabase
      await dbService.createMessage(newCall.id, "assistant", greetingText);

      // XML Redirecting to ElevenLabs streaming audio & Gather input
      const playUrl = `${webhookHost}/api/voice/play?text=${encodeURIComponent(greetingText)}&agentId=${agent.id}`;
      const gatherAction = `${webhookHost}/api/exotel?conversationId=${newCall.id}&agentId=${agent.id}`;
      
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>${playUrl}</Play>
    <Gather input="speech" action="${gatherAction}" method="POST" timeout="5" speechTimeout="auto">
    </Gather>
</Response>`;

      return new NextResponse(xml, {
        headers: { "Content-Type": "application/xml" }
      });
    }

    // 4. ACTIVE CALL DIALOGUE LOOP (Speech response phase)
    if (speechResult && conversationId) {
      // Log customer message
      await dbService.createMessage(conversationId, "user", speechResult);

      // Call central GPT-4o RAG AI responder API
      const chatResponse = await fetch(`${webhookHost}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: speechResult,
          agentId,
          conversationId
        })
      });

      if (!chatResponse.ok) {
        throw new Error("Local chat responder query failed");
      }

      const chatData = await chatResponse.json();
      const replyText = chatData.reply;

      // Log assistant response
      await dbService.createMessage(conversationId, "assistant", replyText);

      const playUrl = `${webhookHost}/api/voice/play?text=${encodeURIComponent(replyText)}&agentId=${agent.id}`;
      const gatherAction = `${webhookHost}/api/exotel?conversationId=${conversationId}&agentId=${agent.id}`;

      let xml = "";

      if (chatData.escalated) {
        // Transfer to human support representative
        const businessDetails = await dbService.getBusiness(agent.business_id);
        const humanForwardPhone = businessDetails?.phone || "+91 98860 12345";
        
        xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>${playUrl}</Play>
    <Dial>${humanForwardPhone}</Dial>
</Response>`;
      } else {
        // Continuous voice loop
        xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>${playUrl}</Play>
    <Gather input="speech" action="${gatherAction}" method="POST" timeout="5" speechTimeout="auto">
    </Gather>
</Response>`;
      }

      return new NextResponse(xml, {
        headers: { "Content-Type": "application/xml" }
      });
    }

    // Catch all empty response if loops are terminated
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`, {
      headers: { "Content-Type": "application/xml" }
    });

  } catch (error: any) {
    console.error("Exotel webhook callback error:", error);
    
    // Return graceful audio error playing message in XML
    const errorText = "ಕ್ಷಮಿಸಿ, ಸಂಪರ್ಕದಲ್ಲಿ ತೊಂದರೆಯಾಗಿದೆ. ದಯವಿಟ್ಟು ನಂತರ ಪ್ರಯತ್ನಿಸಿ.";
    const errPlayUrl = `${webhookHost}/api/voice/play?text=${encodeURIComponent(errorText)}&agentId=${agentId}`;
    
    const errXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>${errPlayUrl}</Play>
    <Hangup/>
</Response>`;

    return new NextResponse(errXml, {
      headers: { "Content-Type": "application/xml" }
    });
  }
}
