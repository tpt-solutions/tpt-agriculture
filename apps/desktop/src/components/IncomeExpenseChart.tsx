// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  Cell,
} from "recharts";
import { getDb } from "@tpt/core";
import { ledgerEntries } from "@tpt/core/schema";
import { eq, and, gte } from "drizzle-orm";

interface Props {
  farmId: string;
}

function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-semibold text-gray-700">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium text-gray-800">
            ${formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function IncomeExpenseChart({ farmId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["chart-income-expense", farmId],
    queryFn: async () => {
      const db = await getDb();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const rows = await db
        .select({
          date: ledgerEntries.date,
          amount: ledgerEntries.amount,
          type: ledgerEntries.type,
        })
        .from(ledgerEntries)
        .where(
          and(
            eq(ledgerEntries.farmId, farmId),
            gte(ledgerEntries.date, sixMonthsAgo)
          )
        )
        .orderBy(ledgerEntries.date);
      const byMonth = new Map<string, { income: number; expense: number }>();
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      let totalIncome = 0;
      let totalExpense = 0;
      for (const row of rows) {
        const d = row.date instanceof Date ? row.date : new Date(row.date);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        const bucket = byMonth.get(key) ?? { income: 0, expense: 0 };
        const amount = Number(row.amount) || 0;
        if (row.type === "INCOME") {
          bucket.income += amount;
          totalIncome += amount;
        } else {
          bucket.expense += amount;
          totalExpense += amount;
        }
        byMonth.set(key, bucket);
      }
      const chartData = Array.from(byMonth.entries()).map(
        ([month, v]) => ({ month, ...v })
      );
      // Determine trend: compare last two months
      let trend: "up" | "down" | "flat" = "flat";
      if (chartData.length >= 2) {
        const last = chartData[chartData.length - 1];
        const prev = chartData[chartData.length - 2];
        const lastNet = last.income - last.expense;
        const prevNet = prev.income - prev.expense;
        if (lastNet > prevNet * 1.05) trend = "up";
        else if (lastNet < prevNet * 0.95) trend = "down";
      }
      return {
        chartData,
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        trend,
      };
    },
  });

  if (isLoading)
    return <div className="text-sm text-gray-500">Loading chart...</div>;
  if (!data || data.chartData.length === 0) return null;

  const trendIcon =
    data.trend === "up"
      ? "\u2191"
      : data.trend === "down"
        ? "\u2193"
        : "\u2192";
  const trendColor =
    data.trend === "up"
      ? "text-green-600"
      : data.trend === "down"
        ? "text-red-600"
        : "text-gray-500";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        Income vs Expense (Last 6 Months)
      </h3>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-md bg-green-50 p-3 text-center">
          <div className="text-xs font-medium text-green-600">
            Total Income
          </div>
          <div className="mt-1 text-lg font-bold text-green-700">
            ${formatCurrency(data.totalIncome)}
          </div>
        </div>
        <div className="rounded-md bg-red-50 p-3 text-center">
          <div className="text-xs font-medium text-red-600">
            Total Expense
          </div>
          <div className="mt-1 text-lg font-bold text-red-700">
            ${formatCurrency(data.totalExpense)}
          </div>
        </div>
        <div
          className={`rounded-md p-3 text-center ${data.netProfit >= 0 ? "bg-blue-50" : "bg-amber-50"}`}
        >
          <div
            className={`text-xs font-medium ${data.netProfit >= 0 ? "text-blue-600" : "text-amber-600"}`}
          >
            Net Profit{" "}
            <span className={`ml-1 text-base ${trendColor}`}>{trendIcon}</span>
          </div>
          <div
            className={`mt-1 text-lg font-bold ${data.netProfit >= 0 ? "text-blue-700" : "text-amber-700"}`}
          >
            {data.netProfit >= 0 ? "+" : "-"}$
            {formatCurrency(Math.abs(data.netProfit))}
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data.chartData} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar
            dataKey="income"
            name="Income"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          >
            {data.chartData.map((_, i) => (
              <Cell key={i} fill="#16a34a" />
            ))}
          </Bar>
          <Bar
            dataKey="expense"
            name="Expense"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          >
            {data.chartData.map((_, i) => (
              <Cell key={i} fill="#dc2626" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
