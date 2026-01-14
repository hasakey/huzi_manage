"use client";

import { toggleTodo, deleteTodo, type Todo } from "@/app/actions/todo-actions";
import { useState, useTransition } from "react";

interface TodoItemProps {
  todo: Todo;
}

export default function TodoItem({ todo }: TodoItemProps) {
  const [isPending, startTransition] = useTransition();
  const [isComplete, setIsComplete] = useState(todo.is_complete);

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleTodo(todo.id, isComplete);
      if (result.success) {
        setIsComplete(!isComplete);
      } else {
        // 如果失败，恢复原状态
        console.error(result.error);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("确定要删除这条待办事项吗？")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteTodo(todo.id);
      if (!result.success) {
        console.error(result.error);
        alert(result.error);
      }
    });
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border bg-white p-4 shadow-sm transition-all ${
        isPending ? "opacity-50" : ""
      } ${isComplete ? "bg-gray-50" : ""}`}
    >
      <input
        type="checkbox"
        checked={isComplete}
        onChange={handleToggle}
        disabled={isPending}
        className="h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
      />
      <span
        className={`flex-1 text-gray-900 ${
          isComplete ? "line-through text-gray-500" : ""
        }`}
      >
        {todo.title}
      </span>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="rounded px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        删除
      </button>
    </div>
  );
}
