// ไฟล์: src/app/api/members/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  getAllMembers,
  getMemberByCardId,
  getMemberByPhone,
  createMember,
  updateMember,
} from "@/lib/google-sheets";

const prisma = new PrismaClient();

// 1. GET: ค้นหาสมาชิก (Search)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("search");

    if (!query) {
      const members = await getAllMembers();
      return NextResponse.json(members);
    }

    const isPhone = /^\d{9,10}$/.test(query);

    let member;
    if (isPhone) {
      member = await getMemberByPhone(query);
    } else {
      const members = await getAllMembers();
      // ค้นหาจาก Card ID (Case Insensitive)
      member = members.find(
        (m) => m.card_id.toLowerCase() === query.toLowerCase()
      );
    }

    if (!member) {
      return NextResponse.json({ error: "ไม่พบข้อมูลสมาชิก" }, { status: 404 });
    }

    // ✅ [NEW LOGIC] ตรวจสอบว่าเป็นบัตรเปล่าหรือไม่? (ไม่มีชื่อ หรือชื่อเป็นช่องว่าง)
    // สมมติว่าบัตรเปล่าใน Sheet คือมี card_id แต่ช่อง name ว่าง
    const isActive = member.name && member.name.trim().length > 0;

    if (!isActive) {
      // ส่งข้อมูลกลับไปพร้อมบอกว่ายังไม่ Active
      return NextResponse.json({
        ...member,
        isActive: false, // Flag บอกหน้าบ้านว่าต้อง Activate
        message: "บัตรนี้ยังไม่ได้ลงทะเบียน",
      });
    }

    return NextResponse.json({ ...member, isActive: true });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// 2. POST: สมัครสมาชิกใหม่ (Register) -> โค้ดเดิม ใช้ได้เลย
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อและเบอร์โทร" },
        { status: 400 }
      );
    }

    const existingMember = await getMemberByPhone(phone);
    if (existingMember) {
      return NextResponse.json(
        { error: "เบอร์โทรนี้มีในระบบแล้ว" },
        { status: 400 }
      );
    }

    const newMember = await createMember({ name, phone });

    try {
      await prisma.member.create({
        data: {
          name: newMember.name,
          phone: newMember.phone,
          card_id: newMember.card_id,
          points: 0,
          tier: "Bronze",
          totalSpent: 0,
          createdAt: new Date(),
        },
      });
    } catch (dbError) {
      console.error("Failed to sync member to DB:", dbError);
    }

    return NextResponse.json(newMember);
  } catch (error) {
    console.error("Create Member Error:", error);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}

// 3. PUT: แก้ไขข้อมูลสมาชิก (ใช้สำหรับ Activate บัตรด้วย)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { card_id, name, phone } = body;

    if (!card_id || !name || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // อัปเดต Google Sheets (ใช้ updateMember เดิมได้เลย เพราะเป็นการใส่ชื่อลงในช่องว่าง)
    const success = await updateMember(card_id, { name, phone });

    if (!success) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // ✅ Sync ลง DB ด้วย (กรณี Activate บัตรใหม่ ต้อง Create หรือ Update ใน DB)
    try {
      const memberInDb = await prisma.member.findUnique({ where: { card_id } });

      if (memberInDb) {
        // ถ้ามีใน DB แล้ว (กรณีเคย Sync) -> Update
        await prisma.member.update({
          where: { card_id },
          data: { name, phone },
        });
      } else {
        // ✅ ถ้าไม่มีใน DB (กรณี Activate บัตรเปล่าครั้งแรก) -> Create ใหม่
        await prisma.member.create({
          data: {
            card_id,
            name,
            phone,
            points: 0, // เริ่มต้น 0 เพราะเป็นบัตรเปล่า
            tier: "Bronze",
            totalSpent: 0,
            createdAt: new Date(),
          },
        });
      }
    } catch (e) {
      console.error("Failed to sync member activation to DB", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}
