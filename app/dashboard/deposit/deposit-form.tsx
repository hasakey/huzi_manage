"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDeposit } from "@/app/dashboard/actions";
import { logServerAction } from "@/app/utils/client-action-logger";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DepositFormProps {
  currentBalance: number;
}

export default function DepositForm({ currentBalance }: DepositFormProps) {
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
      setError("请输入有效的充值金额");
      return;
    }

    startTransition(async () => {
      try {
        const result = await logServerAction("创建充值请求", createDeposit, amountNum);
        
        if (result.success) {
          setSuccess(true);
          setAmount("");
          router.refresh();
          
          // 3秒后清除成功消息
          setTimeout(() => {
            setSuccess(false);
          }, 3000);
        } else {
          setError(result.error || "充值请求失败");
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

        {/* 充值表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              充值金额
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="请输入充值金额"
                className="pl-8"
                disabled={isPending}
                required
              />
            </div>
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
              充值请求已提交，等待管理员审核
            </div>
          )}

          {/* 提交按钮 */}
          <Button
            type="submit"
            disabled={isPending || !amount || parseFloat(amount) <= 0}
            className="w-full"
          >
            {isPending ? "提交中..." : "提交充值请求"}
          </Button>
        </form>

        {/* 提示信息 */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-600">
            <strong>提示：</strong>
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
            <li>充值请求提交后需要管理员审核</li>
            <li>审核通过后，金额将添加到您的账户</li>
            <li>请确保充值金额正确</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
