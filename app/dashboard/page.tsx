import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { getCurrentUserProfile } from "@/app/auth/utils";
import { getUserTransactionStats } from "@/app/dashboard/actions";
import { redirect } from "next/navigation";
import TransactionChart from "./transaction-chart";

export default async function UserDashboardPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const statsResult = await getUserTransactionStats();
  const chartData = statsResult.success ? statsResult.data || [] : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">用户仪表板</h1>
          <p className="text-gray-600">欢迎回来，{profile.full_name || profile.email}</p>
        </div>

        {/* 余额卡片 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">当前余额</p>
            <p className="text-4xl font-bold text-gray-900">
              ¥{profile.balance.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* 交易统计图表 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">交易统计（最近30天）</h2>
          {statsResult.success && chartData.length > 0 ? (
            <TransactionChart data={chartData} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              {statsResult.error || "暂无交易数据"}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
