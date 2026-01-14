import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { getSystemStats } from "@/app/admin/actions";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/app/auth/utils";
import StatsCards from "./stats-cards";
import SystemChart from "./system-chart";

export default async function AdminStatsPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const statsResult = await getSystemStats();

  if (!statsResult.success || !statsResult.data) {
    return (
      <DashboardLayout requiredRole="admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">统计</h1>
            <p className="text-gray-600">系统统计数据</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-red-600">{statsResult.error || "加载统计数据失败"}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stats = statsResult.data;

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">统计</h1>
          <p className="text-gray-600">系统统计数据</p>
        </div>

        {/* 统计卡片 */}
        <StatsCards stats={stats} />

        {/* 交易趋势图表 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">交易趋势（最近30天）</h2>
          {stats.dailyStats.length > 0 ? (
            <SystemChart data={stats.dailyStats} />
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-500">
              暂无交易数据
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
