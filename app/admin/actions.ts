"use server";

import { createServerActionClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { wrapServerAction } from "@/app/utils/server-action-wrapper";

export interface User {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  role: "admin" | "user";
  balance: number;
  created_at: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 检查当前用户是否是管理员
 */
async function checkAdmin(): Promise<{ isAdmin: boolean; userId: string | null }> {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, userId: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    isAdmin: profile?.role === "admin",
    userId: user.id,
  };
}

/**
 * 获取所有用户列表 - 内部实现
 */
async function _getAllUsers(): Promise<ActionResult<User[]>> {
  try {
    const { isAdmin } = await checkAdmin();

    if (!isAdmin) {
      return {
        success: false,
        error: "权限不足：仅管理员可以查看所有用户",
      };
    }

    const supabase = await createServerActionClient();

    // 获取所有 profiles（管理员可以查看所有，因为 RLS 策略允许）
    // 包含 email 和 phone 字段（如果已添加到 profiles 表）
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, balance, full_name, email, phone, created_at")
      .order("created_at", { ascending: false });

    if (profileError) {
      return {
        success: false,
        error: `获取用户资料失败: ${profileError.message}`,
      };
    }

    if (!profiles || profiles.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // 获取用户邮箱（通过查询 auth.users，但我们需要使用另一种方式）
    // 由于无法直接查询 auth.users，我们从 profiles 中获取信息
    // 邮箱信息需要从其他地方获取，或者存储在 profiles 中
    // 暂时使用 profiles 数据，邮箱可以通过其他方式获取

    const users: User[] = profiles.map((profile) => {
      const profileWithContact = profile as {
        email?: string;
        phone?: string | null;
      };
      return {
        id: profile.id,
        email: profileWithContact.email || "", // 从 profiles 表获取邮箱（如果已同步）
        phone: profileWithContact.phone || null, // 从 profiles 表获取手机号（如果已同步）
        full_name: profile.full_name,
        role: (profile.role as "admin" | "user") || "user",
        balance: Number(profile.balance || 0),
        created_at: profile.created_at,
      };
    });

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取用户列表时发生未知错误",
    };
  }
}

/**
 * 更新用户信息 - 内部实现
 */
async function _updateUserProfile(
  userId: string,
  fullName: string
): Promise<ActionResult<User>> {
  try {
    const { isAdmin } = await checkAdmin();

    if (!isAdmin) {
      return {
        success: false,
        error: "权限不足：仅管理员可以更新用户信息",
      };
    }

    const supabase = await createServerActionClient();

    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() || null })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `更新用户信息失败: ${error.message}`,
      };
    }

    // 获取用户邮箱和手机号（从 profiles 表，如果已同步）
    const profileWithContact = data as { email?: string; phone?: string | null };
    let email = profileWithContact.email || "";
    let phone = profileWithContact.phone || null;
    
    // 尝试使用 admin API 获取（如果 profiles 中没有）
    if (!email || !phone) {
      try {
        const adminClient = createAdminClient();
        const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
        if (authUser?.user) {
          email = email || authUser.user.email || "";
          phone = phone || authUser.user.phone || null;
        }
      } catch {
        // Admin API 不可用，忽略
      }
    }

    revalidatePath("/admin/users");

    return {
      success: true,
      data: {
        id: userId,
        email: email,
        phone: phone,
        full_name: data.full_name,
        role: data.role as "admin" | "user",
        balance: Number(data.balance),
        created_at: data.created_at,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新用户信息时发生未知错误",
    };
  }
}

/**
 * 为用户充值 - 内部实现
 */
async function _rechargeUser(
  userId: string,
  amount: number
): Promise<ActionResult<User>> {
  try {
    const { isAdmin } = await checkAdmin();

    if (!isAdmin) {
      return {
        success: false,
        error: "权限不足：仅管理员可以为用户充值",
      };
    }

    if (amount <= 0) {
      return {
        success: false,
        error: "充值金额必须大于 0",
      };
    }

    const supabase = await createServerActionClient();

    // 1. 获取当前余额
    const { data: currentProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("balance, full_name, role, created_at")
      .eq("id", userId)
      .single();

    if (fetchError || !currentProfile) {
      return {
        success: false,
        error: `获取用户信息失败: ${fetchError?.message || "用户不存在"}`,
      };
    }

    // 2. 计算新余额
    const newBalance = Number(currentProfile.balance || 0) + amount;

    // 3. 更新用户余额
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", userId)
      .select("id, role, balance, full_name, email, phone, created_at")
      .single();

    if (updateError) {
      return {
        success: false,
        error: `更新余额失败: ${updateError.message}`,
      };
    }

    // 4. 创建充值交易记录
    const { error: transactionError } = await supabase.from("transactions").insert({
      user_id: userId,
      amount: amount,
      type: "deposit",
      status: "approved",
    });

    if (transactionError) {
      return {
        success: false,
        error: `创建交易记录失败: ${transactionError.message}`,
      };
    }

    // 5. 获取用户邮箱和手机号（从 profiles 表，如果已同步）
    const profileWithContact = updatedProfile as { email?: string; phone?: string | null };
    let userEmail = profileWithContact.email || "";
    let userPhone = profileWithContact.phone || null;
    
    // 如果 profiles 表中没有邮箱或手机号，尝试使用 Admin API 获取
    if (!userEmail || userPhone === null) {
      try {
        const adminClient = createAdminClient();
        const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
        if (authUser?.user) {
          userEmail = userEmail || authUser.user.email || "";
          userPhone = userPhone || authUser.user.phone || null;
        }
      } catch (error) {
        // Admin API 不可用，忽略错误，使用已有的数据
        console.warn("无法通过 Admin API 获取用户邮箱/手机号:", error);
      }
    }

    revalidatePath("/admin/users");

    return {
      success: true,
      data: {
        id: userId,
        email: userEmail,
        phone: userPhone,
        full_name: updatedProfile.full_name,
        role: updatedProfile.role as "admin" | "user",
        balance: Number(updatedProfile.balance),
        created_at: updatedProfile.created_at,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "充值时发生未知错误",
    };
  }
}

/**
 * 获取所有用户列表（带统一日志）
 */
export const getAllUsers = wrapServerAction("获取所有用户", _getAllUsers);

/**
 * 更新用户信息（带统一日志）
 */
export const updateUserProfile = wrapServerAction(
  "更新用户信息",
  _updateUserProfile
);

/**
 * 为用户充值（带统一日志）
 */
export const rechargeUser = wrapServerAction("为用户充值", _rechargeUser);

export interface CreateUserResult {
  id: string;
  email: string;
  password: string;
}

/**
 * 管理员创建用户账号 - 内部实现
 * @param email 用户邮箱（账号名）
 * @param generateRandomEmail 是否生成随机邮箱（如果为 true，则忽略 email 参数）
 */
async function _createUser(
  email: string | null,
  generateRandomEmail: boolean
): Promise<ActionResult<CreateUserResult>> {
  try {
    const { isAdmin } = await checkAdmin();

    if (!isAdmin) {
      return {
        success: false,
        error: "权限不足：仅管理员可以创建账号",
      };
    }

    const adminClient = createAdminClient();
    const defaultPassword = "000000";

    let finalEmail: string;

    // 生成随机邮箱或使用提供的邮箱
    if (generateRandomEmail) {
      // 生成随机邮箱：user_随机数字@example.com
      const randomNum = Math.floor(Math.random() * 1000000);
      finalEmail = `user_${randomNum}@example.com`;
    } else {
      if (!email || !email.trim()) {
        return {
          success: false,
          error: "邮箱不能为空",
        };
      }
      finalEmail = email.trim().toLowerCase();

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(finalEmail)) {
        return {
          success: false,
          error: "邮箱格式不正确",
        };
      }

      // 检查邮箱是否已存在（通过尝试列出用户）
      // 注意：如果用户很多，这可能会很慢，但 Supabase Admin API 没有直接的 getUserByEmail 方法
      // 另一种方法是直接尝试创建，如果邮箱已存在会返回错误
      // 这里我们先尝试创建，如果失败再检查是否是邮箱重复错误
    }

    // 使用 Admin API 创建用户
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: finalEmail,
      password: defaultPassword,
      email_confirm: true, // 自动确认邮箱，无需验证
    });

    if (createError || !newUser.user) {
      // 检查是否是邮箱重复错误
      const errorMessage = createError?.message?.toLowerCase() || "";
      if (errorMessage.includes("already registered") || 
          errorMessage.includes("already exists") ||
          errorMessage.includes("duplicate") ||
          errorMessage.includes("user already")) {
        return {
          success: false,
          error: "该邮箱已被使用",
        };
      }
      return {
        success: false,
        error: `创建用户失败: ${createError?.message || "未知错误"}`,
      };
    }

    // 触发器会自动创建 profile，但我们需要确保它存在
    // 等待一下让触发器执行
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 检查并创建 profile（如果触发器没有执行）
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("id", newUser.user.id)
      .single();

    if (!profile) {
      // 手动创建 profile
      const { error: profileError } = await adminClient.from("profiles").insert({
        id: newUser.user.id,
        role: "user",
        balance: 0,
        email: finalEmail,
      });

      if (profileError) {
        console.error("创建 profile 失败:", profileError);
        // 即使 profile 创建失败，用户也已经创建了，返回成功但记录错误
      }
    }

    // 刷新页面数据
    revalidatePath("/admin/users");
    revalidatePath("/admin");

    return {
      success: true,
      data: {
        id: newUser.user.id,
        email: finalEmail,
        password: defaultPassword,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

// 导出包装后的 Server Action
export const createUser = wrapServerAction("创建用户账号", _createUser);

export interface WithdrawalTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: "deposit" | "withdraw";
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
  };
}

/**
 * 获取所有待审核的交易请求（充值和提现）- 内部实现
 */
async function _getPendingTransactions(): Promise<ActionResult<WithdrawalTransaction[]>> {
  try {
    const { isAdmin } = await checkAdmin();

    if (!isAdmin) {
      return {
        success: false,
        error: "权限不足：仅管理员可以查看交易请求",
      };
    }

    const supabase = await createServerActionClient();

    // 获取所有待审核的交易请求（充值和提现）
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("id, user_id, amount, type, status, created_at, updated_at")
      .in("type", ["deposit", "withdraw"])
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (transactionsError) {
      return {
        success: false,
        error: `获取交易请求失败: ${transactionsError.message}`,
      };
    }

    // 获取用户信息
    const userIds = transactions?.map((t) => t.user_id) || [];
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .in("id", userIds);

    if (profilesError) {
      console.error("获取用户信息失败:", profilesError);
    }

    // 合并用户信息到交易记录
    const transactionsWithUsers: WithdrawalTransaction[] =
      transactions?.map((transaction) => {
        const profile = profiles?.find((p) => p.id === transaction.user_id);
        return {
          ...transaction,
          amount: Number(transaction.amount),
          user: profile
            ? {
                id: profile.id,
                email: profile.email || "",
                full_name: profile.full_name,
                phone: profile.phone,
              }
            : undefined,
        };
      }) || [];

    return {
      success: true,
      data: transactionsWithUsers,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

/**
 * 审核交易请求（充值或提现）- 内部实现
 * @param transactionId 交易 ID
 * @param action 审核操作：'approve' 或 'reject'
 */
async function _reviewTransaction(
  transactionId: string,
  action: "approve" | "reject"
): Promise<ActionResult<WithdrawalTransaction>> {
  try {
    const { isAdmin } = await checkAdmin();

    if (!isAdmin) {
      return {
        success: false,
        error: "权限不足：仅管理员可以审核交易请求",
      };
    }

    if (action !== "approve" && action !== "reject") {
      return {
        success: false,
        error: "无效的审核操作",
      };
    }

    const supabase = await createServerActionClient();

    // 1. 获取交易记录
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("id, user_id, amount, type, status")
      .eq("id", transactionId)
      .single();

    if (fetchError || !transaction) {
      return {
        success: false,
        error: `获取交易记录失败: ${fetchError?.message || "交易不存在"}`,
      };
    }

    // 验证交易状态
    if (transaction.status !== "pending") {
      return {
        success: false,
        error: `交易状态不正确，当前状态: ${transaction.status}`,
      };
    }

    if (transaction.type !== "withdraw" && transaction.type !== "deposit") {
      return {
        success: false,
        error: "只能审核充值或提现类型的交易",
      };
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    const amount = Number(transaction.amount);

    // 2. 如果是批准提现，需要验证余额是否足够
    // 注意：余额扣除/增加由数据库触发器自动处理，这里只需要验证
    if (action === "approve" && transaction.type === "withdraw") {
      // 2.1 获取当前余额
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", transaction.user_id)
        .single();

      if (profileError || !profile) {
        return {
          success: false,
          error: `获取用户信息失败: ${profileError?.message || "用户不存在"}`,
        };
      }

      const currentBalance = Number(profile.balance || 0);

      // 2.2 验证余额是否足够（仅提现需要）
      if (currentBalance < amount) {
        return {
          success: false,
          error: `用户余额不足，当前余额: ¥${currentBalance.toFixed(2)}`,
        };
      }
    }

    // 3. 更新交易状态（触发器会自动扣除余额）
    const { data: updatedTransaction, error: updateError } = await supabase
      .from("transactions")
      .update({ status: newStatus })
      .eq("id", transactionId)
      .select("id, user_id, amount, type, status, created_at, updated_at")
      .single();

    if (updateError) {
      return {
        success: false,
        error: `更新交易状态失败: ${updateError.message}`,
      };
    }

    // 获取用户信息
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("id", transaction.user_id)
      .single();

    const result: WithdrawalTransaction = {
      ...updatedTransaction,
      amount: Number(updatedTransaction.amount),
      user: profile
        ? {
            id: profile.id,
            email: profile.email || "",
            full_name: profile.full_name,
            phone: profile.phone,
          }
        : undefined,
    };

    // 刷新页面数据
    revalidatePath("/admin/withdrawals");
    revalidatePath("/admin");

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

export interface TransactionFilters {
  type?: "deposit" | "withdraw" | "all";
  status?: "pending" | "approved" | "rejected" | "all";
  userId?: string | "all";
  startDate?: string;
  endDate?: string;
}

/**
 * 获取所有交易记录（管理员）- 内部实现
 * @param filters 筛选条件
 */
async function _getAllTransactions(
  filters?: TransactionFilters
): Promise<ActionResult<WithdrawalTransaction[]>> {
  try {
    const { isAdmin } = await checkAdmin();

    if (!isAdmin) {
      return {
        success: false,
        error: "权限不足：仅管理员可以查看所有交易记录",
      };
    }

    const supabase = await createServerActionClient();

    // 构建查询
    let query = supabase
      .from("transactions")
      .select("id, user_id, amount, type, status, created_at, updated_at");

    // 应用筛选条件
    if (filters?.type && filters.type !== "all") {
      query = query.eq("type", filters.type);
    }

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters?.userId && filters.userId !== "all") {
      query = query.eq("user_id", filters.userId);
    }

    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate);
    }

    if (filters?.endDate) {
      // 结束日期设置为当天的 23:59:59
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte("created_at", endDate.toISOString());
    }

    // 排序
    query = query.order("created_at", { ascending: false });

    const { data: transactions, error: transactionsError } = await query;

    if (transactionsError) {
      return {
        success: false,
        error: `获取交易记录失败: ${transactionsError.message}`,
      };
    }

    // 获取用户信息
    const userIds = transactions?.map((t) => t.user_id) || [];
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .in("id", userIds);

    if (profilesError) {
      console.error("获取用户信息失败:", profilesError);
    }

    // 合并用户信息到交易记录
    const transactionsWithUsers: WithdrawalTransaction[] =
      transactions?.map((transaction) => {
        const profile = profiles?.find((p) => p.id === transaction.user_id);
        return {
          ...transaction,
          amount: Number(transaction.amount),
          type: transaction.type || "withdraw", // 确保 type 字段存在
          user: profile
            ? {
                id: profile.id,
                email: profile.email || "",
                full_name: profile.full_name,
                phone: profile.phone,
              }
            : undefined,
        };
      }) || [];

    return {
      success: true,
      data: transactionsWithUsers,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

// 导出包装后的 Server Actions
export const getPendingTransactions = wrapServerAction(
  "获取待审核交易请求",
  _getPendingTransactions
);
export const reviewTransaction = wrapServerAction("审核交易请求", _reviewTransaction);
export const getAllTransactions = wrapServerAction("获取所有交易记录", _getAllTransactions);

export interface SystemStats {
  totalUsers: number;
  totalBalance: number;
  totalTransactions: number;
  totalDeposit: number;
  totalWithdraw: number;
  pendingWithdrawals: number;
  pendingDeposits: number;
  pendingTransactions: number;
  dailyStats: { date: string; deposit: number; withdraw: number }[];
}

/**
 * 获取系统统计信息 - 内部实现
 */
async function _getSystemStats(): Promise<ActionResult<SystemStats>> {
  try {
    const { isAdmin } = await checkAdmin();

    if (!isAdmin) {
      return {
        success: false,
        error: "权限不足：仅管理员可以查看系统统计",
      };
    }

    const supabase = await createServerActionClient();

    // 1. 获取总用户数
    const { count: totalUsers, error: usersError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (usersError) {
      return {
        success: false,
        error: `获取用户数失败: ${usersError.message}`,
      };
    }

    // 2. 获取总余额
    const { data: profiles, error: balanceError } = await supabase
      .from("profiles")
      .select("balance");

    if (balanceError) {
      return {
        success: false,
        error: `获取余额失败: ${balanceError.message}`,
      };
    }

    const totalBalance =
      profiles?.reduce((sum, p) => sum + Number(p.balance || 0), 0) || 0;

    // 3. 获取交易统计
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("amount, type, status");

    if (transactionsError) {
      return {
        success: false,
        error: `获取交易记录失败: ${transactionsError.message}`,
      };
    }

    const totalTransactions = transactions?.length || 0;
    const totalDeposit =
      transactions
        ?.filter((t) => t.type === "deposit" && t.status === "approved")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;
    const totalWithdraw =
      transactions
        ?.filter((t) => t.type === "withdraw" && t.status === "approved")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;
    const pendingWithdrawals =
      transactions?.filter((t) => t.type === "withdraw" && t.status === "pending").length || 0;
    const pendingDeposits =
      transactions?.filter((t) => t.type === "deposit" && t.status === "pending").length || 0;
    const pendingTransactions = pendingWithdrawals + pendingDeposits;

    // 4. 获取最近30天的每日交易统计
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentTransactions, error: recentError } = await supabase
      .from("transactions")
      .select("amount, type, status, created_at")
      .in("status", ["approved", "pending"])
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    if (recentError) {
      return {
        success: false,
        error: `获取最近交易记录失败: ${recentError.message}`,
      };
    }

    // 按日期分组统计
    const dailyStats: Record<string, { deposit: number; withdraw: number }> = {};

    // 初始化最近30天的日期
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      dailyStats[dateKey] = { deposit: 0, withdraw: 0 };
    }

    // 统计每日交易
    recentTransactions?.forEach((transaction) => {
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
    const dailyStatsArray = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      deposit: stats.deposit,
      withdraw: stats.withdraw,
    }));

    return {
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalBalance,
        totalTransactions,
        totalDeposit,
        totalWithdraw,
        pendingWithdrawals,
        pendingDeposits,
        pendingTransactions,
        dailyStats: dailyStatsArray,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

// 导出包装后的 Server Action
export const getSystemStats = wrapServerAction("获取系统统计", _getSystemStats);
