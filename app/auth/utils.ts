import { createClient } from "@/utils/supabase/server";

/**
 * 获取当前登录用户信息
 * 在 Server Component 中使用
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}
