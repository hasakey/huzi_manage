-- 更新交易触发器以支持充值和提现
-- ============================================

-- 更新函数：处理交易审核（更新余额）
CREATE OR REPLACE FUNCTION public.process_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- 只有当状态从 pending 变为 approved 时才处理余额
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    IF NEW.type = 'withdraw' THEN
      -- 提现：扣除用户余额
      UPDATE public.profiles
      SET balance = balance - NEW.amount
      WHERE id = NEW.user_id;
    ELSIF NEW.type = 'deposit' THEN
      -- 充值：增加用户余额
      UPDATE public.profiles
      SET balance = balance + NEW.amount
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  
  -- 如果状态变为 rejected，不做任何操作（余额不变）
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除旧的触发器
DROP TRIGGER IF EXISTS on_transaction_status_change ON public.transactions;

-- 创建新的触发器：当交易状态更新时自动处理余额
CREATE TRIGGER on_transaction_status_change
  AFTER UPDATE OF status ON public.transactions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.process_transaction();
