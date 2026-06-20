// Telephony Service Client Wrapper (Twilio & Exotel REST APIs)
import { dbService } from "./db";

export interface TelephonyConfig {
  provider: "twilio" | "exotel";
  twilioSid?: string;
  twilioToken?: string;
  twilioPhone?: string;
  exotelApiKey?: string;
  exotelToken?: string;
  exotelSubdomain?: string; // 'api' or 'api.in' etc.
  exotelSid?: string;
  exotelPhone?: string;
}

export const telephonyService = {
  // --- Initiates outbound call to customer phone ---
  async makeOutboundCall(
    businessId: string,
    agentId: string,
    customerPhone: string,
    config: TelephonyConfig,
    webhookHost: string // e.g. 'https://my-app.vercel.app'
  ): Promise<{ success: boolean; callId?: string; error?: string }> {
    
    // Create database log
    const callRecord = await dbService.createConversation(businessId, agentId, `Lead Call (${customerPhone})`);
    
    const webhookUrl = `${webhookHost}/api/calls/webhook?conversationId=${callRecord.id}&agentId=${agentId}`;

    try {
      if (config.provider === "twilio") {
        if (!config.twilioSid || !config.twilioToken || !config.twilioPhone) {
          throw new Error("Missing Twilio credentials configuration");
        }

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.twilioSid}/Calls.json`;
        const authHeader = `Basic ${Buffer.from(`${config.twilioSid}:${config.twilioToken}`).toString("base64")}`;

        const params = new URLSearchParams();
        params.append("To", customerPhone);
        params.append("From", config.twilioPhone);
        params.append("Url", webhookUrl);
        params.append("Method", "POST");

        const response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": authHeader,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: params.toString()
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Twilio call trigger failed");
        }

        const resData = await response.json();
        
        // Update database call record with SID
        await dbService.updateConversation(callRecord.id, {
          recording_url: `twilio:${resData.sid}`,
          outcome: "Call Triggered / Dialing"
        });

        return { success: true, callId: resData.sid };
      } 
      else {
        // Exotel Outbound Trigger
        if (!config.exotelApiKey || !config.exotelToken || !config.exotelSid || !config.exotelPhone) {
          throw new Error("Missing Exotel credentials configuration");
        }

        const subdomain = config.exotelSubdomain || "api";
        const exotelUrl = `https://${config.exotelApiKey}:${config.exotelToken}@${subdomain}.exotel.com/v1/Accounts/${config.exotelSid}/Calls/connect.json`;

        const params = new URLSearchParams();
        params.append("From", config.exotelPhone);
        params.append("To", customerPhone);
        params.append("CallerId", config.exotelPhone);
        params.append("Url", webhookUrl);
        params.append("CallType", "trans");

        const response = await fetch(exotelUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: params.toString()
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || "Exotel call trigger failed");
        }

        const resData = await response.json();
        const callSid = resData.Call?.Sid;

        // Update database call record
        await dbService.updateConversation(callRecord.id, {
          recording_url: `exotel:${callSid}`,
          outcome: "Call Triggered / Dialing"
        });

        return { success: true, callId: callSid };
      }
    } catch (error: any) {
      console.error("Telephony Service Outbound call error:", error);
      
      // Update DB record with failure details
      await dbService.updateConversation(callRecord.id, {
        status: "completed",
        outcome: "Dialing Failed",
        summary: `Outbound calling failed: ${error.message}`
      });

      return { success: false, error: error.message };
    }
  },

  // --- XML Generator for TwiML Call flow response ---
  generateTwiMLSpeech(text: string, language: string, webhookUrl: string): string {
    const langVoiceMap: Record<string, { lang: string; voice: string }> = {
      "Kannada": { lang: "kn-IN", voice: "Google.kn-IN-Standard-A" },
      "Telugu": { lang: "te-IN", voice: "Google.te-IN-Standard-A" },
      "Hindi": { lang: "hi-IN", voice: "Google.hi-IN-Standard-A" },
      "Tamil": { lang: "ta-IN", voice: "Google.ta-IN-Standard-A" },
      "Malayalam": { lang: "ml-IN", voice: "Google.ml-IN-Standard-A" },
      "English": { lang: "en-US", voice: "Polly.Joanna" }
    };

    const target = langVoiceMap[language] || langVoiceMap["Kannada"];
    const escapedText = escapeXmlValue(text);
    const escapedWebhook = escapeXmlValue(webhookUrl);

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${target.lang}" voice="${target.voice}">${escapedText}</Say>
    <Gather input="speech" action="${escapedWebhook}" language="${target.lang}" timeout="4" speechTimeout="auto">
        <Say language="${target.lang}" voice="${target.voice}">ದಯವಿಟ್ಟು ಉತ್ತರಿಸಿ.</Say>
    </Gather>
</Response>`;
  },

  // --- XML Generator for Call Escalation / Human Transfer ---
  generateTwiMLEscalation(text: string, language: string, humanPhone: string): string {
    const langVoiceMap: Record<string, { lang: string; voice: string }> = {
      "Kannada": { lang: "kn-IN", voice: "Google.kn-IN-Standard-A" },
      "Telugu": { lang: "te-IN", voice: "Google.te-IN-Standard-A" },
      "Hindi": { lang: "hi-IN", voice: "Google.hi-IN-Standard-A" },
      "Tamil": { lang: "ta-IN", voice: "Google.ta-IN-Standard-A" },
      "Malayalam": { lang: "ml-IN", voice: "Google.ml-IN-Standard-A" },
      "English": { lang: "en-US", voice: "Polly.Joanna" }
    };

    const target = langVoiceMap[language] || langVoiceMap["Kannada"];
    const escapedText = escapeXmlValue(text);
    const escapedPhone = escapeXmlValue(humanPhone);

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${target.lang}" voice="${target.voice}">${escapedText}</Say>
    <Dial>${escapedPhone}</Dial>
</Response>`;
  }
};

export function escapeXmlValue(value: string): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
