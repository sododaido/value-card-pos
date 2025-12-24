// ไฟล์: src/components/pos/pos-header.tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Store,
  UserPlus,
  LayoutDashboard,
  Settings,
  BarChart3,
  Save,
  Plus,
  Trash2,
  Crown,
  Tag,
  RefreshCcw,
  Wallet,
  CreditCard,
  Users,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// --- Types ---
interface ChartDataPoint {
  name: string;
  topup: number;
  payment: number;
}

interface DashboardData {
  period: string;
  topupToday: number;
  paymentToday: number;
  newMembers: number;
  chartData: ChartDataPoint[];
}

interface StoreSetting {
  name: string;
  branch: string;
  isPointSystem: boolean;
}

interface Promotion {
  id?: string;
  name: string;
  value: number;
  type: string;
}

interface Tier {
  id?: string;
  name: string;
  minSpend: number;
  multiplier: number;
  color: string;
}

export function POSHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Dashboard State
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoadingDash, setIsLoadingDash] = useState(false);
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // ✅ ปรับ useState: เริ่มต้นเป็นค่าว่าง รอโหลดข้อมูลจาก DB
  const [setting, setSetting] = useState<StoreSetting>({
    name: "",
    branch: "",
    isPointSystem: true,
  });
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  // Register State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regData, setRegData] = useState({ name: "", phone: "" });
  const [isRegLoading, setIsRegLoading] = useState(false);

  // --- Effects ---

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dashboard Real-time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDashboardOpen) {
      fetchDashboard();
      interval = setInterval(() => {
        fetchDashboard();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isDashboardOpen, period]);

  // ✅ เพิ่ม useEffect: โหลดข้อมูลร้านค้าทันทีที่เปิดหน้าเว็บ
  useEffect(() => {
    fetchSettings();
  }, []);

  // Load Settings on Open
  useEffect(() => {
    if (isSettingsOpen) fetchSettings();
  }, [isSettingsOpen]);

  // --- Functions ---

  const fetchDashboard = async () => {
    if (!dashboardData) setIsLoadingDash(true);
    try {
      const res = await fetch(
        `/api/dashboard?period=${period}&t=${new Date().getTime()}`
      );
      if (!res.ok) {
        console.error("Dashboard API Error:", res.status, res.statusText);
        return;
      }
      const text = await res.text();
      if (!text) return;
      const data = JSON.parse(text);
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setIsLoadingDash(false);
    }
  };

  const fetchSettings = async () => {
    // ไม่ต้อง set loading นานถ้าเป็นการโหลดเบื้องหลัง
    try {
      const res = await fetch(`/api/settings?t=${new Date().getTime()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.setting) {
          setSetting({
            name: data.setting.name || "POS System",
            branch: data.setting.branch || "Staff Panel",
            isPointSystem: data.setting.isPointSystem,
          });
        }
        if (data.promotions) setPromotions(data.promotions);
        if (data.tiers) setTiers(data.tiers);
      }
    } catch (error) {
      console.error("Settings Load Error:", error);
      // toast.error("โหลดการตั้งค่าไม่สำเร็จ"); // ไม่จำเป็นต้องแจ้งเตือนถ้ารีเฟรชหน้าเฉยๆ
    }
  };

  const saveSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setting, promotions, tiers }),
      });
      if (!res.ok) throw new Error();
      toast.success("บันทึกการตั้งค่าเรียบร้อยแล้ว");
      setIsSettingsOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast.error("บันทึกไม่สำเร็จ");
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleRegister = async () => {
    if (!regData.name || !regData.phone)
      return toast.error("กรุณากรอกข้อมูลให้ครบ");
    setIsRegLoading(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`สมัครสำเร็จ! รหัส: ${data.card_id}`);
      setIsRegisterOpen(false);
      setRegData({ name: "", phone: "" });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsRegLoading(false);
    }
  };

  const addPromo = () => {
    setPromotions([
      ...promotions,
      { name: "ส่วนลดใหม่", value: 0, type: "fixed" },
    ]);
  };

  const removePromo = (index: number) => {
    const newPromos = [...promotions];
    newPromos.splice(index, 1);
    setPromotions(newPromos);
  };

  const updatePromo = (
    index: number,
    field: keyof Promotion,
    val: string | number
  ) => {
    setPromotions((prevPromos) => {
      const newPromos = [...prevPromos];
      newPromos[index] = { ...newPromos[index], [field]: val } as Promotion;
      return newPromos;
    });
  };

  const updateTier = (
    index: number,
    field: keyof Tier,
    val: string | number
  ) => {
    setTiers((prevTiers) => {
      const newTiers = [...prevTiers];
      newTiers[index] = { ...newTiers[index], [field]: val } as Tier;
      return newTiers;
    });
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "week":
        return "สัปดาห์นี้";
      case "month":
        return "เดือนนี้";
      default:
        return "วันนี้";
    }
  };

  return (
    <>
      <header className="h-16 border-b bg-white dark:bg-slate-900 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg shadow-blue-900/20 shadow-lg">
            <Store className="h-5 w-5 text-white" />
          </div>
          <div>
            {/* แสดงชื่อร้านจาก State (ถ้าว่าง แสดง POS System) */}
            <h1 className="font-bold text-lg leading-none text-slate-800 dark:text-slate-100">
              {setting.name || "POS System"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {setting.branch || "Staff Panel"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* ปุ่มสลับ Theme */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 mr-2"
            >
              {theme === "dark" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDashboardOpen(true)}
            className="text-slate-600 hover:text-blue-600 dark:text-slate-300 hidden sm:flex"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" /> แดชบอร์ด
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="text-slate-600 hover:text-blue-600 dark:text-slate-300 hidden sm:flex"
          >
            <Settings className="h-4 w-4 mr-2" /> ตั้งค่า
          </Button>

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

          <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                <UserPlus className="h-4 w-4" /> New Member
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-slate-900 dark:border-slate-800">
              <DialogHeader>
                <DialogTitle className="dark:text-white">
                  ลงทะเบียนสมาชิกใหม่
                </DialogTitle>
                <DialogDescription>
                  กรอกข้อมูลลูกค้าเพื่อสร้างบัญชี
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label className="dark:text-slate-200">ชื่อ</Label>
                  <Input
                    value={regData.name}
                    onChange={(e) =>
                      setRegData({ ...regData, name: e.target.value })
                    }
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="dark:text-slate-200">เบอร์โทรศัพท์</Label>
                  <Input
                    value={regData.phone}
                    onChange={(e) =>
                      setRegData({ ...regData, phone: e.target.value })
                    }
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsRegisterOpen(false)}
                  className="dark:bg-slate-800 dark:text-white dark:border-slate-700"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleRegister}
                  disabled={isRegLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  ยืนยัน
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* --- DASHBOARD POPUP --- */}
      <Dialog open={isDashboardOpen} onOpenChange={setIsDashboardOpen}>
        <DialogContent className="!max-w-[98vw] !w-[98vw] !h-[95vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950 dark:border-slate-800">
          <DialogHeader className="px-6 py-4 border-b bg-slate-50 dark:bg-slate-900 dark:border-slate-800 flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-2xl text-slate-800 dark:text-white">
              <BarChart3 className="text-blue-600 h-6 w-6" /> แดชบอร์ดภาพรวม (
              {getPeriodLabel()})
            </DialogTitle>

            <div className="flex gap-2">
              <div className="flex bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-1 shadow-sm">
                <button
                  onClick={() => setPeriod("today")}
                  className={`px-3 py-1 text-sm rounded-md transition-all ${
                    period === "today"
                      ? "bg-blue-100 text-blue-700 font-bold dark:bg-blue-900 dark:text-blue-200"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
                  }`}
                >
                  วันนี้
                </button>
                <button
                  onClick={() => setPeriod("week")}
                  className={`px-3 py-1 text-sm rounded-md transition-all ${
                    period === "week"
                      ? "bg-blue-100 text-blue-700 font-bold dark:bg-blue-900 dark:text-blue-200"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
                  }`}
                >
                  สัปดาห์นี้
                </button>
                <button
                  onClick={() => setPeriod("month")}
                  className={`px-3 py-1 text-sm rounded-md transition-all ${
                    period === "month"
                      ? "bg-blue-100 text-blue-700 font-bold dark:bg-blue-900 dark:text-blue-200"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
                  }`}
                >
                  เดือนนี้
                </button>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchDashboard()}
                disabled={isLoadingDash}
                className="dark:bg-slate-800 dark:text-white dark:border-slate-700"
              >
                <RefreshCcw
                  className={`h-4 w-4 mr-2 ${
                    isLoadingDash ? "animate-spin" : ""
                  }`}
                />
                {isLoadingDash ? "Updating..." : "อัปเดต"}
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
            {dashboardData ? (
              <div className="h-full flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1 */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Wallet className="w-24 h-24 text-green-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        ยอดเติมเงิน ({getPeriodLabel()})
                      </p>
                    </div>
                    <h3 className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">
                      ฿{dashboardData.topupToday?.toLocaleString() ?? "0"}
                    </h3>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <CreditCard className="w-24 h-24 text-red-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        ยอดชำระเงิน ({getPeriodLabel()})
                      </p>
                    </div>
                    <h3 className="text-4xl font-bold text-red-600 dark:text-red-400 mt-2">
                      ฿{dashboardData.paymentToday?.toLocaleString() ?? "0"}
                    </h3>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Users className="w-24 h-24 text-blue-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        สมาชิกใหม่ ({getPeriodLabel()})
                      </p>
                    </div>
                    <h3 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                      {dashboardData.newMembers ?? 0} คน
                    </h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex-1 min-h-[400px]">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">
                    แนวโน้ม 7 วันย้อนหลัง
                  </h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <LineChart data={dashboardData.chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                        opacity={0.1}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          backgroundColor: "var(--tooltip-bg, #fff)",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="topup"
                        name="ยอดเติมเงิน"
                        stroke="#16a34a"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#16a34a" }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="payment"
                        name="ยอดชำระเงิน"
                        stroke="#dc2626"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#dc2626" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                กำลังโหลดข้อมูล...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- SETTINGS POPUP --- */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-[800px] max-h-[90vh] flex flex-col p-0 bg-white dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader className="px-6 py-4 border-b dark:border-slate-800">
            <DialogTitle className="flex items-center gap-2 text-xl text-slate-800 dark:text-white">
              <Settings className="text-slate-600 dark:text-slate-300" />{" "}
              ตั้งค่าระบบ
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 dark:bg-slate-800">
                <TabsTrigger value="general"> ข้อมูลร้านค้า</TabsTrigger>
                <TabsTrigger value="promotions"> โปรโมชั่น</TabsTrigger>
                <TabsTrigger value="tiers"> ระดับสมาชิก</TabsTrigger>
              </TabsList>

              {/* Tab 1: General */}
              <TabsContent value="general" className="space-y-6">
                <div className="grid gap-4 border dark:border-slate-700 p-4 rounded-lg bg-white dark:bg-slate-800">
                  <h3 className="font-medium text-slate-800 dark:text-slate-200">
                    ข้อมูลพื้นฐาน
                  </h3>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right dark:text-slate-300">
                      ชื่อร้าน
                    </Label>
                    <Input
                      className="col-span-3 dark:bg-slate-700 dark:border-slate-600"
                      value={setting.name}
                      onChange={(e) =>
                        setSetting({ ...setting, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right dark:text-slate-300">
                      สาขา
                    </Label>
                    <Input
                      className="col-span-3 dark:bg-slate-700 dark:border-slate-600"
                      value={setting.branch}
                      onChange={(e) =>
                        setSetting({ ...setting, branch: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 border dark:border-slate-700 p-4 rounded-lg bg-white dark:bg-slate-800">
                  <h3 className="font-medium text-slate-800 dark:text-slate-200">
                    การทำงาน
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold dark:text-slate-200">
                        ระบบสะสมแต้ม
                      </Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {setting.isPointSystem
                          ? "เปิดใช้งาน (ลูกค้าจะได้รับแต้มเมื่อเติมเงิน)"
                          : "ปิดใช้งาน (ลูกค้าจะไม่ได้รับแต้ม)"}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={setting.isPointSystem}
                        onChange={(e) =>
                          setSetting({
                            ...setting,
                            isPointSystem: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Promotions */}
              <TabsContent value="promotions" className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    กำหนดส่วนลดที่จะแสดงในหน้าชำระเงิน
                  </p>
                  <Button
                    size="sm"
                    onClick={addPromo}
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="h-4 w-4" /> เพิ่มโปรโมชั่น
                  </Button>
                </div>
                <div className="space-y-2">
                  {promotions.map((promo, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 items-center p-3 border dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                    >
                      <Tag className="h-5 w-5 text-orange-500" />
                      <Input
                        placeholder="ชื่อโปรโมชั่น"
                        value={promo.name}
                        onChange={(e) =>
                          updatePromo(idx, "name", e.target.value)
                        }
                        className="flex-1 dark:bg-slate-700 dark:border-slate-600"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          ลด (บาท)
                        </span>
                        <Input
                          type="number"
                          className="w-24 font-bold text-red-500 dark:bg-slate-700 dark:border-slate-600"
                          value={promo.value}
                          onChange={(e) =>
                            updatePromo(idx, "value", Number(e.target.value))
                          }
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-slate-700"
                        onClick={() => removePromo(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Tab 3: Tiers */}
              <TabsContent value="tiers" className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  กำหนดเกณฑ์ยอดสะสมเพื่อเลื่อนขั้นสมาชิก
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="border dark:border-slate-700 p-4 rounded-xl relative overflow-hidden bg-white dark:bg-slate-800"
                      style={{ borderTop: `4px solid ${tier.color}` }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Crown
                          className="h-5 w-5"
                          style={{ color: tier.color }}
                        />
                        <Input
                          value={tier.name}
                          onChange={(e) =>
                            updateTier(idx, "name", e.target.value)
                          }
                          className="font-bold border-none h-8 px-0 text-lg bg-transparent dark:text-white"
                        />
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-slate-500 dark:text-slate-400">
                            ยอดสะสมขั้นต่ำ
                          </Label>
                          <Input
                            type="number"
                            value={tier.minSpend}
                            onChange={(e) =>
                              updateTier(
                                idx,
                                "minSpend",
                                Number(e.target.value)
                              )
                            }
                            className="dark:bg-slate-700 dark:border-slate-600"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-500 dark:text-slate-400">
                            ตัวคูณแต้ม
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={tier.multiplier}
                            onChange={(e) =>
                              updateTier(
                                idx,
                                "multiplier",
                                Number(e.target.value)
                              )
                            }
                            className="dark:bg-slate-700 dark:border-slate-600"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-500 dark:text-slate-400">
                            สีธีม (Hex)
                          </Label>
                          <div className="flex gap-2">
                            <div
                              className="w-8 h-8 rounded border shadow-sm"
                              style={{ backgroundColor: tier.color }}
                            ></div>
                            <Input
                              value={tier.color}
                              onChange={(e) =>
                                updateTier(idx, "color", e.target.value)
                              }
                              className="uppercase dark:bg-slate-700 dark:border-slate-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <Button
              variant="outline"
              onClick={() => setIsSettingsOpen(false)}
              className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={saveSettings}
              disabled={isLoadingSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Save className="h-4 w-4" /> บันทึกการตั้งค่า
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
