// ไฟล์: src/components/pos/recent-activity.tsx
import { Transaction } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecentActivityProps {
  transactions: Transaction[]; // รับรายการธุรกรรมเข้ามา
  isLoading?: boolean;
}

export function RecentActivity({
  transactions,
  isLoading,
}: RecentActivityProps) {
  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">
        Loading history...
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
        <Clock className="w-8 h-8 mb-2 opacity-20" />
        <p className="text-xs">No recent activity</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] w-full pr-4">
      <div className="space-y-3">
        {transactions.map((txn) => {
          const isTopup = txn.type === "TOPUP";
          return (
            <div
              key={txn.transaction_id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    isTopup
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {isTopup ? (
                    <ArrowDownLeft size={16} />
                  ) : (
                    <ArrowUpRight size={16} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {isTopup ? "Top-up" : "Payment"}
                  </p>
                  <p className="text-xs text-muted-foreground">
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
                  <p className="text-[10px] text-orange-500">
                    +{txn.points_earned} pts
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
