// ไฟล์: src/app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Store, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate เบอร์โทร (ต้องมี 10 หลัก)
    if (phone.length < 10) {
      toast.error("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง");
      return;
    }

    setIsLoading(true);

    try {
      // ยิง API เช็คว่ามีเบอร์นี้ในระบบไหม
      const res = await fetch(`/api/members?search=${phone}`);
      const data = await res.json();

      if (!res.ok || !data) {
        throw new Error("ไม่พบเบอร์โทรศัพท์นี้ในระบบ");
      }

      // ถ้ามี -> พาไปหน้า Dashboard (ส่ง ID ไปด้วย)
      // ในระบบจริงเราจะใช้ Cookies/Session แต่อันนี้ส่งผ่าน URL แบบง่ายๆ ไปก่อนครับ
      toast.success("ยินดีต้อนรับ");
      router.push(`/me?id=${data.card_id}`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-background p-4">
      {/* Logo Area */}
      <div className="mb-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground mx-auto mb-4 shadow-xl rotate-3 hover:rotate-0 transition-all">
          <Store size={40} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Value Card</h1>
        <p className="text-sm text-muted-foreground">Check Balance & Points</p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-sm p-6 shadow-lg border-t-4 border-t-primary">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium pl-1">Phone Number</label>
            <Input
              type="tel"
              placeholder="08x-xxx-xxxx"
              className="text-lg h-12 text-center tracking-widest"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              disabled={isLoading}
              autoFocus
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg font-bold shadow-md transition-all hover:scale-[1.02]"
            disabled={isLoading || phone.length < 10}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                Check Now <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            ยังไม่เป็นสมาชิก? ติดต่อเคาน์เตอร์เพื่อสมัคร
          </p>
        </div>
      </Card>

      {/* Footer */}
      <p className="fixed bottom-4 text-[10px] text-muted-foreground opacity-50"></p>
    </div>
  );
}
