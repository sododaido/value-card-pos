// ไฟล์: src/lib/telegram.ts

// ✅ แก้ไข Token ให้ตรงตามที่ BotFather กำหนด (รักษารูปแบบพิมพ์เล็ก/ใหญ่)
const TELEGRAM_TOKEN = "8153748659:AAFmdbpI_vpvHCr6GyXQTfW6TjMufzVABaY";
const CHAT_ID = "-1003443868235";

interface NotifyData {
  name: string;
  card_id: string;
  phone?: string;
  amount?: number;
  balance_after?: number;
  points_earned?: number;
}

// ✅ ปรับปรุงฟังก์ชันให้รองรับการลองใหม่ (Retry Logic) เมื่อเกิดปัญหา Network/Timeout
export async function sendTelegramNotify(message: string, retries = 2) {
  console.log("🚀 Attempting to send Telegram notification...");

  for (let i = 0; i <= retries; i++) {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: "HTML",
        }),
        // ✅ ขยายเวลา Timeout เป็น 15 วินาที เพื่อลดปัญหา Operation Aborted
        signal: AbortSignal.timeout(15000),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Telegram Notification Sent Successfully!");
        return true;
      }

      console.error(
        `❌ Telegram API Error (Attempt ${i + 1}):`,
        JSON.stringify(result)
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error";
      console.error(`⚠️ Attempt ${i + 1} failed:`, errorMsg);

      // ✅ หากยังไม่ครบจำนวน Retries ให้รอ 2 วินาทีก่อนลองรอบถัดไป
      if (i < retries) {
        await new Promise((res) => setTimeout(res, 2000));
      }
    }
  }

  console.error("❌ Failed to send Telegram notification after all attempts.");
  return false;
}

export const formatNotifyMessage = (type: string, data: NotifyData) => {
  const emoji = type === "REGISTER" ? "🆕" : type === "TOPUP" ? "💰" : "💳";
  const title =
    type === "REGISTER"
      ? "สมัครสมาชิกใหม่"
      : type === "TOPUP"
      ? "เติมเงินสำเร็จ"
      : "ชำระเงินสำเร็จ";

  let detail = `<b>${emoji} ${title}</b>\n`;
  detail += `━━━━━━━━━━━━━━━\n`;
  detail += `👤 <b>ลูกค้า:</b> ${data.name}\n`;
  detail += `🆔 <b>Card ID:</b> <code>${data.card_id}</code>\n`;

  // ✅ ปรับปรุงส่วนแสดงรายละเอียดให้แยกตามประเภท Transaction
  if (type === "REGISTER") {
    detail += `📱 <b>เบอร์โทร:</b> ${data.phone || "-"}\n`;
  } else {
    const amount = data.amount || 0;
    const balance = data.balance_after || 0;
    const points = data.points_earned || 0;

    detail += `💵 <b>จำนวนเงิน:</b> ${amount.toLocaleString()} บาท\n`;
    detail += `🟢 <b>คงเหลือ:</b> ${balance.toLocaleString()} บาท\n`;
    if (points > 0) detail += `✨ <b>แต้มได้รับ:</b> +${points} P\n`;
  }

  detail += `━━━━━━━━━━━━━━━\n`;
  detail += `⏰ ${new Date().toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
  })}`;
  return detail;
};
