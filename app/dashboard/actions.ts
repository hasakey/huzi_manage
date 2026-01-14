"use server";

import { createServerActionClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { wrapServerAction } from "@/app/utils/server-action-wrapper";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: "deposit" | "withdraw";
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

/**
 * 创建充值请求 - 内部实现
 * @param amount 充值金额
 */
async function _createDeposit(amount: number): Promise<ActionResult<Transaction>> {
  try {
    const supabase = await createServerActionClient();

    // 1. 获取当前用户
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

    // 2. 验证金额
    if (amount <= 0) {
      return {
        success: false,
        error: "充值金额必须大于 0",
      };
    }

    // 3. 创建充值交易记录（状态为 pending）
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        amount: amount,
        type: "deposit",
        status: "pending",
      })
      .select()
      .single();

    if (transactionError) {
      return {
        success: false,
        error: `创建充值请求失败: ${transactionError.message}`,
      };
    }

    // 刷新页面数据
    revalidatePath("/dashboard/deposit");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: transaction,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

/**
 * 创建提现请求 - 内部实现
 * @param amount 提现金额
 */
async function _createWithdrawal(amount: number): Promise<ActionResult<Transaction>> {
  try {
    const supabase = await createServerActionClient();

    // 1. 获取当前用户
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

    // 2. 验证金额
    if (amount <= 0) {
      return {
        success: false,
        error: "提现金额必须大于 0",
      };
    }

    // 3. 获取当前余额
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: `获取用户信息失败: ${profileError?.message || "用户不存在"}`,
      };
    }

    const currentBalance = Number(profile.balance || 0);

    // 4. 验证余额是否足够
    if (currentBalance < amount) {
      return {
        success: false,
        error: `余额不足，当前余额: ¥${currentBalance.toFixed(2)}`,
      };
    }

    // 5. 创建提现交易记录（状态为 pending）
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        amount: amount,
        type: "withdraw",
        status: "pending",
      })
      .select()
      .single();

    if (transactionError) {
      return {
        success: false,
        error: `创建提现请求失败: ${transactionError.message}`,
      };
    }

    // 刷新页面数据
    revalidatePath("/dashboard/withdraw");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: transaction,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

/**
 * 获取用户最近30天的交易统计 - 内部实现
 */
async function _getUserTransactionStats(): Promise<
  ActionResult<{ date: string; deposit: number; withdraw: number }[]>
> {
  try {
    const supabase = await createServerActionClient();

    // 1. 获取当前用户
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

    // 2. 获取最近30天的交易记录
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("amount, type, status, created_at")
      .eq("user_id", user.id)
      .in("status", ["approved", "pending"]) // 只统计已批准和待审核的交易
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    if (transactionsError) {
      return {
        success: false,
        error: `获取交易记录失败: ${transactionsError.message}`,
      };
    }

    // 3. 按日期分组统计
    const dailyStats: Record<string, { deposit: number; withdraw: number }> = {};

    // 初始化最近30天的日期
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      dailyStats[dateKey] = { deposit: 0, withdraw: 0 };
    }

    // 统计每日交易
    transactions?.forEach((transaction) => {
      const dateKey = transaction.created_at.split("T")[0];
      const amount = Number(transaction.amount);

      if (dailyStats[dateKey]) {
        if (transaction.type === "deposit") {
          dailyStats[dateKey].deposit += amount;
        } else if (transaction.type === "withdraw") {
          dailyStats[dateKey].withdraw += amount;
        }
      }
    });

    // 转换为数组格式
    const result = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      deposit: stats.deposit,
      withdraw: stats.withdraw,
    }));

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

/**
 * 获取用户交易记录 - 内部实现
 */
async function _getUserTransactions(): Promise<ActionResult<Transaction[]>> {
  try {
    const supabase = await createServerActionClient();

    // 1. 获取当前用户
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

    // 2. 获取所有交易记录
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("id, user_id, amount, type, status, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (transactionsError) {
      return {
        success: false,
        error: `获取交易记录失败: ${transactionsError.message}`,
      };
    }

    return {
      success: true,
      data: transactions?.map((t) => ({
        ...t,
        amount: Number(t.amount),
        type: t.type || "withdraw", // 确保 type 字段存在，默认为 withdraw
      })) || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

// 导出包装后的 Server Actions
export const createDeposit = wrapServerAction("创建充值请求", _createDeposit);
export const createWithdrawal = wrapServerAction("创建提现请求", _createWithdrawal);
export const getUserTransactions = wrapServerAction("获取用户交易记录", _getUserTransactions);
export const getUserTransactionStats = wrapServerAction(
  "获取用户交易统计",
  _getUserTransactionStats
);