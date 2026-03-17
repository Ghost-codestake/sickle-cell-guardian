import React from 'react';
import { Button } from '@/components/ui/button';
import { Droplets, Pill, HeartPulse, X } from 'lucide-react';

interface ActionBarProps {
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  recommendedProtocol: string | null;
  onStartProtocol: (protocol: string) => void;
  onDismiss: () => void;
}

const protocols = [
  { id: 'hydration', label: 'Hydration Protocol', icon: Droplets },
  { id: 'analgesia', label: 'Analgesia Protocol', icon: Pill },
  { id: 'transfusion', label: 'Transfusion Protocol', icon: HeartPulse },
];

const ActionBar: React.FC<ActionBarProps> = ({ riskLevel, recommendedProtocol, onStartProtocol, onDismiss }) => {
  const isUrgent = riskLevel === 'high' || riskLevel === 'critical';

  return (
    <div className={`flex items-center justify-between rounded-lg border p-3 ${
      isUrgent ? 'border-risk-high/30 bg-risk-high-bg' : 'border-border bg-card'
    }`}>
      <div className="flex items-center gap-2">
        {protocols.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={recommendedProtocol?.toLowerCase().includes(id) ? 'default' : 'outline'}
            size="sm"
            onClick={() => onStartProtocol(id)}
            className="gap-1.5"
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Button>
        ))}
      </div>
      <Button variant="ghost" size="sm" onClick={onDismiss} className="text-muted-foreground">
        <X className="h-3.5 w-3.5 mr-1" />
        Dismiss
      </Button>
    </div>
  );
};

export default ActionBar;
