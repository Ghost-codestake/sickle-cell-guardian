import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface AddPatientFormProps {
  onClose: () => void;
  onAdded: () => void;
}

const AddPatientForm: React.FC<AddPatientFormProps> = ({ onClose, onAdded }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    mrn: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'male',
    blood_type: '',
    genotype: 'HbSS',
    diagnosis_date: '',
    emergency_contact: '',
    emergency_phone: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('patients').insert({
        ...form,
        diagnosis_date: form.diagnosis_date || null,
        created_by: user.id,
      });
      if (error) throw error;
      toast({ title: 'Patient added successfully' });
      onAdded();
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Add New Patient</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">MRN *</Label>
            <Input value={form.mrn} onChange={e => update('mrn', e.target.value)} required placeholder="MRN-001" className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">First Name *</Label>
            <Input value={form.first_name} onChange={e => update('first_name', e.target.value)} required className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Last Name *</Label>
            <Input value={form.last_name} onChange={e => update('last_name', e.target.value)} required className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Date of Birth *</Label>
            <Input type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} required className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Gender *</Label>
            <Select value={form.gender} onValueChange={v => update('gender', v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Blood Type</Label>
            <Input value={form.blood_type} onChange={e => update('blood_type', e.target.value)} placeholder="e.g. A+" className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Genotype</Label>
            <Select value={form.genotype} onValueChange={v => update('genotype', v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="HbSS">HbSS</SelectItem>
                <SelectItem value="HbSC">HbSC</SelectItem>
                <SelectItem value="HbSβ+">HbSβ+ Thalassemia</SelectItem>
                <SelectItem value="HbSβ0">HbSβ0 Thalassemia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Diagnosis Date</Label>
            <Input type="date" value={form.diagnosis_date} onChange={e => update('diagnosis_date', e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Emergency Contact</Label>
            <Input value={form.emergency_contact} onChange={e => update('emergency_contact', e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Emergency Phone</Label>
            <Input value={form.emergency_phone} onChange={e => update('emergency_phone', e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="col-span-2 pt-2">
            <Button type="submit" size="sm" className="w-full" disabled={loading}>
              {loading ? 'Adding...' : 'Add Patient'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddPatientForm;
