// ไฟล์: src/app/api/members/route.ts
import { NextResponse } from "next/server";
import {
  getDoc,
  getAllMembers,
  getMemberByPhone,
  createMember,
  updateMember,
} from "@/lib/google-sheets";
// ✅ นำเข้าฟังก์ชัน Telegram
import { sendTelegramNotify, formatNotifyMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("search");

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
      const members = await getAllMembers();
      member = members.find(
        (m) => m.card_id && m.card_id.toLowerCase() === query.toLowerCase()
      );
    }

    // ✅ [จุดแก้ไขเด็ดขาด] เปลี่ยนจาก Error 404 เป็น 200 พร้อม Flag พิเศษ
    // เพื่อป้องกันระบบ Global Toaster พ่นแถบสีแดง CARD_NOT_ACTIVATED ออกมาขวางหน้าจอ

    // 1. กรณีไม่พบรหัสบัตรเลย หรือ พบแต่ข้อมูลไม่ครบ (บัตรเปล่า)
    const hasProfile = member && member.name && member.name.trim() !== "";

    if (!member || !hasProfile) {
      return NextResponse.json(
        {
          card_id: member?.card_id || query,
          isUnregistered: true, // ✅ ส่ง Flag นี้แทนการส่ง Error String
          isActive: false,
        },
        { status: 200 } // ✅ บังคับส่ง 200 เพื่อให้ระบบมองว่า "สำเร็จ" (แต่ต้องลงทะเบียน)
      );
    }

    // 3. กรณีเป็นสมาชิกที่ลงทะเบียนข้อมูลครบถ้วนแล้ว
    return NextResponse.json({ ...member, isActive: true });
  } catch (error) {
    console.error("API Error (Members):", error);
    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
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
      return NextResponse.json({ error: "DUPLICATE_PHONE" }, { status: 400 });
    }

    // 1. สร้างสมาชิกใหม่ใน Google Sheets
    const newMember = await createMember({ name, phone });

    // ✅ 2. จัดการส่งแจ้งเตือน Telegram เมื่อสมัครสำเร็จ
    const runNotifyTask = async () => {
      try {
        const regMsg = formatNotifyMessage("REGISTER", {
          name: newMember.name,
          card_id: newMember.card_id,
          phone: newMember.phone,
        });
        await sendTelegramNotify(regMsg);
      } catch (notifyError) {
        console.error("Telegram Notify Error (Register):", notifyError);
      }
    };

    // เรียกทำงานเบื้องหลัง
    runNotifyTask();

    return NextResponse.json(newMember);
  } catch (error) {
    console.error("POST Member Error:", error);
    return NextResponse.json(
      { error: "FAILED_TO_CREATE_MEMBER" },
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
      return NextResponse.json({ error: "MEMBER_NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "FAILED_TO_UPDATE_MEMBER" },
      { status: 500 }
    );
  }
}
