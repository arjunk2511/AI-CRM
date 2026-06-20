import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { telephonyService, TelephonyConfig } from "@/lib/telephony";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerPhone, agentId, credentials } = body;

    if (!customerPhone || !agentId) {
      return NextResponse.json({ error: "Missing customerPhone or agentId" }, { status: 400 });
    }

    // 1. Fetch active agent details
    const agent = await dbService.getAgent(agentId);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // 2. Fetch business configurations
    const business = await dbService.getBusiness(agent.business_id);
    if (!business) {
      return NextResponse.json({ error: "Business workspace not found" }, { status: 404 });
    }

    // 3. Resolve Telephony Config (priority: request parameters, then env variables)
    const provider = credentials?.provider || process.env.TELEPHONY_PROVIDER || "";
    
    let telephonyConfig: TelephonyConfig | null = null;

    if (provider === "twilio") {
      telephonyConfig = {
        provider: "twilio",
        twilioSid: credentials?.twilioSid || process.env.TWILIO_ACCOUNT_SID,
        twilioToken: credentials?.twilioToken || process.env.TWILIO_AUTH_TOKEN,
        twilioPhone: credentials?.twilioPhone || process.env.TWILIO_PHONE_NUMBER
      };
    } else if (provider === "exotel") {
      telephonyConfig = {
        provider: "exotel",
        exotelApiKey: credentials?.exotelApiKey || process.env.EXOTEL_API_KEY,
        exotelToken: credentials?.exotelToken || process.env.EXOTEL_AUTH_TOKEN,
        exotelSid: credentials?.exotelSid || process.env.EXOTEL_ACCOUNT_SID,
        exotelPhone: credentials?.exotelPhone || process.env.EXOTEL_PHONE_NUMBER,
        exotelSubdomain: credentials?.exotelSubdomain || process.env.EXOTEL_SUBDOMAIN
      };
    }

    // Check if configuration is complete
    const isConfigComplete = telephonyConfig && (
      (telephonyConfig.provider === "twilio" && telephonyConfig.twilioSid && telephonyConfig.twilioToken && telephonyConfig.twilioPhone) ||
      (telephonyConfig.provider === "exotel" && telephonyConfig.exotelApiKey && telephonyConfig.exotelToken && telephonyConfig.exotelSid && telephonyConfig.exotelPhone)
    );

    if (!isConfigComplete) {
      // Initialize local sandbox dialer mock conversation
      const callRecord = await dbService.createConversation(
        business.id,
        agent.id,
        `Lead Call Sandbox (${customerPhone})`
      );

      await dbService.updateConversation(callRecord.id, {
        outcome: "Dialing Simulator Mode",
        summary: "Outbound call dialed in sandbox preview."
      });

      return NextResponse.json({
        success: true,
        isSandbox: true,
        conversationId: callRecord.id,
        message: "No live telephony credentials. Running Sandbox Outbound Call Dialer."
      });
    }

    // 4. Trigger Live Carrier Outbound Dial
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const webhookHost = `${protocol}://${host}`;

    const dialResult = await telephonyService.makeOutboundCall(
      business.id,
      agent.id,
      customerPhone,
      telephonyConfig!,
      webhookHost
    );

    if (!dialResult.success) {
      return NextResponse.json({ error: dialResult.error || "Exotel/Twilio connection failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      isSandbox: false,
      callId: dialResult.callId,
      message: "Live carrier dial call triggered successfully."
    });

  } catch (error: any) {
    console.error("Outbound Call API proxy error:", error);
    return NextResponse.json({ error: error.message || "Failed to dial" }, { status: 500 });
  }
}
