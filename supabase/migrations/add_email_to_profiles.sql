-- ============================================
-- 在 profiles 表中添加 email 和 phone 字段并同步数据
-- ============================================

-- 1. 添加 email 字段到 profiles 表
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. 添加 phone 字段到 profiles 表
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON public.profiles(phone);

-- 4. 更新触发器函数，在创建新用户时自动同步邮箱和手机号
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email, phone)
  VALUES (
    NEW.id,
    'user',
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,  -- 同步邮箱
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', NULL)  -- 同步手机号
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 同步现有用户的邮箱和手机号（需要在 Supabase Dashboard 的 SQL Editor 中执行）
-- 注意：由于无法直接查询 auth.users，需要手动执行以下 SQL
-- 或者使用 Supabase Dashboard 的 SQL Editor 执行：

/*
-- 方法1：使用 Supabase Dashboard SQL Editor（推荐）
-- 在 Supabase Dashboard > SQL Editor 中执行以下 SQL：

-- 同步邮箱
UPDATE public.profiles p
SET email = (
  SELECT email 
  FROM auth.users 
  WHERE id = p.id
)
WHERE email IS NULL OR email = '';

-- 同步手机号
UPDATE public.profiles p
SET phone = (
  SELECT COALESCE(phone, raw_user_meta_data->>'phone')
  FROM auth.users 
  WHERE id = p.id
)
WHERE phone IS NULL OR phone = '';

-- 方法2：如果上面的 SQL 无法执行（权限问题），可以手动更新
-- 或者使用 Supabase Admin API 批量更新
*/

-- 6. 创建一个函数来更新单个用户的邮箱和手机号（当用户更新时调用）
CREATE OR REPLACE FUNCTION public.sync_user_contact(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
  user_phone TEXT;
BEGIN
  -- 从 auth.users 获取邮箱和手机号
  SELECT 
    email,
    COALESCE(phone, raw_user_meta_data->>'phone')
  INTO user_email, user_phone
  FROM auth.users
  WHERE id = user_id;
  
  -- 更新 profiles 表的邮箱和手机号
  UPDATE public.profiles
  SET 
    email = COALESCE(user_email, email),
    phone = COALESCE(user_phone, phone)
  WHERE id = user_id;
END;
$$;

-- 7. 创建一个触发器，当 auth.users 的 email 或 phone 更新时，同步更新 profiles
-- 注意：这需要在 Supabase Dashboard 中手动创建，因为无法直接创建 auth schema 的触发器
-- 或者使用 Supabase 的 Database Webhooks

-- 如果需要自动同步更新，可以在 Supabase Dashboard > Database > Functions 中创建：
/*
CREATE OR REPLACE FUNCTION public.handle_auth_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    email = NEW.email,
    phone = COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone')
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email OR OLD.phone IS DISTINCT FROM NEW.phone)
  EXECUTE FUNCTION public.handle_auth_user_update();
*/
