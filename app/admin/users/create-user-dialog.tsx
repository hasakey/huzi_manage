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
import { createUser } from "@/app/admin/actions";
import { logServerAction } from "@/app/utils/client-action-logger";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserDialogProps) {
  const [email, setEmail] = useState("");
  const [generateRandomEmail, setGenerateRandomEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ email: string; password: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setCreatedUser(null);

    if (!generateRandomEmail && !email.trim()) {
      setError("请输入邮箱或选择生成随机邮箱");
      return;
    }

    startTransition(async () => {
      const result = await logServerAction(
        "创建用户账号",
        createUser,
        email.trim() || null,
        generateRandomEmail
      );

      if (result.success && result.data) {
        setSuccess(true);
        setCreatedUser({
          email: result.data.email,
          password: result.data.password,
        });
        setEmail("");
        setGenerateRandomEmail(false);
        onSuccess();
      } else {
        setError(result.error || "创建账号失败");
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      setEmail("");
      setGenerateRandomEmail(false);
      setError(null);
      setSuccess(false);
      setCreatedUser(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>创建新账号</DialogTitle>
          <DialogDescription>创建新的用户账号，初始密码为 000000</DialogDescription>
        </DialogHeader>

        {success && createdUser ? (
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm font-medium text-green-800 mb-2">账号创建成功！</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">账号（邮箱）：</span>
                  <span className="font-mono font-medium text-green-900">{createdUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">初始密码：</span>
                  <span className="font-mono font-medium text-green-900">{createdUser.password}</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-green-600">
                请告知用户使用此账号和密码登录，登录后建议修改密码。
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>关闭</Button>
              <Button
                onClick={() => {
                  setSuccess(false);
                  setCreatedUser(null);
                }}
              >
                继续创建
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="generateRandom"
                  checked={generateRandomEmail}
                  onChange={(e) => {
                    setGenerateRandomEmail(e.target.checked);
                    if (e.target.checked) {
                      setEmail("");
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="generateRandom" className="text-sm font-normal cursor-pointer">
                  生成随机邮箱账号
                </Label>
              </div>
            </div>

            {!generateRandomEmail && (
              <div className="space-y-2">
                <Label htmlFor="email">邮箱（账号名）</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  disabled={isPending}
                  required={!generateRandomEmail}
                />
                <p className="text-xs text-gray-500">
                  账号名将作为登录邮箱使用，创建后不可修改
                </p>
              </div>
            )}

            {generateRandomEmail && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-sm text-blue-700">
                  将自动生成随机邮箱账号（格式：user_随机数字@example.com）
                </p>
              </div>
            )}

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
              <p className="text-sm text-gray-700">
                <strong>初始密码：</strong>000000
              </p>
              <p className="text-xs text-gray-600 mt-1">
                用户首次登录后建议修改密码
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "创建中..." : "创建账号"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
