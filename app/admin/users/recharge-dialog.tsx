"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rechargeUser } from "@/app/admin/actions";
import { logServerAction } from "@/app/utils/client-action-logger";
import type { User } from "@/app/admin/actions";

interface RechargeDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function RechargeDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: RechargeDialogProps) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("请输入有效的充值金额（必须大于 0）");
      return;
    }

    startTransition(async () => {
      const result = await logServerAction(
        "为用户充值",
        rechargeUser,
        user.id,
        amountNum
      );

      if (result.success) {
        onSuccess();
        setAmount("");
        onOpenChange(false);
      } else {
        setError(result.error || "充值失败");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>为用户充值</DialogTitle>
            <DialogDescription>
              为用户账户充值。充值金额将立即到账，并创建一条充值交易记录。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="userInfo">用户信息</Label>
              <Input
                id="userInfo"
                value={`${user.full_name || user.email || user.id.slice(0, 8)} (当前余额: ¥${user.balance.toLocaleString("zh-CN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })})`}
                disabled
                className="bg-gray-50 text-gray-900"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount" className="text-gray-900">充值金额</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="请输入充值金额"
                className="bg-white text-gray-900 border-gray-300"
                required
              />
              <p className="text-xs text-gray-500">
                充值后余额: ¥
                {amount
                  ? (
                      user.balance + parseFloat(amount || "0")
                    ).toLocaleString("zh-CN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : user.balance.toLocaleString("zh-CN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
              </p>
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAmount("");
                setError(null);
                onOpenChange(false);
              }}
              disabled={isPending}
            >
              取消
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
              {isPending ? "充值中..." : "确认充值"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
