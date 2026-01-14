import { getCurrentUserProfile } from "@/app/auth/utils";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user";
}

export default async function DashboardLayout({
  children,
  requiredRole,
}: DashboardLayoutProps) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // 角色检查
  if (requiredRole === "admin" && profile.role !== "admin") {
    redirect("/dashboard");
  }

  if (requiredRole === "user" && profile.role === "admin") {
    redirect("/admin");
  }

  return (
    <div className="flex h-screen">
      <Sidebar role={profile.role} userName={profile.full_name || profile.email} />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
