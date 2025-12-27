"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  RotateCcw,
  CreditCard,
  Banknote,
  UserCog,
  AlertTriangle,
  Tag,
  TicketPercent,
  Loader2,
  CheckCircle2, // ไอคอนสำเร็จ
  XCircle, // ไอคอนไม่สำเร็จ
  Delete, // ไอคอนลบ (Clear)
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ✅ 1. Interface สำหรับข้อมูลดิบจาก API เพื่อแก้ Error Unexpected Any
interface APIPromotion {
  promo_id?: string;
  promo_name?: string;
  name?: string;
  discount_value?: number;
  value?: number;
  discount_type?: "FIXED" | "PERCENT";
  is_active?: boolean | string;
}

// ✅ 2. Interface หลักให้ตรงกับระบบจริง
interface Promotion {
  promo_id: string;
  promo_name: string;
  discount_value: number;
}

interface ActionPanelProps {
  onSearch: (keyword: string) => void;
  onConfirm: (
    type: "TOPUP" | "PAYMENT",
    amount: number,
    note: string
  ) => Promise<boolean>;
  onUpdateMember: (data: { name: string; phone: string }) => void;
  onReset: () => void;
  isLoading: boolean;
  memberId?: string;
}

export function ActionPanel({
  onSearch,
  onConfirm,
  onUpdateMember,
  onReset,
  isLoading,
  memberId,
}: ActionPanelProps) {
  const [keyword, setKeyword] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [activeTab, setActiveTab] = useState<"TOPUP" | "PAYMENT">("TOPUP");

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // 🔥 State สำหรับ Popup ผลลัพธ์ (Success/Fail)
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [resultStatus, setResultStatus] = useState<"SUCCESS" | "ERROR">(
    "SUCCESS"
  );
  const [resultMessage, setResultMessage] = useState("");

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [isPromoDialogOpen, setIsPromoDialogOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // ✅ [Sound Logic] แก้ไข Error Unexpected Any โดยการระบุ Type สำหรับ WebkitAudioContext
  const playNotificationSound = (type: "SUCCESS" | "ERROR") => {
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtxClass) return;

      const audioCtx = new AudioCtxClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === "SUCCESS") {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          1320,
          audioCtx.currentTime + 0.1
        );
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioCtx.currentTime + 0.3
        );
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      } else {
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(
          110,
          audioCtx.currentTime + 0.2
        );
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("Audio feedback error:", e);
    }
  };

  // ✅ [Keyboard Shortcut Logic] ฟังก์ชันรีเซ็ตหน้าจอ
  const handleGlobalReset = () => {
    onReset();
    setKeyword("");
    setAmount("");
    setSelectedPromo(null);
    setNote("");
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  // ✅ ป้องกัน Error Cascading Renders
  useEffect(() => {
    if (memberId && memberId !== keyword) {
      const timer = setTimeout(() => {
        setKeyword(memberId);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [memberId, keyword]);

  // ✅ 3. ดึงข้อมูลโปรโมชั่น
  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const res = await fetch(`/api/settings?t=${new Date().getTime()}`);
        const data = await res.json();
        if (data.promotions) {
          const mapped = data.promotions.map((p: APIPromotion) => ({
            promo_id:
              p.promo_id ||
              (p as APIPromotion & { id: string }).id ||
              Math.random().toString(),
            promo_name: p.promo_name || p.name || "โปรโมชั่น",
            discount_value: parseFloat(
              String(p.discount_value || p.value || 0)
            ),
          }));
          setPromotions(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch promotions", error);
      }
    };
    fetchPromos();
  }, []);

  // ✅ ปรับปรุง Focus Management: คืน Focus ไปที่ช่อง Search เมื่อไม่มีการทำงานค้างอยู่
  useEffect(() => {
    if (
      !isLoading &&
      !memberId &&
      !isEditOpen &&
      !isPromoDialogOpen &&
      !isConfirmOpen &&
      !isResultOpen
    ) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [
    isLoading,
    memberId,
    isEditOpen,
    isPromoDialogOpen,
    isConfirmOpen,
    isResultOpen,
  ]);

  // ✅ [ปรับปรุง] Logic การดักจับบาร์โค้ด และสั่งปิด Toast ก่อนค้นหาใหม่
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeyword(val);

    const cleanVal = val.trim();
    // ✅ ส่ง Search เมื่อความยาวถึงจุดที่กำหนด และไม่อยู่ในสถานะ Loading
    if (!isLoading && cleanVal) {
      if (
        cleanVal.length === 10 ||
        (cleanVal.toUpperCase().startsWith("CF") && cleanVal.length >= 7) ||
        cleanVal.length === 13
      ) {
        toast.dismiss(); // 🚨 เคลียร์หน้าจอก่อนยิง API ใหม่ เพื่อเปิดทางให้ Pop-up
        onSearch(cleanVal);
      }
    }
  };

  // ✅ [ปรับปรุง] การ Search ผ่านฟอร์ม
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim() && !isLoading) {
      toast.dismiss();
      onSearch(keyword.trim());
    }
  };

  const getNetAmount = () => {
    const amt = parseFloat(amount) || 0;
    const discount = selectedPromo ? selectedPromo.discount_value : 0;
    return Math.max(0, amt - discount);
  };

  const handlePreSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmTransaction = async () => {
    const finalAmount =
      activeTab === "PAYMENT" ? getNetAmount() : parseFloat(amount);
    let finalNote = note;
    if (activeTab === "PAYMENT" && selectedPromo) {
      finalNote =
        `${note} [โปรโมชั่น: ${selectedPromo.promo_name} -${selectedPromo.discount_value}บ.]`.trim();
    }

    try {
      const isSuccess = await onConfirm(activeTab, finalAmount, finalNote);
      setIsConfirmOpen(false);

      if (isSuccess) {
        playNotificationSound("SUCCESS");
        setResultStatus("SUCCESS");
        setResultMessage("ทำรายการสำเร็จ");
        setAmount("");
        setSelectedPromo(null);
        setNote("");
      } else {
        playNotificationSound("ERROR");
        setResultStatus("ERROR");
        setResultMessage("ทำรายการไม่สำเร็จ / ยอดเงินไม่พอ");
      }

      setIsResultOpen(true);
      setTimeout(() => {
        setIsResultOpen(false);
      }, 2000);
    } catch (error) {
      setIsConfirmOpen(false);
      playNotificationSound("ERROR");
      setResultStatus("ERROR");
      setResultMessage("เกิดข้อผิดพลาดในระบบ");
      setIsResultOpen(true);
      setTimeout(() => {
        setIsResultOpen(false);
      }, 2000);
    }
  };

  // ✅ [ปรับปรุง] เพิ่ม Scanner Guard ที่แม่นยำขึ้น
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isEditOpen && !isPromoDialogOpen) {
        if (isConfirmOpen) {
          setIsConfirmOpen(false);
        } else {
          handleGlobalReset();
        }
      }

      if (e.key === "Enter") {
        // 🚨 [จุดแก้ไขสำคัญ] หากเครื่องสแกนส่ง Enter มาในขณะที่โฟกัสอยู่ที่ช่องค้นหา หรือระบบกำลังโหลด (isLoading)
        // ให้หยุดการทำงานทันที เพื่อไม่ให้ Enter ทะลุไปกดปิด Dialog ลงทะเบียนที่กำลังจะเด้งขึ้นมา
        if (document.activeElement === searchInputRef.current || isLoading) {
          return;
        }

        if (isConfirmOpen) {
          e.preventDefault();
          handleConfirmTransaction();
        } else if (
          amount &&
          parseFloat(amount) > 0 &&
          memberId &&
          !isEditOpen &&
          !isPromoDialogOpen
        ) {
          if (document.activeElement?.tagName !== "TEXTAREA") {
            e.preventDefault();
            handlePreSubmit();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    amount,
    memberId,
    isConfirmOpen,
    isEditOpen,
    isPromoDialogOpen,
    activeTab,
    selectedPromo,
    note,
    isLoading, // ✅ ตรวจจับสถานะการโหลดเพื่อป้องกันเครื่องสแกนบาร์โค้ด
  ]);

  const handleUpdateSubmit = () => {
    onUpdateMember({ name: editName, phone: editPhone });
    setIsEditOpen(false);
  };

  const addAmount = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toString());
  };

  const clearAmount = () => {
    setAmount("");
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <form onSubmit={handleSearchSubmit} className="flex gap-2 shrink-0">
        <Input
          ref={searchInputRef}
          placeholder="ค้นหาเบอร์โทร / Scan barcode"
          value={keyword}
          onChange={handleKeywordChange}
          className="flex-1 text-base h-10 dark:bg-slate-800 dark:border-slate-700"
          autoFocus
          autoComplete="off"
        />
        <Button
          type="submit"
          size="sm"
          className="h-10 w-10 px-0"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </form>

      <div className="flex justify-end gap-2 shrink-0">
        {memberId && (
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:bg-slate-800 dark:border-slate-700 dark:text-blue-400"
              >
                <UserCog className="h-3.5 w-3.5 mr-1" /> แก้ไขข้อมูล
              </Button>
            </DialogTrigger>
            <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
              <DialogHeader>
                <DialogTitle className="dark:text-white">
                  แก้ไขข้อมูลสมาชิก
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right dark:text-slate-300">ชื่อ</Label>
                  <Input
                    id="name"
                    className="col-span-3 dark:bg-slate-800"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right dark:text-slate-300">
                    เบอร์โทร
                  </Label>
                  <Input
                    id="phone"
                    className="col-span-3 dark:bg-slate-800"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleUpdateSubmit} disabled={isLoading}>
                  บันทึก
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleGlobalReset}
          className="h-8 text-xs text-muted-foreground hover:text-red-500 dark:text-slate-400"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> รีเซ็ตหน้าจอ (Esc)
        </Button>
      </div>

      <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg p-1 border dark:border-slate-700 flex flex-col min-h-0 overflow-hidden">
        <Tabs
          defaultValue="TOPUP"
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as "TOPUP" | "PAYMENT");
            setAmount("");
            setSelectedPromo(null);
          }}
          className="flex flex-col h-full"
        >
          <TabsList className="grid w-full grid-cols-2 h-11 shrink-0 bg-slate-200 dark:bg-slate-800">
            <TabsTrigger
              value="TOPUP"
              className="text-sm data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all"
            >
              <Banknote className="h-4 w-4 mr-2" /> เติมเงิน
            </TabsTrigger>
            <TabsTrigger
              value="PAYMENT"
              className="text-sm data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all"
            >
              <CreditCard className="h-4 w-4 mr-2" /> ชำระเงิน
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="TOPUP"
            className="flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-2 space-y-3">
              <Label className="text-sm font-semibold dark:text-slate-200">
                ระบุจำนวนเงินที่เติม
              </Label>
              <Input
                type="number"
                placeholder="0"
                className="!text-5xl !h-[90px] text-center font-bold text-green-600 tracking-tight leading-none placeholder:text-slate-200 dark:bg-slate-800 dark:border-slate-700"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!memberId}
              />

              <div className="grid grid-cols-4 gap-1.5">
                {[1, 5, 10, 20].map((val) => (
                  <Button
                    key={val}
                    variant="outline"
                    size="sm"
                    onClick={() => addAmount(val)}
                    disabled={!memberId}
                    className="h-8 text-xs font-bold dark:bg-slate-800 dark:border-slate-700"
                  >
                    +{val}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[100, 500, 1000].map((val) => (
                  <Button
                    key={val}
                    variant="outline"
                    size="sm"
                    onClick={() => addAmount(val)}
                    disabled={!memberId}
                    className="h-8 text-xs font-bold dark:bg-slate-800 dark:border-slate-700"
                  >
                    +{val}
                  </Button>
                ))}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearAmount}
                  disabled={!memberId || !amount}
                  className="h-8 text-xs font-bold"
                >
                  <Delete className="h-3.5 w-3.5 mr-1" /> ล้าง
                </Button>
              </div>

              <Input
                placeholder="หมายเหตุ (ถ้ามี)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={!memberId}
                className="h-9 text-sm dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <div className="p-2 border-t dark:border-slate-700 mt-auto shrink-0">
              <Button
                size="lg"
                className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 text-white shadow-md"
                disabled={!memberId || !amount || isLoading}
                onClick={handlePreSubmit}
              >
                ยืนยันเติมเงิน (Enter)
              </Button>
            </div>
          </TabsContent>

          <TabsContent
            value="PAYMENT"
            className="flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-2 space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-bold text-red-600">
                  ระบุยอดชำระสินค้า
                </Label>
                <Dialog
                  open={isPromoDialogOpen}
                  onOpenChange={setIsPromoDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] text-orange-600 border-orange-200 hover:bg-orange-50 gap-1 dark:bg-slate-800 dark:border-slate-700"
                      disabled={!memberId || !amount}
                    >
                      <TicketPercent className="h-3 w-3" />{" "}
                      {selectedPromo ? "เปลี่ยน" : "โปรโมชั่น"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
                    <DialogHeader>
                      <DialogTitle className="dark:text-white">
                        เลือกโปรโมชั่น
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-2 py-4 max-h-[50vh] overflow-y-auto">
                      {promotions.length > 0 ? (
                        promotions.map((promo) => (
                          <div
                            key={promo.promo_id}
                            onClick={() => {
                              setSelectedPromo(promo);
                              setIsPromoDialogOpen(false);
                            }}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-orange-50 cursor-pointer transition-all dark:border-slate-700 dark:hover:bg-slate-800"
                          >
                            <div className="flex items-center gap-2">
                              <Tag className="text-orange-500 h-4 w-4" />
                              <span className="text-sm font-medium dark:text-slate-200">
                                {promo.promo_name}
                              </span>
                            </div>
                            <div className="text-xs font-bold px-2 py-1 bg-white border rounded-full text-slate-700 dark:bg-slate-800 dark:text-white dark:border-slate-600">
                              -฿{promo.discount_value}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-slate-400 py-4 text-xs">
                          ไม่มีโปรโมชั่น
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 mt-2"
                        onClick={() => {
                          setSelectedPromo(null);
                          setIsPromoDialogOpen(false);
                        }}
                      >
                        ไม่ใช้ส่วนลด
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="relative">
                <Input
                  type="number"
                  placeholder="0"
                  className="!text-5xl !h-[90px] text-center font-bold text-red-600 border-red-200 bg-red-50 tracking-tight leading-none placeholder:text-red-100 dark:bg-slate-800 dark:border-red-900"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!memberId}
                />
                {selectedPromo && (
                  <div className="absolute top-2 right-2 animate-in fade-in zoom-in duration-300">
                    <div className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm font-bold flex items-center gap-1">
                      <Tag className="h-2.5 w-2.5" />
                      {selectedPromo.promo_name}
                    </div>
                  </div>
                )}
              </div>
              {selectedPromo && (
                <div className="flex justify-center items-baseline gap-2 py-1">
                  <span className="text-slate-500 text-xs dark:text-slate-400">
                    สุทธิ:
                  </span>
                  <span className="font-bold text-red-600 text-2xl">
                    ฿{getNetAmount().toLocaleString()}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-4 gap-1.5">
                {[1, 5, 10, 20].map((val) => (
                  <Button
                    key={val}
                    variant="outline"
                    size="sm"
                    onClick={() => addAmount(val)}
                    disabled={!memberId}
                    className="h-8 text-xs font-bold dark:bg-slate-800 dark:text-white dark:border-slate-700"
                  >
                    +{val}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[100, 500, 1000].map((val) => (
                  <Button
                    key={val}
                    variant="outline"
                    size="sm"
                    onClick={() => addAmount(val)}
                    disabled={!memberId}
                    className="h-8 text-xs font-bold dark:bg-slate-800 dark:text-white dark:border-slate-700"
                  >
                    +{val}
                  </Button>
                ))}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearAmount}
                  disabled={!memberId || !amount}
                  className="h-8 text-xs font-bold"
                >
                  <Delete className="h-3.5 w-3.5 mr-1" /> ล้าง
                </Button>
              </div>

              <Input
                placeholder="หมายเหตุ (ถ้ามี)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={!memberId}
                className="h-9 text-sm dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <div className="p-2 border-t dark:border-slate-700 mt-auto shrink-0">
              <Button
                size="lg"
                className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 text-white shadow-md"
                disabled={!memberId || !amount || isLoading}
                onClick={handlePreSubmit}
              >
                ยืนยันชำระเงิน (Enter)
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl dark:text-white">
              <AlertTriangle
                className={`h-6 w-6 ${
                  activeTab === "PAYMENT" ? "text-red-600" : "text-green-600"
                }`}
              />
              ยืนยันการทำรายการ
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border dark:border-slate-700">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                รายการ:
              </span>
              <span
                className={`font-bold ${
                  activeTab === "PAYMENT" ? "text-red-600" : "text-green-600"
                }`}
              >
                {activeTab === "TOPUP" ? "เติมเงินเข้าระบบ" : "ชำระค่าสินค้า"}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-dashed dark:border-slate-600 pt-3">
              <span className="text-slate-800 font-medium dark:text-white">
                ยอดสุทธิ:
              </span>
              <span className="font-bold text-3xl dark:text-white">
                ฿
                {(activeTab === "PAYMENT"
                  ? getNetAmount()
                  : parseFloat(amount || "0")
                ).toLocaleString()}
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isLoading}
            >
              ยกเลิก (Esc)
            </Button>
            <Button
              size="sm"
              className={
                activeTab === "PAYMENT" ? "bg-red-600" : "bg-green-600"
              }
              onClick={handleConfirmTransaction}
              disabled={isLoading}
            >
              ยืนยัน (Enter)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent className="sm:max-w-xs text-center flex flex-col items-center justify-center p-6 dark:bg-slate-900 dark:border-slate-800">
          <div
            className={`h-16 w-16 rounded-full flex items-center justify-center mb-3 animate-in zoom-in duration-300 ${
              resultStatus === "SUCCESS" ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {resultStatus === "SUCCESS" ? (
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            ) : (
              <XCircle className="h-10 w-10 text-red-600" />
            )}
          </div>
          <DialogTitle
            className={`text-xl font-bold mb-1 ${
              resultStatus === "SUCCESS" ? "text-green-600" : "text-red-600"
            }`}
          >
            {resultStatus === "SUCCESS" ? "สำเร็จ!" : "ไม่สำเร็จ!"}
          </DialogTitle>
          <p className="text-slate-600 text-sm dark:text-slate-400">
            {resultMessage}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
