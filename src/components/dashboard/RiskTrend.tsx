import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

interface RiskTrendProps {
  data: { time: string; score: number }[];
}

const RiskTrend: React.FC<RiskTrendProps> = ({ data }) => {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">24-Hour Risk Trend</h4>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              labelStyle={{ fontFamily: 'IBM Plex Mono' }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 2, fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RiskTrend;
