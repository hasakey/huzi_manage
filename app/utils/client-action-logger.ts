/**
 * 客户端 Server Action 日志拦截器
 * 统一处理所有 Server Actions 的调用日志，无需在每个组件中添加日志代码
 * 
 * 使用方法：
 * 在客户端组件中，使用 logServerAction 包装 Server Action 调用
 * 
 * 示例：
 * ```tsx
 * import { addTodo } from "@/app/actions/todo-actions";
 * import { logServerAction } from "@/app/utils/client-action-logger";
 * 
 * const result = await logServerAction("添加待办", addTodo, formData);
 * ```
 */

const isDev = typeof window !== "undefined" && process.env.NODE_ENV === "development";

/**
 * 记录 Server Action 调用的日志
 * @param actionName Action 名称
 * @param action Server Action 函数
 * @param args Action 参数
 * @returns Action 返回结果
 */
export async function logServerAction<T extends unknown[], R>(
  actionName: string,
  action: (...args: T) => Promise<R>,
  ...args: T
): Promise<R> {
  if (!isDev) {
    // 生产环境直接执行，不记录日志
    return action(...args);
  }

  // 格式化参数用于日志
  const formattedArgs = formatArgsForLog(args);
  
  console.log(`\n[客户端] 调用 Server Action: ${actionName}`);
  console.log(`[客户端] 参数:`, formattedArgs);
  
  const startTime = Date.now();

  try {
    const result = await action(...args);
    const duration = Date.now() - startTime;

    console.log(`[客户端] ${actionName} - 执行成功 (耗时: ${duration}ms)`);
    console.log(`[客户端] ${actionName} - 返回结果:`, result);
    console.log(`[客户端] ${actionName} - 执行结束\n`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error(`[客户端] ${actionName} - ✗ 执行失败 (耗时: ${duration}ms)`);
    if (error instanceof Error) {
      console.error(`[客户端] ${actionName} - 错误信息:`, error.message);
    } else {
      console.error(`[客户端] ${actionName} - 错误:`, error);
    }
    console.log(`[客户端] ${actionName} - 执行结束\n`);

    throw error;
  }
}

/**
 * 格式化参数用于日志（隐藏敏感信息）
 */
function formatArgsForLog(args: unknown[]): unknown {
  if (args.length === 0) return "无参数";

  // 如果是 FormData，提取并格式化
  if (args[0] instanceof FormData) {
    const formData = args[0] as FormData;
    const entries: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {
      // 隐藏密码字段
      if (key.toLowerCase().includes("password")) {
        entries[key] = "***隐藏***";
      } else {
        entries[key] = value.toString();
      }
    }

    return { FormData: entries };
  }

  // 如果是普通参数，格式化对象（隐藏密码字段）
  if (typeof args[0] === "object" && args[0] !== null) {
    const formatted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args[0])) {
      if (key.toLowerCase().includes("password")) {
        formatted[key] = "***隐藏***";
      } else {
        formatted[key] = value;
      }
    }
    return formatted;
  }

  return args;
}
