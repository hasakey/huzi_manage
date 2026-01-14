import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { getAllUsers } from "@/app/admin/actions";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/app/auth/utils";
import TransactionsPageClient from "./page-client";

export default async function AdminTransactionsPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  // 获取用户列表用于筛选
  const usersResult = await getAllUsers();
  const users = usersResult.success ? usersResult.data || [] : [];

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">交易记录</h1>
          <p className="text-gray-600">查看所有用户的充值和提现记录</p>
        </div>

        <TransactionsPageClient users={users} />
      </div>
    </DashboardLayout>
  );
}
