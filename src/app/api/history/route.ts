// ไฟล์: src/app/api/history/route.ts
import { NextResponse } from "next/server";
import { getMemberTransactions } from "@/lib/google-sheets";

// บังคับให้โหลดข้อมูลใหม่ทุกครั้ง ไม่ให้จำค่าเก่า (แก้ปัญหาข้อมูลไม่อัปเดต)
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get("card_id");

  if (!cardId) {
    return NextResponse.json({ error: "Card ID is required" }, { status: 400 });
  }

  try {
    const history = await getMemberTransactions(cardId);
    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
