// ไฟล์: src/lib/tier-logic.ts

export type Tier = "Bronze" | "Silver" | "Gold" | "Platinum";

export const TIER_CONFIG = {
  Bronze: { min: 0, multiplier: 1 },
  Silver: { min: 1000, multiplier: 1.5 },
  Gold: { min: 3000, multiplier: 2 },
  Platinum: { min: 10000, multiplier: 3 },
};

// ฟังก์ชันคำนวณ Tier จากยอดใช้จ่ายรวม
export function calculateTier(totalSpent: number): Tier {
  if (totalSpent >= TIER_CONFIG.Platinum.min) return "Platinum";
  if (totalSpent >= TIER_CONFIG.Gold.min) return "Gold";
  if (totalSpent >= TIER_CONFIG.Silver.min) return "Silver";
  return "Bronze";
}

// ฟังก์ชันคำนวณแต้มที่ได้ (ยอดเติม * 10% * ตัวคูณ Tier)
export function calculatePointsEarned(
  amount: number,
  currentTier: Tier
): number {
  const basePoints = amount * 0.1; // พื้นฐาน 10%
  const multiplier = TIER_CONFIG[currentTier].multiplier;
  return Math.floor(basePoints * multiplier);
}
