-- 修复 transactions 表的 INSERT 策略，允许用户创建充值和提现请求
-- ============================================
-- 注意：如果之前执行过 fix_rls_recursion.sql，请先执行此文件更新策略

-- 删除旧的策略
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;

-- 创建新策略：用户可以插入自己的 transactions（充值和提现都可以，但必须是 pending 状态）
CREATE POLICY "Users can insert their own transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND type IN ('deposit', 'withdraw')
    AND status = 'pending'
  );
