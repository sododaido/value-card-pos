"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Member, Transaction } from "@/types/index";
import { DigitalMemberCard } from "@/components/pos/digital-member-card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  LogOut,
  RefreshCw,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Barcode from "react-barcode";

function CustomerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // ✅ แก้ไข: รองรับทั้ง ?id= และ ?card_id= เพื่อความยืดหยุ่น
  const cardId = searchParams.get("id") || searchParams.get("card_id");

  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [tiers, setTiers] = useState([]); // ✅ เพิ่ม State สำหรับเก็บข้อมูลระดับสมาชิก
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!cardId) return;
    setLoading(true);
    try {
      // 1. ดึงข้อมูล Tiers (เพื่อให้ DigitalMemberCard แสดงสีได้ถูกต้อง)
      const settingsRes = await fetch("/api/settings");
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.tiers) setTiers(settingsData.tiers);
      }

      // 2. ดึงข้อมูลสมาชิก
      const resMember = await fetch(`/api/members?search=${cardId}`);
      if (!resMember.ok) throw new Error("Failed to load member");
      const dataMember = await resMember.json();
      setMember(dataMember);

      // 3. ดึงประวัติการใช้งาน
      const resHistory = await fetch(
        `/api/history?card_id=${dataMember.card_id}`
      );
      if (resHistory.ok) {
        const dataHistory = await resHistory.json();
        setHistory(dataHistory);
      }
    } catch (error) {
      console.error(error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cardId) {
      router.push("/");
    } else {
      fetchData();
    }
  }, [cardId]);

  if (loading || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* 1. Header */}
      <div className="h-48 bg-primary rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        <div className="p-6 text-primary-foreground relative z-10 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">My Wallet</h1>
            <p className="text-sm opacity-80">Value Card Member</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => router.push("/")}
          >
            <LogOut size={20} />
          </Button>
        </div>
      </div>

      <div className="px-4 -mt-20 relative z-20 space-y-6">
        {/* 2. Member Card (ส่ง tiers เข้าไปด้วยเพื่อให้แสดงสีตามระดับ) */}
        <div className="transform transition-all active:scale-95 duration-200">
          <DigitalMemberCard member={member} tiers={tiers} />
        </div>

        {/* 3. Barcode */}
        <div className="bg-white rounded-xl p-6 shadow-sm border flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">
            Scan to Pay
          </p>
          <div className="p-2 bg-white">
            <Barcode
              key={member.card_id}
              value={member.card_id}
              width={2}
              height={80}
              displayValue={false}
              background="#ffffff"
            />
          </div>
          <p className="font-mono text-lg font-bold tracking-[0.2em] text-slate-600">
            {member.card_id}
          </p>
        </div>

        {/* 4. Refresh Button */}
        <Button
          variant="outline"
          className="w-full h-12 text-slate-500 bg-white hover:bg-slate-50 border-slate-200 shadow-sm"
          onClick={fetchData}
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Update Balance
        </Button>

        {/* 5. Transaction History */}
        <div className="pt-4">
          <h3 className="text-md font-bold mb-3 px-1 flex items-center gap-2 text-slate-700">
            <Clock size={18} /> Recent Activity
          </h3>

          {history.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground bg-white rounded-xl border border-dashed">
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((txn) => {
                const isTopup = txn.type === "TOPUP";
                return (
                  <div
                    key={txn.transaction_id}
                    className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          isTopup
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {isTopup ? (
                          <ArrowDownLeft size={20} />
                        ) : (
                          <ArrowUpRight size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">
                          {isTopup ? "Top Up" : "Payment"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDate(txn.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          isTopup ? "text-green-600" : "text-slate-900"
                        }`}
                      >
                        {isTopup ? "+" : "-"}
                        {formatCurrency(txn.amount)}
                      </p>
                      {txn.points_earned > 0 && (
                        <p className="text-[10px] text-orange-500">
                          +{txn.points_earned} pts
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="animate-spin text-primary w-10 h-10" />
        </div>
      }
    >
      <CustomerContent />
    </Suspense>
  );
}
