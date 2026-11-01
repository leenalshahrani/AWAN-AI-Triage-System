import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type Color = 'mint' | 'critical' | 'safe' | 'violet' | 'blue';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  icon: ReactNode;
  trend?: number[];
  color?: Color;
}

const COLOR_MAP: Record<Color, {
  iconBg: string; iconText: string;
  bar: string; border: string; trend: string;
}> = {
  mint:     { iconBg: 'bg-mint/10',       iconText: 'text-mint',       bar: 'bg-mint',       border: 'border-t-mint',     trend: 'bg-mint/20' },
  critical: { iconBg: 'bg-red-50',        iconText: 'text-critical',   bar: 'bg-critical',   border: 'border-t-critical', trend: 'bg-critical/20' },
  safe:     { iconBg: 'bg-emerald-50',    iconText: 'text-safe',       bar: 'bg-safe',       border: 'border-t-safe',     trend: 'bg-safe/20' },
  violet:   { iconBg: 'bg-violet-50',     iconText: 'text-violet-600', bar: 'bg-violet-500', border: 'border-t-violet-500', trend: 'bg-violet-100' },
  blue:     { iconBg: 'bg-blue-50',       iconText: 'text-blue-600',   bar: 'bg-blue-500',   border: 'border-t-blue-500', trend: 'bg-blue-100' },
};

export const StatCard = ({ title, value, subtitle, change, icon, trend, color = 'mint' }: StatCardProps) => {
  const c = COLOR_MAP[color];
  const isPositive = change !== undefined && change > 0;
  const isNeutral  = change === undefined || change === 0;

  return (
    <div className={`bg-white rounded-xl p-5 shadow-card border border-gray-100 border-t-2 ${c.border} transition-shadow hover:shadow-card-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 ${c.iconBg} rounded-xl flex items-center justify-center ${c.iconText} flex-shrink-0`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            isNeutral   ? 'bg-gray-100 text-gray-500' :
            isPositive  ? 'bg-emerald-50 text-safe' :
                          'bg-red-50 text-critical'
          }`}>
            {isNeutral ? <Minus className="w-3 h-3" /> : isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change !== 0 && <span>{isPositive ? '+' : ''}{change}%</span>}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}

      {trend && trend.length > 1 && (
        <div className="mt-4 h-8 flex items-end gap-0.5">
          {trend.map((val, i) => (
            <div
              key={i}
              className={`flex-1 ${c.trend} rounded-t-sm transition-all`}
              style={{ height: `${(val / Math.max(...trend, 1)) * 100}%`, minHeight: '3px' }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
