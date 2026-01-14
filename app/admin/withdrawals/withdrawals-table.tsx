"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReviewTransactionDialog from "./review-transaction-dialog";
import type { WithdrawalTransaction } from "@/app/admin/actions";

interface TransactionsTableProps {
  transactions: WithdrawalTransaction[];
}

export default function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [reviewingTransaction, setReviewingTransaction] = useState<WithdrawalTransaction | null>(null);
  const router = useRouter();

  const handleReviewComplete = () => {
    router.refresh();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">暂无待审核的交易请求</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">类型</TableHead>
              <TableHead className="w-[200px]">用户</TableHead>
              <TableHead className="w-[150px]">邮箱</TableHead>
              <TableHead className="w-[120px]">手机号</TableHead>
              <TableHead className="w-[120px]">金额</TableHead>
              <TableHead className="w-[180px]">申请时间</TableHead>
              <TableHead className="w-[100px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <Badge
                    variant={transaction.type === "deposit" ? "default" : "destructive"}
                    className={
                      transaction.type === "deposit"
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    }
                  >
                    {transaction.type === "deposit" ? "充值" : "提现"}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {transaction.user?.full_name || "未设置"}
                </TableCell>
                <TableCell>{transaction.user?.email || "-"}</TableCell>
                <TableCell>{transaction.user?.phone || "-"}</TableCell>
                <TableCell
                  className={`font-semibold ${
                    transaction.type === "deposit" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {transaction.type === "deposit" ? "+" : "-"}¥{transaction.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-gray-600">
                  {formatDate(transaction.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReviewingTransaction(transaction)}
                  >
                    审核
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {reviewingTransaction && (
        <ReviewTransactionDialog
          transaction={reviewingTransaction}
          open={!!reviewingTransaction}
          onOpenChange={(open) => {
            if (!open) {
              setReviewingTransaction(null);
            }
          }}
          onReviewComplete={handleReviewComplete}
        />
      )}
    </>
  );
}
