import { createClient } from "@supabase/supabase-js";

/**
 * 创建 Supabase Admin 客户端（使用 Service Role Key）
 * 仅在 Server Actions 中使用，用于需要管理员权限的操作
 * 
 * 注意：Service Role Key 具有完全权限，请确保：
 * 1. 仅在服务器端使用
 * 2. 不要暴露给客户端
 * 3. 仅在需要管理员权限的操作中使用
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "缺少 Supabase 配置：需要 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
