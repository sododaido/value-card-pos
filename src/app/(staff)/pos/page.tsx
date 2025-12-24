// ไฟล์: src/app/(staff)/pos/page.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Member, Transaction } from "@/types/index";
import { POSHeader } from "@/components/pos/pos-header";
import { DigitalMemberCard } from "@/components/pos/digital-member-card";
import { RecentActivity } from "@/components/pos/recent-activity";
import { ActionPanel } from "@/components/pos/action-panel";
import { Separator } from "@/components/ui/separator";

// ✅ Import UI Components สำหรับ Dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

interface Tier {
  name: string;
  color: string;
}

export default function POSPage() {
  const [member, setMember] = useState<Member | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ State สำหรับ Activate Card Dialog
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [activationData, setActivationData] = useState({
    card_id: "",
    name: "",
    phone: "",
  });

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await fetch("/api/settings?t=" + new Date().getTime());
        const data = await res.json();
        if (data.tiers) setTiers(data.tiers);
      } catch (error) {
        console.error("Failed to load tiers", error);
      }
    };
    fetchTiers();
  }, []);

  const fetchHistory = async (cardId: string) => {
    try {
      const res = await fetch(
        `/api/history?card_id=${cardId}&t=${new Date().getTime()}`
      );
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to load history", error);
    }
  };

  const handleSearch = async (keyword: string) => {
    if (!keyword) return;

    setIsLoading(true);
    setMember(null);
    setTransactions([]);

    try {
      const res = await fetch(`/api/members?search=${keyword}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "ไม่พบข้อมูลสมาชิก");

      // ✅ ตรวจสอบสถานะบัตร
      if (data.isActive === false) {
        // ถ้าเป็นบัตรเปล่า -> เปิด Dialog ลงทะเบียนทันที
        setActivationData({ card_id: data.card_id, name: "", phone: "" });
        setIsActivateOpen(true);
        toast.info("พบบัตรใหม่! กรุณาลงทะเบียนเพื่อเปิดใช้งาน");
        return;
      }

      // ถ้าบัตรปกติ -> แสดงข้อมูล
      setMember(data);
      toast.success(`สวัสดีคุณ ${data.name}`);
      await fetchHistory(data.card_id);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ ฟังก์ชัน Activate บัตร
  const handleActivateCard = async () => {
    if (!activationData.name || !activationData.phone) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activationData),
      });

      if (!res.ok) throw new Error("ลงทะเบียนบัตรไม่สำเร็จ");

      toast.success("เปิดใช้งานบัตรเรียบร้อยแล้ว!");
      setIsActivateOpen(false);

      // ✅ [แก้ไข] เติมฟิลด์ให้ครบตาม Type Member เพื่อแก้ Error TypeScript
      const newMemberData: Member = {
        card_id: activationData.card_id,
        name: activationData.name,
        phone: activationData.phone,
        points: 0,
        balance: 0,
        tier: "Bronze",
        total_spent: 0,
        // ฟิลด์ที่เพิ่มมาให้ครบ Type
        member_id: activationData.card_id, // ใช้เลขบัตรแทนชั่วคราว
        joined_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setMember(newMemberData);
      setTransactions([]);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransaction = async (
    type: "TOPUP" | "PAYMENT",
    amount: number,
    note: string
  ) => {
    if (!member) {
      toast.error("กรุณาค้นหาสมาชิกก่อนทำรายการ");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/members/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_id: member.card_id, type, amount, note }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setMember((prev) =>
        prev
          ? {
              ...prev,
              balance: result.data.balance,
              points: result.data.points,
              tier: result.data.tier,
            }
          : null
      );
      await fetchHistory(member.card_id);
    } catch (error) {
      toast.error((error as Error).message || "เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMember = async (data: { name: string; phone: string }) => {
    if (!member) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: member.card_id,
          name: data.name,
          phone: data.phone,
        }),
      });
      if (!res.ok) throw new Error("ไม่สามารถแก้ไขข้อมูลได้");
      toast.success("แก้ไขข้อมูลสมาชิกเรียบร้อย");
      setMember((prev) =>
        prev ? { ...prev, name: data.name, phone: data.phone } : null
      );
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMember(null);
    setTransactions([]);
    toast.info("รีเซ็ตหน้าจอเรียบร้อย");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <POSHeader />

      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Member Card
                </h2>
                {member && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full animate-pulse">
                    Active
                  </span>
                )}
              </div>
              <DigitalMemberCard member={member} tiers={tiers} />
            </section>
            <Separator />
            <section className="flex-1 overflow-hidden flex flex-col">
              <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                Recent Activity{" "}
                <span className="text-xs bg-slate-100 px-2 rounded-md border">
                  Last 5
                </span>
              </h2>
              <RecentActivity
                transactions={transactions}
                isLoading={isLoading}
              />
            </section>
          </div>
          <div className="md:col-span-7 lg:col-span-8 bg-card rounded-xl border shadow-sm p-6 h-full">
            <ActionPanel
              onSearch={handleSearch}
              onConfirm={handleTransaction}
              onUpdateMember={handleUpdateMember}
              onReset={handleReset}
              isLoading={isLoading}
              memberId={member?.card_id}
            />
          </div>
        </div>
      </main>

      {/* ✅ Dialog ลงทะเบียนบัตรใหม่ */}
      <Dialog open={isActivateOpen} onOpenChange={setIsActivateOpen}>
        <DialogContent className="sm:max-w-md dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl dark:text-white">
              <CreditCard className="text-blue-600 h-6 w-6" />
              เปิดใช้งานบัตร (Activate)
            </DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              กรุณาระบุข้อมูลเพื่อลงทะเบียน
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right dark:text-slate-300">รหัสบัตร</Label>
              <Input
                className="col-span-3 bg-slate-100 font-mono dark:bg-slate-800 dark:text-slate-300"
                value={activationData.card_id}
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right dark:text-slate-300">
                ชื่อ <span className="text-red-500">*</span>
              </Label>
              <Input
                className="col-span-3 dark:bg-slate-800"
                value={activationData.name}
                onChange={(e) =>
                  setActivationData({ ...activationData, name: e.target.value })
                }
                placeholder="เช่น สมชาย"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right dark:text-slate-300">
                เบอร์โทร <span className="text-red-500">*</span>
              </Label>
              <Input
                className="col-span-3 dark:bg-slate-800"
                value={activationData.phone}
                onChange={(e) =>
                  setActivationData({
                    ...activationData,
                    phone: e.target.value,
                  })
                }
                placeholder="08xxxxxxxx"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActivateOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleActivateCard}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              เปิดใช้งาน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="h-8 bg-primary/5 border-t flex items-center justify-between px-6 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isLoading ? "bg-yellow-500" : "bg-green-500"
            } animate-pulse`}
          ></span>
          {isLoading ? "SYNCING DATA..." : "SYSTEM ONLINE"}
        </div>
        <div>Connected to Google Sheets</div>
      </footer>
    </div>
  );
}
