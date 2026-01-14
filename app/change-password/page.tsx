import ChangePasswordForm from "./change-password-form";

export default function ChangePasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">修改密码</h1>
            <p className="mt-2 text-sm text-gray-600">请填写以下信息修改密码</p>
          </div>
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  );
}
