"use server";

import { createServerActionClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

/**
 * 用户登录
 * @param formData 包含 email 和 password 的表单数据
 */
export async function login(formData: FormData): Promise<AuthActionResult> {
  try {
    const supabase = await createServerActionClient();

    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      return {
        success: false,
        error: "邮箱和密码不能为空",
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "登录失败",
      };
    }

    revalidatePath("/");
    redirect("/");
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "登录时发生未知错误",
    };
  }
}

/**
 * 用户注册
 * @param formData 包含 email 和 password 的表单数据
 */
export async function signup(formData: FormData): Promise<AuthActionResult> {
  try {
    const supabase = await createServerActionClient();

    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      return {
        success: false,
        error: "邮箱和密码不能为空",
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: "密码长度至少为 6 位",
      };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "注册失败",
      };
    }

    revalidatePath("/");
    redirect("/");
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "注册时发生未知错误",
    };
  }
}

/**
 * 用户登出
 */
export async function logout(): Promise<void> {
  try {
    const supabase = await createServerActionClient();
    await supabase.auth.signOut();
    revalidatePath("/");
    redirect("/login");
  } catch (error) {
    console.error("登出失败:", error);
    redirect("/login");
  }
}
