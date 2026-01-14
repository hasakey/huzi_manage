import LoginForm from "./login-form";

export default async function LoginPage() {
  // Middleware 已经处理了路由保护，这里不需要再次检查
  // 如果已登录，middleware 会自动重定向到首页
  return <LoginForm />;
}
