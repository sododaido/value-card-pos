// ไฟล์: src/components/common/export-button.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

// กำหนด Type ของข้อมูลที่อนุญาตให้ Export ได้ (แทนการใช้ any)
type CSVValue = string | number | boolean | null | undefined;

interface ExportButtonProps {
  // ✅ แก้ไข: ระบุ Type ชัดเจนว่ารับ Object ที่ค่าข้างในเป็น CSVValue
  data: Record<string, CSVValue>[];
  filename?: string;
  label?: string;
}

export function ExportButton({
  data,
  filename = "export",
  label = "Export CSV",
}: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("ไม่มีข้อมูลให้ดาวน์โหลด");
      return;
    }

    // 1. ดึง Header
    const headers = Object.keys(data[0]);

    // 2. แปลงข้อมูลเป็น CSV Format
    const csvContent = [
      headers.join(","), // หัวตาราง
      ...data.map((row) =>
        headers
          .map((fieldName) => {
            const value = row[fieldName];

            // จัดการกรณีข้อมูลเป็น null หรือ undefined ให้เป็นช่องว่าง
            if (value === null || value === undefined) return "";

            // จัดการกรณีข้อมูลมีเครื่องหมายจุลภาค (,) ให้ใส่เครื่องหมายคำพูดครอบ
            const stringValue = String(value);
            return stringValue.includes(",") ? `"${stringValue}"` : stringValue;
          })
          .join(",")
      ),
    ].join("\n");

    // 3. สร้าง Blob พร้อม BOM (\uFEFF)
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="gap-2 border-slate-300"
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}
