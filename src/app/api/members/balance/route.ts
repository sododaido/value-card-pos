import { NextResponse } from "next/server";
import {
  getMemberByCardId,
  updateMember,
  createTransaction,
} from "@/lib/google-sheets";
import { calculateTier, calculatePointsEarned, Tier } from "@/lib/tier-logic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { card_id, type, amount, staff_name, note } = body;

    if (!card_id || !amount || !type) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const member = await getMemberByCardId(card_id);
    if (!member) {
      return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });
    }

    // ค่า Default Setting (เนื่องจากถอด DB ออก)
    const isPointSystem = true;

    const balanceBefore = member.balance;
    let newBalance = member.balance;
    let newPoints = member.points;
    let newTotalSpent = member.total_spent;
    let newTier = member.tier;
    let pointsEarned = 0;

    // === คำนวณยอด ===
    if (type === "TOPUP") {
      newBalance += amount;
      if (isPointSystem) {
        pointsEarned = calculatePointsEarned(amount, member.tier as Tier);
        newPoints += pointsEarned;
      }
    } else if (type === "PAYMENT") {
      if (member.balance < amount) {
        return NextResponse.json({ error: "ยอดเงินไม่พอ" }, { status: 400 });
      }
      newBalance -= amount;
      newTotalSpent += amount;
      newTier = calculateTier(newTotalSpent);
    }

    // 🚀 บันทึกลง Google Sheets
    // ใช้ await เพื่อให้แน่ใจว่าบันทึกเสร็จก่อนตอบกลับ (เพื่อความชัวร์ในช่วงแรก)
    await Promise.all([
      updateMember(card_id, {
        balance: newBalance,
        points: newPoints,
        total_spent: newTotalSpent,
        tier: newTier,
      }),
      createTransaction({
        member_id: member.member_id,
        card_id: member.card_id,
        type,
        amount,
        balance_before: balanceBefore,
        balance_after: newBalance,
        points_earned: pointsEarned,
        staff_name: staff_name || "Staff",
        note: note || "",
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        balance: newBalance,
        points: newPoints,
        tier: newTier,
        pointsEarned: pointsEarned,
      },
    });
  } catch (error) {
    console.error("Balance Update Error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
