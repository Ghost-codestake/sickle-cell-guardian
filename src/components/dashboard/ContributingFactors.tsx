import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ContributingFactor } from '@/types/clinical';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface ContributingFactorsProps {
  factors: ContributingFactor[];
}

const ContributingFactors: React.FC<ContributingFactorsProps> = ({ factors }) => {
  if (!factors || factors.length === 0) return null;

  const getDirectionIcon = (dir: string) => {
    if (dir === 'up') return <ArrowUp className="h-3 w-3" />;
    if (dir === 'down') return <ArrowDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contributing Factors</h4>
      <div className="flex flex-wrap gap-2">
        {factors.sort((a, b) => b.impact_percent - a.impact_percent).map((factor, i) => (
          <Badge
            key={i}
            variant="outline"
            className={`gap-1 font-mono text-xs ${
              factor.impact_percent >= 15
                ? 'border-risk-high/40 text-risk-high bg-risk-high-bg'
                : factor.impact_percent >= 8
                ? 'border-risk-moderate/40 text-risk-moderate bg-risk-moderate-bg'
                : ''
            }`}
          >
            {getDirectionIcon(factor.direction)}
            {factor.vital} {factor.direction === 'up' ? '↑' : factor.direction === 'down' ? '↓' : '—'}:
            <span className="font-semibold">+{factor.impact_percent}%</span>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default ContributingFactors;
