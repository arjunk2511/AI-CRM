import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  const result = {
    url_valid: false,
    auth_header_created: false,
    sid: null as string | null,
    call_request_sent: false,
    response: null as string | null,
    error: null as string | null
  };

  try {
    const searchParams = request.nextUrl.searchParams;
    let bodyParams: any = {};
    if (request.method === "POST") {
      try {
        bodyParams = await request.json();
      } catch (e) {}
    }

    const apiKey = bodyParams.apiKey || bodyParams.exotelApiKey || searchParams.get("apiKey") || searchParams.get("exotelApiKey") || process.env.EXOTEL_API_KEY || "";
    const token = bodyParams.authToken || bodyParams.exotelToken || searchParams.get("authToken") || searchParams.get("exotelToken") || process.env.EXOTEL_AUTH_TOKEN || "";
    const sid = bodyParams.sid || bodyParams.exotelSid || searchParams.get("sid") || searchParams.get("exotelSid") || process.env.EXOTEL_ACCOUNT_SID || "";
    const fromPhone = bodyParams.phone || bodyParams.exotelPhone || searchParams.get("phone") || searchParams.get("exotelPhone") || process.env.EXOTEL_PHONE_NUMBER || "";
    const subdomain = bodyParams.subdomain || bodyParams.exotelSubdomain || searchParams.get("subdomain") || searchParams.get("exotelSubdomain") || process.env.EXOTEL_SUBDOMAIN || "api";
    const toPhone = bodyParams.to || bodyParams.customerPhone || searchParams.get("to") || searchParams.get("customerPhone") || "+919886012345";
    const webhookUrl = bodyParams.webhookUrl || searchParams.get("webhookUrl") || "https://localhost:3000/api/calls/webhook";

    if (!apiKey || !token || !sid || !fromPhone) {
      throw new Error(`Missing Exotel credentials configuration. Resolved values: apiKey=${apiKey ? "SET" : "MISSING"}, token=${token ? "SET" : "MISSING"}, sid=${sid ? "SET" : "MISSING"}, phone=${fromPhone ? "SET" : "MISSING"}`);
    }

    result.sid = sid;

    // 1. Validate Exotel URL construction (ensuring no embedded credentials)
    const exotelUrl = `https://${subdomain}.exotel.com/v1/Accounts/${sid}/Calls/connect.json`;
    result.url_valid = exotelUrl.startsWith("https://") && !exotelUrl.includes(apiKey) && !exotelUrl.includes(token);

    // 2. Validate Basic Auth header creation
    const authHeader = `Basic ${Buffer.from(`${apiKey}:${token}`).toString("base64")}`;
    result.auth_header_created = authHeader.startsWith("Basic ");

    // 3. Construct parameters
    const params = new URLSearchParams();
    params.append("From", fromPhone);
    params.append("To", toPhone);
    params.append("CallerId", fromPhone);
    params.append("Url", webhookUrl);
    params.append("CallType", "trans");

    // 4. Send outbound call trigger
    const response = await fetch(exotelUrl, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    result.call_request_sent = true;

    const resText = await response.text();
    result.response = resText;
    console.log("[Debug Exotel Call] Exotel response body:", resText);

    if (!response.ok) {
      throw new Error(`Exotel request failed with status ${response.status}: ${resText}`);
    }

  } catch (err: any) {
    console.error("[Debug Exotel Call] Error:", err);
    result.error = err.message || String(err);
  }

  return NextResponse.json(result);
}
