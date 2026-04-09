"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface GasData {
  LPG_Concentration?: string;
  CO_Concentration?: string;
  Methane_Concentration?: string;
  Hydrogen_Concentration?: string;
  NH3_Concentration?: string;
  CO2_Concentration?: string;
  Alcohol_Concentration?: string;
}

interface GasComparisonChartProps {
  gasData?: GasData | null;
}

const palette = ["#6366F1", "#EF4444", "#22C55E", "#F59E0B", "#A855F7", "#14B8A6", "#EC4899"];

const GasComparisonChart: React.FC<GasComparisonChartProps> = ({ gasData }) => {
  const data = [
    { name: "LPG", value: Number(gasData?.LPG_Concentration) || 0 },
    { name: "CO", value: Number(gasData?.CO_Concentration) || 0 },
    { name: "Methane", value: Number(gasData?.Methane_Concentration) || 0 },
    { name: "Hydrogen", value: Number(gasData?.Hydrogen_Concentration) || 0 },
    { name: "NH3", value: Number(gasData?.NH3_Concentration) || 0 },
    { name: "CO2", value: Number(gasData?.CO2_Concentration) || 0 },
    { name: "Alcohol", value: Number(gasData?.Alcohol_Concentration) || 0 },
  ];

  return (
    <div className="h-full w-full rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-gray-800 dark:text-slate-100">Current Gas Comparison</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400">Snapshot of all measured gases (ppm)</p>
      </div>

      <div className="h-[220px] sm:h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(3)} ppm`}
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((item, index) => (
                <Cell key={item.name} fill={palette[index % palette.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GasComparisonChart;
