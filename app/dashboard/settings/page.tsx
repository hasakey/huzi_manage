import DashboardLayout from "@/app/components/layout/DashboardLayout";
import ChangePasswordForm from "./change-password-form";

export default async function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">设置</h1>
          <p className="text-gray-600">管理你的账户设置</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">修改密码</h2>
          <ChangePasswordForm />
        </div>
      </div>
    </DashboardLayout>
  );
}
