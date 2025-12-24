import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // ส่งค่า Default กลับไป เพื่อให้ POS ทำงานได้
    // (ระบบ Point และ Tier จะยังคำนวณตาม Logic ใน Code)
    return NextResponse.json({
      setting: { name: "POS System", isPointSystem: true },
      promotions: [], // ยังไม่มีโปรโมชั่น
      tiers: [
        {
          id: "1",
          name: "Bronze",
          minSpend: 0,
          multiplier: 1,
          color: "#cd7f32",
        },
        {
          id: "2",
          name: "Silver",
          minSpend: 5000,
          multiplier: 1.2,
          color: "#c0c0c0",
        },
        {
          id: "3",
          name: "Gold",
          minSpend: 10000,
          multiplier: 1.5,
          color: "#ffd700",
        },
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // เนื่องจากไม่มี DB แล้ว ฟังก์ชันนี้จะแค่ตอบว่า Success (แต่ไม่ได้บันทึกจริง)
    // เพื่อให้หน้า UI ไม่ Error เวลาพนักงานกดบันทึก
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
