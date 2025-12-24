// ไฟล์: src/components/layout/sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  History,
  Settings,
  LogOut,
  CreditCard,
  BarChart3,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Import กราฟจาก Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Mock Data: ข้อมูลสำหรับกราฟ (ยอดขาย 7 วันย้อนหลัง)
const MOCK_CHART_DATA = [
  { name: "จันทร์", ยอดขาย: 4000, ลูกค้า: 24 },
  { name: "อังคาร", ยอดขาย: 3000, ลูกค้า: 18 },
  { name: "พุธ", ยอดขาย: 2000, ลูกค้า: 15 },
  { name: "พฤหัส", ยอดขาย: 2780, ลูกค้า: 20 },
  { name: "ศุกร์", ยอดขาย: 1890, ลูกค้า: 12 },
  { name: "เสาร์", ยอดขาย: 6390, ลูกค้า: 45 },
  { name: "อาทิตย์", ยอดขาย: 3490, ลูกค้า: 30 },
];

export function Sidebar() {
  const pathname = usePathname();

  // State สำหรับเปิด/ปิด Pop-up
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // เมนูทั้งหมด
  const menuItems = [
    {
      title: "แดชบอร์ด",
      icon: LayoutDashboard,
      action: () => setIsDashboardOpen(true), // เปิด Pop-up
      isActive: isDashboardOpen,
    },
    {
      title: "จุดขาย (POS)",
      href: "/pos", // เปลี่ยนหน้า
      icon: Store,
      isActive: pathname === "/pos",
    },
    {
      title: "ประวัติรายการ",
      href: "/history", // เปลี่ยนหน้า
      icon: History,
      isActive: pathname === "/history",
    },
    {
      title: "ตั้งค่าระบบ",
      icon: Settings,
      action: () => setIsSettingsOpen(true), // เปิด Pop-up
      isActive: isSettingsOpen,
    },
  ];

  return (
    <>
      <div className="flex h-full w-64 flex-col bg-slate-900 text-white shadow-xl">
        {/* Logo Section */}
        <div className="flex h-16 items-center justify-center border-b border-slate-800 px-6 bg-slate-950">
          <CreditCard className="mr-2 h-6 w-6 text-blue-500" />
          <span className="text-xl font-bold tracking-tight">POS System</span>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1.5 px-3">
            {menuItems.map((item, index) => {
              const baseClass = cn(
                "group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                item.isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              );

              // ถ้ามี href ให้ใช้ Link (เปลี่ยนหน้า)
              if ("href" in item && item.href) {
                return (
                  <Link key={index} href={item.href} className={baseClass}>
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 transition-colors",
                        item.isActive
                          ? "text-white"
                          : "text-slate-500 group-hover:text-white"
                      )}
                    />
                    {item.title}
                  </Link>
                );
              }

              // ถ้าไม่มี href ให้เป็นปุ่มธรรมดา (เปิด Pop-up)
              return (
                <button key={index} onClick={item.action} className={baseClass}>
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 transition-colors",
                      item.isActive
                        ? "text-white"
                        : "text-slate-500 group-hover:text-white"
                    )}
                  />
                  {item.title}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 p-4 bg-slate-950">
          <button className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-colors">
            <LogOut className="mr-3 h-5 w-5" />
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* ==================== POP-UP: DASHBOARD ==================== */}
      <Dialog open={isDashboardOpen} onOpenChange={setIsDashboardOpen}>
        <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b bg-slate-50">
            <DialogTitle className="flex items-center gap-2 text-2xl text-slate-800">
              <BarChart3 className="text-blue-600 h-6 w-6" />
              แดชบอร์ดภาพรวมร้านค้า
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
            {/* 1. Cards แสดงตัวเลข */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Card 1: ยอดขาย */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-slate-500 text-sm font-medium">
                    ยอดขายวันนี้
                  </p>
                  <h3 className="text-4xl font-bold text-slate-800 mt-2">
                    ฿12,450
                  </h3>
                  <div className="flex items-center gap-1 text-green-600 text-sm mt-2 font-medium bg-green-50 px-2 py-1 rounded-full w-fit">
                    <TrendingUp className="h-3 w-3" /> +12% จากเมื่อวาน
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>
              </div>

              {/* Card 2: สมาชิก */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-slate-500 text-sm font-medium">
                    สมาชิกใหม่ (สัปดาห์นี้)
                  </p>
                  <h3 className="text-4xl font-bold text-slate-800 mt-2">
                    15 คน
                  </h3>
                  <p className="text-slate-400 text-sm mt-2">
                    รวมสมาชิกทั้งหมด 850 คน
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>

              {/* Card 3: แต้ม */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-slate-500 text-sm font-medium">
                    แต้มที่ถูกใช้ไป
                  </p>
                  <h3 className="text-4xl font-bold text-slate-800 mt-2">
                    5,400
                  </h3>
                  <p className="text-slate-400 text-sm mt-2">
                    มูลค่าส่วนลดรวม ฿540
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Store className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* 2. กราฟ (Recharts) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[500px]">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800">
                  สถิติยอดขาย 7 วันย้อนหลัง
                </h3>
                <p className="text-slate-500 text-sm">
                  เปรียบเทียบยอดขายและจำนวนลูกค้า
                </p>
              </div>

              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={MOCK_CHART_DATA}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    tick={{ fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `฿${value}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    cursor={{ fill: "#f1f5f9" }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="ยอดขาย"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                    name="ยอดขาย (บาท)"
                    barSize={40}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="ลูกค้า"
                    fill="#f97316"
                    radius={[4, 4, 0, 0]}
                    name="ลูกค้า (คน)"
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== POP-UP: SETTINGS ==================== */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Settings className="text-slate-600" /> ตั้งค่าระบบ
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {/* ส่วนที่ 1: ข้อมูลร้านค้า */}
            <div className="space-y-4">
              <h3 className="font-medium text-slate-900 flex items-center gap-2">
                <Store className="h-4 w-4" /> ข้อมูลร้านค้า
              </h3>
              <div className="h-[1px] w-full bg-slate-200" />
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-slate-500">ชื่อร้าน</Label>
                <Input className="col-span-3" defaultValue="My POS Shop" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-slate-500">สาขา</Label>
                <Input className="col-span-3" defaultValue="สำนักงานใหญ่" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-slate-500">เบอร์โทร</Label>
                <Input className="col-span-3" defaultValue="02-123-4567" />
              </div>
            </div>

            {/* ส่วนที่ 2: ตั้งค่าทั่วไป */}
            <div className="space-y-4">
              <h3 className="font-medium text-slate-900 flex items-center gap-2">
                <Settings className="h-4 w-4" /> ตั้งค่าทั่วไป
              </h3>
              <div className="h-[1px] w-full bg-slate-200" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ระบบสะสมแต้ม</Label>
                  <p className="text-xs text-slate-500">
                    ให้แต้มลูกค้าอัตโนมัติเมื่อชำระเงิน
                  </p>
                </div>
                {/* Switch removed */}
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>พิมพ์ใบเสร็จอัตโนมัติ</Label>
                  <p className="text-xs text-slate-500">
                    สั่งพิมพ์ทันทีเมื่อจบรายการ
                  </p>
                </div>
                {/* Switch removed */}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsSettingsOpen(false)}
            >
              บันทึกการตั้งค่า
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
