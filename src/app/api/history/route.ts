// ไฟล์: src/app/api/history/route.ts
import { NextResponse } from "next/server";
import { getMemberTransactions } from "@/lib/google-sheets";

// บังคับปิด Cache
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get("card_id");

  if (!cardId) {
    return NextResponse.json({ error: "Card ID is required" }, { status: 400 });
  }

  try {
    // ฟังก์ชันนี้เราแก้ใน lib/google-sheets.ts แล้ว ให้กรองด้วย Card ID โดยตรง
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
