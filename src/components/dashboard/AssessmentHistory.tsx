import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Assessment } from '@/types/clinical';
import { format } from 'date-fns';

interface AssessmentHistoryProps {
  assessments: Assessment[];
}

const riskBadgeClass: Record<string, string> = {
  low: 'bg-risk-low text-primary-foreground',
  moderate: 'bg-risk-moderate text-primary-foreground',
  high: 'bg-risk-high text-primary-foreground',
  critical: 'bg-risk-high text-primary-foreground',
};

const AssessmentHistory: React.FC<AssessmentHistoryProps> = ({ assessments }) => {
  if (assessments.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No assessments recorded yet.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Date</TableHead>
            <TableHead className="text-xs">Risk Score</TableHead>
            <TableHead className="text-xs">Level</TableHead>
            <TableHead className="text-xs">Confidence</TableHead>
            <TableHead className="text-xs">Protocol</TableHead>
            <TableHead className="text-xs">Action Taken</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assessments.map(a => (
            <TableRow key={a.id}>
              <TableCell className="text-xs font-mono">{format(new Date(a.created_at), 'dd MMM yyyy HH:mm')}</TableCell>
              <TableCell className="font-mono text-sm font-semibold">{Math.round(a.risk_score)}%</TableCell>
              <TableCell>
                <Badge className={`text-[10px] ${riskBadgeClass[a.risk_level] || ''}`}>
                  {a.risk_level.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs">{a.confidence ? `${Math.round(a.confidence)}%` : '—'}</TableCell>
              <TableCell className="text-xs">{a.recommended_protocol || '—'}</TableCell>
              <TableCell className="text-xs">{a.action_taken || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AssessmentHistory;
