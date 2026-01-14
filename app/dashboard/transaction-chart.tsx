"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TransactionChartProps {
  data: { date: string; deposit: number; withdraw: number }[];
}

export default function TransactionChart({ data }: TransactionChartProps) {
  // 格式化日期显示
  const formattedData = data.map((item) => ({
    ...item,
    dateLabel: new Date(item.date).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="dateLabel"
          stroke="#6b7280"
          style={{ fontSize: "12px" }}
          tick={{ fill: "#6b7280" }}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: "12px" }}
          tick={{ fill: "#6b7280" }}
          tickFormatter={(value) => `¥${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
          formatter={(value: number | undefined, name: string | undefined) => [
            `¥${(value || 0).toFixed(2)}`,
            (name === "deposit" ? "充值" : "提现"),
          ]}
          labelFormatter={(label) => `日期: ${label}`}
        />
        <Legend
          formatter={(value) => (value === "deposit" ? "充值" : "提现")}
          wrapperStyle={{ paddingTop: "20px" }}
        />
        <Line
          type="monotone"
          dataKey="deposit"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: "#10b981", r: 4 }}
          activeDot={{ r: 6 }}
          name="deposit"
        />
        <Line
          type="monotone"
          dataKey="withdraw"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ fill: "#ef4444", r: 4 }}
          activeDot={{ r: 6 }}
          name="withdraw"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
