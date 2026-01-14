"use client";

import { login, signup } from "@/app/auth/actions";
import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton({ isLogin }: { isLogin: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "处理中..." : isLogin ? "登录" : "注册"}
    </button>
  );
}

export default function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData, action: typeof login | typeof signup) {
    setError(null);
    startTransition(async () => {
      const result = await action(formData);
      if (!result.success) {
        setError(result.error || "操作失败");
      }
      // 如果成功，Server Action 会重定向，所以这里不需要处理成功情况
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          {/* 标题 */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {isLogin ? "登录" : "注册"}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {isLogin ? "欢迎回来" : "创建新账户"}
            </p>
          </div>

          {/* 切换按钮 */}
          <div className="mb-6 flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                isLogin
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                !isLogin
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              注册
            </button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 登录表单 */}
          {isLogin && (
            <form action={(formData) => handleSubmit(formData, login)}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    邮箱
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    required
                    placeholder="your@email.com"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    密码
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <SubmitButton isLogin={true} />
              </div>
            </form>
          )}

          {/* 注册表单 */}
          {!isLogin && (
            <form action={(formData) => handleSubmit(formData, signup)}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    邮箱
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    name="email"
                    required
                    placeholder="your@email.com"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    密码
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    placeholder="至少 6 位"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">密码长度至少为 6 位</p>
                </div>
                <SubmitButton isLogin={false} />
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
