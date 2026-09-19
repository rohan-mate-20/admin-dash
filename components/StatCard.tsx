import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  trend: string;
  icon: ReactNode;
  trendUp?: boolean;
}

export function StatCard({ title, value, trend, icon, trendUp = true }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
      <div className="w-12 h-12 rounded-lg bg-lightbg text-navy flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-text-secondary font-medium text-sm mb-1">{title}</h3>
        <p className="text-2xl font-bold text-text-main mb-2">{value}</p>
        <p className={`text-xs font-medium ${trendUp ? "text-green-600" : "text-red"}`}>
          {trendUp ? "↑ " : "↓ "}{trend}
        </p>
      </div>
    </div>
  );
}
