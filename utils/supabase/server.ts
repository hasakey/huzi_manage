import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 创建用于 Server Components 的 Supabase 客户端
 * 在 Server Components 中使用此函数
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 在 Server Components 中，setAll 可能无法工作
            // 这是预期的行为，因为 Server Components 是只读的
          }
        },
      },
    }
  );
}

/**
 * 创建用于 Server Actions 的 Supabase 客户端
 * 在 Server Actions 中使用此函数
 */
export async function createServerActionClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Server Actions 中可以设置 cookies
            // 如果失败，记录错误
            console.error("Failed to set cookies in Server Action:", error);
          }
        },
      },
    }
  );
}
