"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DigitalMemberCard } from "@/components/pos/digital-member-card";
import { RecentActivity } from "@/components/pos/recent-activity";
import { Member, Transaction } from "@/types/index";
import {
  Loader2,
  AlertCircle,
  ChevronLeft,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Barcode from "react-barcode"; // ✅ นำเข้า Library บาร์โค้ด

function MemberProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cardId = searchParams.get("card_id");

  const [member, setMember] = useState<Member | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tiers, setTiers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!cardId) return;
    setIsLoading(true);
    try {
      const settingsRes = await fetch("/api/settings");
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.tiers) setTiers(settingsData.tiers);
      }

      const memberRes = await fetch(
        `/api/members?search=${cardId}&t=${Date.now()}`
      );
      const memberData = await memberRes.json();
      if (!memberRes.ok)
        throw new Error(memberData.error || "ไม่พบข้อมูลสมาชิก");
      setMember(memberData);

      const txnRes = await fetch(
        `/api/transactions?card_id=${cardId}&t=${Date.now()}`
      );
      if (txnRes.ok) {
        const txnData = await txnRes.json();
        setTransactions(txnData);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!cardId) {
      router.replace("/mobile");
      return;
    }
    loadData();
  }, [cardId, router]);

  if (isLoading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-slate-900" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl">
      {/* 1. Header แบบในรูปภาพ */}
      <div className="p-6 bg-slate-900 text-white flex justify-between items-center rounded-b-[2rem]">
        <div>
          <h1 className="text-xl font-bold">My Wallet</h1>
          <p className="text-xs opacity-60">Value Card Member</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/mobile")}
          className="text-white"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 -mt-8">
        {/* 2. บัตรสมาชิกดิจิทัล */}
        <DigitalMemberCard member={member} tiers={tiers} />

        {/* 3. ส่วนบาร์โค้ดสำหรับสแกนจ่าย */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center gap-4 text-center">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em]">
            Scan to Pay
          </p>
          <div className="p-2 bg-white rounded-lg">
            {member?.card_id && (
              <Barcode
                value={member.card_id}
                width={2}
                height={80}
                displayValue={false}
                background="#ffffff"
              />
            )}
          </div>
          <p className="font-mono text-xl font-bold tracking-[0.3em] text-slate-700">
            {member?.card_id}
          </p>
        </div>

        {/* 4. ปุ่มอัปเดตยอดเงิน */}
        <Button
          variant="outline"
          onClick={loadData}
          className="w-full h-14 rounded-2xl bg-white border-slate-100 text-slate-500 font-bold shadow-sm flex gap-2"
        >
          <RefreshCw className="h-4 w-4" /> Update Balance
        </Button>

        {/* 5. ประวัติการใช้งานล่าสุด */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 px-1">
            Recent Activity
          </h3>
          <RecentActivity transactions={transactions} isLoading={isLoading} />
        </div>
      </div>

      <div className="p-6 text-center shrink-0">
        <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-widest opacity-50">
          Powered by ValueCard System
        </p>
      </div>
    </div>
  );
}

export default function MemberProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <MemberProfileContent />
    </Suspense>
  );
}
