import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, ShieldAlert } from "lucide-react";

interface Incident {
  id: string;
  incident_type: string;
  severity: string;
  status: string;
  description: string;
  source_function: string | null;
  reporter_role: string | null;
  capa_notes: string | null;
  created_at: string;
}

const STATUSES = ["open", "under_review", "capa", "closed"];

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  under_review: "Under review",
  capa: "Corrective action",
  closed: "Closed",
};

const severityVariant = (s: string) =>
  s === "critical" || s === "high" ? "destructive" : s === "medium" ? "default" : "secondary";

export const IncidentQueue = () => {
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_incidents")
      .select("id, incident_type, severity, status, description, source_function, reporter_role, capa_notes, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast({ title: "Could not load reports", description: error.message, variant: "destructive" });
    } else {
      setIncidents((data ?? []) as Incident[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const update = async (incident: Incident, status: string) => {
    const payload: Record<string, unknown> = {
      status,
      capa_notes: notes[incident.id] ?? incident.capa_notes,
    };
    if (status === "closed") payload.closed_at = new Date().toISOString();
    const { error } = await supabase.from("ai_incidents").update(payload).eq("id", incident.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Marked ${STATUS_LABEL[status].toLowerCase()}` });
    load();
  };

  const shown = filter === "all" ? incidents : incidents.filter((i) => i.status === filter);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" /> AI safety reports
          </CardTitle>
          <CardDescription>
            Problems reported by clinicians, plus automatic reports raised when an AI answer fails safety checks.
          </CardDescription>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All reports</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {format(new Date(i.created_at), "dd MMM yyyy, HH:mm")}
                  </TableCell>
                  <TableCell className="text-xs">{i.incident_type.replace(/_/g, " ")}</TableCell>
                  <TableCell><Badge variant={severityVariant(i.severity)}>{i.severity}</Badge></TableCell>
                  <TableCell className="text-xs max-w-md">
                    <div>{i.description}</div>
                    <div className="text-muted-foreground mt-1">
                      {i.source_function ?? "unknown feature"}{i.reporter_role ? ` · ${i.reporter_role}` : " · automatic"}
                    </div>
                    <Textarea
                      className="mt-2"
                      rows={2}
                      placeholder="Review or corrective action notes"
                      value={notes[i.id] ?? i.capa_notes ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [i.id]: e.target.value }))}
                    />
                  </TableCell>
                  <TableCell><Badge variant={i.status === "closed" ? "secondary" : "default"}>{STATUS_LABEL[i.status]}</Badge></TableCell>
                  <TableCell className="text-right space-y-2">
                    {STATUSES.filter((s) => s !== i.status).map((s) => (
                      <Button key={s} size="sm" variant="outline" className="w-full" onClick={() => update(i, s)}>
                        {STATUS_LABEL[s]}
                      </Button>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
              {shown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">No reports.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
