// ไฟล์: src/components/pos/action-panel.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  RotateCcw,
  CreditCard,
  Banknote,
  UserCog,
  AlertTriangle,
  Tag,
  TicketPercent,
  CheckCircle2,
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

// Interface
interface Promotion {
  id: string;
  name: string;
  value: number;
}

interface ActionPanelProps {
  onSearch: (keyword: string) => void;
  onConfirm: (type: "TOPUP" | "PAYMENT", amount: number, note: string) => void;
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

  // State สำหรับ Success Popup
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successData, setSuccessData] = useState<{
    type: string;
    amount: number;
    note: string;
  } | null>(null);

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [isPromoDialogOpen, setIsPromoDialogOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load Promotions
  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const res = await fetch(`/api/settings?t=${new Date().getTime()}`);
        const data = await res.json();
        if (data.promotions) {
          setPromotions(data.promotions);
        }
      } catch (error) {
        console.error("Failed to fetch promotions", error);
      }
    };
    fetchPromos();
  }, []);

  // Auto Focus
  useEffect(() => {
    if (!isLoading && !memberId) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, memberId]);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeyword(val);

    // ✅ เพิ่มเงื่อนไข Auto Search:
    // 1. เบอร์โทร (10 หลัก)
    // 2. รหัสบัตร (ขึ้นต้น CF และยาว 7 หลัก) เช่น CF10001
    // 3. บาร์โค้ดทั่วไป (13 หลัก)
    if (
      val.length === 10 ||
      (val.toUpperCase().startsWith("CF") && val.length === 7) ||
      val.length === 13
    ) {
      onSearch(val);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(keyword);
  };

  const getNetAmount = () => {
    const amt = parseFloat(amount) || 0;
    const discount = selectedPromo ? selectedPromo.value : 0;
    return Math.max(0, amt - discount);
  };

  const handlePreSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setIsConfirmOpen(true);
  };

  // ฟังก์ชันยืนยันและแสดง Popup ความสำเร็จ
  const handleConfirmTransaction = async () => {
    const finalAmount =
      activeTab === "PAYMENT" ? getNetAmount() : parseFloat(amount);
    let finalNote = note;
    if (activeTab === "PAYMENT" && selectedPromo) {
      finalNote =
        `${note} [โปรโมชั่น: ${selectedPromo.name} -${selectedPromo.value}บ.]`.trim();
    }

    // 1. ส่งข้อมูลไปทำงาน
    onConfirm(activeTab, finalAmount, finalNote);

    // 2. ปิด Popup ยืนยัน
    setIsConfirmOpen(false);

    // 3. เปิด Popup Success
    setSuccessData({
      type: activeTab,
      amount: finalAmount,
      note: finalNote,
    });
    setIsSuccessOpen(true);
  };

  const handleCloseSuccess = () => {
    setIsSuccessOpen(false);
    setAmount("");
    setSelectedPromo(null);
    setNote("");
  };

  const handleUpdateSubmit = () => {
    onUpdateMember({ name: editName, phone: editPhone });
    setIsEditOpen(false);
  };

  const addAmount = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toString());
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <Input
          ref={searchInputRef}
          placeholder="ค้นหาเบอร์โทร / Scan barcode"
          value={keyword}
          onChange={handleKeywordChange}
          className="flex-1 text-lg h-12 dark:bg-slate-800 dark:border-slate-700"
          autoFocus
        />
        <Button
          type="submit"
          size="lg"
          className="h-12 w-12 px-0"
          disabled={isLoading}
        >
          <Search className="h-5 w-5" />
        </Button>
      </form>

      {/* Control Buttons */}
      <div className="flex justify-end gap-2">
        {memberId && (
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:bg-slate-800 dark:border-slate-700 dark:text-blue-400"
              >
                <UserCog className="h-4 w-4 mr-2" /> แก้ไขข้อมูล
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
                  บันทึกการเปลี่ยนแปลง
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onReset();
            setKeyword("");
            setAmount("");
            setSelectedPromo(null);
            setNote("");
            setTimeout(() => searchInputRef.current?.focus(), 100);
          }}
          className="text-muted-foreground hover:text-red-500 dark:text-slate-400"
        >
          <RotateCcw className="h-4 w-4 mr-2" /> รีเซ็ตหน้าจอ
        </Button>
      </div>

      {/* Transaction Tabs */}
      <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg p-1 border dark:border-slate-700 flex flex-col min-h-0">
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
          <TabsList className="grid w-full grid-cols-2 h-14 shrink-0 bg-slate-200 dark:bg-slate-800">
            <TabsTrigger
              value="TOPUP"
              className="text-base data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all"
            >
              <Banknote className="h-5 w-5 mr-2" /> เติมเงิน (Top-up)
            </TabsTrigger>
            <TabsTrigger
              value="PAYMENT"
              className="text-base data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all"
            >
              <CreditCard className="h-5 w-5 mr-2" /> ชำระเงิน (Pay)
            </TabsTrigger>
          </TabsList>

          {/* TOPUP Content */}
          <TabsContent
            value="TOPUP"
            className="flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden"
          >
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              <Label className="text-lg dark:text-slate-200">
                ระบุจำนวนเงินที่เติม
              </Label>
              <Input
                type="number"
                placeholder="0"
                className="!text-[80px] !h-[120px] text-center font-bold text-green-600 tracking-tight leading-none placeholder:text-slate-200 dark:bg-slate-800 dark:border-slate-700"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!memberId}
              />
              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map((val) => (
                  <Button
                    key={val}
                    variant="outline"
                    onClick={() => addAmount(val)}
                    disabled={!memberId}
                    className="dark:bg-slate-800 dark:text-white dark:border-slate-700"
                  >
                    +{val}
                  </Button>
                ))}
              </div>
              <Input
                placeholder="หมายเหตุ (ถ้ามี)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={!memberId}
                className="dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <div className="p-2 border-t dark:border-slate-700 mt-auto">
              <Button
                size="lg"
                className="w-full h-16 text-xl bg-green-600 hover:bg-green-700 text-white"
                disabled={!memberId || !amount || isLoading}
                onClick={handlePreSubmit}
              >
                ยืนยันเติมเงิน
              </Button>
            </div>
          </TabsContent>

          {/* PAYMENT Content */}
          <TabsContent
            value="PAYMENT"
            className="flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden"
          >
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg text-red-600 font-bold">
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
                      className="text-orange-600 border-orange-200 hover:bg-orange-50 gap-2 dark:bg-slate-800 dark:border-slate-700"
                      disabled={!memberId || !amount}
                    >
                      <TicketPercent className="h-4 w-4" />{" "}
                      {selectedPromo
                        ? "เปลี่ยนโปรโมชั่น"
                        : "เลือกส่วนลด / โปรโมชั่น"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
                    <DialogHeader>
                      <DialogTitle className="dark:text-white">
                        เลือกโปรโมชั่นที่ต้องการ
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-4 max-h-[60vh] overflow-y-auto">
                      {promotions.length > 0 ? (
                        promotions.map((promo) => (
                          <div
                            key={promo.id}
                            onClick={() => {
                              setSelectedPromo(promo);
                              setIsPromoDialogOpen(false);
                            }}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-orange-50 hover:border-orange-300 cursor-pointer transition-all dark:border-slate-700 dark:hover:bg-slate-800"
                          >
                            <div className="flex items-center gap-3">
                              <Tag className="text-orange-500 h-5 w-5" />
                              <span className="font-medium dark:text-slate-200">
                                {promo.name}
                              </span>
                            </div>
                            <div className="text-sm font-bold px-3 py-1 bg-white border rounded-full text-slate-700 dark:bg-slate-800 dark:text-white dark:border-slate-600">
                              -฿{promo.value}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-slate-400 py-4">
                          ไม่มีโปรโมชั่นที่เปิดใช้งาน
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-2"
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
                  className="!text-[80px] !h-[120px] text-center font-bold text-red-600 border-red-200 bg-red-50 tracking-tight leading-none placeholder:text-red-100 dark:bg-slate-800 dark:border-red-900"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!memberId}
                />
                {selectedPromo && (
                  <div className="absolute top-4 right-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-orange-500 text-white text-base px-3 py-1 rounded-full shadow-sm font-bold flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {selectedPromo.name} (-฿{selectedPromo.value})
                    </div>
                  </div>
                )}
              </div>
              {selectedPromo && (
                <div className="flex justify-center items-baseline gap-2 animate-pulse">
                  <span className="text-slate-500 text-lg dark:text-slate-400">
                    ยอดชำระสุทธิ:
                  </span>
                  <span className="font-bold text-red-600 text-4xl">
                    ฿{getNetAmount().toLocaleString()}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map((val) => (
                  <Button
                    key={val}
                    variant="outline"
                    onClick={() => addAmount(val)}
                    disabled={!memberId}
                    className="hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                  >
                    +{val}
                  </Button>
                ))}
              </div>
              <Input
                placeholder="หมายเหตุ (ถ้ามี)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={!memberId}
                className="dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <div className="p-2 border-t dark:border-slate-700 mt-auto">
              <Button
                size="lg"
                className="w-full h-16 text-xl bg-red-600 hover:bg-red-700 text-white"
                disabled={!memberId || !amount || isLoading}
                onClick={handlePreSubmit}
              >
                ยืนยันชำระเงิน{" "}
                {selectedPromo ? `(฿${getNetAmount().toLocaleString()})` : ""}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* --- 1. Confirm Dialog --- */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl dark:text-white">
              <AlertTriangle
                className={`h-8 w-8 ${
                  activeTab === "PAYMENT" ? "text-red-600" : "text-green-600"
                }`}
              />
              ยืนยันการทำรายการ
            </DialogTitle>
            <DialogDescription className="text-lg pt-2 dark:text-slate-400">
              กรุณาตรวจสอบยอดเงินก่อนยืนยัน
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6 bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border dark:border-slate-700">
            <div className="flex justify-between items-center text-lg">
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
            <div className="space-y-1 border-t border-dashed dark:border-slate-600 pt-4 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-800 font-medium text-xl dark:text-white">
                  ยอดสุทธิ:
                </span>
                <span className="font-bold text-4xl dark:text-white">
                  ฿
                  {activeTab === "PAYMENT"
                    ? getNetAmount().toLocaleString()
                    : parseFloat(amount || "0").toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsConfirmOpen(false)}
              className="h-12 text-lg dark:bg-slate-800 dark:text-white"
            >
              ยกเลิก
            </Button>
            <Button
              size="lg"
              className={`h-12 text-lg ${
                activeTab === "PAYMENT"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              } text-white`}
              onClick={handleConfirmTransaction}
            >
              ยืนยันทำรายการ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- 2. ✅ SUCCESS Dialog --- */}
      <Dialog open={isSuccessOpen} onOpenChange={handleCloseSuccess}>
        <DialogContent className="sm:max-w-md text-center flex flex-col items-center justify-center p-10 dark:bg-slate-900 dark:border-slate-800">
          <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>

          <DialogTitle className="text-3xl font-bold text-green-600 mb-2 text-center">
            ทำรายการสำเร็จ!
          </DialogTitle>

          <p className="text-slate-500 text-lg mb-6 dark:text-slate-400">
            บันทึกข้อมูลเรียบร้อยแล้ว
          </p>

          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl w-full mb-6 border dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 mb-1">
              {successData?.type === "TOPUP" ? "ยอดเติมเงิน" : "ยอดชำระเงิน"}
            </div>
            <div
              className={`text-5xl font-bold ${
                successData?.type === "TOPUP"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              ฿{successData?.amount.toLocaleString()}
            </div>
            {successData?.note && (
              <div className="mt-4 pt-4 border-t border-dashed text-slate-600 dark:text-slate-400 text-sm">
                {successData.note}
              </div>
            )}
          </div>

          <Button
            size="lg"
            className="w-full h-14 text-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            onClick={handleCloseSuccess}
          >
            ปิดหน้าต่าง
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
