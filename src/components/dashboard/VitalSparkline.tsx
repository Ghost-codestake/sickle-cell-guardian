import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

interface VitalSparklineProps {
  label: string;
  unit: string;
  data: { time: string; value: number }[];
  normalRange?: { min: number; max: number };
  isAnomaly?: boolean;
}

const VitalSparkline: React.FC<VitalSparklineProps> = ({ label, unit, data, normalRange, isAnomaly }) => {
  const lastValue = data.length > 0 ? data[data.length - 1].value : null;

  return (
    <div className={`rounded-md border p-3 ${isAnomaly ? 'border-risk-high/40 bg-risk-high-bg' : 'border-border bg-card'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className={`font-mono text-sm font-semibold ${isAnomaly ? 'text-risk-high' : 'text-foreground'}`}>
          {lastValue !== null ? lastValue : '—'} <span className="text-xs text-muted-foreground font-normal">{unit}</span>
        </span>
      </div>
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="time" hide />
            <YAxis hide domain={normalRange ? [normalRange.min * 0.9, normalRange.max * 1.1] : ['auto', 'auto']} />
            {normalRange && (
              <>
                <ReferenceLine y={normalRange.min} stroke="hsl(var(--border))" strokeDasharray="2 2" />
                <ReferenceLine y={normalRange.max} stroke="hsl(var(--border))" strokeDasharray="2 2" />
              </>
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={isAnomaly ? 'hsl(var(--risk-high))' : 'hsl(var(--primary))'}
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VitalSparkline;
