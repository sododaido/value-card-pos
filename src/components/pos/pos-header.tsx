"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  Store,
  UserPlus,
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
  Loader2,
  TrendingUp,
  History,
  PieChart,
  // ✅ เพิ่มไอคอน Gauge ตามรูปภาพที่เเนบมา
  Gauge,
  BarChartHorizontal,
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
  promo_id?: string;
  promo_name: string;
  discount_value: number;
  discount_type: "FIXED" | "PERCENT";
  is_active: boolean;
}

interface APIPromotion {
  promo_id?: string;
  promo_name?: string;
  name?: string;
  discount_value?: number;
  value?: number;
  discount_type?: "FIXED" | "PERCENT";
  is_active?: boolean;
}

interface APITier {
  id?: string | number;
  name?: string;
  minSpend?: string | number;
  multiplier?: string | number;
  color?: string;
}

interface Tier {
  id?: string;
  name: string;
  minSpend: number;
  multiplier: number;
  color: string;
}

interface POSHeaderProps {
  onMemberRegistered?: (cardId: string) => void;
}

export function POSHeader({ onMemberRegistered }: POSHeaderProps) {
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
  const [setting, setSetting] = useState<StoreSetting>({
    name: "POS System",
    branch: "Staff Panel",
    isPointSystem: true,
  });
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  // Register State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regData, setRegData] = useState({ name: "", phone: "" });
  const [isRegLoading, setIsRegLoading] = useState(false);

  // --- Functions ---

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/settings?t=${new Date().getTime()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.setting) {
          setSetting({
            name: data.setting.name || "POS System",
            branch: data.setting.branch || "Staff Panel",
            isPointSystem: data.setting.isPointSystem ?? true,
          });
        }

        if (data.promotions) {
          setPromotions(
            data.promotions.map((p: APIPromotion) => ({
              promo_id: p.promo_id,
              promo_name: p.promo_name || p.name || "โปรโมชั่นไม่มีชื่อ",
              discount_value: p.discount_value || p.value || 0,
              discount_type: p.discount_type || "FIXED",
              is_active: p.is_active ?? true,
            }))
          );
        }

        if (data.tiers && Array.isArray(data.tiers)) {
          const uniqueTiers = data.tiers.map((t: APITier) => ({
            id: String(t.id || ""),
            name: t.name || "ระดับใหม่",
            minSpend: Number(t.minSpend || 0),
            multiplier: Number(t.multiplier || 1),
            color: t.color || "#3b82f6",
          }));
          setTiers(uniqueTiers);
        }
      }
    } catch (error) {
      console.error("Settings Load Error:", error);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    if (!dashboardData) setIsLoadingDash(true);
    try {
      const res = await fetch(
        `/api/dashboard?period=${period}&t=${new Date().getTime()}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setIsLoadingDash(false);
    }
  }, [dashboardData, period]);

  // --- Effects ---

  useEffect(() => {
    setMounted(true);
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDashboardOpen) {
      fetchDashboard();
      interval = setInterval(fetchDashboard, 5000);
    }
    return () => clearInterval(interval);
  }, [isDashboardOpen, fetchDashboard]);

  // --- Action Handlers ---

  const saveSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setting,
          promotions: promotions.map((p) => ({
            name: p.promo_name,
            value: p.discount_value,
          })),
          tiers,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("บันทึกการตั้งค่าเรียบร้อยแล้ว");
      setIsSettingsOpen(false);
      await fetchSettings();
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
      toast.success(`สมัครสมาชิกสำเร็จ! รหัสบัตร: ${data.card_id}`);
      setIsRegisterOpen(false);
      if (onMemberRegistered && data.card_id) {
        onMemberRegistered(data.card_id);
      }
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
      {
        promo_name: "ส่วนลดใหม่",
        discount_value: 0,
        discount_type: "FIXED",
        is_active: true,
      },
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
    val: string | number | boolean
  ) => {
    const newPromos = [...promotions];
    newPromos[index] = { ...newPromos[index], [field]: val } as Promotion;
    setPromotions(newPromos);
  };

  const updateTier = (
    index: number,
    field: keyof Tier,
    val: string | number
  ) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: val } as Tier;
    setTiers(newTiers);
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

  if (!mounted) return null;

  return (
    <>
      <header className="h-14 border-b bg-white dark:bg-slate-900 dark:border-slate-800 px-4 flex items-center justify-between sticky top-0 z-10 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2">
          {/* ✅ ไอคอนระบบรูป CreditCard */}
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-blue-900/20 shadow-lg">
            <CreditCard className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none text-slate-800 dark:text-slate-100">
              {setting.name}
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {setting.branch}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          {/* ✅ สวิตช์สลับโหมด Sun/Moon */}
          <div className="flex items-center gap-2 mr-1">
            <Sun
              className={`h-3.5 w-3.5 ${
                theme === "dark" ? "text-slate-500" : "text-amber-500"
              }`}
            />
            <label className="relative inline-flex items-center cursor-pointer scale-90">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={theme === "dark"}
                onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <Moon
              className={`h-3.5 w-3.5 ${
                theme === "dark" ? "text-blue-400" : "text-slate-500"
              }`}
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDashboardOpen(true)}
            // ✅ เปลี่ยนไอคอนแดชบอร์ดให้เป็นรูป Gauge ตามความต้องการ
            className="h-8 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-blue-600 dark:text-slate-300 hidden sm:flex gap-2"
          >
            <Gauge className="h-4 w-4" /> Dashboard
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="h-8 text-xs text-slate-600 hover:text-blue-600 dark:text-slate-300 hidden sm:flex"
          >
            <Settings className="h-3.5 w-3.5 mr-1.5" /> ตั้งค่า
          </Button>

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

          <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              >
                <UserPlus className="h-3.5 w-3.5" /> New Member
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
                  size="sm"
                  onClick={() => setIsRegisterOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  size="sm"
                  onClick={handleRegister}
                  disabled={isRegLoading}
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
        <DialogContent className="!max-w-[98vw] !w-[98vw] !h-[95vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950 dark:border-slate-800 rounded-[2rem]">
          <DialogHeader className="px-6 py-4 border-b bg-white dark:bg-slate-900 dark:border-slate-800 flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl text-slate-800 dark:text-white font-black uppercase tracking-tight">
              {/* ✅ เปลี่ยนไอคอนแดชบอร์ดหลักเป็น BarChartHorizontal เพื่อความมืออาชีพ */}
              <BarChartHorizontal className="text-blue-600 h-6 w-6" /> Analytics
              Dashboard
            </DialogTitle>
            <div className="flex gap-2">
              <div className="flex bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-0.5 shadow-sm">
                {(["today", "week", "month"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${
                      period === p
                        ? "bg-slate-900 text-white dark:bg-blue-600"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
                    }`}
                  >
                    {p === "today"
                      ? "Today"
                      : p === "week"
                      ? "Weekly"
                      : "Monthly"}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-9 text-[10px] font-black uppercase tracking-widest border-slate-200 dark:border-slate-700 rounded-xl"
                onClick={fetchDashboard}
                disabled={isLoadingDash}
              >
                <RefreshCcw
                  className={`h-3 w-3 mr-2 ${
                    isLoadingDash ? "animate-spin" : ""
                  }`}
                />
                Sync
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
            {dashboardData ? (
              <div className="h-full flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DashboardCard
                    icon={<PieChart />}
                    label={`Gross Topup (${getPeriodLabel()})`}
                    value={dashboardData.topupToday}
                    color="green"
                  />
                  <DashboardCard
                    icon={<History />}
                    label={`Gross Payment (${getPeriodLabel()})`}
                    value={dashboardData.paymentToday}
                    color="red"
                  />
                  <DashboardCard
                    icon={<Users />}
                    label={`Member Growth (${getPeriodLabel()})`}
                    value={dashboardData.newMembers}
                    color="blue"
                    unit="คน"
                  />
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex-1 min-h-[350px]">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
                      Performance Metrics Overview
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Inflow
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Outflow
                        </span>
                      </div>
                    </div>
                  </div>
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
                        tick={{
                          fill: "#94a3b8",
                          fontSize: 10,
                          fontWeight: "bold",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{
                          fill: "#94a3b8",
                          fontSize: 10,
                          fontWeight: "bold",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "20px",
                          border: "none",
                          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                          fontSize: "12px",
                          fontWeight: "bold",
                          padding: "12px 20px",
                        }}
                      />
                      <Legend
                        wrapperStyle={{
                          display: "none", // ซ่อนเพื่อใช้ Legend ที่สร้างเองด้านบน
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="topup"
                        name="Topup"
                        stroke="#10b981"
                        strokeWidth={4}
                        dot={{
                          r: 0, // ซ่อน dot ปกติเพื่อให้ดูคลีนขึ้น
                        }}
                        activeDot={{
                          r: 6,
                          fill: "#10b981",
                          strokeWidth: 3,
                          stroke: "#fff",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="payment"
                        name="Payment"
                        stroke="#f43f5e"
                        strokeWidth={4}
                        dot={{
                          r: 0,
                        }}
                        activeDot={{
                          r: 6,
                          fill: "#f43f5e",
                          strokeWidth: 3,
                          stroke: "#fff",
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-[10px] font-black uppercase tracking-widest italic">
                  Synchronizing Business Intelligence...
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- SETTINGS POPUP --- */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-[800px] max-h-[90vh] flex flex-col p-0 bg-white dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <DialogTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-white uppercase font-black tracking-widest">
              <Settings className="h-5 w-5 text-blue-600" /> System
              Configuration
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 dark:bg-slate-800 h-10 p-1 rounded-xl">
                <TabsTrigger
                  value="general"
                  className="text-xs font-bold rounded-lg"
                >
                  General Info
                </TabsTrigger>
                <TabsTrigger
                  value="promotions"
                  className="text-xs font-bold rounded-lg"
                >
                  Marketing
                </TabsTrigger>
                <TabsTrigger
                  value="tiers"
                  className="text-xs font-bold rounded-lg"
                >
                  Membership
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid gap-3 border dark:border-slate-700 p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Identity
                  </h3>
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label className="text-right text-xs font-bold dark:text-slate-300">
                      Store Name
                    </Label>
                    <Input
                      className="col-span-3 h-9 text-xs dark:bg-slate-700 dark:border-slate-600 rounded-lg"
                      value={setting.name}
                      onChange={(e) =>
                        setSetting({ ...setting, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label className="text-right text-xs font-bold dark:text-slate-300">
                      Location
                    </Label>
                    <Input
                      className="col-span-3 h-9 text-xs dark:bg-slate-700 dark:border-slate-600 rounded-lg"
                      value={setting.branch}
                      onChange={(e) =>
                        setSetting({ ...setting, branch: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-3 border dark:border-slate-700 p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Feature Controls
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-bold dark:text-slate-200">
                        Loyalty Points System
                      </Label>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium italic">
                        Enable automatic point calculation for every payment
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
                      <div className="w-10 h-5.5 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="promotions" className="space-y-3">
                <div className="flex justify-between items-center mb-1 px-1">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Campaigns
                  </h3>
                  <Button
                    size="sm"
                    onClick={addPromo}
                    className="h-8 text-xs gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-lg"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add New
                  </Button>
                </div>
                <div className="space-y-2">
                  {promotions.map((promo, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 items-center p-3 border dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 shadow-inner"
                    >
                      <Tag className="h-4 w-4 text-blue-600" />
                      <Input
                        placeholder="Promo Name"
                        value={promo.promo_name}
                        onChange={(e) =>
                          updatePromo(idx, "promo_name", e.target.value)
                        }
                        className="flex-1 h-9 text-xs font-bold"
                      />
                      <Input
                        type="number"
                        className="w-24 h-9 font-black text-blue-600 text-xs text-right bg-white"
                        value={promo.discount_value}
                        onChange={(e) =>
                          updatePromo(
                            idx,
                            "discount_value",
                            Number(e.target.value)
                          )
                        }
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50"
                        onClick={() => removePromo(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="tiers" className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                  Membership Tiers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {tiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="border dark:border-slate-700 p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm"
                      style={{ borderTop: `4px solid ${tier.color}` }}
                    >
                      <div className="flex items-center gap-1.5 mb-4">
                        <Crown
                          className="h-5 w-5"
                          style={{ color: tier.color }}
                        />
                        <Input
                          value={tier.name}
                          onChange={(e) =>
                            updateTier(idx, "name", e.target.value)
                          }
                          className="font-black border-none h-6 px-0 text-sm bg-transparent uppercase tracking-wider"
                        />
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Min Accumulate
                          </Label>
                          <Input
                            type="number"
                            className="h-8 text-xs font-bold mt-1"
                            value={tier.minSpend}
                            onChange={(e) =>
                              updateTier(
                                idx,
                                "minSpend",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Points Multiplier
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            className="h-8 text-xs font-bold mt-1"
                            value={tier.multiplier}
                            onChange={(e) =>
                              updateTier(
                                idx,
                                "multiplier",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Theme Hex
                          </Label>
                          <div className="flex gap-2 mt-1">
                            <div
                              className="w-8 h-8 rounded-lg border shadow-sm shrink-0"
                              style={{ backgroundColor: tier.color }}
                            ></div>
                            <Input
                              value={tier.color}
                              onChange={(e) =>
                                updateTier(idx, "color", e.target.value)
                              }
                              className="uppercase h-8 text-xs font-mono font-bold"
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

          <DialogFooter className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSettingsOpen(false)}
              className="text-slate-500 font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={saveSettings}
              disabled={isLoadingSettings}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 font-bold shadow-lg px-6 rounded-xl"
            >
              {isLoadingSettings ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}{" "}
              Deploy Config
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface DashboardCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "green" | "red" | "blue";
  unit?: string;
}

function DashboardCard({
  icon,
  label,
  value,
  color,
  unit = "",
}: DashboardCardProps) {
  const colorClasses = {
    green:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
    red: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 border-rose-100 dark:border-rose-800",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800",
  };
  const selectedColor = colorClasses[color].split(" ");
  return (
    <div
      className={`bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] shadow-sm border ${selectedColor[4]} relative overflow-hidden group hover:shadow-lg transition-all`}
    >
      <div className="flex items-center gap-4 mb-3">
        <div
          className={`p-3 rounded-2xl ${selectedColor[0]} ${selectedColor[2]}`}
        >
          {React.isValidElement(icon)
            ? React.cloneElement(
                icon as React.ReactElement<React.SVGProps<SVGSVGElement>>,
                {
                  className: `h-6 w-6 ${selectedColor[1]} ${selectedColor[3]}`,
                }
              )
            : icon}
        </div>
        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
          {label}
        </p>
      </div>
      <h3
        className={`text-3xl font-black tracking-tighter ${selectedColor[1]} ${selectedColor[3]}`}
      >
        {unit === "฿" || unit === ""
          ? `฿${value.toLocaleString()}`
          : `${value.toLocaleString()} ${unit}`}
      </h3>
      <div
        className={`absolute bottom-0 right-0 w-24 h-24 ${selectedColor[1]} opacity-[0.02] -mr-6 -mb-6 group-hover:scale-110 transition-transform`}
      >
        {React.isValidElement(icon) &&
          React.cloneElement(
            icon as React.ReactElement<React.SVGProps<SVGSVGElement>>,
            {
              className: "w-full h-full",
            }
          )}
      </div>
    </div>
  );
}
