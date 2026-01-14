import { getCurrentUserProfile } from "@/app/auth/utils";
import { redirect } from "next/navigation";

export default async function Home() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // 根据角色重定向到对应的仪表板
  // role 字段：'admin' 表示管理员，'user' 表示普通用户
  if (profile.role === "admin") {
    redirect("/admin");
  } else {
    redirect("/dashboard");
  }
}
