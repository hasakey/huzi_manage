"use client";

import { changePassword } from "@/app/auth/actions";
import { logServerAction } from "@/app/utils/client-action-logger";
import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "修改中..." : "修改密码"}
    </button>
  );
}

export default function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await logServerAction("修改密码", changePassword, formData);

      if (result.success) {
        setSuccess(true);
        // 清空表单
        const form = document.getElementById("change-password-form") as HTMLFormElement;
        form?.reset();
        // 3秒后跳转到登录页
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(result.error || "修改密码失败");
      }
    });
  }

  return (
    <form id="change-password-form" action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
          <p className="text-sm text-green-600">密码修改成功！即将跳转到登录页...</p>
        </div>
      )}

      <div>
        <label
          htmlFor="currentPassword"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          当前密码
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          placeholder="请输入当前密码"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          新密码
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={6}
          placeholder="至少 6 位"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">密码长度至少为 6 位</p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          确认新密码
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          placeholder="请再次输入新密码"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <SubmitButton />

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          返回登录
        </Link>
      </div>
    </form>
  );
}
