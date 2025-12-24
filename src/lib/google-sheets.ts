import { Member, Promotion, AppSettings, Transaction } from "@/types/index";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

export async function getDoc() {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: SCOPES,
  });

  const doc = new GoogleSpreadsheet(
    process.env.GOOGLE_SHEET_ID as string,
    serviceAccountAuth
  );

  await doc.loadInfo();
  return doc;
}

// === Helper Functions ===

export async function getAllMembers() {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle["Members"];
  const rows = await sheet.getRows();

  return rows.map((row) => ({
    member_id: row.get("member_id"),
    card_id: row.get("card_id"),
    name: row.get("name"),
    phone: row.get("phone"),
    balance: parseFloat(row.get("balance") || "0"),
    points: parseInt(row.get("points") || "0"),
    tier: row.get("tier"),
    total_spent: parseFloat(row.get("total_spent") || "0"),
    joined_date: row.get("joined_date"),
    updated_at: row.get("updated_at"),
    row_number: row.rowNumber,
  }));
}

export async function getMemberByCardId(cardId: string) {
  const members = await getAllMembers();
  return members.find((m) => m.card_id === cardId);
}

export async function getMemberByPhone(phone: string) {
  const members = await getAllMembers();
  return members.find((m) => m.phone === phone);
}

export async function createMember(data: { name: string; phone: string }) {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle["Members"];
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);

  const newMember = {
    member_id: `MEM${timestamp}`,
    card_id: `CARD${random}`,
    name: data.name,
    phone: data.phone,
    balance: 0,
    points: 0,
    tier: "Bronze",
    total_spent: 0,
    joined_date: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await sheet.addRow(newMember);
  return newMember;
}

export async function updateMember(cardId: string, data: Partial<Member>) {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle["Members"];
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get("card_id") === cardId);

  if (!row) throw new Error("Member not found");

  if (data.name) row.set("name", data.name);
  if (data.phone) row.set("phone", data.phone);
  if (data.balance !== undefined) row.set("balance", data.balance.toString());
  if (data.points !== undefined) row.set("points", data.points.toString());
  if (data.total_spent !== undefined)
    row.set("total_spent", data.total_spent.toString());
  if (data.tier) row.set("tier", data.tier);
  row.set("updated_at", new Date().toISOString());

  await row.save();
  return true;
}

export async function createTransaction(data: {
  member_id: string;
  card_id: string;
  type: "TOPUP" | "PAYMENT";
  amount: number;
  balance_before: number;
  balance_after: number;
  points_earned: number;
  staff_name?: string;
  note?: string;
}) {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle["Transactions"];

  const newTransaction = {
    transaction_id: `TXN${Date.now()}`,
    member_id: data.member_id,
    card_id: data.card_id,
    type: data.type,
    amount: data.amount,
    balance_before: data.balance_before,
    balance_after: data.balance_after,
    points_earned: data.points_earned,
    note: data.note || "-",
    staff_name: data.staff_name || "System",
    timestamp: new Date().toISOString(),
  };

  await sheet.addRow(newTransaction);
  return newTransaction;
}

// === จุดสำคัญ: ฟังก์ชันดึงประวัติ (แก้ไขใหม่) ===
export async function getMemberTransactions(
  cardId: string
): Promise<Transaction[]> {
  console.log("🚀 Starting getMemberTransactions for:", cardId);

  const doc = await getDoc();
  const sheet = doc.sheetsByTitle["Transactions"];

  if (!sheet) {
    console.error("❌ Error: Tab 'Transactions' not found in Google Sheets");
    return [];
  }

  const rows = await sheet.getRows();
  console.log(`📊 Found ${rows.length} total rows in Transactions`);

  // แปลง input เป็นตัวใหญ่และตัดช่องว่าง
  const targetId = String(cardId).toUpperCase().trim();

  const history = rows
    .filter((row) => {
      // อ่านค่าจาก Sheet อย่างระมัดระวัง
      const rawCardId = row.get("card_id");

      // ถ้าไม่มีข้อมูลในช่องนี้ ให้ข้ามไป
      if (!rawCardId) return false;

      // แปลงข้อมูลใน Sheet เป็น string -> ตัดช่องว่าง -> ตัวใหญ่
      const sheetCardId = String(rawCardId).toUpperCase().trim();

      // เปรียบเทียบ
      const isMatch = sheetCardId === targetId;
      if (isMatch) console.log(`✅ Match found: ${sheetCardId}`);

      return isMatch;
    })
    .reverse()
    .slice(0, 5)
    .map((row) => ({
      transaction_id: row.get("transaction_id"),
      member_id: row.get("member_id"),
      card_id: row.get("card_id"),
      type: row.get("type") as "TOPUP" | "PAYMENT",
      amount: parseFloat(row.get("amount") || "0"),
      balance_before: parseFloat(row.get("balance_before") || "0"),
      balance_after: parseFloat(row.get("balance_after") || "0"),
      points_earned: parseFloat(row.get("points_earned") || "0"),
      staff_name: row.get("staff_name"),
      timestamp: row.get("timestamp"),
      note: row.get("note"),
    }));

  console.log(`🏁 Returning ${history.length} transactions`);
  return history;
}

export async function getActivePromotions(): Promise<Promotion[]> {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle["Promotions"];
  const rows = await sheet.getRows();

  return rows
    .map((row) => ({
      promo_id: row.get("promo_id"),
      promo_name: row.get("promo_name"),
      discount_type: row.get("discount_type") as "FIXED" | "PERCENT",
      discount_value: parseFloat(row.get("discount_value") || "0"),
      is_active: String(row.get("is_active")).toLowerCase() === "true",
    }))
    .filter((p) => p.is_active);
}

export async function getAppSettings(): Promise<AppSettings> {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle["Settings"];
  const rows = await sheet.getRows();
  const config: Record<string, string> = {};

  rows.forEach((row) => {
    const key = row.get("setting_key");
    const value = row.get("setting_value");
    if (key) config[key] = value || "";
  });

  return {
    shop_name: config["shop_name"] || "POS System",
    enable_points: config["enable_points"] === "TRUE",
    tier_silver: parseFloat(config["tier_silver"] || "1000"),
    tier_gold: parseFloat(config["tier_gold"] || "3000"),
    tier_platinum: parseFloat(config["tier_platinum"] || "10000"),
  };
}
