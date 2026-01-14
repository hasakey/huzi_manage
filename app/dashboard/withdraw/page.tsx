import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { getCurrentUserProfile } from "@/app/auth/utils";
import { redirect } from "next/navigation";
import WithdrawForm from "./withdraw-form";

export default async function WithdrawPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">提现</h1>
          <p className="text-gray-600">申请提现</p>
        </div>

        <WithdrawForm currentBalance={profile.balance} />
      </div>
    </DashboardLayout>
  );
}
