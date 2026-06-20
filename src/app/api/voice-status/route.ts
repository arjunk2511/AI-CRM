import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const isDbMock = dbService.isMock();
    const activeProvider = process.env.TELEPHONY_PROVIDER || "exotel (fallback)";
    
    return NextResponse.json({
      status: "active",
      provider: activeProvider,
      database: isDbMock ? "local_sandbox" : "supabase_production",
      health: "excellent",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "degraded",
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
