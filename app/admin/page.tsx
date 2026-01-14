import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { getSystemStats } from "@/app/admin/actions";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/app/auth/utils";
import { Users, AlertCircle, TrendingUp, Wallet } from "lucide-react";

export default async function AdminDashboardPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const statsResult = await getSystemStats();

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">管理员仪表板</h1>
          <p className="text-gray-600">系统管理概览</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* 总用户数 */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">总用户数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsResult.success && statsResult.data
                    ? statsResult.data.totalUsers
                    : "-"}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* 待审核交易 */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">待审核交易</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsResult.success && statsResult.data
                    ? statsResult.data.pendingTransactions
                    : "-"}
                </p>
                <p className="text-xs text-gray-500">
                  {statsResult.success && statsResult.data
                    ? `充值: ${statsResult.data.pendingDeposits} | 提现: ${statsResult.data.pendingWithdrawals}`
                    : "充值和提现"}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* 总交易数 */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">总交易数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsResult.success && statsResult.data
                    ? statsResult.data.totalTransactions
                    : "-"}
                </p>
                <p className="text-xs text-gray-500">所有交易记录</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 更多统计信息 */}
        {statsResult.success && statsResult.data && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* 总余额 */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">系统总余额</p>
                  <p className="text-2xl font-bold text-green-600">
                    ¥{statsResult.data.totalBalance.toLocaleString("zh-CN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* 交易统计 */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-600">交易统计</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">总充值</span>
                    <span className="text-lg font-semibold text-emerald-600">
                      ¥{statsResult.data.totalDeposit.toLocaleString("zh-CN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">总提现</span>
                    <span className="text-lg font-semibold text-red-600">
                      ¥{statsResult.data.totalWithdraw.toLocaleString("zh-CN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {!statsResult.success && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-600">{statsResult.error || "加载统计数据失败"}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
