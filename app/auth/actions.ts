"use server";

import { createServerActionClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { wrapServerAction } from "@/app/utils/server-action-wrapper";

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

/**
 * 用户登录 - 内部实现
 */
async function _login(formData: FormData): Promise<AuthActionResult> {
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
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "登录时发生未知错误",
    };
  }
}


/**
 * 用户登出 - 内部实现
 */
async function _logout(): Promise<{ success: boolean }> {
  try {
    const supabase = await createServerActionClient();
    await supabase.auth.signOut();
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("登出失败:", error);
    return { success: false };
  }
}

/**
 * 修改密码 - 内部实现
 */
async function _changePassword(formData: FormData): Promise<AuthActionResult> {
  try {
    const supabase = await createServerActionClient();

    const currentPassword = formData.get("currentPassword")?.toString();
    const newPassword = formData.get("newPassword")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return {
        success: false,
        error: "所有字段都不能为空",
      };
    }

    if (newPassword.length < 6) {
      return {
        success: false,
        error: "新密码长度至少为 6 位",
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        success: false,
        error: "新密码和确认密码不匹配",
      };
    }

    // 获取当前用户
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "未登录或用户认证失败",
      };
    }

    // 验证当前密码（通过尝试登录）
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (verifyError) {
      return {
        success: false,
        error: "当前密码不正确",
      };
    }

    // 更新密码
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return {
        success: false,
        error: updateError.message || "修改密码失败",
      };
    }

    revalidatePath("/");
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "修改密码时发生未知错误",
    };
  }
}

/**
 * 用户登录（带统一日志）
 * @param formData 包含 email 和 password 的表单数据
 */
export const login = wrapServerAction("用户登录", _login);

/**
 * 用户登出（带统一日志）
 */
export const logout = wrapServerAction("用户登出", _logout);

/**
 * 修改密码（带统一日志）
 * @param formData 包含 currentPassword, newPassword, confirmPassword 的表单数据
 */
export const changePassword = wrapServerAction("修改密码", _changePassword);
