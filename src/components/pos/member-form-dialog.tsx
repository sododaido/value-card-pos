"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, UserPlus, Save } from "lucide-react";
import { toast } from "sonner";
import { Member } from "@/types";

interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Member | null; // ถ้ามีข้อมูลส่งมา = แก้ไข, ถ้าไม่มี = สร้างใหม่
  onSuccess: (newMember?: Member) => void;
}

export function MemberFormDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: MemberFormDialogProps) {
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cardId, setCardId] = useState(""); // เฉพาะตอนสร้างใหม่

  // โหลดข้อมูลเดิมมาใส่ฟอร์ม (กรณีแก้ไข)
  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name);
        setPhone(initialData.phone);
        setCardId(initialData.card_id);
      } else {
        // เคลียร์ฟอร์มสำหรับสร้างใหม่
        setName("");
        setPhone("");
        // สุ่ม Card ID อัตโนมัติ (เช่น CF + เลขสุ่ม 6 หลัก)
        setCardId(`CF${Math.floor(100000 + Math.random() * 900000)}`);
      }
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = "/api/members";
      const method = isEdit ? "PUT" : "POST";
      const body = {
        card_id: cardId, // ตอนแก้ส่งไปเพื่อระบุคน (แต่หลังบ้านไม่แก้ ID)
        name,
        phone,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "ทำรายการไม่สำเร็จ");

      toast.success(isEdit ? "แก้ไขข้อมูลสำเร็จ" : "สมัครสมาชิกสำเร็จ");
      onSuccess(isEdit ? { ...initialData!, name, phone } : result.data); // ส่งข้อมูลกลับไปอัปเดตหน้าจอ
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "แก้ไขข้อมูลลูกค้า" : "สมัครสมาชิกใหม่"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "แก้ไขชื่อหรือเบอร์โทรศัพท์ของสมาชิก"
              : "กรอกข้อมูลเพื่อลงทะเบียนสมาชิกใหม่เข้าระบบ"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {/* Card ID (ReadOnly) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Card ID</Label>
            <Input
              value={cardId}
              disabled
              className="col-span-3 bg-slate-100 font-mono"
            />
          </div>

          {/* Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              ชื่อ-สกุล
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              required
              autoFocus
            />
          </div>

          {/* Phone */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              เบอร์โทร
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="col-span-3"
              required
              placeholder="08xxxxxxxx"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isEdit ? (
                <Save className="mr-2 h-4 w-4" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              {loading ? "Saving..." : isEdit ? "บันทึกแก้ไข" : "ยืนยันสมัคร"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
