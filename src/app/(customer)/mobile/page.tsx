"use client";

import React, { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Smartphone, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function MobileLoginContent() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // ตรวจสอบความถูกต้องของเบอร์โทรศัพท์
    if (phone.length < 10) {
      toast.error("กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก");
      return;
    }

    setIsLoading(true);
    try {
      // ✅ เรียก API ค้นหาสมาชิกด้วยเบอร์โทรศัพท์
      const res = await fetch(`/api/members?search=${phone}&t=${Date.now()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ไม่พบข้อมูลสมาชิกในระบบ");
      }

      // ✅ เมื่อพบสมาชิก ให้ Redirect ไปหน้าแสดงบัตรสมาชิกที่ /mobile/me
      toast.success("เข้าสู่ระบบสำเร็จ");
      router.push(`/mobile/me?card_id=${data.card_id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px] space-y-8 text-center">
        {/* ส่วนหัวและโลโก้ */}
        <div className="space-y-2">
          <div className="h-20 w-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl">
            <Smartphone className="text-white h-10 w-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            Value Card
          </h1>
          <p className="text-slate-500 font-medium italic">
            Check Balance & Points
          </p>
        </div>

        {/* ฟอร์มล็อกอิน */}
        <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
          <div className="space-y-3 text-left">
            <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-[0.2em]">
              Phone Number
            </label>
            <Input
              type="tel"
              placeholder="08x-xxx-xxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              // ✅ แก้ไข: เพิ่มสีตัวหนังสือ (text-slate-900) และพื้นหลัง (bg-white) เพื่อให้เห็นตัวเลขชัดเจนบนมือถือทุกโหมด
              className="h-16 text-2xl text-center font-bold rounded-2xl border-slate-200 focus:ring-2 focus:ring-slate-900 transition-all shadow-inner text-slate-900 dark:text-slate-900 bg-white dark:bg-white"
              maxLength={10}
            />
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-lg font-bold shadow-lg shadow-slate-300 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-6 w-6" />
            ) : (
              <>
                Check Now <ArrowRight className="h-6 w-6" />
              </>
            )}
          </Button>

          <p className="text-slate-400 text-xs font-medium">
            ยังไม่เป็นสมาชิก? ติดต่อพนักงานเพื่อสมัครใช้งาน
          </p>
        </div>

        <div className="pt-4">
          <p className="text-[10px] text-slate-300 uppercase font-bold tracking-[0.3em]">
            Digital Membership System
          </p>
        </div>
      </div>
    </div>
  );
}

// ✅ หุ้มด้วย Suspense เพื่อรองรับมาตรฐานของ Next.js 14+
export default function MobileLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <MobileLoginContent />
    </Suspense>
  );
}
