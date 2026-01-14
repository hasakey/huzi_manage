import { createClient } from "@/utils/supabase/server";

export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  role: "admin" | "user";
  balance: number;
  full_name: string | null;
}

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

/**
 * 获取当前用户的完整 Profile（包含 role 和 balance）
 * 在 Server Component 中使用
 * 
 * 注意：如果遇到 RLS 无限递归错误，请执行 supabase/migrations/fix_rls_recursion.sql
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[getCurrentUserProfile] 用户认证失败:", userError?.message);
      return null;
    }

    // 方法 1: 直接查询 profiles 表（如果 RLS 策略已修复）
    // 方法 2: 如果遇到递归错误，可以临时使用 RPC 函数
    // 这里先尝试直接查询，如果失败会返回 null
    
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, balance, full_name, email, phone")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("[getCurrentUserProfile] 查询 profile 失败:", profileError.message);
      console.error("[getCurrentUserProfile] 错误详情:", profileError);
      
      // 如果是 RLS 递归错误，提示用户执行修复 SQL
      if (profileError.code === '42P17') {
        console.error("[getCurrentUserProfile] ⚠️ RLS 策略无限递归错误！");
        console.error("[getCurrentUserProfile] 请执行 supabase/migrations/fix_rls_recursion.sql 来修复此问题");
      }
      
      return null;
    }

    if (!profile) {
      console.error("[getCurrentUserProfile] Profile 不存在，用户 ID:", user.id);
      return null;
    }

    const profileWithContact = profile as { email?: string; phone?: string | null };
    return {
      id: user.id,
      email: profileWithContact.email || user.email || "",
      phone: profileWithContact.phone || null,
      role: profile.role as "admin" | "user",
      balance: Number(profile.balance),
      full_name: profile.full_name,
    };
  } catch (error) {
    console.error("[getCurrentUserProfile] 发生异常:", error);
    return null;
  }
}
