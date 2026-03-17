import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Patient, Vital, Assessment, ContributingFactor } from '@/types/clinical';
import PatientList from '@/components/dashboard/PatientList';
import RiskGauge from '@/components/dashboard/RiskGauge';
import VitalSparkline from '@/components/dashboard/VitalSparkline';
import ContributingFactors from '@/components/dashboard/ContributingFactors';
import RiskTrend from '@/components/dashboard/RiskTrend';
import ActionBar from '@/components/dashboard/ActionBar';
import AddPatientForm from '@/components/dashboard/AddPatientForm';
import RecordVitalsForm from '@/components/dashboard/RecordVitalsForm';
import AssessmentHistory from '@/components/dashboard/AssessmentHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, LogOut, Plus, FileText, Stethoscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [latestAssessments, setLatestAssessments] = useState<Record<string, Assessment>>({});
  const [loading, setLoading] = useState(true);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [assessingRisk, setAssessingRisk] = useState(false);
  const [flashScore, setFlashScore] = useState(false);

  const fetchPatients = useCallback(async () => {
    const { data } = await supabase.from('patients').select('*').order('last_name');
    if (data) setPatients(data as Patient[]);
  }, []);

  const fetchLatestAssessments = useCallback(async () => {
    const { data } = await supabase
      .from('assessments')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      const map: Record<string, Assessment> = {};
      (data as unknown as Assessment[]).forEach(a => {
        if (!map[a.patient_id]) map[a.patient_id] = a;
      });
      setLatestAssessments(map);
    }
  }, []);

  const fetchPatientData = useCallback(async (patientId: string) => {
    const [vitalsRes, assessmentsRes] = await Promise.all([
      supabase.from('vitals').select('*').eq('patient_id', patientId).order('recorded_at', { ascending: true }),
      supabase.from('assessments').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
    ]);
    if (vitalsRes.data) setVitals(vitalsRes.data as Vital[]);
    if (assessmentsRes.data) setAssessments(assessmentsRes.data as Assessment[]);
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchPatients(), fetchLatestAssessments()]);
      setLoading(false);
    };
    init();
  }, [fetchPatients, fetchLatestAssessments]);

  useEffect(() => {
    if (selectedPatientId) fetchPatientData(selectedPatientId);
  }, [selectedPatientId, fetchPatientData]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const latestAssessment = selectedPatientId ? latestAssessments[selectedPatientId] : undefined;

  const handleAssessRisk = async () => {
    if (!selectedPatientId || vitals.length === 0) {
      toast({ title: 'No vitals', description: 'Record vitals before assessing risk.', variant: 'destructive' });
      return;
    }
    setAssessingRisk(true);
    try {
      const latestVital = vitals[vitals.length - 1];
      const { data, error } = await supabase.functions.invoke('assess-risk', {
        body: {
          patient_id: selectedPatientId,
          vital_id: latestVital.id,
          vitals: latestVital,
          patient: selectedPatient,
          vital_history: vitals.slice(-10),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setFlashScore(true);
      setTimeout(() => setFlashScore(false), 700);
      await Promise.all([fetchPatientData(selectedPatientId), fetchLatestAssessments()]);
      toast({ title: 'Risk assessed', description: `Score: ${Math.round(data.risk_score)}% — ${data.risk_level.toUpperCase()}` });
    } catch (err: any) {
      toast({ title: 'Assessment failed', description: err.message, variant: 'destructive' });
    } finally {
      setAssessingRisk(false);
    }
  };

  const handleStartProtocol = async (protocol: string) => {
    if (!latestAssessment) return;
    await supabase.from('assessments').update({ action_taken: protocol }).eq('id', latestAssessment.id);
    toast({ title: 'Protocol initiated', description: `${protocol} protocol started.` });
    if (selectedPatientId) {
      await fetchPatientData(selectedPatientId);
      await fetchLatestAssessments();
    }
  };

  const handleVitalsRecorded = async () => {
    if (selectedPatientId) await fetchPatientData(selectedPatientId);
  };

  // Transform vitals for sparklines
  const makeSparklineData = (key: keyof Vital) => {
    return vitals
      .filter(v => v[key] !== null)
      .map(v => ({
        time: new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: Number(v[key]),
      }));
  };

  const riskTrendData = assessments
    .slice()
    .reverse()
    .map(a => ({
      time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      score: Number(a.risk_score),
    }));

  const factors: ContributingFactor[] = latestAssessment?.contributing_factors
    ? (Array.isArray(latestAssessment.contributing_factors)
        ? latestAssessment.contributing_factors as ContributingFactor[]
        : [])
    : [];

  // Detect anomalies from contributing factors
  const anomalyVitals = new Set(factors.filter(f => f.impact_percent >= 10).map(f => f.vital?.toLowerCase()));

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <div className="w-72 bg-sidebar border-r border-sidebar-border p-4 space-y-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-3 border-b border-sidebar-border flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-sidebar-primary">
            <Activity className="h-3.5 w-3.5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground">SickleGuard</span>
        </div>
        <div className="flex-1">
          <PatientList
            patients={patients}
            latestAssessments={latestAssessments}
            selectedId={selectedPatientId}
            onSelect={setSelectedPatientId}
          />
        </div>
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <Button variant="outline" size="sm" className="w-full gap-1.5 bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80" onClick={() => setShowAddPatient(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Patient
          </Button>
          <Button variant="ghost" size="sm" className="w-full gap-1.5 text-sidebar-foreground/70 hover:text-sidebar-foreground" onClick={signOut}>
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-12 border-b flex items-center justify-between px-4">
          <div>
            {selectedPatient ? (
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold">
                  {selectedPatient.last_name}, {selectedPatient.first_name}
                </h2>
                <span className="font-mono text-xs text-muted-foreground">{selectedPatient.mrn}</span>
                <span className="text-xs text-muted-foreground">
                  {selectedPatient.genotype} · {selectedPatient.gender} · DOB: {selectedPatient.date_of_birth}
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Select a patient from the sidebar</span>
            )}
          </div>
          {selectedPatient && (
            <Button size="sm" onClick={handleAssessRisk} disabled={assessingRisk} className="gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" />
              {assessingRisk ? 'Assessing...' : 'Assess Risk'}
            </Button>
          )}
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {showAddPatient && (
            <div className="p-4 max-w-xl">
              <AddPatientForm onClose={() => setShowAddPatient(false)} onAdded={() => { fetchPatients(); fetchLatestAssessments(); }} />
            </div>
          )}

          {!selectedPatient && !showAddPatient && (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center space-y-3 py-20">
                <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                <h3 className="text-lg font-medium text-muted-foreground">Welcome to SickleGuard</h3>
                <p className="text-sm text-muted-foreground/70">Select a patient from the sidebar or add a new one to begin.</p>
              </div>
            </div>
          )}

          {selectedPatient && (
            <div className="p-4 space-y-4">
              {/* Risk Overview + Evidence */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Risk Gauge */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">VOC Risk Score</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center py-4">
                    {latestAssessment ? (
                      <RiskGauge
                        score={Number(latestAssessment.risk_score)}
                        confidence={latestAssessment.confidence ? Number(latestAssessment.confidence) : undefined}
                        animateFlash={flashScore}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">No assessment yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Record vitals and assess risk</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Evidence Panel */}
                <Card className="lg:col-span-3">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Vital Signs</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2">
                    <VitalSparkline label="Heart Rate" unit="bpm" data={makeSparklineData('heart_rate')} normalRange={{ min: 60, max: 100 }} isAnomaly={anomalyVitals.has('heart_rate') || anomalyVitals.has('heart rate')} />
                    <VitalSparkline label="SpO2" unit="%" data={makeSparklineData('spo2')} normalRange={{ min: 95, max: 100 }} isAnomaly={anomalyVitals.has('spo2')} />
                    <VitalSparkline label="Temperature" unit="°C" data={makeSparklineData('temperature')} normalRange={{ min: 36.1, max: 37.5 }} isAnomaly={anomalyVitals.has('temperature')} />
                    <VitalSparkline label="HbS Level" unit="%" data={makeSparklineData('hbs_level')} normalRange={{ min: 20, max: 40 }} isAnomaly={anomalyVitals.has('hbs_level') || anomalyVitals.has('hbs level') || anomalyVitals.has('hbs')} />
                    <VitalSparkline label="Hemoglobin" unit="g/dL" data={makeSparklineData('hemoglobin')} normalRange={{ min: 7, max: 11 }} isAnomaly={anomalyVitals.has('hemoglobin')} />
                    <VitalSparkline label="Pain Score" unit="0-10" data={makeSparklineData('pain_score')} normalRange={{ min: 0, max: 3 }} isAnomaly={anomalyVitals.has('pain_score') || anomalyVitals.has('pain score') || anomalyVitals.has('pain')} />
                  </CardContent>
                </Card>
              </div>

              {/* Contributing Factors + Clinical Reasoning */}
              {latestAssessment && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <ContributingFactors factors={factors} />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Clinical Reasoning</h4>
                      <p className="text-sm text-foreground leading-relaxed">
                        {latestAssessment.clinical_reasoning || 'No reasoning provided.'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Risk Trend */}
              {riskTrendData.length > 1 && (
                <Card>
                  <CardContent className="pt-4">
                    <RiskTrend data={riskTrendData} />
                  </CardContent>
                </Card>
              )}

              {/* Action Bar */}
              {latestAssessment && (
                <ActionBar
                  riskLevel={latestAssessment.risk_level}
                  recommendedProtocol={latestAssessment.recommended_protocol}
                  onStartProtocol={handleStartProtocol}
                  onDismiss={() => {}}
                />
              )}

              {/* Tabs: Record Vitals / Assessment History */}
              <Tabs defaultValue="vitals">
                <TabsList>
                  <TabsTrigger value="vitals" className="gap-1.5 text-xs">
                    <Stethoscope className="h-3 w-3" /> Record Vitals
                  </TabsTrigger>
                  <TabsTrigger value="history" className="gap-1.5 text-xs">
                    <FileText className="h-3 w-3" /> Assessment History
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="vitals" className="max-w-xl">
                  <RecordVitalsForm patientId={selectedPatientId!} onRecorded={handleVitalsRecorded} />
                </TabsContent>
                <TabsContent value="history">
                  <AssessmentHistory assessments={assessments} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
