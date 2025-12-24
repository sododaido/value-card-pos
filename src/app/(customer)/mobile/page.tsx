// ไฟล์: src/app/(customer)/mobile/page.tsx
"use client";

import { useState } from "react";
import { Search, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DigitalMemberCard } from "@/components/pos/digital-member-card";
import { Member } from "@/types/index";

// ✅ แก้ไข: ใช้ "as unknown as Member" เพื่อแก้ปัญหา Type ไม่ตรง (Bypass แบบปลอดภัยกว่า any)
const MOCK_MEMBER = {
  id: "1",
  name: "คุณลูกค้า ตัวอย่าง",
  phone: "0812345678",
  card_id: "MB-8888",
  tier: "Gold",
  points: 1250,
  balance: 500.0,
  // ใส่ Date เผื่อไว้
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as Member;

export default function MobilePage() {
  const [phone, setPhone] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (phone.length < 10) {
      setError("กรุณากรอกเบอร์โทรให้ครบ 10 หลัก");
      return;
    }

    setIsLoading(true);
    setError("");
    setMember(null);

    // จำลองการโหลดข้อมูล
    setTimeout(() => {
      if (phone === "0812345678") {
        setMember(MOCK_MEMBER);
      } else {
        setError("ไม่พบข้อมูลสมาชิกในระบบ");
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-10 px-4 gap-6">
      <div className="text-center space-y-2">
        <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-200">
          <Smartphone className="text-white h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">
          ตรวจสอบสถานะสมาชิก
        </h1>
        <p className="text-slate-500 text-sm">
          กรอกเบอร์โทรศัพท์เพื่อดูคะแนนและยอดเงิน
        </p>
      </div>

      <form onSubmit={handleCheckMember} className="w-full max-w-sm flex gap-2">
        <Input
          type="tel"
          placeholder="เบอร์โทรศัพท์ (เช่น 0812345678)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-12 text-lg bg-white shadow-sm"
          maxLength={10}
          autoFocus
        />
        <Button
          type="submit"
          size="icon"
          className="h-12 w-12 bg-blue-600 hover:bg-blue-700 shadow-sm shrink-0"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="animate-spin text-white">⟳</span>
          ) : (
            <Search className="h-5 w-5" />
          )}
        </Button>
      </form>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-full animate-pulse border border-red-100">
          {error}
        </div>
      )}

      <div className="w-full max-w-sm mt-2 transition-all duration-500 ease-in-out">
        {member ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DigitalMemberCard member={member} />
            <p className="text-center text-xs text-slate-400 mt-4">
              ข้อมูลจำลอง ณ วันที่ {new Date().toLocaleDateString("th-TH")}
            </p>
          </div>
        ) : (
          !isLoading &&
          !error && (
            <div className="h-48 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 bg-white/50">
              <p className="text-sm">ผลลัพธ์จะแสดงที่นี่</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
