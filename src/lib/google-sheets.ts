// ไฟล์: src/lib/google-sheets.ts
import { Member, Promotion, AppSettings, Transaction } from "@/types/index";
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from "google-spreadsheet";
import { JWT } from "google-auth-library";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

// เพิ่ม Interface สำหรับ Tier
export interface Tier {
  id: string;
  name: string;
  minSpend: number;
  multiplier: number;
  color: string;
}

// ✅ ส่วนที่แก้ไข: เปลี่ยนจาก any[] เป็น Member[] เพื่อแก้ Error
let cachedDoc: GoogleSpreadsheet | null = null;
let cachedMembers: Member[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5000; // เก็บ Cache ไว้ 5 วินาที

export async function getDoc() {
  if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
    throw new Error("Missing Google Sheets credentials");
  }

  // ✅ ถ้าเคยเชื่อมต่อแล้ว ให้ใช้ของเดิม ลดการดึงข้อมูลจาก Google API
  if (cachedDoc && cachedDoc.title) {
    return cachedDoc;
  }

  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: SCOPES,
  });

  const doc = new GoogleSpreadsheet(
    process.env.GOOGLE_SHEET_ID,
    serviceAccountAuth
  );

  await doc.loadInfo();
  cachedDoc = doc; // บันทึกลง Cache
  return doc;
}

// === Helper Functions ===

export async function getAllMembers(): Promise<Member[]> {
  // ✅ ใช้ Cache หากข้อมูลยังใหม่ (ไม่เกิน 5 วินาที)
  const now = Date.now();
  if (cachedMembers && now - lastFetchTime < CACHE_TTL) {
    return cachedMembers;
  }

  const doc = await getDoc();
  const sheet = doc.sheetsByTitle["Members"];
  const rows = await sheet.getRows();

  const members: Member[] = rows.map((row) => {
    const cardId = row.get("card_id");
    const cleanCardId = cardId ? String(cardId).trim() : "";

    return {
      member_id: cleanCardId,
      card_id: cleanCardId,
      name: row.get("name") || "",
      phone: row.get("phone") || "",
      balance: parseFloat(row.get("balance") || "0"),
      points: parseInt(row.get("points") || "0"),
      tier: row.get("tier") || "Bronze",
      total_spent: parseFloat(row.get("total_spent") || "0"),
      joined_date: row.get("joined_date"),
      updated_at: row.get("updated_at"),
    };
  });

  cachedMembers = members;
  lastFetchTime = now;
  return members;
}

export async function getMemberByCardId(cardId: string) {
  const members = await getAllMembers();
  return members.find(
    (m) => m.card_id && m.card_id.toLowerCase() === cardId.toLowerCase().trim()
  );
}

export async function getMemberByPhone(phone: string) {
  const members = await getAllMembers();
  return members.find((m) => m.phone === phone);
}

/**
 * ✅ ฟังก์ชันสร้างสมาชิกโดยดึง card_id ที่ว่างจาก Sheet
 */
export async function createMember(data: { name: string; phone: string }) {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle["Members"];
  const rows = await sheet.getRows();

  // 1. ค้นหาแถวที่มี card_id อยู่แล้วแต่ name ยังว่างอยู่ (แถวที่เตรียมไว้)
  const emptyRow = rows.find((row) => {
    const cid = row.get("card_id");
    const name = row.get("name");
    return cid && (!name || name.trim() === "");
  });

  if (emptyRow) {
    const cardId = emptyRow.get("card_id");
    emptyRow.set("name", data.name);
    emptyRow.set("phone", data.phone);
    emptyRow.set("balance", "0");
    emptyRow.set("points", "0");
    emptyRow.set("tier", "Bronze");
    emptyRow.set("total_spent", "0");
    emptyRow.set("joined_date", new Date().toISOString());
    emptyRow.set("updated_at", new Date().toISOString());

    await emptyRow.save();
    cachedMembers = null; // Clear cache เมื่อมีการเปลี่ยนแปลง
    return {
      member_id: cardId,
      card_id: cardId,
      name: data.name,
      phone: data.phone,
      balance: 0,
      points: 0,
      tier: "Bronze",
      total_spent: 0,
      joined_date: emptyRow.get("joined_date"),
      updated_at: emptyRow.get("updated_at"),
    };
  }

  // 2. ถ้าหาแถวว่างไม่เจอ (Fallback) ให้รันเลขต่อจากบัตรล่าสุด
  const lastRow = rows[rows.length - 1];
  let nextCardId = "";

  if (lastRow) {
    const lastId = lastRow.get("card_id");
    const match = String(lastId).match(/([a-zA-Z]+)(\d+)/);
    if (match) {
      const prefix = match[1];
      const number = parseInt(match[2]) + 1;
      nextCardId = `${prefix}${number}`;
    } else {
      nextCardId = `CF${Date.now().toString().slice(-5)}`;
    }
  } else {
    nextCardId = "CF10001";
  }

  const newMember = {
    card_id: nextCardId,
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
  cachedMembers = null; // Clear cache
  return { ...newMember, member_id: nextCardId };
}

export async function updateMember(cardId: string, data: Partial<Member>) {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle["Members"];
  const rows = await sheet.getRows();

  const row = rows.find(
    (r) =>
      String(r.get("card_id")).toLowerCase().trim() ===
      cardId.toLowerCase().trim()
  );

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
  cachedMembers = null; // Clear cache เมื่อมีการอัปเดตข้อมูลสมาชิก
  return true;
}

export async function createTransaction(data: {
  member_id?: string;
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
    card_id: data.card_id,
    type: data.type,
    amount: data.amount,
    balance_before: data.balance_before,
    balance_after: data.balance_after,
    points_earned: data.points_earned,
    note: data.note || "-",
    staff_name: data.staff_name || "Staff",
    timestamp: new Date().toISOString(),
  };

  await sheet.addRow(newTransaction);
  return newTransaction;
}

export async function getMemberTransactions(
  cardId: string
): Promise<Transaction[]> {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle["Transactions"];
  if (!sheet) return [];

  const rows = await sheet.getRows();
  const targetId = String(cardId).toUpperCase().trim();

  return rows
    .filter((row: GoogleSpreadsheetRow) => {
      const rawCardId = row.get("card_id");
      if (!rawCardId) return false;
      return String(rawCardId).toUpperCase().trim() === targetId;
    })
    .reverse()
    .slice(0, 20)
    .map((row: GoogleSpreadsheetRow) => ({
      transaction_id: row.get("transaction_id"),
      member_id: row.get("card_id"),
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
}

export async function getDashboardStats(period: string = "today") {
  const doc = await getDoc();
  const txnSheet = doc.sheetsByTitle["Transactions"];
  const memberSheet = doc.sheetsByTitle["Members"];
  if (!txnSheet || !memberSheet) return null;

  const txnRows = await txnSheet.getRows();
  const memberRows = await memberSheet.getRows();

  const now = new Date();
  const bangkokNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );

  const startDate = new Date(bangkokNow);
  if (period === "today") {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    startDate.setDate(bangkokNow.getDate() - 7);
  } else if (period === "month") {
    startDate.setMonth(bangkokNow.getMonth() - 1);
  }

  let topup = 0;
  let payment = 0;
  let newMembersCount = 0;

  txnRows.forEach((row: GoogleSpreadsheetRow) => {
    const timestamp = row.get("timestamp");
    if (!timestamp) return;
    const txnDate = new Date(timestamp);
    if (txnDate >= startDate) {
      const type = row.get("type");
      const amount = parseFloat(row.get("amount") || "0");
      if (type === "TOPUP") topup += amount;
      if (type === "PAYMENT") payment += amount;
    }
  });

  memberRows.forEach((row: GoogleSpreadsheetRow) => {
    const joined = row.get("joined_date");
    if (!joined) return;
    const joinedDate = new Date(joined);
    if (joinedDate >= startDate) {
      newMembersCount++;
    }
  });

  const chartMap = new Map();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(bangkokNow);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
    });
    chartMap.set(d.toDateString(), { name: dateStr, topup: 0, payment: 0 });
  }

  txnRows.forEach((row: GoogleSpreadsheetRow) => {
    const timestamp = row.get("timestamp");
    if (!timestamp) return;
    const txnDate = new Date(timestamp);
    const dateKey = txnDate.toDateString();
    if (chartMap.has(dateKey)) {
      const dayData = chartMap.get(dateKey);
      const amount = parseFloat(row.get("amount") || "0");
      if (row.get("type") === "TOPUP") dayData.topup += amount;
      if (row.get("type") === "PAYMENT") dayData.payment += amount;
    }
  });

  return {
    topupToday: topup,
    paymentToday: payment,
    newMembers: newMembersCount,
    chartData: Array.from(chartMap.values()),
  };
}

export async function getAppSettings(): Promise<
  AppSettings & { shop_branch: string }
> {
  const doc = await getDoc();
  if (!doc.sheetsByTitle["Settings"]) {
    return {
      shop_name: "POS System",
      shop_branch: "Staff Panel",
      enable_points: true,
      tier_silver: 1000,
      tier_gold: 3000,
      tier_platinum: 10000,
    };
  }
  const sheet = doc.sheetsByTitle["Settings"];
  const rows = await sheet.getRows();
  const config: Record<string, string> = {};
  rows.forEach((row: GoogleSpreadsheetRow) => {
    const key = row.get("setting_key");
    const value = row.get("setting_value");
    if (key) config[key] = value || "";
  });
  return {
    shop_name: config["shop_name"] || "POS System",
    shop_branch: config["shop_branch"] || "Staff Panel",
    enable_points: config["enable_points"] === "TRUE",
    tier_silver: parseFloat(config["tier_silver"] || "1000"),
    tier_gold: parseFloat(config["tier_gold"] || "3000"),
    tier_platinum: parseFloat(config["tier_platinum"] || "10000"),
  };
}

export async function updateAppSettings(
  settings: Partial<AppSettings> & { shop_branch?: string }
) {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle["Settings"];
  if (!sheet) return false;
  const rows = await sheet.getRows();
  const upsertSetting = async (key: string, value: string) => {
    const row = rows.find((r) => r.get("setting_key") === key);
    if (row) {
      row.set("setting_value", value);
      await row.save();
    } else {
      await sheet.addRow({ setting_key: key, setting_value: value });
    }
  };
  if (settings.shop_name) await upsertSetting("shop_name", settings.shop_name);
  if (settings.shop_branch)
    await upsertSetting("shop_branch", settings.shop_branch);
  if (settings.enable_points !== undefined)
    await upsertSetting(
      "enable_points",
      settings.enable_points ? "TRUE" : "FALSE"
    );
  if (settings.tier_silver)
    await upsertSetting("tier_silver", settings.tier_silver.toString());
  if (settings.tier_gold)
    await upsertSetting("tier_gold", settings.tier_gold.toString());
  if (settings.tier_platinum)
    await upsertSetting("tier_platinum", settings.tier_platinum.toString());
  return true;
}

export async function getActivePromotions(): Promise<Promotion[]> {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle["Promotions"];
  if (!sheet) return [];
  const rows = await sheet.getRows();
  return rows
    .map((row: GoogleSpreadsheetRow) => ({
      promo_id: row.get("promo_id"),
      promo_name: row.get("promo_name"),
      discount_type: row.get("discount_type") as "FIXED" | "PERCENT",
      discount_value: parseFloat(row.get("discount_value") || "0"),
      is_active: String(row.get("is_active")).toLowerCase() === "true",
    }))
    .filter((p: Promotion) => p.is_active);
}

export async function updatePromotions(
  promotions: { name: string; value: number }[]
) {
  const doc = await getDoc();
  let sheet = doc.sheetsByTitle["Promotions"];

  if (!sheet) {
    sheet = await doc.addSheet({
      title: "Promotions",
      headerValues: [
        "promo_id",
        "promo_name",
        "discount_type",
        "discount_value",
        "is_active",
      ],
    });
  }

  const rows = await sheet.getRows();
  for (const row of rows) {
    await row.delete();
  }

  if (promotions.length > 0) {
    const newRows = promotions.map((p, index) => ({
      promo_id: `PRM${Date.now()}${index}`,
      promo_name: p.name,
      discount_type: "FIXED",
      discount_value: p.value.toString(),
      is_active: "TRUE",
    }));

    await sheet.addRows(newRows);
  }

  return true;
}

export async function getTiers(): Promise<Tier[]> {
  const doc = await getDoc();
  let sheet = doc.sheetsByTitle["Tiers"];

  if (!sheet) {
    sheet = await doc.addSheet({
      title: "Tiers",
      headerValues: ["id", "name", "minSpend", "multiplier", "color"],
    });
    const defaultTiers = [
      {
        id: "1",
        name: "Bronze",
        minSpend: "0",
        multiplier: "1",
        color: "#cd7f32",
      },
      {
        id: "2",
        name: "Silver",
        minSpend: "1000",
        multiplier: "1.2",
        color: "#c0c0c0",
      },
      {
        id: "3",
        name: "Gold",
        minSpend: "3000",
        multiplier: "1.5",
        color: "#ffd700",
      },
    ];
    await sheet.addRows(defaultTiers);
  }

  const rows = await sheet.getRows();
  const seenNames = new Set();
  const tiers: Tier[] = [];

  for (const row of rows) {
    const name = row.get("name");
    if (!name || seenNames.has(name.toLowerCase())) continue;

    seenNames.add(name.toLowerCase());
    tiers.push({
      id: String(row.get("id") || ""),
      name: String(name),
      minSpend: parseFloat(row.get("minSpend") || "0"),
      multiplier: parseFloat(row.get("multiplier") || "1"),
      color: String(row.get("color") || "#3b82f6"),
    });
  }

  return tiers;
}

export async function updateTiers(tiers: Tier[]) {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle["Tiers"];
  if (!sheet) return false;

  const rows = await sheet.getRows();
  for (const row of rows) {
    await row.delete();
  }

  if (tiers.length > 0) {
    const newRows = tiers.map((t, idx) => ({
      id: String(idx + 1),
      name: t.name,
      minSpend: String(t.minSpend),
      multiplier: String(t.multiplier),
      color: t.color,
    }));
    await sheet.addRows(newRows);
  }
  return true;
}

export async function autoUpdateMemberTier(cardId: string, totalSpent: number) {
  const tiers = await getTiers();
  const sortedTiers = [...tiers].sort((a, b) => b.minSpend - a.minSpend);

  const matchedTier =
    sortedTiers.find((t) => totalSpent >= t.minSpend) || tiers[0];

  if (matchedTier) {
    await updateMember(cardId, { tier: matchedTier.name });
    return matchedTier;
  }
  return null;
}
