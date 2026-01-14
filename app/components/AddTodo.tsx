"use client";

import { addTodo } from "@/app/actions/todo-actions";
import { useFormStatus } from "react-dom";
import { useRef } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "添加中..." : "添加"}
    </button>
  );
}

export default function AddTodo() {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    const result = await addTodo(formData);
    if (result.success) {
      formRef.current?.reset();
    } else {
      alert(result.error || "添加失败");
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex gap-3">
      <input
        type="text"
        name="title"
        placeholder="输入待办事项..."
        required
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <SubmitButton />
    </form>
  );
}
