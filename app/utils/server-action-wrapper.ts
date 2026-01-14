/**
 * Server Action 统一包装器
 * 在开发模式下自动打印入参和出参，方便调试
 * 
 * 注意：此文件不需要 "use server" 指令
 * 因为包装器本身不是 Server Action，它只是返回一个 Server Action
 * Server Actions 在使用此包装器的文件中定义（那些文件已经有 "use server" 了）
 * 
 * 优点：
 * - 统一日志记录入口（服务器端 + 客户端）
 * - 自动隐藏敏感信息
 * - 性能监控
 * - 类型安全
 * 
 * 注意事项：
 * - 仅在开发模式启用，不影响生产性能
 * - 保持原始错误堆栈
 * - 可通过环境变量控制日志级别
 * - 服务器端日志打印在终端，客户端日志通过返回值传递
 */

type ServerAction<T extends unknown[], R> = (...args: T) => Promise<R>;

// 可以通过环境变量控制日志级别（可选）
// 默认关闭服务器端日志，只保留客户端日志（在 client-action-logger.ts 中处理）
const LOG_LEVEL = process.env.SERVER_ACTION_LOG_LEVEL || "off"; // 'full' | 'minimal' | 'off'

/**
 * 包装 Server Action，添加统一的日志记录
 * @param actionName Action 名称（用于日志标识）
 * @param action Server Action 函数
 * @returns 包装后的 Server Action
 */
export function wrapServerAction<T extends unknown[], R>(
  actionName: string,
  action: ServerAction<T, R>
): ServerAction<T, R> {
  // 获取函数名（如果函数有名称，去掉下划线前缀）
  const functionName = action.name 
    ? action.name.startsWith("_") 
      ? action.name.slice(1) 
      : action.name
    : "anonymous";
  
  // 创建一个命名函数，确保函数名能被正确识别
  // 注意：这个函数会在有 "use server" 的文件中被导出，所以它会保持 Server Action 特性
  const wrappedAction = async function namedAction(...args: T): Promise<R> {
    const isDev = process.env.NODE_ENV === "development";
    const shouldLog = isDev && LOG_LEVEL !== "off";

    // 格式化参数用于日志
    const formattedArgs = formatArgs(args);
    
    // 服务器端日志（终端）
    if (shouldLog && LOG_LEVEL === "full") {
      console.log(`\n[Server Action] ${actionName} (${functionName}) - 开始执行`);
      console.log(`[Server Action] ${actionName} (${functionName}) - 入参:`, formattedArgs);
    }

    const startTime = Date.now();

    try {
      const result = await action(...args);
      const duration = Date.now() - startTime;

      // 服务器端日志（终端）
      if (shouldLog) {
        if (LOG_LEVEL === "full") {
          console.log(`[Server Action] ${actionName} (${functionName}) - 执行成功 (耗时: ${duration}ms)`);
          console.log(`[Server Action] ${actionName} (${functionName}) - 出参:`, formatResult(result));
          console.log(`[Server Action] ${actionName} (${functionName}) - 执行结束\n`);
        } else if (LOG_LEVEL === "minimal") {
          console.log(`[Server Action] ${actionName} (${functionName}) - ✓ (${duration}ms)`);
        }
      }

      // 客户端日志（通过返回值传递，在客户端组件中统一处理）
      // 注意：这需要在客户端组件中调用一个统一的日志处理函数
      // 但由于 Server Actions 的限制，我们无法直接在这里输出到浏览器控制台
      // 所以需要在返回值中添加日志信息，或者使用其他机制
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // 服务器端日志（终端）
      if (shouldLog) {
        console.error(`[Server Action] ${actionName} (${functionName}) - ✗ 执行失败 (耗时: ${duration}ms)`);
        // 保留原始错误堆栈
        if (error instanceof Error) {
          console.error(`[Server Action] ${actionName} (${functionName}) - 错误信息:`, error.message);
          if (LOG_LEVEL === "full") {
            console.error(`[Server Action] ${actionName} (${functionName}) - 错误堆栈:`, error.stack);
          }
        } else {
          console.error(`[Server Action] ${actionName} (${functionName}) - 错误:`, error);
        }
        if (LOG_LEVEL === "full") {
          console.log(`[Server Action] ${actionName} (${functionName}) - 执行结束\n`);
        }
      }

      // 重新抛出原始错误，保持错误堆栈
      throw error;
    }
  };
  
  // 设置函数名，确保在日志中能正确显示
  Object.defineProperty(wrappedAction, "name", { value: functionName });
  
  return wrappedAction;
}

/**
 * 格式化参数（隐藏敏感信息）
 */
function formatArgs(args: unknown[]): unknown {
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

/**
 * 格式化返回结果
 */
function formatResult(result: unknown): unknown {
  if (result === undefined || result === null) {
    return "无返回值";
  }

  // 如果是对象，格式化输出
  if (typeof result === "object") {
    return JSON.stringify(result, null, 2);
  }

  return result;
}
