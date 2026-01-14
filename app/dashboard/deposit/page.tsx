import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { getCurrentUserProfile } from "@/app/auth/utils";
import { redirect } from "next/navigation";
import DepositForm from "./deposit-form";

export default async function DepositPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">充值</h1>
          <p className="text-gray-600">申请充值</p>
        </div>

        <DepositForm currentBalance={profile.balance} />
      </div>
    </DashboardLayout>
  );
}
