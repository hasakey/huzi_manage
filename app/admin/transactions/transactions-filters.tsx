"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { TransactionFilters, User } from "@/app/admin/actions";

interface TransactionsFiltersProps {
  users: User[];
  onFilterChange: (filters: TransactionFilters) => void;
  initialFilters?: TransactionFilters;
}

export default function TransactionsFilters({
  users,
  onFilterChange,
  initialFilters,
}: TransactionsFiltersProps) {
  const [filters, setFilters] = useState<TransactionFilters>({
    type: initialFilters?.type || "all",
    status: initialFilters?.status || "all",
    userId: initialFilters?.userId || "all",
    startDate: initialFilters?.startDate || "",
    endDate: initialFilters?.endDate || "",
  });

  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // 自动应用筛选（除了日期字段，需要手动点击应用）
    if (key !== "startDate" && key !== "endDate") {
      onFilterChange(newFilters);
    }
  };

  const handleApply = () => {
    onFilterChange(filters);
  };

  const handleReset = () => {
    const resetFilters: TransactionFilters = {
      type: "all",
      status: "all",
      userId: "all",
      startDate: "",
      endDate: "",
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* 类型筛选 */}
          <div className="space-y-2">
            <Label htmlFor="type-filter" className="text-sm font-medium text-gray-700">
              类型
            </Label>
            <Select
              value={filters.type || "all"}
              onValueChange={(value) => handleFilterChange("type", value)}
            >
              <SelectTrigger id="type-filter" className="w-full">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="deposit">充值</SelectItem>
                <SelectItem value="withdraw">提现</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 状态筛选 */}
          <div className="space-y-2">
            <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
              状态
            </Label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger id="status-filter" className="w-full">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
                <SelectItem value="approved">已批准</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 用户筛选 */}
          <div className="space-y-2">
            <Label htmlFor="user-filter" className="text-sm font-medium text-gray-700">
              用户
            </Label>
            <Select
              value={filters.userId || "all"}
              onValueChange={(value) => handleFilterChange("userId", value)}
            >
              <SelectTrigger id="user-filter" className="w-full">
                <SelectValue placeholder="全部用户" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">全部用户</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email || user.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 开始时间 */}
          <div className="space-y-2">
            <Label htmlFor="start-date" className="text-sm font-medium text-gray-700">
              开始时间
            </Label>
            <Input
              id="start-date"
              type="date"
              value={filters.startDate || ""}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="w-full"
            />
          </div>

          {/* 结束时间 */}
          <div className="space-y-2">
            <Label htmlFor="end-date" className="text-sm font-medium text-gray-700">
              结束时间
            </Label>
            <Input
              id="end-date"
              type="date"
              value={filters.endDate || ""}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-2 border-t border-gray-200">
          <Button onClick={handleApply} className="bg-blue-600 hover:bg-blue-700 text-white">
            应用筛选
          </Button>
          <Button variant="outline" onClick={handleReset} className="border-gray-300">
            重置
          </Button>
        </div>
      </div>
    </div>
  );
}
