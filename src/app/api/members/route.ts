import { NextResponse } from "next/server";
import {
  getAllMembers,
  getMemberByCardId,
  getMemberByPhone,
  createMember,
  updateMember,
} from "@/lib/google-sheets";

// 1. GET: ค้นหาสมาชิก
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

    // ตรวจสอบบัตร Active
    const isActive = member.name && member.name.trim().length > 0;

    if (!isActive) {
      return NextResponse.json({
        ...member,
        isActive: false,
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

// 2. POST: สมัครสมาชิกใหม่
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
    return NextResponse.json(newMember);
  } catch (error) {
    console.error("Create Member Error:", error);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}

// 3. PUT: แก้ไขข้อมูลสมาชิก
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

    const success = await updateMember(card_id, { name, phone });

    if (!success) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}
