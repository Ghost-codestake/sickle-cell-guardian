import React, { useMemo } from 'react';

interface RiskGaugeProps {
  score: number;
  confidence?: number;
  animateFlash?: boolean;
}

const RiskGauge: React.FC<RiskGaugeProps> = ({ score, confidence, animateFlash }) => {
  const { color, label, bgClass } = useMemo(() => {
    if (score >= 75) return { color: 'hsl(var(--risk-high))', label: 'CRITICAL', bgClass: 'text-risk-high' };
    if (score >= 50) return { color: 'hsl(var(--risk-moderate))', label: 'ELEVATED', bgClass: 'text-risk-moderate' };
    return { color: 'hsl(var(--risk-low))', label: 'STABLE', bgClass: 'text-risk-low' };
  }, [score]);

  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = Math.PI * normalizedRadius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={radius * 2} height={radius + 10} viewBox={`0 0 ${radius * 2} ${radius + 10}`}>
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - strokeWidth / 2} ${radius}`}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={`M ${strokeWidth / 2} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - strokeWidth / 2} ${radius}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className={`-mt-16 text-center ${animateFlash ? 'animate-score-flash' : ''}`}>
        <span className={`font-mono text-4xl font-bold ${bgClass}`}>
          {Math.round(score)}
        </span>
        <span className="text-sm text-muted-foreground ml-1">%</span>
      </div>
      <span className={`text-xs font-semibold tracking-widest uppercase ${bgClass}`}>
        {label}
      </span>
      {confidence !== undefined && (
        <span className="text-xs text-muted-foreground font-mono">
          Confidence: {Math.round(confidence)}%
        </span>
      )}
    </div>
  );
};

export default RiskGauge;
