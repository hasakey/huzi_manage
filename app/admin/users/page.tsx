import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { getAllUsers } from "@/app/admin/actions";
import UsersTable from "./users-table";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const result = await getAllUsers();

  if (!result.success) {
    // 如果是权限错误，重定向
    if (result.error?.includes("权限不足")) {
      redirect("/dashboard");
    }
    return (
      <DashboardLayout requiredRole="admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
            <p className="text-gray-600">管理所有用户账户</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-red-600">{result.error || "加载用户列表失败"}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-600">管理所有用户账户</p>
        </div>

        <UsersTable users={result.data || []} />
      </div>
    </DashboardLayout>
  );
}
