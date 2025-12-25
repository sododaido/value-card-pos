// ไฟล์: src/app/api/settings/route.ts
import { NextResponse } from "next/server";
import {
  getDoc, // ✅ นำเข้าเพิ่ม
  getAppSettings,
  getActivePromotions,
  updateAppSettings,
  updatePromotions,
  getTiers,
  updateTiers,
} from "@/lib/google-sheets";

interface PromoInput {
  name: string;
  value: number;
}

// ✅ เพิ่ม Interface เพื่อแก้ Error Unexpected any ในบรรทัดที่ 74, 75
interface TierInput {
  id: string;
  name: string;
  minSpend: number;
  multiplier: number;
  color: string;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // ✅ หัวใจหลัก: โหลด Google Sheet เพียงครั้งเดียวต่อหนึ่งหน้าจอ
    const doc = await getDoc();
    await doc.loadInfo();

    const [settings, promotions, tiers] = await Promise.all([
      getAppSettings(),
      getActivePromotions(),
      getTiers(),
    ]);

    return NextResponse.json({
      setting: {
        name: settings.shop_name,
        branch: settings.shop_branch,
        isPointSystem: settings.enable_points,
      },
      promotions: promotions.map((p) => ({
        promo_id: p.promo_id,
        promo_name: p.promo_name,
        discount_value: p.discount_value,
        discount_type: p.discount_type,
        is_active: p.is_active,
      })),
      tiers: tiers,
    });
  } catch (error) {
    console.error("Settings API Error:", error);
    return NextResponse.json({
      setting: {
        name: "POS System",
        branch: "Staff Panel",
        isPointSystem: true,
      },
      promotions: [],
      tiers: [],
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { setting, promotions, tiers } = body;

    const doc = await getDoc();
    await doc.loadInfo(); // ✅ โหลดครั้งเดียว

    if (setting) {
      await updateAppSettings({
        shop_name: setting.name,
        shop_branch: setting.branch,
        enable_points: setting.isPointSystem,
      });
    }

    if (promotions && Array.isArray(promotions)) {
      const formattedPromos = promotions.map((p: PromoInput) => ({
        name: p.name || (p as unknown as { promo_name: string }).promo_name,
        value: Number(
          p.value || (p as unknown as { discount_value: number }).discount_value
        ),
      }));

      await updatePromotions(formattedPromos);
    }

    if (tiers && Array.isArray(tiers)) {
      const formattedTiers = tiers.map((t: TierInput) => ({
        id: String(t.id),
        name: t.name,
        minSpend: Number(t.minSpend),
        multiplier: Number(t.multiplier),
        color: t.color,
      }));
      await updateTiers(formattedTiers);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
