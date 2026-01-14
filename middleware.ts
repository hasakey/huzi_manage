import { updateSession } from "@/utils/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware 配置
 * 匹配所有路径，除了静态文件和 API 路由
 */
export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // 认证路由
  const isAuthRoute = pathname === "/login" || pathname === "/change-password";
  
  // 受保护的路由
  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  
  // 管理员路由
  const isAdminRoute = pathname.startsWith("/admin");

  // 如果访问受保护的路由但未登录，重定向到登录页
  if (isProtectedRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  // 如果已登录但访问登录页，根据角色重定向
  if (isAuthRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    
    // 获取用户角色（简化版，实际角色检查在页面组件中）
    // 这里先重定向到 dashboard，页面组件会根据角色再次重定向
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico, sitemap.xml, robots.txt (静态文件)
     * - public 文件夹中的文件
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
