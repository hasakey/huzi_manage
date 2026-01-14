"use server";

import { createServerActionClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { wrapServerAction } from "@/app/utils/server-action-wrapper";

export interface Todo {
  id: string;
  title: string;
  is_complete: boolean;
  user_id: string;
  created_at: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 获取当前用户的待办列表 - 内部实现
 * 可以在 Server Component 中直接调用
 */
async function _getTodos(): Promise<ActionResult<Todo[]>> {
  try {
    const supabase = await createServerActionClient();

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

    // 查询当前用户的 todos
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        success: false,
        error: `获取待办列表失败: ${error.message}`,
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

/**
 * 添加新的待办事项 - 内部实现
 * @param formData 包含 title 字段的表单数据
 */
async function _addTodo(formData: FormData): Promise<ActionResult<Todo>> {
  try {
    const supabase = await createServerActionClient();

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

    // 从 FormData 获取 title
    const title = formData.get("title")?.toString().trim();

    if (!title) {
      return {
        success: false,
        error: "标题不能为空",
      };
    }

    // 插入新记录
    const { data, error } = await supabase
      .from("todos")
      .insert({
        title,
        user_id: user.id,
        is_complete: false,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `添加待办失败: ${error.message}`,
      };
    }

    // 刷新页面数据
    revalidatePath("/");

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

/**
 * 切换待办事项的完成状态 - 内部实现
 * @param id 待办事项的 ID
 * @param currentStatus 当前的完成状态
 */
async function _toggleTodo(
  id: string,
  currentStatus: boolean
): Promise<ActionResult<Todo>> {
  try {
    const supabase = await createServerActionClient();

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

    if (!id) {
      return {
        success: false,
        error: "待办事项 ID 不能为空",
      };
    }

    // 更新完成状态
    const { data, error } = await supabase
      .from("todos")
      .update({ is_complete: !currentStatus })
      .eq("id", id)
      .eq("user_id", user.id) // 确保只能更新自己的数据
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `更新待办状态失败: ${error.message}`,
      };
    }

    if (!data) {
      return {
        success: false,
        error: "未找到该待办事项或无权操作",
      };
    }

    // 刷新页面数据
    revalidatePath("/");

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

/**
 * 删除待办事项 - 内部实现
 * @param id 待办事项的 ID
 */
async function _deleteTodo(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createServerActionClient();

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

    if (!id) {
      return {
        success: false,
        error: "待办事项 ID 不能为空",
      };
    }

    // 删除记录
    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id); // 确保只能删除自己的数据

    if (error) {
      return {
        success: false,
        error: `删除待办失败: ${error.message}`,
      };
    }

    // 刷新页面数据
    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

/**
 * 获取当前用户的待办列表（带统一日志）
 */
export const getTodos = wrapServerAction("获取待办列表", _getTodos);

/**
 * 添加新的待办事项（带统一日志）
 */
export const addTodo = wrapServerAction("添加待办", _addTodo);

/**
 * 切换待办事项的完成状态（带统一日志）
 */
export const toggleTodo = wrapServerAction("切换待办状态", _toggleTodo);

/**
 * 删除待办事项（带统一日志）
 */
export const deleteTodo = wrapServerAction("删除待办", _deleteTodo);
