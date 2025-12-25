// ไฟล์: src/components/pos/digital-member-card.tsx
import { Member } from "@/types/index";
import { CreditCard, Trophy, Phone } from "lucide-react";

// Interface สำหรับรับข้อมูล Tier
interface TierConfig {
  name: string;
  color: string; // สี Hex Code (เช่น #FFD700)
}

interface DigitalMemberCardProps {
  member: Member | null;
  tiers?: TierConfig[]; // รับข้อมูล Tier เข้ามาด้วย
}

export function DigitalMemberCard({
  member,
  tiers = [],
}: DigitalMemberCardProps) {
  // กรณีไม่มีสมาชิก (Waiting State)
  if (!member) {
    return (
      // ✅ ลดความสูงจาก h-48 เป็น h-40 เพื่อประหยัดพื้นที่แนวตั้ง
      <div className="h-40 w-full rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-2">
        <div className="p-2.5 bg-white rounded-full shadow-sm">
          <CreditCard className="h-5 w-5 text-slate-300" />
        </div>
        <p className="text-xs font-medium">Waiting for member...</p>
      </div>
    );
  }

  // ✅ ฟังก์ชันหาสีบัตรจาก Tiers ที่ได้รับการแก้ไขเพื่อความปลอดภัย
  const getCardStyle = () => {
    // 1. ค้นหา Tier ที่ชื่อตรงกัน โดยใช้ Optional Chaining (?.)
    const matchedTier = tiers.find(
      (t) => t?.name?.toLowerCase() === member?.tier?.toLowerCase()
    );

    // 2. ถ้าเจอ Tier ที่ตรงกันและมีค่าสี ให้ใช้สีนั้น
    if (matchedTier && matchedTier.color) {
      return {
        background: matchedTier.color,
        color: "#fff",
      };
    }

    // 3. ถ้าไม่เจอ (เช่น เป็นสมาชิกใหม่ที่ Tier ยังไม่ถูก Map) ให้ใช้สีส้มพื้นฐาน
    return {
      background: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
      color: "#fff",
    };
  };

  return (
    <div
      // ✅ ลดความสูงจาก h-48 เป็น h-40 และปรับ padding จาก p-6 เป็น p-5
      className="h-40 w-full rounded-2xl p-5 shadow-xl relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
      style={getCardStyle()}
    >
      {/* Background Pattern (ลายน้ำถ้วยรางวัล) */}
      <div className="absolute -top-4 -right-4 p-4 opacity-10 rotate-12 pointer-events-none">
        {/* ✅ ปรับขนาดไอคอนพื้นหลังให้เล็กลงเล็กน้อย */}
        <Trophy className="h-32 w-32" />
      </div>

      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* ส่วนบน: ข้อมูลสมาชิก และ คะแนน */}
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            {/* Badge ระดับสมาชิก */}
            <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-bold uppercase backdrop-blur-md border border-white/10 tracking-wider shadow-sm">
              {member.tier || "BRONZE"} MEMBER
            </span>

            {/* ชื่อสมาชิก - ✅ ปรับฟอนต์จาก text-2xl เป็น text-xl */}
            <h3 className="text-xl font-bold tracking-wide truncate max-w-[160px] drop-shadow-sm">
              {member.name}
            </h3>

            {/* เบอร์โทรศัพท์ */}
            <div className="flex items-center gap-1 text-white/90 text-xs mt-0.5">
              <Phone className="h-3 w-3" />
              <span className="font-medium tracking-wide">{member.phone}</span>
            </div>

            {/* รหัสบัตร */}
            <p className="text-[9px] text-white/60 font-mono tracking-widest uppercase mt-0.5">
              {member.card_id}
            </p>
          </div>

          {/* คะแนนสะสม (ขวาบน) */}
          <div className="text-right">
            <p className="text-[9px] text-white/80 uppercase tracking-wider">
              Points
            </p>
            {/* ✅ ปรับฟอนต์จาก text-2xl เป็น text-xl */}
            <p className="text-xl font-bold drop-shadow-md">
              {(member.points || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* ส่วนล่าง: ยอดเงินคงเหลือ */}
        <div className="mt-auto">
          <p className="text-[10px] text-white/80 mb-0.5 font-medium">
            Current Balance
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-medium opacity-90">฿</span>
            {/* ✅ ปรับฟอนต์จาก text-4xl เป็น text-3xl เพื่อความกะทัดรัด */}
            <span className="text-3xl font-bold tracking-tight drop-shadow-md">
              {(member.balance || 0).toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
