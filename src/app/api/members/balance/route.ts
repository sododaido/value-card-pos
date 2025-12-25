import { NextResponse } from "next/server";
import {
  getMemberByCardId,
  updateMember,
  createTransaction,
  getAppSettings,
  getTiers, // ✅ เพิ่มการดึงข้อมูล Tiers
  autoUpdateMemberTier, // ✅ เพิ่มฟังก์ชันอัปเดตระดับอัตโนมัติ
} from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { card_id, type, amount, note } = await req.json();

    if (!card_id || !amount) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // 1. ดึงข้อมูลสมาชิกล่าสุดจาก Sheet
    const member = await getMemberByCardId(card_id);
    if (!member) {
      return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });
    }

    // ✅ ดึงข้อมูลการตั้งค่าและระดับสมาชิกปัจจุบัน
    const settings = await getAppSettings();
    const tiers = await getTiers();
    const currentTier = tiers.find((t) => t.name === member.tier) || tiers[0];

    const currentBalance = member.balance;
    let newBalance = currentBalance;
    let pointsEarned = 0;

    // 2. คำนวณยอดเงินและตรวจสอบ
    if (type === "TOPUP") {
      newBalance += amount;

      // ✅ คำนวณแต้มจากการเติมเงิน (Multiplier ตามระดับสมาชิก)
      if (settings.enable_points) {
        // สูตร: (ยอดเงิน / 100) * ตัวคูณของระดับนั้นๆ
        pointsEarned = Math.floor((amount / 100) * currentTier.multiplier);
      }
    } else if (type === "PAYMENT") {
      // 🛑 STOP: เช็คเงินก่อนตัด ถ้าไม่พอให้ Error ทันที
      if (currentBalance < amount) {
        return NextResponse.json(
          { error: "ยอดเงินคงเหลือไม่เพียงพอ" },
          { status: 400 }
        );
      }

      newBalance -= amount;

      // (เลือกเปิดได้: หากต้องการให้แต้มตอนชำระเงินแทนการเติมเงิน ให้ย้าย Logic pointsEarned มาไว้ตรงนี้)
    }

    // คำนวณยอดใช้จ่ายสะสมใหม่
    const newTotalSpent =
      member.total_spent + (type === "PAYMENT" ? amount : 0);

    // 3. อัปเดตสมาชิกลง Google Sheets
    await updateMember(card_id, {
      balance: newBalance,
      points: member.points + pointsEarned,
      total_spent: newTotalSpent,
    });

    // ✅ 3.5 ตรวจสอบและอัปเกรดระดับสมาชิกอัตโนมัติ (Auto Tier Upgrade)
    await autoUpdateMemberTier(card_id, newTotalSpent);

    // 4. บันทึกประวัติ Transaction
    await createTransaction({
      member_id: member.member_id,
      card_id: member.card_id,
      type,
      amount,
      balance_before: currentBalance,
      balance_after: newBalance,
      points_earned: pointsEarned,
      note,
      staff_name: "Staff",
    });

    return NextResponse.json({
      success: true,
      data: {
        balance: newBalance,
        points: member.points + pointsEarned,
      },
    });
  } catch (error) {
    console.error("Balance API Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการทำรายการ" },
      { status: 500 }
    );
  }
}
