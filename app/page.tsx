import { getTodos } from "@/app/actions/todo-actions";
import { getCurrentUser } from "@/app/auth/utils";
import AddTodo from "@/app/components/AddTodo";
import LogoutButton from "@/app/components/LogoutButton";
import TodoItem from "@/app/components/TodoItem";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getCurrentUser();

  // 如果未登录，重定向到登录页面
  if (!user) {
    redirect("/login");
  }

  const result = await getTodos();

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* 标题和用户信息 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">待办事项</h1>
              <p className="mt-2 text-gray-600">管理你的日常任务</p>
            </div>
            <LogoutButton />
          </div>
          <div className="text-sm text-gray-500">
            欢迎，{user.email}
          </div>
        </div>

        {/* 添加待办卡片 */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">添加新待办</h2>
          <AddTodo />
        </div>

        {/* 待办列表卡片 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">我的待办</h2>

          {!result.success ? (
            <div className="py-8 text-center">
              <p className="text-red-600">{result.error || "加载失败"}</p>
            </div>
          ) : !result.data || result.data.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">暂无待办事项，添加一个开始吧！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {result.data.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
