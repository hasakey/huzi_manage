# Phase 1: 数据库 Schema 和 Shadcn UI 安装指南

## 1. 数据库 Schema 设置

### 执行 SQL

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 点击 **New query**
5. 复制并执行 `supabase/migrations/create_admin_dashboard_schema.sql` 文件中的所有 SQL

### SQL 文件说明

该 SQL 文件包含：
- ✅ `profiles` 表：扩展 `auth.users`，包含 `role`, `balance`, `full_name`
- ✅ `transactions` 表：交易记录，包含 `amount`, `type`, `status`
- ✅ RLS 策略：
  - 用户可以查看和更新自己的数据
  - 管理员可以查看和更新所有数据
- ✅ 自动触发器：
  - 用户注册时自动创建 `profile`
  - 提现审核通过时自动扣除余额

### 设置第一个管理员账户

执行以下 SQL（将 `YOUR_ADMIN_USER_ID` 替换为你的用户 ID）：

```sql
-- 将你的账户设置为管理员
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'YOUR_ADMIN_USER_ID';
```

或者，如果你想在注册时直接成为管理员，可以修改触发器函数：

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    CASE 
      WHEN NEW.email = 'your-admin-email@example.com' THEN 'admin'
      ELSE 'user'
    END,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 2. 安装 Shadcn UI 依赖

在项目根目录执行以下命令：

```bash
npm install clsx tailwind-merge class-variance-authority lucide-react recharts
```

## 3. 安装 Shadcn UI 组件

安装基础组件（我们后续会用到）：

```bash
# 安装 Button 组件
npx shadcn@latest add button

# 安装 Card 组件
npx shadcn@latest add card

# 安装 Table 组件
npx shadcn@latest add table

# 安装 Tabs 组件
npx shadcn@latest add tabs

# 安装 Dialog 组件（用于审核 Modal）
npx shadcn@latest add dialog

# 安装 Input 组件
npx shadcn@latest add input

# 安装 Label 组件
npx shadcn@latest add label

# 安装 Select 组件
npx shadcn@latest add select

# 安装 Badge 组件（用于状态显示）
npx shadcn@latest add badge
```

## 4. 验证安装

### 检查文件结构

安装完成后，你的项目应该有以下结构：

```
components/
  ui/
    button.tsx
    card.tsx
    table.tsx
    tabs.tsx
    dialog.tsx
    input.tsx
    label.tsx
    select.tsx
    badge.tsx
lib/
  utils.ts
```

### 测试 Shadcn UI

创建一个测试页面验证安装：

```tsx
// app/test-ui/page.tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TestUI() {
  return (
    <div className="p-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Shadcn UI 测试</h1>
        <Button>测试按钮</Button>
      </Card>
    </div>
  );
}
```

访问 `/test-ui` 页面，如果看到样式正常的按钮和卡片，说明安装成功。

## 5. 更新 TypeScript 类型

执行以下命令更新 Supabase 类型定义：

```bash
npm run update-types
```

## 下一步

完成 Phase 1 后，我们可以继续：
- Phase 2: 构建布局（侧边栏/导航）和认证页面
- Phase 3: 构建管理员用户管理和手动充值逻辑
- Phase 4: 构建用户提现流程和管理员审核 Modal
- Phase 5: 添加 Recharts 可视化图表
