"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  LogOut,
  Settings,
} from "lucide-react";
import { logout } from "@/app/auth/actions";
import { logServerAction } from "@/app/utils/client-action-logger";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface SidebarProps {
  role: "admin" | "user";
  userName?: string;
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      const result = await logServerAction("用户登出", logout);
      if (result.success) {
        router.push("/login");
        router.refresh();
      }
    });
  };

  const userMenuItems = [
    {
      title: "仪表板",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "充值",
      href: "/dashboard/deposit",
      icon: FileText,
    },
    {
      title: "提现",
      href: "/dashboard/withdraw",
      icon: FileText,
    },
    {
      title: "交易记录",
      href: "/dashboard/transactions",
      icon: FileText,
    },
    {
      title: "设置",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  const adminMenuItems = [
    {
      title: "仪表板",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "用户管理",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "交易审核",
      href: "/admin/withdrawals",
      icon: FileText,
    },
    {
      title: "交易记录",
      href: "/admin/transactions",
      icon: FileText,
    },
    {
      title: "统计",
      href: "/admin/stats",
      icon: BarChart3,
    },
  ];

  const menuItems = role === "admin" ? adminMenuItems : userMenuItems;

  return (
    <div className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo/Header */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <h1 className="text-xl font-bold text-gray-900">管理后台</h1>
      </div>

      {/* User Info */}
      {userName && (
        <div className="border-b border-gray-200 px-6 py-4">
          <p className="text-sm font-medium text-gray-900">{userName}</p>
          <p className="text-xs text-gray-500">
            {role === "admin" ? "管理员" : "用户"}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          // 精确匹配
          const isExactMatch = pathname === item.href;
          // 子路径匹配（例如 /admin/users 匹配 /admin/users）
          const isSubPath = pathname.startsWith(item.href + "/");
          
          // 检查当前路径是否匹配了其他更具体的菜单项
          // 例如：如果 pathname 是 /admin/withdrawals，/admin 不应该激活
          // 因为 /admin/withdrawals 匹配了更具体的菜单项
          const matchesMoreSpecificItem = menuItems.some(
            (otherItem) => 
              otherItem.href !== item.href && 
              otherItem.href.startsWith(item.href + "/") &&
              (pathname === otherItem.href || pathname.startsWith(otherItem.href + "/"))
          );
          
          // 只有当精确匹配，或者是子路径且没有匹配更具体的菜单项时才激活
          const isActive = (isExactMatch || isSubPath) && !matchesMoreSpecificItem;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <LogOut className="h-5 w-5" />
          登出
        </button>
      </div>
    </div>
  );
}
