// ไฟล์: src/app/api/settings/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// ✅ เพิ่ม 2 บรรทัดนี้ที่บรรทัดบนสุด เพื่อบังคับให้ดึงข้อมูลใหม่เสมอ
export const dynamic = "force-dynamic";
export const revalidate = 0;

const prisma = new PrismaClient();

// ... (Code ส่วนที่เหลือเหมือนเดิม ไม่ต้องลบ) ...
// (แต่ถ้าอยากมั่นใจ ให้ Copy Code เต็มๆ จากรอบที่แล้วมาใส่ แล้วเติม 2 บรรทัดบนสุดเข้าไปครับ)

// Interface สำหรับรับค่า
interface PromotionInput {
  id?: string;
  name: string;
  type?: string;
  value: string | number;
  isActive?: boolean;
}

interface TierInput {
  id?: string;
  name: string;
  minSpend: string | number;
  multiplier: string | number;
  color: string;
}

export async function GET() {
  try {
    let setting = await prisma.storeSetting.findFirst();
    if (!setting) {
      setting = await prisma.storeSetting.create({
        data: { name: "POS System", isPointSystem: true },
      });
    }

    const promotions = await prisma.promotion.findMany({
      where: { isActive: true },
      orderBy: { value: "asc" },
    });

    let tiers = await prisma.memberTier.findMany({
      orderBy: { minSpend: "asc" },
    });

    if (tiers.length === 0) {
      await prisma.memberTier.createMany({
        data: [
          { name: "Bronze", minSpend: 0, multiplier: 1, color: "#cd7f32" },
          { name: "Silver", minSpend: 5000, multiplier: 1.2, color: "#c0c0c0" },
          { name: "Gold", minSpend: 10000, multiplier: 1.5, color: "#ffd700" },
        ],
      });
      tiers = await prisma.memberTier.findMany({
        orderBy: { minSpend: "asc" },
      });
    }

    return NextResponse.json({ setting, promotions, tiers });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { setting, promotions, tiers } = body;

    // 1. อัปเดตข้อมูลร้าน
    if (setting) {
      const exist = await prisma.storeSetting.findFirst();
      if (exist) {
        await prisma.storeSetting.update({
          where: { id: exist.id },
          data: setting,
        });
      }
    }

    // 2. อัปเดตโปรโมชั่น
    if (promotions) {
      // ลบเก่าสร้างใหม่ (ง่ายที่สุดสำหรับการจัดการ List)
      await prisma.promotion.deleteMany({});
      if (promotions.length > 0) {
        const cleanPromos = promotions.map((p: PromotionInput) => ({
          name: p.name,
          type: p.type || "fixed",
          value: Number(p.value),
          isActive: true,
        }));
        await prisma.promotion.createMany({ data: cleanPromos });
      }
    }

    // 3. อัปเดต Tier สมาชิก
    if (tiers) {
      for (const tier of tiers as TierInput[]) {
        if (tier.id) {
          await prisma.memberTier.update({
            where: { id: tier.id },
            data: {
              minSpend: Number(tier.minSpend),
              multiplier: Number(tier.multiplier),
              name: tier.name,
              color: tier.color,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save Error:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
