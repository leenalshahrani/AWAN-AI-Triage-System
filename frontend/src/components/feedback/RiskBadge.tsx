interface RiskBadgeProps {
  level: 'high' | 'low';
  classification: string;
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge = ({ level, classification, confidence, size = 'md' }: RiskBadgeProps) => {
  const styles = {
    high: 'bg-risk-highBg text-risk-high border-risk-high',
    low: 'bg-risk-lowBg text-risk-low border-risk-low',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <div className={`inline-flex flex-col items-center rounded-lg border-2 font-semibold ${styles[level]} ${sizes[size]}`}>
      <span className="uppercase tracking-wide">{level === 'high' ? 'HIGH RISK' : 'LOW RISK'}</span>
      <span className="text-xs font-normal mt-1">{classification}</span>
      {confidence !== undefined && (
        <span className="text-xs font-normal mt-1">Confidence: {confidence.toFixed(1)}%</span>
      )}
    </div>
  );
};
