// ไฟล์: src/components/pos/recent-activity.tsx
import { Transaction } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft, Clock, History } from "lucide-react"; // ✅ เพิ่ม History icon
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecentActivityProps {
  transactions: Transaction[]; // รับรายการธุรกรรมเข้ามา
  isLoading?: boolean;
}

export function RecentActivity({
  transactions = [], // ✅ กำหนด Default value เพื่อป้องกัน Error เมื่อเป็น undefined
  isLoading,
}: RecentActivityProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 flex flex-col h-full min-h-[350px]">
      {/* ✅ เพิ่มส่วนหัวให้ชัดเจนเพื่อให้ UI ไม่กระโดดเวลาข้อมูลเด้งมา */}
      <div className="p-4 border-b dark:border-slate-800 flex items-center gap-2">
        <History className="h-5 w-5 text-slate-500" />
        <h3 className="font-bold dark:text-white">ประวัติรายการล่าสุด</h3>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-muted-foreground">
                กำลังโหลดประวัติ...
              </p>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
            <Clock className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-xs">ไม่พบประวัติการทำรายการ</p>
          </div>
        ) : (
          <ScrollArea className="h-full w-full pr-4">
            <div className="p-4 space-y-3">
              {transactions.map((txn) => {
                const isTopup = txn.type === "TOPUP";
                return (
                  <div
                    key={txn.transaction_id}
                    className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          isTopup
                            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {isTopup ? (
                          <ArrowDownLeft size={16} />
                        ) : (
                          <ArrowUpRight size={16} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold dark:text-slate-200">
                          {isTopup ? "เติมเงิน" : "ชำระเงิน"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDate(txn.timestamp)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          isTopup ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isTopup ? "+" : "-"}
                        {formatCurrency(txn.amount)}
                      </p>
                      {txn.points_earned > 0 && (
                        <p className="text-[10px] text-orange-500 font-medium">
                          +{txn.points_earned} pts
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
