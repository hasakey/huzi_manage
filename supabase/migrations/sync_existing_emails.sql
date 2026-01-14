-- ============================================
-- 同步现有用户的邮箱和手机号到 profiles 表
-- ============================================
-- 注意：这个 SQL 需要在 Supabase Dashboard 的 SQL Editor 中执行
-- 因为它需要访问 auth.users 表

-- 1. 更新所有现有用户的邮箱
UPDATE public.profiles p
SET email = (
  SELECT email 
  FROM auth.users 
  WHERE id = p.id
)
WHERE email IS NULL OR email = '';

-- 2. 更新所有现有用户的手机号
UPDATE public.profiles p
SET phone = (
  SELECT COALESCE(phone, raw_user_meta_data->>'phone')
  FROM auth.users 
  WHERE id = p.id
)
WHERE phone IS NULL OR phone = '';

-- 3. 验证更新结果
SELECT 
  id,
  email,
  phone,
  full_name,
  role,
  balance
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;
