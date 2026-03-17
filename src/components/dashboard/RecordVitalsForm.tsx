import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RecordVitalsFormProps {
  patientId: string;
  onRecorded: () => void;
}

const RecordVitalsForm: React.FC<RecordVitalsFormProps> = ({ patientId, onRecorded }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    heart_rate: '',
    spo2: '',
    temperature: '',
    systolic_bp: '',
    diastolic_bp: '',
    hbs_level: '',
    reticulocyte_count: '',
    wbc_count: '',
    hemoglobin: '',
    pain_score: '',
    hydration_status: 'adequate',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('vitals').insert({
        patient_id: patientId,
        heart_rate: form.heart_rate ? Number(form.heart_rate) : null,
        spo2: form.spo2 ? Number(form.spo2) : null,
        temperature: form.temperature ? Number(form.temperature) : null,
        systolic_bp: form.systolic_bp ? Number(form.systolic_bp) : null,
        diastolic_bp: form.diastolic_bp ? Number(form.diastolic_bp) : null,
        hbs_level: form.hbs_level ? Number(form.hbs_level) : null,
        reticulocyte_count: form.reticulocyte_count ? Number(form.reticulocyte_count) : null,
        wbc_count: form.wbc_count ? Number(form.wbc_count) : null,
        hemoglobin: form.hemoglobin ? Number(form.hemoglobin) : null,
        pain_score: form.pain_score ? Number(form.pain_score) : null,
        hydration_status: form.hydration_status,
        recorded_by: user.id,
      });
      if (error) throw error;
      toast({ title: 'Vitals recorded' });
      onRecorded();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const fields = [
    { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', placeholder: '72' },
    { key: 'spo2', label: 'SpO2', unit: '%', placeholder: '98' },
    { key: 'temperature', label: 'Temperature', unit: '°C', placeholder: '37.0' },
    { key: 'systolic_bp', label: 'Systolic BP', unit: 'mmHg', placeholder: '120' },
    { key: 'diastolic_bp', label: 'Diastolic BP', unit: 'mmHg', placeholder: '80' },
    { key: 'hbs_level', label: 'HbS Level', unit: '%', placeholder: '40' },
    { key: 'reticulocyte_count', label: 'Reticulocyte', unit: '%', placeholder: '2.0' },
    { key: 'wbc_count', label: 'WBC Count', unit: '×10³/μL', placeholder: '8.0' },
    { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', placeholder: '10.0' },
    { key: 'pain_score', label: 'Pain Score', unit: '0-10', placeholder: '3' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Record Vitals</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          {fields.map(({ key, label, unit, placeholder }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{label} <span className="text-muted-foreground">({unit})</span></Label>
              <Input
                type="number"
                step="any"
                value={(form as any)[key]}
                onChange={e => update(key, e.target.value)}
                placeholder={placeholder}
                className="h-8 text-xs font-mono"
              />
            </div>
          ))}
          <div className="space-y-1">
            <Label className="text-xs">Hydration Status</Label>
            <Select value={form.hydration_status} onValueChange={v => update('hydration_status', v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="adequate">Adequate</SelectItem>
                <SelectItem value="mild_dehydration">Mild Dehydration</SelectItem>
                <SelectItem value="moderate_dehydration">Moderate Dehydration</SelectItem>
                <SelectItem value="severe_dehydration">Severe Dehydration</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 pt-2">
            <Button type="submit" size="sm" className="w-full" disabled={loading}>
              {loading ? 'Recording...' : 'Record & Assess Risk'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RecordVitalsForm;
