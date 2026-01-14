"use client";

import { useState, useTransition, useEffect } from "react";
import { getAllTransactions, type TransactionFilters, type User } from "@/app/admin/actions";
import { logServerAction } from "@/app/utils/client-action-logger";
import TransactionsFilters from "./transactions-filters";
import AdminTransactionsTable from "./transactions-table";
import type { WithdrawalTransaction } from "@/app/admin/actions";

interface TransactionsPageClientProps {
  users: User[];
}

export default function TransactionsPageClient({ users }: TransactionsPageClientProps) {
  const [transactions, setTransactions] = useState<WithdrawalTransaction[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>({
    type: "all",
    status: "all",
    userId: "all",
    startDate: "",
    endDate: "",
  });
  const [isLoading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 初始加载数据
  useEffect(() => {
    loadTransactions(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTransactions = (currentFilters: TransactionFilters) => {
    startTransition(async () => {
      setError(null);
      try {
        const result = await logServerAction(
          "获取所有交易记录",
          getAllTransactions,
          currentFilters
        );

        if (result.success) {
          setTransactions(result.data || []);
        } else {
          setError(result.error || "加载交易记录失败");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
      }
    });
  };

  const handleFilterChange = (newFilters: TransactionFilters) => {
    setFilters(newFilters);
    loadTransactions(newFilters);
  };

  return (
    <div className="space-y-6">
      {/* 筛选组件 */}
      <TransactionsFilters
        users={users}
        onFilterChange={handleFilterChange}
        initialFilters={filters}
      />

      {/* 错误提示 */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">加载中...</p>
        </div>
      )}

      {/* 交易记录表格 */}
      {!isLoading && !error && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              共找到 <span className="font-semibold text-gray-900">{transactions.length}</span> 条记录
            </p>
          </div>
          <AdminTransactionsTable transactions={transactions} />
        </>
      )}
    </div>
  );
}
