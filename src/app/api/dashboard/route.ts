// ไฟล์: src/app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/google-sheets";

// ✅ 1. บังคับปิด Cache เพื่อให้ข้อมูลอัปเดตเสมอ
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today";

    // ดึงข้อมูลจริงจาก Google Sheets ผ่านฟังก์ชันที่อัปเดตแล้ว
    const stats = await getDashboardStats(period);

    if (!stats) {
      return NextResponse.json({
        period,
        topupToday: 0,
        paymentToday: 0,
        newMembers: 0,
        chartData: [],
      });
    }

    // ✅ ส่งข้อมูลที่คำนวณจริง (รวมถึง newMembers และ chartData)
    return NextResponse.json({
      period,
      topupToday: stats.topupToday,
      paymentToday: stats.paymentToday,
      newMembers: stats.newMembers,
      chartData: stats.chartData,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
