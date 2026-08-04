import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FacilityRegistrationDialog } from "@/components/facility/FacilityRegistrationDialog";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

interface Facility {
  id: string;
  facility_name: string;
  facility_type: string;
  region: string;
  city: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  is_active: boolean;
  emergency_capable: boolean;
  created_at: string;
}

export function FacilityManager() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Facility[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from("facilities")
      .select("*")
      .order("created_at", { ascending: false });
    setBusy(false);
    if (error) {
      toast({ title: "Could not load facilities", description: error.message, variant: "destructive" });
      return;
    }
    setRows((data ?? []) as Facility[]);
  };

  useEffect(() => { void load(); }, []);

  const setActive = async (f: Facility, is_active: boolean) => {
    const { error } = await supabase.from("facilities").update({ is_active }).eq("id", f.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    if (is_active) {
      const { data: existing } = await supabase
        .from("referral_targets")
        .select("id")
        .eq("name", f.facility_name)
        .maybeSingle();
      if (!existing) {
        await supabase.from("referral_targets").insert({
          name: f.facility_name,
          target_type: f.emergency_capable ? "emergency_centre" : "clinic",
          contact_phone: f.contact_phone,
          contact_email: f.contact_email,
          address: [f.city, f.region].filter(Boolean).join(", ") || null,
          is_active: true,
        });
      }
    }
    toast({ title: is_active ? "Facility activated" : "Facility deactivated" });
    void load();
  };

  const pending = rows.filter((r) => !r.is_active);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Facilities</CardTitle>
          <CardDescription>
            {busy ? "Loading…" : `${rows.length} listed · ${pending.length} awaiting activation`}
          </CardDescription>
        </div>
        <FacilityRegistrationDialog mode="admin" onSaved={load} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.facility_name}</TableCell>
                <TableCell className="text-xs capitalize">{f.facility_type.replace(/_/g, " ")}</TableCell>
                <TableCell className="text-xs">{[f.city, f.region].filter(Boolean).join(", ")}</TableCell>
                <TableCell className="text-xs">{f.contact_phone ?? f.contact_email ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={f.is_active ? "default" : "secondary"}>
                    {f.is_active ? "Active" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {f.is_active ? (
                    <Button size="sm" variant="outline" onClick={() => setActive(f, false)}>
                      <XCircle className="h-3 w-3 mr-1" /> Deactivate
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setActive(f, true)}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Activate
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!busy && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No facilities yet — add one directly with the button above.
                </TableCell>
              </TableRow>
            )}
            {busy && (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <Loader2 className="h-4 w-4 animate-spin inline" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
