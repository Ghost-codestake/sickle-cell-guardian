import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, User } from 'lucide-react';
import { Patient, Assessment } from '@/types/clinical';

interface PatientListProps {
  patients: Patient[];
  latestAssessments: Record<string, Assessment>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const getRiskBadge = (assessment?: Assessment) => {
  if (!assessment) return { label: 'New', className: 'bg-muted text-muted-foreground' };
  const level = assessment.risk_level;
  if (level === 'critical' || level === 'high') return { label: 'Critical', className: 'bg-risk-high text-primary-foreground' };
  if (level === 'moderate') return { label: 'Elevated', className: 'bg-risk-moderate text-primary-foreground' };
  return { label: 'Stable', className: 'bg-risk-low text-primary-foreground' };
};

const PatientList: React.FC<PatientListProps> = ({ patients, latestAssessments, selectedId, onSelect }) => {
  const [search, setSearch] = useState('');

  const filtered = patients.filter(p =>
    `${p.first_name} ${p.last_name} ${p.mrn}`.toLowerCase().includes(search.toLowerCase())
  );

  // Sort: critical first
  const sorted = [...filtered].sort((a, b) => {
    const scoreA = latestAssessments[a.id]?.risk_score ?? -1;
    const scoreB = latestAssessments[b.id]?.risk_score ?? -1;
    return scoreB - scoreA;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-sidebar-foreground/50" />
          <Input
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.map(patient => {
          const badge = getRiskBadge(latestAssessments[patient.id]);
          const isSelected = selectedId === patient.id;
          return (
            <button
              key={patient.id}
              onClick={() => onSelect(patient.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-sidebar-border ${
                isSelected
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
              }`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {patient.last_name}, {patient.first_name}
                </p>
                <p className="text-xs text-sidebar-foreground/60 font-mono">{patient.mrn}</p>
              </div>
              <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${badge.className}`}>
                {badge.label}
              </Badge>
            </button>
          );
        })}
        {sorted.length === 0 && (
          <div className="p-4 text-center text-xs text-sidebar-foreground/50">
            No patients found
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;
