"use client";

import { logout } from "@/app/auth/actions";
import { logServerAction } from "@/app/utils/client-action-logger";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLogout = () => {
    startTransition(async () => {
      const result = await logServerAction("用户登出", logout);
      
      if (result.success) {
        router.push("/login");
        router.refresh();
      }
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? "登出中..." : "登出"}
    </button>
  );
}
