// ไฟล์: src/app/api/members/balance/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  getMemberByCardId,
  updateMember,
  createTransaction,
} from "@/lib/google-sheets";
import { calculateTier, calculatePointsEarned, Tier } from "@/lib/tier-logic";

const prisma = new PrismaClient();

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

    // 1. ดึงการตั้งค่า
    const setting = await prisma.storeSetting.findFirst();
    const isPointSystem = setting?.isPointSystem ?? true;

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

    // ✅ 2. บันทึกลง Database (Prisma) -> ทำทันทีและรอผลเพราะเร็ว
    const prismaTx = await prisma.transaction.create({
      data: {
        type: type,
        amount: Number(amount),
        points: pointsEarned,
        note: note || "",
        createdAt: new Date(),
      },
    });

    // 🚀 3. บันทึกลง Google Sheets -> สั่งทำแต่ "ไม่ต้องรอ" (Fire and Forget)
    // วิธีนี้ทำให้หน้าจอได้รับคำตอบทันที ไม่ต้องรอ Google หมุน
    Promise.all([
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
    ]).catch((err) =>
      console.error("Google Sheets Sync Error (Background):", err)
    );

    // ✅ 4. ตอบกลับทันที (ลูกค้ารู้สึกว่าระบบเร็วมาก)
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
