import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ScrollText, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Ev {
  id: string; recorded_at: string; actor_role: string; action: string;
  resource_type: string; outcome: string; description: string | null;
}

export const PatientAuditTrail = ({ patientId }: { patientId: string }) => {
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("audit_events")
      .select("id, recorded_at, actor_role, action, resource_type, outcome, description")
      .eq("patient_id", patientId)
      .order("recorded_at", { ascending: false })
      .limit(100)
      .then(({ data }) => { setEvents((data as Ev[]) ?? []); setLoading(false); });
  }, [patientId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-5 w-5" /> Audit trail
          <Badge variant="outline" className="gap-1 text-xs font-normal"><Lock className="h-3 w-3" />Tamper-proof</Badge>
        </CardTitle>
        <CardDescription>Every recorded action on this patient. Entries cannot be edited or deleted.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audited actions visible to you for this patient yet.</p>
        ) : (
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {events.map((e) => (
              <li key={e.id} className="text-sm border-l-2 border-primary/40 pl-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{e.action}</span>
                  <span className="text-muted-foreground">· {e.resource_type}</span>
                  <Badge variant={e.outcome === "success" ? "secondary" : "destructive"} className="text-xs">{e.outcome}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(e.recorded_at), "dd MMM yyyy, HH:mm:ss")} · {e.actor_role}
                  {e.description ? ` · ${e.description}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
