"use client";

import React, { useState, useEffect } from "react";
import { POSHeader } from "@/components/pos/pos-header";
import { ActionPanel } from "@/components/pos/action-panel";
import { DigitalMemberCard } from "@/components/pos/digital-member-card";
import { RecentActivity } from "@/components/pos/recent-activity";
import { Member, Transaction } from "@/types/index";
import { toast } from "sonner";

export default function POSPage() {
  const [member, setMember] = useState<Member | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tiers, setTiers] = useState([]);

  // โหลดข้อมูล Tiers เพื่อส่งให้บัตรสมาชิกแสดงสีตามระดับ
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.tiers) setTiers(data.tiers);
      })
      .catch((err) => console.error("Failed to load tiers", err));
  }, []);

  // ✅ ฟังก์ชันค้นหาหลัก (ประกาศก่อนการ Return JSX)
  const handleSearchMember = async (query: string) => {
    if (!query) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/members?search=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ไม่พบข้อมูลสมาชิก");
      }

      setMember(data);

      // โหลดประวัติธุรกรรมต่อทันที
      const txnRes = await fetch(`/api/transactions?card_id=${data.card_id}`);
      if (txnRes.ok) {
        const txnData = await txnRes.json();
        setTransactions(txnData);
      }
    } catch (error) {
      toast.error((error as Error).message);
      setMember(null);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransaction = async (
    type: "TOPUP" | "PAYMENT",
    amount: number,
    note: string
  ): Promise<boolean> => {
    // เพิ่ม Return Type เพื่อให้ ActionPanel ทำงานต่อได้
    if (!member) return false;
    setIsLoading(true);
    try {
      const res = await fetch("/api/members/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: member.card_id,
          type,
          amount,
          note,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transaction failed");

      toast.success(type === "TOPUP" ? "เติมเงินสำเร็จ" : "ชำระเงินสำเร็จ");

      // รีโหลดข้อมูลสมาชิกเพื่ออัปเดตยอดเงิน/แต้ม/ระดับ
      await handleSearchMember(member.card_id);
      return true;
    } catch (error) {
      toast.error((error as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMember(null);
    setTransactions([]);
  };

  return (
    // ✅ แก้ไข: ใช้ min-h-screen และ max-h-screen ร่วมกับ flex-col เพื่อบังคับ Layout ไม่ให้ล้น
    <div className="min-h-screen max-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden">
      {/* ✅ บรรทัดที่ 230: เชื่อมต่อ handleSearchMember กับ callback เมื่อสมัครเสร็จ */}
      <POSHeader
        onMemberRegistered={(cardId: string) => {
          handleSearchMember(cardId);
        }}
      />

      {/* ✅ แก้ไข: ใช้ flex-grow เพื่อให้เนื้อหาหลักยืดขยายจนสุดพื้นที่ที่เหลือ และดัน footer ลงข้างล่าง */}
      <main className="flex-grow p-2 md:p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 max-w-[1600px] mx-auto w-full overflow-hidden">
        {/* คอลัมน์ซ้าย: แสดงบัตรและประวัติ (lg:col-span-4) */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-3 min-h-0 overflow-hidden">
          <div className="shrink-0">
            <DigitalMemberCard member={member} tiers={tiers} />
          </div>
          <div className="flex-grow min-h-0 bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 overflow-hidden">
            <RecentActivity transactions={transactions} isLoading={isLoading} />
          </div>
        </div>

        {/* คอลัมน์ขวา: ส่วนจัดการ (lg:col-span-8) */}
        <div className="lg:col-span-8 xl:col-span-8 bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 p-3 md:p-4 flex flex-col min-h-0 overflow-hidden">
          <ActionPanel
            onSearch={handleSearchMember}
            onConfirm={handleTransaction}
            onUpdateMember={() => {}}
            onReset={handleReset}
            isLoading={isLoading}
            memberId={member?.card_id || ""}
          />
        </div>
      </main>

      {/* ✅ แก้ไข: footer อยู่ต่อท้ายเนื้อหาจริงใน DOM และเอา fixed ออก เพื่อไม่ให้ลอยทับปุ่มกดยืนยัน */}
      <footer className="h-7 shrink-0 bg-slate-100 dark:bg-slate-900 border-t dark:border-slate-800 px-4 flex items-center justify-between text-[10px] text-slate-500">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="font-bold uppercase tracking-tighter">
              System Online
            </span>
          </div>
          <span className="opacity-40">|</span>
          <span className="tracking-tight"></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="opacity-60 italic">Connected to Google Sheets</span>
        </div>
      </footer>
    </div>
  );
}
