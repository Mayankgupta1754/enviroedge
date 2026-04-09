"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RiskTrendPoint {
  time: string;
  probability: number;
}

interface RiskTrendChartProps {
  data: RiskTrendPoint[];
}

const RiskTrendChart: React.FC<RiskTrendChartProps> = ({ data }) => {
  return (
    <div className="h-full w-full rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-gray-800 dark:text-slate-100">Risk Trend</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400">Suffocation probability over time</p>
      </div>

      <div className="h-[220px] sm:h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              unit="%"
            />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(2)}%`}
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
              }}
            />
            <Area
              type="monotone"
              dataKey="probability"
              stroke="#4F46E5"
              strokeWidth={2.5}
              fill="url(#riskGradient)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RiskTrendChart;
