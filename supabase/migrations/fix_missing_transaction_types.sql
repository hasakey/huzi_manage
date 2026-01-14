-- 修复缺失 type 字段的交易记录
-- ============================================
-- 如果数据库中存在 type 为 NULL 的交易记录，根据金额判断类型
-- 负数金额通常是提现，正数金额通常是充值

-- 更新 type 为 NULL 的交易记录
UPDATE public.transactions
SET type = CASE 
  WHEN amount < 0 THEN 'withdraw'
  WHEN amount > 0 THEN 'deposit'
  ELSE 'withdraw'  -- 如果金额为0，默认为提现
END
WHERE type IS NULL;

-- 确保所有交易记录都有 type 字段（添加约束）
ALTER TABLE public.transactions
ALTER COLUMN type SET NOT NULL;

-- 如果上面的 ALTER 失败（因为还有 NULL 值），先更新所有 NULL 值
-- 然后再执行 ALTER COLUMN type SET NOT NULL
