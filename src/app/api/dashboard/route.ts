import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// ✅ 1. บังคับปิด Cache เพื่อให้ได้ข้อมูล Real-time
export const dynamic = "force-dynamic";
export const revalidate = 0;

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today";

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // เริ่มต้นที่เที่ยงคืน

    // ✅ 2. คำนวณวันเริ่มต้นตามช่วงเวลา
    if (period === "week") {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
    } else if (period === "month") {
      startDate.setDate(1);
    }

    // ✅ 3. ดึงข้อมูลยอดรวม (Cards)
    const topupResult = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: "TOPUP",
        createdAt: { gte: startDate },
      },
    });

    const paymentResult = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: "PAYMENT",
        createdAt: { gte: startDate },
      },
    });

    const newMembers = await prisma.member.count({
      where: { createdAt: { gte: startDate } },
    });

    // ✅ 4. ดึงข้อมูลกราฟ (ย้อนหลัง 7 วัน)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(new Date().getDate() - i);
      d.setHours(0, 0, 0, 0);

      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);

      const dayTopup = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "TOPUP", createdAt: { gte: d, lt: nextDay } },
      });

      const dayPayment = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "PAYMENT", createdAt: { gte: d, lt: nextDay } },
      });

      const dayName = d.toLocaleDateString("th-TH", {
        weekday: "short",
        day: "numeric",
      });
      chartData.push({
        name: dayName,
        topup: dayTopup._sum.amount || 0,
        payment: dayPayment._sum.amount || 0,
      });
    }

    return NextResponse.json({
      period,
      topupToday: topupResult._sum.amount || 0,
      paymentToday: paymentResult._sum.amount || 0,
      newMembers,
      chartData,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
