"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewTransaction } from "@/app/admin/actions";
import { logServerAction } from "@/app/utils/client-action-logger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WithdrawalTransaction } from "@/app/admin/actions";

interface ReviewTransactionDialogProps {
  transaction: WithdrawalTransaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewComplete: () => void;
}

export default function ReviewTransactionDialog({
  transaction,
  open,
  onOpenChange,
  onReviewComplete,
}: ReviewTransactionDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleReview = (action: "approve" | "reject") => {
    setError(null);

    startTransition(async () => {
      try {
        const result = await logServerAction(
          "审核交易请求",
          reviewTransaction,
          transaction.id,
          action
        );

        if (result.success) {
          onOpenChange(false);
          onReviewComplete();
          router.refresh();
        } else {
          setError(result.error || "审核失败");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
      }
    });
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

  const isDeposit = transaction.type === "deposit";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>审核{isDeposit ? "充值" : "提现"}请求</DialogTitle>
          <DialogDescription>请仔细核对交易信息后做出决定</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 用户信息 */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">用户信息</h4>
            <div className="rounded-lg bg-gray-50 p-3 space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">姓名：</span>
                <span className="text-sm font-medium">
                  {transaction.user?.full_name || "未设置"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">邮箱：</span>
                <span className="text-sm font-medium">
                  {transaction.user?.email || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">手机号：</span>
                <span className="text-sm font-medium">
                  {transaction.user?.phone || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* 交易信息 */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">{isDeposit ? "充值" : "提现"}信息</h4>
            <div className="rounded-lg bg-gray-50 p-3 space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">交易类型：</span>
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
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{isDeposit ? "充值" : "提现"}金额：</span>
                <span
                  className={`text-lg font-bold ${
                    isDeposit ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isDeposit ? "+" : "-"}¥{transaction.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">申请时间：</span>
                <span className="text-sm font-medium">
                  {formatDate(transaction.created_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">状态：</span>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  待审核
                </Badge>
              </div>
            </div>
          </div>

          {/* 错误消息 */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* 提示信息 */}
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs text-blue-700">
              <strong>提示：</strong>
            </p>
            <ul className="mt-1 space-y-0.5 text-xs text-blue-600 list-disc list-inside">
              {isDeposit ? (
                <>
                  <li>批准后会将金额添加到用户账户</li>
                  <li>拒绝后不会增加用户余额</li>
                </>
              ) : (
                <>
                  <li>批准后将从用户账户扣除相应金额</li>
                  <li>拒绝后不会扣除用户余额</li>
                  <li>请确保用户余额充足后再批准</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleReview("reject")}
            disabled={isPending}
          >
            {isPending ? "处理中..." : "拒绝"}
          </Button>
          <Button
            onClick={() => handleReview("approve")}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPending ? "处理中..." : "批准"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
