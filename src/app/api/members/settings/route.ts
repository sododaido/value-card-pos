// ไฟล์: src/app/api/settings/route.ts
import { NextResponse } from "next/server";
import { getAppSettings, getActivePromotions } from "@/lib/google-sheets";

export async function GET() {
  try {
    // ทำงานพร้อมกัน (Parallel) เพื่อความเร็ว
    const [settings, promotions] = await Promise.all([
      getAppSettings(),
      getActivePromotions(),
    ]);

    return NextResponse.json({
      settings,
      promotions,
    });
  } catch (error) {
    console.error("Settings API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
