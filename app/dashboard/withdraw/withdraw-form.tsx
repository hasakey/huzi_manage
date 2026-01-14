"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWithdrawal } from "@/app/dashboard/actions";
import { logServerAction } from "@/app/utils/client-action-logger";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface WithdrawFormProps {
  currentBalance: number;
}

export default function WithdrawForm({ currentBalance }: WithdrawFormProps) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("请输入有效的提现金额");
      return;
    }

    if (amountNum > currentBalance) {
      setError(`余额不足，当前余额: ¥${currentBalance.toFixed(2)}`);
      return;
    }

    startTransition(async () => {
      try {
        const result = await logServerAction("创建提现请求", createWithdrawal, amountNum);
        
        if (result.success) {
          setSuccess(true);
          setAmount("");
          router.refresh();
          
          // 3秒后清除成功消息
          setTimeout(() => {
            setSuccess(false);
          }, 3000);
        } else {
          setError(result.error || "提现请求失败");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
      }
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* 当前余额显示 */}
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-gray-600">当前余额</p>
          <p className="text-3xl font-bold text-blue-600">¥{currentBalance.toFixed(2)}</p>
        </div>

        {/* 提现表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              提现金额
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={currentBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="请输入提现金额"
                className="pl-8"
                disabled={isPending}
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              可提现金额: ¥{currentBalance.toFixed(2)}
            </p>
          </div>

          {/* 错误消息 */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* 成功消息 */}
          {success && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
              提现请求已提交，等待管理员审核
            </div>
          )}

          {/* 提交按钮 */}
          <Button
            type="submit"
            disabled={isPending || !amount || parseFloat(amount) <= 0}
            className="w-full"
          >
            {isPending ? "提交中..." : "提交提现请求"}
          </Button>
        </form>

        {/* 提示信息 */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-600">
            <strong>提示：</strong>
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
            <li>提现请求提交后需要管理员审核</li>
            <li>审核通过后，金额将从您的账户扣除</li>
            <li>请确保提现金额不超过当前余额</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
