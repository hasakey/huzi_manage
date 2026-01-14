import { getCurrentUser } from "@/app/auth/utils";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();

  // 如果已登录，重定向到首页
  if (user) {
    redirect("/");
  }

  return <LoginForm />;
}
