import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { getPendingTransactions } from "@/app/admin/actions";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/app/auth/utils";
import TransactionsTable from "./withdrawals-table";

export default async function AdminTransactionsPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const result = await getPendingTransactions();

  if (!result.success) {
    return (
      <DashboardLayout requiredRole="admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">交易审核</h1>
            <p className="text-gray-600">审核待处理的充值和提现请求</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-red-600">加载失败: {result.error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">交易审核</h1>
          <p className="text-gray-600">审核待处理的充值和提现请求</p>
        </div>

        <TransactionsTable transactions={result.data || []} />
      </div>
    </DashboardLayout>
  );
}
