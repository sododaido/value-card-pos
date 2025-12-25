// ไฟล์: src/app/api/members/route.ts
import { NextResponse } from "next/server";
import {
  getDoc, // ✅ นำเข้าเพิ่ม
  getAllMembers,
  getMemberByPhone,
  createMember,
  updateMember,
} from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("search");

    // ✅ โหลด Google Sheet เพียงครั้งเดียว
    const doc = await getDoc();
    await doc.loadInfo();

    if (!query) {
      const members = await getAllMembers();
      return NextResponse.json(members);
    }

    const isPhone = /^\d{9,10}$/.test(query);
    let member;

    if (isPhone) {
      member = await getMemberByPhone(query);
    } else {
      // ค้นหาในลิสต์ทั้งหมดเพื่อความรวดเร็ว ลด Request
      const members = await getAllMembers();
      member = members.find(
        (m) => m.card_id && m.card_id.toLowerCase() === query.toLowerCase()
      );
    }

    if (!member) {
      return NextResponse.json({ error: "ไม่พบข้อมูลสมาชิก" }, { status: 404 });
    }

    return NextResponse.json({ ...member, isActive: true });
  } catch (error) {
    console.error("API Error (Members):", error);
    // ส่งข้อมูล Error ที่ชัดเจนขึ้น
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    const doc = await getDoc();
    await doc.loadInfo();

    const existingMember = await getMemberByPhone(phone);
    if (existingMember) {
      return NextResponse.json(
        { error: "เบอร์โทรนี้มีในระบบแล้ว" },
        { status: 400 }
      );
    }

    // ✅ เรียกใช้ createMember ที่แก้ไขใหม่ ซึ่งจะคืนค่า card_id จริงจาก Sheet กลับมา
    const newMember = await createMember({ name, phone });

    // คืนข้อมูลสมาชิกใหม่พร้อม card_id ให้หน้าบ้าน
    return NextResponse.json(newMember);
  } catch (error) {
    console.error("POST Member Error:", error);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { card_id, name, phone } = body;

    const doc = await getDoc();
    await doc.loadInfo();

    const success = await updateMember(card_id, { name, phone });
    if (!success)
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}
