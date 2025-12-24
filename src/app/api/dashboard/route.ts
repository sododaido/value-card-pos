import { NextResponse } from "next/server";

// ✅ บังคับปิด Cache
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today";

    // เนื่องจากเราถอด Database ออก เราจะส่งข้อมูลว่างกลับไปก่อนเพื่อให้หน้าเว็บไม่พัง
    // ในอนาคตคุณสามารถเขียนฟังก์ชันดึงยอดจาก Google Sheets มาใส่แทนได้
    return NextResponse.json({
      period,
      topupToday: 0,
      paymentToday: 0,
      newMembers: 0,
      chartData: [], // กราฟว่าง
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
