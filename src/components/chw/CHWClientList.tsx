import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PatientForm } from "@/components/PatientForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Play, History } from "lucide-react";

interface Patient {
  id: string;
  patient_identifier: string;
  created_at: string;
}

interface SessionRow {
  id: string;
  patient_id: string;
  session_number: number;
  status: string;
  started_at: string;
}

interface Props {
  onOpenSession: (sessionId: string) => void;
}

export function CHWClientList({ onOpenSession }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data: pats } = await supabase
      .from("patients")
      .select("id, patient_identifier, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setPatients((pats as Patient[]) || []);

    const { data: sess } = await supabase
      .from("chw_sessions")
      .select("id, patient_id, session_number, status, started_at")
      .eq("chw_id", user.id)
      .order("started_at", { ascending: false });
    setSessions((sess as SessionRow[]) || []);
  };

  useEffect(() => {
    load();
  }, [user]);

  const sessionsFor = (pid: string) => sessions.filter((s) => s.patient_id === pid);
  const activeFor = (pid: string) => sessionsFor(pid).find((s) => s.status === "active");

  const startSession = async (patientId: string) => {
    if (!user) return;
    const existingActive = activeFor(patientId);
    if (existingActive) {
      onOpenSession(existingActive.id);
      return;
    }
    setBusy(patientId);
    const { data, error } = await supabase
      .from("chw_sessions")
      .insert({ chw_id: user.id, patient_id: patientId, status: "active" })
      .select("id")
      .single();
    setBusy(null);
    if (error) {
      toast({
        title: "Could not start session",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    onOpenSession(data.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">My Clients</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Register New Client
        </Button>
      </div>

      {patients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No clients yet. Register your first client to begin a session.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {patients.map((p) => {
            const list = sessionsFor(p.id);
            const completedCount = list.filter((s) => s.status !== "active").length;
            const remaining = 5 - list.length;
            const active = activeFor(p.id);
            return (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{p.patient_identifier}</span>
                    <div className="flex gap-1 items-center">
                      <Badge variant="outline">
                        {completedCount} completed
                      </Badge>
                      <Badge variant={remaining > 0 ? "secondary" : "destructive"}>
                        {remaining > 0 ? `${remaining} left` : "limit reached"}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {list.length > 0 && (
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                      {list
                        .slice()
                        .sort((a, b) => a.session_number - b.session_number)
                        .map((s) => (
                          <Badge
                            key={s.id}
                            variant={s.status === "active" ? "default" : "outline"}
                            className="font-normal"
                          >
                            #{s.session_number} {s.status}
                          </Badge>
                        ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {active ? (
                      <Button
                        size="sm"
                        onClick={() => onOpenSession(active.id)}
                      >
                        <Play className="h-3 w-3 mr-1" /> Resume Active Session
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={remaining === 0 || busy === p.id}
                        onClick={() => startSession(p.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Start Session #{list.length + 1}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Register New Client</DialogTitle>
          </DialogHeader>
          <PatientForm
            onSuccess={() => {
              setShowForm(false);
              load();
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
