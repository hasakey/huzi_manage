import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { getUserTransactions } from "@/app/dashboard/actions";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/app/auth/utils";
import TransactionsTable from "./transactions-table";

export default async function UserTransactionsPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const result = await getUserTransactions();

  if (!result.success) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">交易记录</h1>
            <p className="text-gray-600">查看您的充值和提现记录</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-red-600">{result.error || "加载交易记录失败"}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">交易记录</h1>
          <p className="text-gray-600">查看您的充值和提现记录</p>
        </div>

        <TransactionsTable transactions={result.data || []} />
      </div>
    </DashboardLayout>
  );
}
