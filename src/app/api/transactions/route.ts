import { NextResponse } from "next/server";
import {
  getMemberByCardId,
  updateMember,
  createTransaction,
  getAppSettings,
  getTiers,
  autoUpdateMemberTier,
  getMemberTransactions,
} from "@/lib/google-sheets";
// ✅ นำเข้าฟังก์ชัน Telegram
import { sendTelegramNotify, formatNotifyMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// ✅ ส่วนที่ 1: ดึงประวัติรายการล่าสุด (ทำให้ประวัติฝั่งซ้ายเด้งขึ้นมา)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get("card_id");

  if (!cardId)
    return NextResponse.json({ error: "Card ID is required" }, { status: 400 });

  try {
    const history = await getMemberTransactions(cardId);
    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}

// ✅ ส่วนที่ 2: บันทึกการเติมเงิน/ชำระเงิน (ทำให้ปุ่มยืนยันใช้งานได้)
export async function POST(req: Request) {
  try {
    const { card_id, type, amount, note } = await req.json();

    // ✅ Optimization 1: ดึงข้อมูลสมาชิก, Settings และ Tiers พร้อมกัน (Parallel)
    const [member, settings, tiers] = await Promise.all([
      getMemberByCardId(card_id),
      getAppSettings(),
      getTiers(),
    ]);

    if (!member)
      return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });

    const currentTier = tiers.find((t) => t.name === member.tier) || tiers[0];
    const currentBalance = member.balance;
    let newBalance = currentBalance;
    let pointsEarned = 0;

    if (type === "TOPUP") {
      newBalance += amount;
      if (settings.enable_points)
        pointsEarned = Math.floor((amount / 100) * currentTier.multiplier);
    } else if (type === "PAYMENT") {
      if (currentBalance < amount)
        return NextResponse.json({ error: "ยอดเงินไม่พอ" }, { status: 400 });
      newBalance -= amount;
    }

    const newTotalSpent =
      member.total_spent + (type === "PAYMENT" ? amount : 0);

    // ✅ Optimization 2: อัปเดตข้อมูลหลักของสมาชิกก่อนเพื่อให้ข้อมูลถูกต้อง
    await updateMember(card_id, {
      balance: newBalance,
      points: member.points + pointsEarned,
      total_spent: newTotalSpent,
    });

    // ✅ Optimization 3: ปรับปรุงการจัดการงานเบื้องหลังและการส่ง Telegram ให้เสถียรขึ้น
    const runSecondaryTasks = async () => {
      try {
        // บันทึกรายการและอัปเดตระดับสมาชิก
        await Promise.all([
          autoUpdateMemberTier(card_id, newTotalSpent),
          createTransaction({
            card_id: member.card_id,
            type,
            amount,
            balance_before: currentBalance,
            balance_after: newBalance,
            points_earned: pointsEarned,
            note,
            staff_name: "Staff",
          }),
        ]);

        // ✅ ส่งแจ้งเตือน Telegram (จัดการภายใน Secondary Tasks เพื่อไม่ให้หน่วงหน้าบ้าน)
        const telegramMsg = formatNotifyMessage(type, {
          name: member.name,
          card_id: member.card_id,
          amount: amount,
          balance_after: newBalance,
          points_earned: pointsEarned,
        });
        await sendTelegramNotify(telegramMsg);
      } catch (err) {
        console.error("Secondary Tasks Error:", err);
      }
    };

    // เรียกทำงานแบบไม่รอ (Async)
    runSecondaryTasks();

    return NextResponse.json({ success: true, balance: newBalance });
  } catch (error) {
    console.error("API POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
