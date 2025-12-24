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
      <div className="h-48 w-full rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="p-3 bg-white rounded-full shadow-sm">
          <CreditCard className="h-6 w-6 text-slate-300" />
        </div>
        <p className="text-sm font-medium">Waiting for member...</p>
      </div>
    );
  }

  // ✅ ฟังก์ชันหาสีบัตรจาก Tiers ที่ส่งเข้ามา
  const getCardStyle = () => {
    // หา Tier ที่ชื่อตรงกับสมาชิก (Case Insensitive)
    const matchedTier = tiers.find(
      (t) => t.name.toLowerCase() === member.tier.toLowerCase()
    );

    // ถ้าเจอ ให้ใช้สีจาก Tier นั้น
    if (matchedTier && matchedTier.color) {
      return {
        background: matchedTier.color, // ใช้สี Hex ตรงๆ
        color: "#fff", // บังคับตัวหนังสือสีขาวเสมอเพื่อความชัด
      };
    }

    // ถ้าไม่เจอ (Default) ใช้สีส้ม Bronze เดิม
    return {
      background: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)", // Orange Gradient
      color: "#fff",
    };
  };

  return (
    <div
      className="h-48 w-full rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
      style={getCardStyle()} // ✅ ใช้ Style แบบ Dynamic
    >
      {/* Background Pattern (ลายน้ำถ้วยรางวัล) */}
      <div className="absolute -top-4 -right-4 p-4 opacity-10 rotate-12 pointer-events-none">
        <Trophy className="h-40 w-40" />
      </div>

      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* ส่วนบน: ข้อมูลสมาชิก และ คะแนน */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            {/* Badge ระดับสมาชิก */}
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase backdrop-blur-md border border-white/10 tracking-wider shadow-sm">
              {member.tier} MEMBER
            </span>

            {/* ชื่อสมาชิก */}
            <h3 className="text-2xl font-bold tracking-wide truncate max-w-[180px] drop-shadow-sm">
              {member.name}
            </h3>

            {/* เบอร์โทรศัพท์ */}
            <div className="flex items-center gap-1.5 text-white/90 text-sm mt-1">
              <Phone className="h-3.5 w-3.5" />
              <span className="font-medium tracking-wide">{member.phone}</span>
            </div>

            {/* รหัสบัตร */}
            <p className="text-[10px] text-white/60 font-mono tracking-widest uppercase mt-1">
              {member.card_id}
            </p>
          </div>

          {/* คะแนนสะสม (ขวาบน) */}
          <div className="text-right">
            <p className="text-[10px] text-white/80 uppercase tracking-wider mb-0.5">
              Points
            </p>
            <p className="text-2xl font-bold drop-shadow-md">
              {member.points.toLocaleString()}
            </p>
          </div>
        </div>

        {/* ส่วนล่าง: ยอดเงินคงเหลือ */}
        <div className="mt-auto">
          <p className="text-xs text-white/80 mb-1 font-medium">
            Current Balance
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-medium opacity-90">฿</span>
            <span className="text-4xl font-bold tracking-tight drop-shadow-md">
              {member.balance.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
