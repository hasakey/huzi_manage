"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/app/dashboard/actions";

interface TransactionsTableProps {
  transactions: Transaction[];
}

export default function TransactionsTable({ transactions }: TransactionsTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-600 text-white">
            已批准
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            待审核
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="bg-red-600 text-white">
            已拒绝
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">暂无交易记录</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">类型</TableHead>
            <TableHead className="w-[120px]">金额</TableHead>
            <TableHead className="w-[100px]">状态</TableHead>
            <TableHead className="w-[180px]">申请时间</TableHead>
            <TableHead className="w-[180px]">更新时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            // 确保 type 字段存在，如果为空则根据金额判断（负数通常是提现）
            const transactionType = transaction.type || (transaction.amount < 0 ? "withdraw" : "deposit");
            const isDeposit = transactionType === "deposit";
            
            return (
              <TableRow key={transaction.id}>
                <TableCell>
                  <Badge
                    variant={isDeposit ? "default" : "destructive"}
                    className={
                      isDeposit
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    }
                  >
                    {isDeposit ? "充值" : "提现"}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`font-semibold ${
                    isDeposit ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isDeposit ? "+" : "-"}¥{Math.abs(transaction.amount).toFixed(2)}
                </TableCell>
                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                <TableCell className="text-gray-600">
                  {formatDate(transaction.created_at)}
                </TableCell>
                <TableCell className="text-gray-600">
                  {formatDate(transaction.updated_at)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
