// ไฟล์: src/types/index.ts

export interface Member {
  member_id: string;
  card_id: string;
  name: string;
  phone: string;
  balance: number;
  points: number;
  // เพิ่ม | string เผื่อไว้กรณีข้อมูลจาก API ไม่ตรงเป๊ะ หรือ Mock data เป็น string ธรรมดา
  tier: "Bronze" | "Silver" | "Gold" | "Platinum" | string;
  total_spent: number;
  joined_date: string;
  updated_at: string;
  row_number?: number;

  // ✅ เพิ่มฟิลด์นี้เข้าไป เพื่อแก้ Error ในไฟล์ page.tsx
  isActive?: boolean | string;
}

export interface Transaction {
  transaction_id: string;
  member_id: string;
  card_id: string;
  type: "TOPUP" | "PAYMENT";
  amount: number;
  balance_before: number;
  balance_after: number;
  points_earned: number;
  note: string;
  staff_name: string;
  timestamp: string;
}

export interface Promotion {
  promo_id: string;
  promo_name: string;
  discount_type: "FIXED" | "PERCENT";
  discount_value: number;
  is_active: boolean;
}

export interface AppSettings {
  shop_name: string;
  enable_points: boolean;
  tier_silver: number;
  tier_gold: number;
  tier_platinum: number;
}
