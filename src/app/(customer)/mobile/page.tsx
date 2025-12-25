"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DigitalMemberCard } from "@/components/pos/digital-member-card";
import { RecentActivity } from "@/components/pos/recent-activity";
import { Member, Transaction } from "@/types/index";
import { Loader2, AlertCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function MemberProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cardId = searchParams.get("card_id"); // รับค่าจาก URL เช่น ?card_id=CF10001

  const [member, setMember] = useState<Member | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tiers, setTiers] = useState([]); // ✅ เพิ่ม State สำหรับเก็บข้อมูลระดับสมาชิก
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ แก้ไข: หากเข้าหน้านี้โดยไม่มี card_id ให้เด้งกลับไปหน้าล็อกอินหลักทันที ไม่ต้องโหลดค้าง
    if (!cardId || cardId.trim() === "") {
      router.replace("/mobile");
      return;
    }

    async function loadData() {
      try {
        // 1. ดึงข้อมูล Tiers เพื่อให้สีบัตรแสดงผลถูกต้องตามระดับสมาชิก
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.tiers) setTiers(settingsData.tiers);
        }

        // 2. ดึงข้อมูลสมาชิกจาก API
        const memberRes = await fetch(
          `/api/members?search=${cardId}&t=${Date.now()}`
        );
        const memberData = await memberRes.json();

        if (!memberRes.ok)
          throw new Error(memberData.error || "ไม่พบข้อมูลสมาชิก");
        setMember(memberData);

        // 3. ดึงประวัติธุรกรรมล่าสุด
        const txnRes = await fetch(
          `/api/transactions?card_id=${cardId}&t=${Date.now()}`
        );
        if (txnRes.ok) {
          const txnData = await txnRes.json();
          setTransactions(txnData);
        }
      } catch (err) {
        // ✅ แก้ไข Error: ระบุประเภท Error ให้ชัดเจนแทนการใช้ any เพื่อผ่าน Lint Check
        const errorMessage =
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [cardId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-slate-500 animate-pulse font-medium">
          กำลังโหลดข้อมูลบัตรของคุณ...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center text-center gap-4 bg-slate-50">
        <div className="bg-red-50 p-4 rounded-full">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">ขออภัย</h2>
        <p className="text-slate-500 max-w-xs">{error}</p>
        <Button
          onClick={() => router.push("/mobile")}
          variant="outline"
          className="mt-2 h-10 px-6 rounded-full"
        >
          กลับหน้าหลัก
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col max-w-md mx-auto shadow-2xl">
      {/* ส่วนหัวหน้าจอสำหรับมือถือ */}
      <div className="p-4 flex items-center gap-2 bg-white dark:bg-slate-900 border-b dark:border-slate-800 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/mobile")}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-lg dark:text-white">บัตรสมาชิกของฉัน</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 flex flex-col gap-6">
          {/* ✅ บัตรสมาชิกดิจิทัล: ส่ง tiers เข้าไปด้วยเพื่อให้แสดงสีตามระดับ (Bronze/Silver/Gold) */}
          <DigitalMemberCard member={member} tiers={tiers} />

          {/* ✅ รายการธุรกรรมล่าสุด: ดึงจาก API จริงที่เชื่อมต่อ Google Sheets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                ประวัติการใช้งาน
              </h3>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                Update Real-time
              </span>
            </div>
            <RecentActivity transactions={transactions} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* Footer สำหรับแบรนด์ */}
      <div className="p-6 text-center shrink-0">
        <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-widest opacity-50">
          Powered by ValueCard System
        </p>
      </div>
    </div>
  );
}

// ✅ หุ้มด้วย Suspense เพื่อรองรับการทำงานของ useSearchParams ใน Next.js 14+ ป้องกัน Build Error
export default function MemberProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <MemberProfileContent />
    </Suspense>
  );
}
